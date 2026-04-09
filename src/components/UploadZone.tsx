import { useState, useCallback, useEffect } from 'react';
import type { Transcription, TranscriptionProgress } from '../types';

const LANGUAGES = [
  { code: 'auto', label: 'Auto Detect' },
  { code: 'id', label: 'Indonesian' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'th', label: 'Thai' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'ms', label: 'Malay' },
];

const MODELS = [
  { id: 'tiny', label: 'Tiny', size: '~75 MB', desc: 'Fastest, less accurate' },
  { id: 'base', label: 'Base', size: '~142 MB', desc: 'Good balance' },
  { id: 'small', label: 'Small', size: '~466 MB', desc: 'Better accuracy' },
  { id: 'medium', label: 'Medium', size: '~1.5 GB', desc: 'Best accuracy' },
];

interface UploadZoneProps {
  progress: TranscriptionProgress;
  onComplete: (transcription: Transcription) => void;
}

export default function UploadZone({ progress, onComplete }: UploadZoneProps) {
  const [file, setFile] = useState<{ path: string; name: string; size: number } | null>(null);
  const [language, setLanguage] = useState('auto');
  const [model, setModel] = useState('base');
  const [timestamps, setTimestamps] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState<Record<string, boolean>>({});

  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
  const isProcessing = progress.status === 'transcribing' || progress.status === 'downloading-model';

  const refreshModelStatus = useCallback(async () => {
    if (!isElectron) return;
    const entries = await Promise.all(
      MODELS.map(async (m) => [m.id, await window.electronAPI.checkModel(m.id)] as const)
    );
    setModelStatus(Object.fromEntries(entries));
  }, [isElectron]);

  useEffect(() => {
    refreshModelStatus();
  }, [refreshModelStatus]);

  useEffect(() => {
    // Refresh after a successful download/transcription
    if (progress.status === 'done') refreshModelStatus();
  }, [progress.status, refreshModelStatus]);

  const handleDownloadModel = async (modelId: string) => {
    if (!isElectron) return;
    setError(null);
    const result = await window.electronAPI.downloadModel(modelId);
    if (!result.success) {
      setError(result.error || `Failed to download ${modelId} model`);
    }
    await refreshModelStatus();
  };

  const handleSelectFile = async () => {
    if (!isElectron) return;
    const result = await window.electronAPI.selectFile();
    if (result) {
      setFile(result);
      setError(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const filePath =
        (window.electronAPI?.getPathForFile?.(droppedFile)) ||
        (droppedFile as any).path ||
        '';
      if (!filePath) {
        setError('Could not read file path from drop. Please use the file picker instead.');
        return;
      }
      setFile({
        path: filePath,
        name: droppedFile.name,
        size: droppedFile.size,
      });
      setError(null);
    }
  }, []);

  const handleTranscribe = async () => {
    if (!isElectron || !file) return;
    setError(null);

    const result = await window.electronAPI.transcribe({
      filePath: file.path,
      language,
      model,
      timestamps,
    });

    if (result.success && result.data) {
      const id = crypto.randomUUID();
      const transcription: Transcription = {
        id,
        filename: file.name,
        filepath: file.path,
        language,
        model,
        duration: result.data.duration,
        text: result.data.text,
        segments: result.data.segments,
        created_at: new Date().toISOString(),
      };

      await window.electronAPI.saveTranscription(transcription);
      setFile(null);
      onComplete(transcription);
    } else {
      setError(result.error || 'Transcription failed');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      <h2 className="text-2xl font-bold text-white mb-2">Transcribe Audio</h2>
      <p className="text-slate-400 mb-8">
        Upload an audio or video file to transcribe using local AI
      </p>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={!file && !isProcessing ? handleSelectFile : undefined}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : file
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
        }`}
      >
        {file ? (
          <div>
            <div className="w-14 h-14 mx-auto mb-4 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-white font-medium text-lg">{file.name}</p>
            <p className="text-slate-400 text-sm mt-1">{formatSize(file.size)}</p>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="mt-3 text-sm text-slate-500 hover:text-red-400 transition-colors"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div>
            <div className="w-14 h-14 mx-auto mb-4 bg-slate-700/50 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-white font-medium text-lg">Drop your file here</p>
            <p className="text-slate-400 text-sm mt-1">or click to browse</p>
            <p className="text-slate-600 text-xs mt-3">
              Supports MP3, MP4, WAV, OGG, M4A, WEBM, FLAC, AAC, MOV, MKV, AVI
            </p>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {MODELS.map((m) => {
              const downloaded = modelStatus[m.id];
              const badge = downloaded === undefined ? '…' : downloaded ? '✓ Downloaded' : '⬇ Not downloaded';
              return (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.size}) — {badge}
                </option>
              );
            })}
          </select>
          <div className="mt-2 flex items-center justify-between text-xs">
            {modelStatus[model] === true ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Model ready on your device
              </span>
            ) : modelStatus[model] === false ? (
              <>
                <span className="text-amber-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Not downloaded yet
                </span>
                <button
                  type="button"
                  onClick={() => handleDownloadModel(model)}
                  disabled={isProcessing}
                  className="text-indigo-400 hover:text-indigo-300 underline disabled:opacity-50"
                >
                  Download now
                </button>
              </>
            ) : (
              <span className="text-slate-500">Checking…</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <input
          type="checkbox"
          id="timestamps"
          checked={timestamps}
          onChange={(e) => setTimestamps(e.target.checked)}
          disabled={isProcessing}
          className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
        />
        <label htmlFor="timestamps" className="text-sm text-slate-400">Include timestamps</label>
      </div>

      {/* Progress */}
      {isProcessing && (
        <div className="mt-6 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-300">
              {progress.status === 'downloading-model'
                ? `Downloading ${progress.model} model...`
                : 'Transcribing...'}
            </span>
            <span className="text-sm text-indigo-400">{Math.round(progress.progress)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Transcribe Button */}
      <button
        onClick={handleTranscribe}
        disabled={!file || isProcessing}
        className={`w-full mt-6 py-3 rounded-xl font-medium text-white transition-all ${
          !file || isProcessing
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-lg shadow-indigo-500/25'
        }`}
      >
        {isProcessing ? 'Processing...' : 'Start Transcription'}
      </button>

      {/* Requirements */}
      {!isElectron && (
        <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-amber-400 text-sm font-medium">Desktop App Required</p>
          <p className="text-amber-400/70 text-xs mt-1">
            This app requires the Electron desktop environment to function. Run with: npm run dev
          </p>
        </div>
      )}
    </div>
  );
}
