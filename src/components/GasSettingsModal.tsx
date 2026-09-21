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
  Copy,
  ExternalLink,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  getGasUrl,
  setGasUrl,
  resetGasUrl,
  api,
  DataSource,
  setPreferredDataSource,
  getActiveFirebaseConfig,
  setActiveFirebaseConfig,
  resetActiveFirebaseConfig,
  PRESET_CONFIGS,
  FirebaseAppConfig,
  FirebaseConnectionDiagnostic,
} from '../services/api';

interface GasSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSource: DataSource;
  onSourceChanged?: () => void;
}

const FIRESTORE_RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

export const GasSettingsModal: React.FC<GasSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSource,
  onSourceChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'firebase' | 'gas' | 'local'>('firebase');
  const [url, setUrlState] = useState(getGasUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [diagnostic, setDiagnostic] = useState<FirebaseConnectionDiagnostic | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);
  const [showConfigEditor, setShowConfigEditor] = useState(false);

  // Active config state
  const [activeConfig, setActiveConfigState] = useState<FirebaseAppConfig>(() =>
    getActiveFirebaseConfig()
  );

  // Form edit state for custom config
  const [editConfig, setEditConfig] = useState<FirebaseAppConfig>(() => getActiveFirebaseConfig());

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
    setDiagnostic(null);

    try {
      const res = await api.testFirebaseConnection();
      setIsTesting(false);
      setDiagnostic(res);
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

  const handleSeedFirebase = async () => {
    setIsSeeding(true);
    try {
      const res = await api.seedInitialFirebaseCollections();
      setIsSeeding(false);
      setStatusMsg({
        text: res.message || 'Data awal disinkronkan',
        isError: !res.success,
      });
      if (res.success) {
        handleTestFirebase();
      }
    } catch (err) {
      setIsSeeding(false);
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMsg({
        text: `Gagal inisialisasi: ${msg}`,
        isError: true,
      });
    }
  };

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_SNIPPET);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  const handleSwitchPreset = (presetKey: 'sebayuloka' | 'wildan_fb826' | 'sebayu' | 'wildan') => {
    const preset = PRESET_CONFIGS[presetKey];
    if (!preset) return;
    setActiveFirebaseConfig(preset.config);
    setActiveConfigState(preset.config);
    setEditConfig(preset.config);
    setStatusMsg({
      text: `Konfigurasi dialihkan ke ${preset.name}. Memuat ulang pengaturan...`,
      isError: false,
    });
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleSaveCustomConfig = () => {
    if (!editConfig.projectId || !editConfig.apiKey) {
      setStatusMsg({
        text: 'Project ID dan API Key tidak boleh kosong.',
        isError: true,
      });
      return;
    }
    setActiveFirebaseConfig(editConfig);
    setActiveConfigState(editConfig);
    setStatusMsg({
      text: 'Konfigurasi Firebase kustom berhasil disimpan. Memuat ulang aplikasi...',
      isError: false,
    });
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleResetToDefaultConfig = () => {
    resetActiveFirebaseConfig();
    const cfg = getActiveFirebaseConfig();
    setActiveConfigState(cfg);
    setEditConfig(cfg);
    setStatusMsg({
      text: 'Konfigurasi Firebase dikembalikan ke bawaan.',
      isError: false,
    });
    setTimeout(() => {
      window.location.reload();
    }, 600);
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

  const isPermissionDenied =
    diagnostic?.errorCode === 'permission-denied' ||
    (statusMsg?.isError &&
      (statusMsg.text.toLowerCase().includes('permission-denied') ||
        statusMsg.text.toLowerCase().includes('permission denied') ||
        statusMsg.text.toLowerCase().includes('missing or insufficient permissions')));

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
            <div className="space-y-3.5 text-xs">
              {/* Header card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>Konfigurasi Firebase Firestore Cloud</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      currentSource === 'FIREBASE'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {currentSource === 'FIREBASE' ? 'Sumber Aktif' : 'Tersedia'}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Database Firestore NoSQL Google Cloud untuk sinkronisasi akun guru, siswa, bank soal CBT, dan rekapitulasi nilai secara real-time.
                </p>
              </div>

              {/* Preset Selector */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Pilih Target Proyek Firebase:
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    ID: {activeConfig.projectId}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchPreset('sebayuloka')}
                    className={`text-left p-2.5 rounded-lg border transition ${
                      activeConfig.projectId === 'elearningcbt-sebayuloka'
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs truncate">sebayuloka</span>
                      {activeConfig.projectId === 'elearningcbt-sebayuloka' && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Proyek Utama
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchPreset('wildan_fb826')}
                    className={`text-left p-2.5 rounded-lg border transition ${
                      activeConfig.projectId === 'elearningcbt-wildanprama-fb826'
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs truncate">wildanprama-fb826</span>
                      {activeConfig.projectId === 'elearningcbt-wildanprama-fb826' && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Proyek Baru
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchPreset('sebayu')}
                    className={`text-left p-2.5 rounded-lg border transition ${
                      activeConfig.projectId === 'elearningcbt-sebayu'
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs truncate">sebayu</span>
                      {activeConfig.projectId === 'elearningcbt-sebayu' && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Proyek Sebelumnya
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchPreset('wildan')}
                    className={`text-left p-2.5 rounded-lg border transition ${
                      activeConfig.projectId === 'elearningcbt-wildanpramadika'
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs truncate">wildanpramadika</span>
                      {activeConfig.projectId === 'elearningcbt-wildanpramadika' && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Proyek Cadangan
                    </span>
                  </button>
                </div>
              </div>

              {/* SPECIFIC TROUBLESHOOTING GUIDE FOR PERMISSION DENIED */}
              {isPermissionDenied && (
                <div className="p-3.5 rounded-xl bg-amber-50/90 border-2 border-amber-400 text-slate-800 space-y-2.5 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-900 text-xs sm:text-sm">
                        Solusi Mengatasi Error: Aturan Keamanan Firestore Memblokir Akses
                      </div>
                      <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                        Kunci API dan Database <strong>{activeConfig.projectId}</strong> valid, namun aturan keamanan bawaan di Firebase Console masih mengunci izin akses baca/tulis (<code className="text-amber-900 bg-amber-100 px-1 py-0.5 rounded">allow read, write: if false;</code>).
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2">
                    <div className="text-[11px] font-bold text-slate-800">
                      Ikuti 3 Langkah Cepat Berikut:
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-700 leading-normal">
                      <li>
                        Buka halaman pengaturan aturan Firebase Console proyek Anda:{' '}
                        <a
                          href={`https://console.firebase.google.com/project/${activeConfig.projectId}/firestore/rules`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 underline ml-1"
                        >
                          Buka Tab Rules di Firebase Console <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                      <li>
                        Salin kode aturan keamanan di bawah ini dan tempelkan (replace) seluruh isi tab <strong>Rules</strong> di Firebase Console:
                      </li>
                    </ol>

                    {/* Code block with copy button */}
                    <div className="relative mt-2">
                      <pre className="p-2.5 rounded-lg bg-slate-900 text-amber-300 font-mono text-[10px] overflow-x-auto leading-relaxed border border-slate-800">
                        {FIRESTORE_RULES_SNIPPET}
                      </pre>
                      <button
                        type="button"
                        onClick={handleCopyRules}
                        className="absolute top-2 right-2 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-semibold text-[10px] flex items-center gap-1 shadow-sm transition"
                      >
                        {copiedRules ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-300" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin Rules</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-700">
                      3. Klik tombol biru <strong>Publish (Publikasikan)</strong> di Firebase Console, lalu klik tombol <strong>"Uji & Sambungkan Firebase"</strong> di bawah.
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons for Firebase */}
              <div className="flex flex-wrap gap-2 pt-1">
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

                <button
                  type="button"
                  onClick={handleSeedFirebase}
                  disabled={isSeeding || isTesting}
                  title="Tulis data master awal (akun pengguna, mata pelajaran, ujian) ke Firestore"
                  className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${isSeeding ? 'animate-spin' : ''}`} />
                  <span>{isSeeding ? 'Menyinkronkan...' : 'Sinkronkan Data Awal'}</span>
                </button>
              </div>

              {/* Collapsible raw credentials editor */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowConfigEditor(!showConfigEditor)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lihat / Sesuaikan Kredensial Firebase</span>
                  </div>
                  {showConfigEditor ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {showConfigEditor && (
                  <div className="p-3.5 space-y-2.5 bg-white border-t border-slate-200 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          API Key
                        </label>
                        <input
                          type="text"
                          value={editConfig.apiKey}
                          onChange={(e) => setEditConfig({ ...editConfig, apiKey: e.target.value })}
                          className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Project ID
                        </label>
                        <input
                          type="text"
                          value={editConfig.projectId}
                          onChange={(e) => setEditConfig({ ...editConfig, projectId: e.target.value })}
                          className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Auth Domain
                        </label>
                        <input
                          type="text"
                          value={editConfig.authDomain}
                          onChange={(e) => setEditConfig({ ...editConfig, authDomain: e.target.value })}
                          className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Storage Bucket
                        </label>
                        <input
                          type="text"
                          value={editConfig.storageBucket}
                          onChange={(e) => setEditConfig({ ...editConfig, storageBucket: e.target.value })}
                          className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          Messaging Sender ID
                        </label>
                        <input
                          type="text"
                          value={editConfig.messagingSenderId}
                          onChange={(e) =>
                            setEditConfig({ ...editConfig, messagingSenderId: e.target.value })
                          }
                          className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">
                          App ID
                        </label>
                        <input
                          type="text"
                          value={editConfig.appId}
                          onChange={(e) => setEditConfig({ ...editConfig, appId: e.target.value })}
                          className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleResetToDefaultConfig}
                        className="py-1.5 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs"
                      >
                        Reset Bawaan
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCustomConfig}
                        className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition"
                      >
                        Simpan & Terapkan
                      </button>
                    </div>
                  </div>
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
