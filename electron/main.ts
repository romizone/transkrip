import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { initDatabase, getDb } from './database';
import { transcribeAudio, downloadModel, getModelPath } from './whisper';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Audio/Video', extensions: ['mp3', 'mp4', 'wav', 'ogg', 'm4a', 'webm', 'flac', 'aac', 'mov', 'mkv', 'avi', 'wmv', 'opus', 'wma'] },
    ],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const stat = fs.statSync(filePath);
  return {
    path: filePath,
    name: path.basename(filePath),
    size: stat.size,
  };
});

ipcMain.handle('transcribe', async (event, options: {
  filePath: string;
  language: string;
  model: string;
  timestamps: boolean;
}) => {
  try {
    const modelPath = getModelPath(options.model);
    if (!fs.existsSync(modelPath)) {
      mainWindow?.webContents.send('transcription-progress', { status: 'downloading-model', model: options.model, progress: 0 });
      let lastSent = 0;
      await downloadModel(options.model, (received, total) => {
        const percent = total > 0 ? (received / total) * 100 : 0;
        const now = Date.now();
        if (now - lastSent > 150 || (total > 0 && received === total)) {
          lastSent = now;
          mainWindow?.webContents.send('transcription-progress', {
            status: 'downloading-model',
            model: options.model,
            progress: percent,
          });
          mainWindow?.webContents.send('model-download-progress', {
            model: options.model,
            status: 'downloading',
            received,
            total,
            percent,
          });
        }
      });
    }

    mainWindow?.webContents.send('transcription-progress', { status: 'transcribing', progress: 0 });

    const result = await transcribeAudio({
      filePath: options.filePath,
      language: options.language,
      modelName: options.model,
      timestamps: options.timestamps,
      onProgress: (progress: number) => {
        mainWindow?.webContents.send('transcription-progress', { status: 'transcribing', progress });
      },
    });

    mainWindow?.webContents.send('transcription-progress', { status: 'done', progress: 100 });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-model', async (_event, modelName: string) => {
  const modelPath = getModelPath(modelName);
  return fs.existsSync(modelPath);
});

ipcMain.handle('download-model', async (_event, modelName: string) => {
  try {
    mainWindow?.webContents.send('model-download-progress', { model: modelName, status: 'downloading', received: 0, total: 0, percent: 0 });
    let lastSent = 0;
    await downloadModel(modelName, (received, total) => {
      const percent = total > 0 ? (received / total) * 100 : 0;
      // Throttle to avoid flooding IPC
      const now = Date.now();
      if (now - lastSent > 150 || (total > 0 && received === total)) {
        lastSent = now;
        mainWindow?.webContents.send('model-download-progress', {
          model: modelName,
          status: 'downloading',
          received,
          total,
          percent,
        });
      }
    });
    mainWindow?.webContents.send('model-download-progress', { model: modelName, status: 'done', percent: 100 });
    return { success: true };
  } catch (error: any) {
    mainWindow?.webContents.send('model-download-progress', { model: modelName, status: 'error', error: error.message });
    return { success: false, error: error.message };
  }
});

// Database IPC
ipcMain.handle('db-save-transcription', async (_event, record: any) => {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO transcriptions (id, filename, filepath, language, model, duration, text, segments, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      record.id,
      record.filename,
      record.filepath,
      record.language,
      record.model,
      record.duration || 0,
      record.text,
      JSON.stringify(record.segments || []),
      record.created_at || new Date().toISOString()
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-get-transcriptions', async () => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM transcriptions ORDER BY created_at DESC').all();
    return rows.map((row: any) => ({
      ...row,
      segments: JSON.parse(row.segments || '[]'),
    }));
  } catch (error: any) {
    console.error('db-get-transcriptions failed:', error);
    return [];
  }
});

ipcMain.handle('db-get-transcription', async (_event, id: string) => {
  try {
    const db = getDb();
    const row: any = db.prepare('SELECT * FROM transcriptions WHERE id = ?').get(id);
    if (!row) return null;
    return { ...row, segments: JSON.parse(row.segments || '[]') };
  } catch (error: any) {
    console.error('db-get-transcription failed:', error);
    return null;
  }
});

ipcMain.handle('db-delete-transcription', async (_event, id: string) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM transcriptions WHERE id = ?').run(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-update-transcription', async (_event, id: string, text: string) => {
  try {
    const db = getDb();
    db.prepare('UPDATE transcriptions SET text = ? WHERE id = ?').run(text, id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-app-path', async () => {
  return app.getPath('userData');
});
