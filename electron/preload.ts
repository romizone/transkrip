import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  transcribe: (options: any) => ipcRenderer.invoke('transcribe', options),
  checkModel: (model: string) => ipcRenderer.invoke('check-model', model),
  downloadModel: (model: string) => ipcRenderer.invoke('download-model', model),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // Database
  saveTranscription: (record: any) => ipcRenderer.invoke('db-save-transcription', record),
  getTranscriptions: () => ipcRenderer.invoke('db-get-transcriptions'),
  getTranscription: (id: string) => ipcRenderer.invoke('db-get-transcription', id),
  deleteTranscription: (id: string) => ipcRenderer.invoke('db-delete-transcription', id),
  updateTranscription: (id: string, text: string) => ipcRenderer.invoke('db-update-transcription', id, text),

  // Events
  onTranscriptionProgress: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('transcription-progress', handler);
    return () => ipcRenderer.removeListener('transcription-progress', handler);
  },
  onModelDownloadProgress: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('model-download-progress', handler);
    return () => ipcRenderer.removeListener('model-download-progress', handler);
  },
});
