import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Cloud,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Sliders,
  ShieldCheck,
  FileText,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import {
  connectGoogleDrive,
  disconnectGoogleDrive,
  getCachedDriveToken,
  getCurrentGoogleUser,
  initGoogleDriveAuth,
  getBackupConfig,
  saveBackupConfig,
  getBackupHistory,
  executeCompleteBackup,
  BackupScheduleConfig,
  BackupHistoryItem,
} from '../../services/googleDrive';
import { User as FirebaseUser } from 'firebase/auth';

interface AdminBackupScheduleProps {
  onShowModal: (modal: {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
    isConfirm?: boolean;
    onConfirm?: () => void;
  }) => void;
}

export const AdminBackupSchedule: React.FC<AdminBackupScheduleProps> = ({ onShowModal }) => {
  const [config, setConfig] = useState<BackupScheduleConfig>(getBackupConfig());
  const [history, setHistory] = useState<BackupHistoryItem[]>(getBackupHistory());
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(!!getCachedDriveToken());
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(getCurrentGoogleUser());
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isExecutingBackup, setIsExecutingBackup] = useState<boolean>(false);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = initGoogleDriveAuth((connected, user) => {
      setIsDriveConnected(connected);
      setGoogleUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleConnectDrive = async () => {
    setIsConnecting(true);
    const res = await connectGoogleDrive();
    setIsConnecting(false);
    if (res.success) {
      setIsDriveConnected(true);
      setGoogleUser(res.user || null);
      onShowModal({
        isOpen: true,
        title: 'Google Drive Terhubung! ☁️',
        message: 'Akun Google Drive berhasil ditautkan. Sekarang setiap backup akan otomatis terunggah ke Google Drive Anda.',
        type: 'success',
      });
    } else {
      onShowModal({
        isOpen: true,
        title: 'Koneksi Dibatalkan',
        message: res.error || 'Gagal menghubungkan Google Drive.',
        type: 'warning',
      });
    }
  };

  const handleDisconnectDrive = async () => {
    onShowModal({
      isOpen: true,
      title: 'Putuskan Akun Google Drive?',
      message: 'Apakah Anda yakin ingin memutuskan tautan Google Drive? Backup otomatis selanjutnya hanya akan diunduh secara lokal hingga akun ditautkan kembali.',
      type: 'warning',
      isConfirm: true,
      onConfirm: async () => {
        await disconnectGoogleDrive();
        setIsDriveConnected(false);
        setGoogleUser(null);
      },
    });
  };

  const handleSaveConfig = () => {
    setIsSavingConfig(true);
    saveBackupConfig(config);
    setTimeout(() => {
      setIsSavingConfig(false);
      onShowModal({
        isOpen: true,
        title: 'Pengaturan Jadwal Tersimpan',
        message: 'Jadwal backup otomatis telah diperbarui dan aktif di sistem.',
        type: 'success',
      });
    }, 250);
  };

  const handleRunManualBackup = async () => {
    setIsExecutingBackup(true);
    try {
      const result = await executeCompleteBackup(true);
      setHistory(getBackupHistory());
      setConfig(getBackupConfig());

      if (result.localSuccess && result.driveSuccess) {
        onShowModal({
          isOpen: true,
          title: 'Dual Backup Berhasil! 🎉',
          message: `Arsip data "${result.filename}" telah berhasil di-download otomatis ke perangkat lokal dan terunggah ke Google Drive Anda.`,
          type: 'success',
        });
      } else if (result.localSuccess) {
        onShowModal({
          isOpen: true,
          title: 'Backup Lokal Berhasil',
          message: `File "${result.filename}" telah tersimpan di komputer/perangkat Anda. Catatan Google Drive: ${result.error || 'Periksa koneksi Google Drive Anda.'}`,
          type: 'info',
        });
      } else {
        onShowModal({
          isOpen: true,
          title: 'Backup Terkendala',
          message: result.error || 'Gagal mengeksekusi backup data.',
          type: 'danger',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onShowModal({
        isOpen: true,
        title: 'Kesalahan Sistem',
        message: msg,
        type: 'danger',
      });
    } finally {
      setIsExecutingBackup(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-2xs">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span>Jadwal Backup Berkala</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Dual Output
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Sistem pencadangan otomatis & manual: 1 file ke perangkat lokal dan 1 file ke Google Drive
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Jalankan Backup Manual */}
        <button
          type="button"
          onClick={handleRunManualBackup}
          disabled={isExecutingBackup}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-200 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isExecutingBackup ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memproses Dual Backup...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4 stroke-[2.5]" />
              <span>Jalankan Backup Sekarang</span>
            </>
          )}
        </button>
      </div>

      {/* Grid: Status Google Drive & Dual Output Notice */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Card: Google Drive Connection Status */}
        <div className="md:col-span-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-sm text-slate-800">Status Google Drive</h3>
            </div>
            {isDriveConnected ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Terhubung
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Belum Terhubung
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Hubungkan akun Google Drive sekolah Anda untuk mengaktifkan sinkronisasi otomatis arsip backup CBT ke penyimpanan awan yang aman.
          </p>

          {isDriveConnected ? (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {googleUser?.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt="User"
                    className="w-10 h-10 rounded-full border border-slate-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm">
                    {googleUser?.displayName ? googleUser.displayName.charAt(0) : 'G'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-800 truncate">
                    {googleUser?.displayName || 'Akun Google Terhubung'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {googleUser?.email || 'Google Drive Active'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDisconnectDrive}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition shrink-0"
              >
                Putuskan
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnectDrive}
              disabled={isConnecting}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 active:scale-[0.98] text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isConnecting ? 'Menghubungkan...' : 'Hubungkan Akun Google Drive'}</span>
            </button>
          )}
        </div>

        {/* Card: Dual Output Mechanism Information */}
        <div className="md:col-span-6 bg-gradient-to-br from-indigo-50/70 to-sky-50/70 p-5 rounded-2xl shadow-sm border border-indigo-100 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
              <h3 className="font-bold text-sm text-indigo-950">Mekanisme Dual Output Sekaligus</h3>
            </div>
            <p className="text-xs text-indigo-900/90 leading-relaxed">
              Sesuai dengan ketentuan perlindungan data, setiap kali sistem melakukan proses backup (baik dijadwalkan maupun manual):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 bg-white/90 rounded-xl border border-indigo-100 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Output 1: Lokal</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  File arsip otomatis di-download ke folder Download komputer Anda.
                </p>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-indigo-100 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Cloud className="w-3.5 h-3.5 text-sky-600" />
                  <span>Output 2: Google Drive</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  File arsip otomatis diunggah ke Google Drive dengan tautan akses langsung.
                </p>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-indigo-700/80 font-medium">
            Mencakup: Akun Pengguna, Bank Soal, Kunci Jawaban, Materi, Rekap Nilai, & Pengaturan.
          </div>
        </div>
      </div>

      {/* Pengaturan Jadwal Otomatis */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-800">Konfigurasi Jadwal Otomatis</h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            <span className="ml-3 text-xs font-bold text-slate-700">
              {config.enabled ? 'Jadwal Aktif' : 'Nonaktif'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Frekuensi Backup
            </label>
            <select
              value={config.frequency}
              disabled={!config.enabled}
              onChange={(e) =>
                setConfig({ ...config, frequency: e.target.value as 'daily' | 'weekly' | 'interval' })
              }
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium focus:border-indigo-600 focus:outline-none disabled:bg-slate-100"
            >
              <option value="daily">Setiap Hari (Harian)</option>
              <option value="weekly">Setiap Minggu (Mingguan)</option>
              <option value="interval">Interval Jam Berkala</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Waktu Eksekusi Harian (WIB)
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="time"
                value={config.dailyTime}
                disabled={!config.enabled || config.frequency === 'interval'}
                onChange={(e) => setConfig({ ...config, dailyTime: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium focus:border-indigo-600 focus:outline-none disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Interval Berkala (Jika Memilih Interval)
            </label>
            <select
              value={config.intervalHours}
              disabled={!config.enabled || config.frequency !== 'interval'}
              onChange={(e) => setConfig({ ...config, intervalHours: Number(e.target.value) })}
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium focus:border-indigo-600 focus:outline-none disabled:bg-slate-100"
            >
              <option value={6}>Setiap 6 Jam</option>
              <option value={12}>Setiap 12 Jam</option>
              <option value={24}>Setiap 24 Jam</option>
              <option value={48}>Setiap 2 Hari</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={isSavingConfig}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm transition shadow-xs"
          >
            {isSavingConfig ? 'Menyimpan...' : 'Simpan Pengaturan Jadwal'}
          </button>
        </div>
      </div>

      {/* Tabel Riwayat Backup */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-sm text-slate-800">Riwayat Eksekusi Backup</h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {history.length} Catatan Arsip
          </span>
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Belum ada riwayat backup yang dicatat. Klik tombol "Jalankan Backup Sekarang" untuk memulai pencadangan pertama.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3">Waktu Eksekusi</th>
                  <th className="p-3">Nama File Arsip</th>
                  <th className="p-3">Ukuran</th>
                  <th className="p-3 text-center">Output 1 (Lokal)</th>
                  <th className="p-3 text-center">Output 2 (Google Drive)</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 text-slate-700 whitespace-nowrap font-medium">
                      {new Date(item.timestamp).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800 text-[11px] truncate max-w-[200px]" title={item.filename}>
                      {item.filename}
                    </td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {formatFileSize(item.sizeBytes)}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {item.localDownload === 'Sukses' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Sukses
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                          Gagal
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {item.driveUpload === 'Sukses' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <Cloud className="w-3 h-3 text-emerald-600" />
                          Tersimpan di Drive
                        </span>
                      ) : item.driveUpload === 'Belum Terhubung' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          Belum Terhubung
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold" title={item.error}>
                          Gagal
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {item.driveLink && (
                        <a
                          href={item.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-[11px] font-bold border border-sky-200 transition"
                        >
                          <ExternalLink className="w-3 h-3 text-sky-600" />
                          <span>Buka Drive</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
