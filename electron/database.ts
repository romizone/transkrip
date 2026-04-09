import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let db: Database.Database | null = null;

export function initDatabase() {
  const dbDir = path.join(app.getPath('userData'), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(path.join(dbDir, 'transkrip.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS transcriptions (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      filepath TEXT,
      language TEXT DEFAULT 'auto',
      model TEXT DEFAULT 'base',
      duration REAL DEFAULT 0,
      text TEXT DEFAULT '',
      segments TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at
      ON transcriptions(created_at DESC);
  `);

  return db;
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}
