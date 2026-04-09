export interface Segment {
  start: number;
  end: number;
  text: string;
}

export interface Transcription {
  id: string;
  filename: string;
  filepath: string;
  language: string;
  model: string;
  duration: number;
  text: string;
  segments: Segment[];
  created_at: string;
}

export interface TranscriptionProgress {
  status: 'idle' | 'downloading-model' | 'transcribing' | 'done' | 'error';
  progress: number;
  model?: string;
  error?: string;
}

export interface ElectronAPI {
  selectFile: () => Promise<{ path: string; name: string; size: number } | null>;
  transcribe: (options: {
    filePath: string;
    language: string;
    model: string;
    timestamps: boolean;
  }) => Promise<{ success: boolean; data?: any; error?: string }>;
  checkModel: (model: string) => Promise<boolean>;
  downloadModel: (model: string) => Promise<{ success: boolean; error?: string }>;
  getAppPath: () => Promise<string>;

  saveTranscription: (record: any) => Promise<{ success: boolean }>;
  getTranscriptions: () => Promise<Transcription[]>;
  getTranscription: (id: string) => Promise<Transcription | null>;
  deleteTranscription: (id: string) => Promise<{ success: boolean }>;
  updateTranscription: (id: string, text: string) => Promise<{ success: boolean }>;

  onTranscriptionProgress: (callback: (data: any) => void) => () => void;
  onModelDownloadProgress: (callback: (data: any) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
