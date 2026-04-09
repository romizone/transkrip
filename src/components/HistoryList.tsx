import { useState } from 'react';
import type { Transcription } from '../types';

interface HistoryListProps {
  transcriptions: Transcription[];
  onView: (t: Transcription) => void;
  onDelete: (id: string) => void;
}

export default function HistoryList({ transcriptions, onView, onDelete }: HistoryListProps) {
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = transcriptions.filter(
    (t) =>
      t.filename.toLowerCase().includes(search.toLowerCase()) ||
      t.text.toLowerCase().includes(search.toLowerCase())
  );

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">History</h2>
          <p className="text-slate-400 text-sm mt-1">
            {transcriptions.length} transcription{transcriptions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search transcriptions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-slate-400">
            {search ? 'No transcriptions match your search' : 'No transcriptions yet'}
          </p>
          <p className="text-slate-600 text-sm mt-1">
            {search ? 'Try a different search term' : 'Upload a file to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <button
                  onClick={() => onView(t)}
                  className="flex-1 text-left"
                >
                  <h3 className="text-white font-medium group-hover:text-indigo-400 transition-colors">
                    {t.filename}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                    {t.text.substring(0, 200)}...
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>{formatDate(t.created_at)}</span>
                    <span>{formatDuration(t.duration)}</span>
                    <span>{t.language === 'auto' ? 'Auto' : t.language.toUpperCase()}</span>
                    <span>{t.model}</span>
                    <span>{t.text.split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                </button>

                <div className="ml-4 flex items-center gap-1">
                  {confirmDelete === t.id ? (
                    <>
                      <button
                        onClick={() => { onDelete(t.id); setConfirmDelete(null); }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs text-white"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(t.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
