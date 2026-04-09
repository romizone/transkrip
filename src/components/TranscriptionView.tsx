import { useState } from 'react';
import type { Transcription } from '../types';
import { exportToTxt, exportToSrt, exportToPdf, exportToDocx } from '../lib/export';

interface TranscriptionViewProps {
  transcription: Transcription;
  onBack: () => void;
}

export default function TranscriptionView({ transcription, onBack }: TranscriptionViewProps) {
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(transcription.text);
  const [copied, setCopied] = useState(false);

  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleSave = async () => {
    if (!isElectron) return;
    await window.electronAPI.updateTranscription(transcription.id, editText);
    transcription.text = editText;
    setEditing(false);
  };

  const handleCopy = async () => {
    const text = showTimestamps && transcription.segments.length > 0
      ? transcription.segments.map(s => `[${formatTime(s.start)}] ${s.text}`).join('\n')
      : transcription.text;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (format: string) => {
    const data = { ...transcription, text: editText || transcription.text };
    switch (format) {
      case 'txt': exportToTxt(data); break;
      case 'srt': exportToSrt(data); break;
      case 'pdf': exportToPdf(data); break;
      case 'docx': exportToDocx(data); break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{transcription.filename}</h2>
          <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
            <span>{formatDuration(transcription.duration)}</span>
            <span>{transcription.language === 'auto' ? 'Auto' : transcription.language.toUpperCase()}</span>
            <span>{transcription.model} model</span>
            <span>{new Date(transcription.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors flex items-center gap-2"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Copied!
            </>
          ) : (
            'Copy'
          )}
        </button>

        <button
          onClick={() => setEditing(!editing)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            editing ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          {editing ? 'Cancel Edit' : 'Edit'}
        </button>

        {editing && (
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm text-white transition-colors"
          >
            Save
          </button>
        )}

        {transcription.segments.length > 0 && (
          <button
            onClick={() => setShowTimestamps(!showTimestamps)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showTimestamps ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Timestamps
          </button>
        )}

        <div className="flex-1" />

        {/* Export buttons */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500 mr-2">Export:</span>
          {['TXT', 'SRT', 'PDF', 'DOCX'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt.toLowerCase())}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto">
        {editing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full h-full min-h-[400px] bg-transparent text-slate-200 text-sm leading-relaxed focus:outline-none resize-none"
          />
        ) : showTimestamps && transcription.segments.length > 0 ? (
          <div className="space-y-3">
            {transcription.segments.map((segment, i) => (
              <div key={i} className="flex gap-4 group hover:bg-slate-700/30 -mx-3 px-3 py-1.5 rounded-lg transition-colors">
                <span className="text-xs text-indigo-400 font-mono whitespace-nowrap pt-0.5 min-w-[60px]">
                  {formatTime(segment.start)}
                </span>
                <p className="text-slate-200 text-sm leading-relaxed">{segment.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
            {transcription.text}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mt-4 text-xs text-slate-500">
        <span>{transcription.text.split(/\s+/).filter(Boolean).length} words</span>
        <span>{transcription.text.length} characters</span>
        <span>{transcription.segments.length} segments</span>
      </div>
    </div>
  );
}
