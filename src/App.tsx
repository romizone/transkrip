import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import UploadZone from './components/UploadZone';
import TranscriptionView from './components/TranscriptionView';
import HistoryList from './components/HistoryList';
import Settings from './components/Settings';
import type { Transcription, TranscriptionProgress } from './types';

type Page = 'upload' | 'history' | 'settings' | 'view';

export default function App() {
  const [page, setPage] = useState<Page>('upload');
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [activeTranscription, setActiveTranscription] = useState<Transcription | null>(null);
  const [progress, setProgress] = useState<TranscriptionProgress>({
    status: 'idle',
    progress: 0,
  });

  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  const loadHistory = async () => {
    if (!isElectron) return;
    const records = await window.electronAPI.getTranscriptions();
    setTranscriptions(records);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (!isElectron) return;
    const unsub = window.electronAPI.onTranscriptionProgress((data) => {
      setProgress({
        status: data.status,
        progress: data.progress ?? 0,
        model: data.model,
      });
    });
    return unsub;
  }, []);

  const handleTranscriptionComplete = async (transcription: Transcription) => {
    setActiveTranscription(transcription);
    setPage('view');
    await loadHistory();
  };

  const handleViewTranscription = (t: Transcription) => {
    setActiveTranscription(t);
    setPage('view');
  };

  const handleDelete = async (id: string) => {
    if (!isElectron) return;
    await window.electronAPI.deleteTranscription(id);
    await loadHistory();
    if (activeTranscription?.id === id) {
      setActiveTranscription(null);
      setPage('upload');
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Drag region for macOS title bar */}
      <div className="drag-region fixed top-0 left-0 right-0 h-12 z-50" />

      <Sidebar
        currentPage={page}
        onNavigate={setPage}
        historyCount={transcriptions.length}
      />

      <main className="flex-1 overflow-y-auto pt-8">
        {page === 'upload' && (
          <UploadZone
            progress={progress}
            onComplete={handleTranscriptionComplete}
          />
        )}
        {page === 'view' && activeTranscription && (
          <TranscriptionView
            transcription={activeTranscription}
            onBack={() => setPage('upload')}
          />
        )}
        {page === 'history' && (
          <HistoryList
            transcriptions={transcriptions}
            onView={handleViewTranscription}
            onDelete={handleDelete}
          />
        )}
        {page === 'settings' && <Settings />}
      </main>
    </div>
  );
}
