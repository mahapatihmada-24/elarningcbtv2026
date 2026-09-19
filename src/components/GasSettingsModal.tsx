import React, { useState } from 'react';
import {
  X,
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Flame,
  FileSpreadsheet,
  HardDrive,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  getGasUrl,
  setGasUrl,
  resetGasUrl,
  api,
  DataSource,
  setPreferredDataSource,
} from '../services/api';
import firebaseConfig from '../../firebase-applet-config.json';
import { ensureFirebaseSeeded } from '../services/firebase';

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
  const [activeTab, setActiveTab] = useState<'firebase' | 'gas' | 'local'>('firebase');
  const [url, setUrlState] = useState(getGasUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSelectSource = (src: DataSource) => {
    setPreferredDataSource(src);
    setStatusMsg({
      text: `Database aktif berhasil diubah ke: ${
        src === 'FIREBASE'
          ? 'Google Firebase Console (Firestore)'
          : src === 'GAS'
          ? 'Google Apps Script (Spreadsheet)'
          : 'Penyimpanan Lokal (Offline)'
      }`,
      isError: false,
    });
    if (onSourceChanged) onSourceChanged();
  };

  const handleTestFirebase = async () => {
    setIsTesting(true);
    setStatusMsg(null);
    try {
      const res = await api.testFirebaseConnection();
      setIsTesting(false);
      setStatusMsg({
        text: res.message || 'Koneksi ke Google Firebase Console berhasil!',
        isError: !res.success,
      });
      if (res.success) {
        setPreferredDataSource('FIREBASE');
        if (onSourceChanged) onSourceChanged();
      }
    } catch (err: unknown) {
      setIsTesting(false);
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMsg({
        text: `Gagal terhubung ke Firebase: ${msg}`,
        isError: true,
      });
    }
  };

  const handleTestGas = async () => {
    setIsTesting(true);
    setStatusMsg(null);
    setGasUrl(url);

    const res = await api.testGasConnection();
    setIsTesting(false);
    setStatusMsg({ text: res.message, isError: !res.success });
    if (res.success) {
      setPreferredDataSource('GAS');
      if (onSourceChanged) onSourceChanged();
    }
  };

  const handleSaveGasUrl = () => {
    setGasUrl(url);
    setStatusMsg({ text: 'URL Google Apps Script berhasil disimpan!', isError: false });
    if (onSourceChanged) onSourceChanged();
  };

  const handleResetGasUrl = () => {
    resetGasUrl();
    const defaultUrl = getGasUrl();
    setUrlState(defaultUrl);
    setStatusMsg({ text: 'URL dikembalikan ke default template.', isError: false });
    if (onSourceChanged) onSourceChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
            <Database className="w-5 h-5" />
            <span>Pengaturan Database & Server Cloud</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Database Banner */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Database Aktif Saat Ini:</span>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
              currentSource === 'FIREBASE'
                ? 'bg-emerald-100 text-emerald-800'
                : currentSource === 'GAS'
                ? 'bg-sky-100 text-sky-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentSource === 'FIREBASE'
                  ? 'bg-emerald-500 animate-pulse'
                  : currentSource === 'GAS'
                  ? 'bg-sky-500 animate-pulse'
                  : 'bg-amber-500'
              }`}
            />
            {currentSource === 'FIREBASE'
              ? 'Google Firebase (Firestore)'
              : currentSource === 'GAS'
              ? 'Google Apps Script (Sheets)'
              : 'Penyimpanan Lokal (Offline)'}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mt-4">
          <button
            onClick={() => {
              setActiveTab('firebase');
              setStatusMsg(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'firebase'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Google Firebase</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('gas');
              setStatusMsg(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'gas'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Spreadsheet (GAS)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('local');
              setStatusMsg(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'local'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4 text-slate-600" />
            <span>Mode Lokal</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1">
          {/* TAB 1: GOOGLE FIREBASE CONSOLE */}
          {activeTab === 'firebase' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 border border-amber-200/70">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                    <Flame className="w-5 h-5 text-amber-500" />
                    <span>Konfigurasi Google Firebase Console</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300/60">
                    Resmi Cloud Terpasang
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Database E-Learning & CBT telah dikonfigurasi terhubung langsung ke Google Firebase Console (Firestore NoSQL Database).
                </p>
              </div>

              {/* Firebase Spec details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Firebase Project ID</span>
                  <span className="font-mono text-slate-800 font-semibold truncate block">
                    {firebaseConfig.projectId || '-'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Auth Domain</span>
                  <span className="font-mono text-slate-800 font-semibold truncate block">
                    {firebaseConfig.authDomain || '-'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 sm:col-span-2">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Firestore Database ID</span>
                  <span className="font-mono text-slate-800 font-semibold truncate block">
                    {firebaseConfig.firestoreDatabaseId || '(default)'}
                  </span>
                </div>
              </div>

              {/* Collections list */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Koleksi Terdaftar di Firestore:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span><code>users</code> (Akun Pengguna)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span><code>materi</code> (Modul Pembelajaran)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span><code>ujian</code> (Bank Soal CBT)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span><code>nilai</code> (Hasil & Rekapitulasi)</span>
                  </div>
                </div>
              </div>

              {/* Action buttons for Firebase */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={handleTestFirebase}
                  disabled={isTesting}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Menguji Koneksi...' : 'Uji & Sambungkan Firebase'}</span>
                </button>

                {currentSource !== 'FIREBASE' && (
                  <button
                    onClick={() => handleSelectSource('FIREBASE')}
                    className="py-2.5 px-4 rounded-xl border border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold transition"
                  >
                    Aktifkan Firebase
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE APPS SCRIPT */}
          {activeTab === 'gas' && (
            <div className="space-y-4 text-xs">
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
                  Gunakan URL Web App dari menu <em>Deploy &gt; New deployment &gt; Web app</em> di editor Google Apps Script jika Anda ingin menyinkronkan data langsung ke Google Sheets.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={handleTestGas}
                  disabled={isTesting}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-indigo-600' : ''}`} />
                  <span>{isTesting ? 'Menguji...' : 'Uji Koneksi GAS'}</span>
                </button>
                <button
                  onClick={handleSaveGasUrl}
                  className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shadow-sm"
                >
                  Simpan URL
                </button>
                <button
                  onClick={handleResetGasUrl}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition"
                >
                  Reset
                </button>
              </div>

              {currentSource !== 'GAS' && (
                <button
                  onClick={() => handleSelectSource('GAS')}
                  className="w-full py-2 rounded-xl border border-sky-600 text-sky-700 hover:bg-sky-50 font-semibold transition"
                >
                  Jadikan Google Apps Script Sebagai Database Utama
                </button>
              )}
            </div>
          )}

          {/* TAB 3: LOCAL STORAGE */}
          {activeTab === 'local' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-2">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-slate-500" />
                  <span>Penyimpanan Lokal Browser (Offline Mode)</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Data disimpan di peramban (browser) perangkat ini. Cocok untuk simulasi atau jika koneksi internet terputus saat pelaksanaan ujian CBT.
                </p>
              </div>

              {currentSource !== 'LOCAL' ? (
                <button
                  onClick={() => handleSelectSource('LOCAL')}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold transition shadow-sm"
                >
                  Gunakan Mode Penyimpanan Lokal (Offline)
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-amber-600" />
                  <span>Mode Penyimpanan Lokal sedang aktif saat ini.</span>
                </div>
              )}
            </div>
          )}

          {/* Status Message Display */}
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
              <span className="leading-relaxed">{statusMsg.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
