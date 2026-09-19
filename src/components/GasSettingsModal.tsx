import React, { useState } from 'react';
import { X, Cloud, RefreshCw, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { getGasUrl, setGasUrl, resetGasUrl, api, DataSource } from '../services/api';

interface GasSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSource: DataSource;
  onSourceChanged?: () => void;
}

export const GasSettingsModal: React.FC<GasSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSource,
  onSourceChanged,
}) => {
  const [url, setUrlState] = useState(getGasUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    setGasUrl(url);
    setStatusMsg({ text: 'URL Google Apps Script berhasil disimpan!', isError: false });
    if (onSourceChanged) onSourceChanged();
  };

  const handleReset = () => {
    resetGasUrl();
    const defaultUrl = getGasUrl();
    setUrlState(defaultUrl);
    setStatusMsg({ text: 'URL dikembalikan ke default template.', isError: false });
    if (onSourceChanged) onSourceChanged();
  };

  const handleTest = async () => {
    setIsTesting(true);
    setStatusMsg(null);
    setGasUrl(url);

    const res = await api.testGasConnection();
    setIsTesting(false);
    setStatusMsg({ text: res.message, isError: !res.success });
    if (onSourceChanged) onSourceChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
            <Cloud className="w-5 h-5" />
            <span>Konektivitas Google Apps Script (Backend)</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 my-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">Status Data Saat Ini:</span>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                currentSource === 'GAS'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  currentSource === 'GAS' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              {currentSource === 'GAS' ? 'Terhubung ke Google Spreadsheet' : 'Penyimpanan Lokal (Offline Ready)'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL Web App Deployment (Google Apps Script)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrlState(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Diperoleh saat Anda melakukan menu <em>Deploy &gt; New deployment &gt; Web app (Anyone)</em> di Google Apps Script editor.
            </p>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                statusMsg.isError
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {statusMsg.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-indigo-600' : ''}`} />
            {isTesting ? 'Menguji...' : 'Uji Koneksi'}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm"
          >
            Simpan URL
          </button>
          <button
            onClick={handleReset}
            className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
