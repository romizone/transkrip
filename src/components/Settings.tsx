import { useState, useEffect } from 'react';

const MODELS = [
  { id: 'tiny', label: 'Tiny', size: '~75 MB', desc: 'Fastest, lower accuracy' },
  { id: 'base', label: 'Base', size: '~142 MB', desc: 'Good balance of speed & accuracy' },
  { id: 'small', label: 'Small', size: '~466 MB', desc: 'Better accuracy, slower' },
  { id: 'medium', label: 'Medium', size: '~1.5 GB', desc: 'Best accuracy, slowest' },
];

export default function Settings() {
  const [modelStatus, setModelStatus] = useState<Record<string, 'unknown' | 'available' | 'downloading' | 'not-found'>>({});
  const [appPath, setAppPath] = useState('');

  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  useEffect(() => {
    if (!isElectron) return;

    window.electronAPI.getAppPath().then(setAppPath);

    MODELS.forEach(async (m) => {
      const exists = await window.electronAPI.checkModel(m.id);
      setModelStatus((prev) => ({ ...prev, [m.id]: exists ? 'available' : 'not-found' }));
    });
  }, []);

  const handleDownload = async (modelId: string) => {
    if (!isElectron) return;
    setModelStatus((prev) => ({ ...prev, [modelId]: 'downloading' }));
    const result = await window.electronAPI.downloadModel(modelId);
    setModelStatus((prev) => ({
      ...prev,
      [modelId]: result.success ? 'available' : 'not-found',
    }));
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
      <p className="text-slate-400 mb-8">Manage models and preferences</p>

      {/* Models */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Whisper Models</h3>
        <p className="text-slate-400 text-sm mb-4">
          Download models for offline transcription. Larger models are more accurate but slower.
        </p>

        <div className="space-y-3">
          {MODELS.map((m) => {
            const status = modelStatus[m.id] || 'unknown';
            return (
              <div
                key={m.id}
                className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-medium">{m.label}</h4>
                    <span className="text-xs text-slate-500">{m.size}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{m.desc}</p>
                </div>

                <div>
                  {status === 'available' ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Downloaded
                    </span>
                  ) : status === 'downloading' ? (
                    <span className="text-indigo-400 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Downloading...
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDownload(m.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white transition-colors"
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Requirements */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Requirements</h3>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-sm text-white font-medium">whisper.cpp</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Install via Homebrew: <code className="bg-slate-700 px-1.5 py-0.5 rounded">brew install whisper-cpp</code>
            </p>
          </div>
          <div>
            <p className="text-sm text-white font-medium">ffmpeg</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Install via Homebrew: <code className="bg-slate-700 px-1.5 py-0.5 rounded">brew install ffmpeg</code>
            </p>
          </div>
        </div>
      </section>

      {/* Data Location */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4">Data</h3>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <p className="text-sm text-slate-400">App data location:</p>
          <p className="text-sm text-white font-mono mt-1">{appPath || 'N/A'}</p>
        </div>
      </section>
    </div>
  );
}
