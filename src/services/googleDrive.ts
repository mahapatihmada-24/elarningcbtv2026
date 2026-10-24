import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import { api } from './api';

// In-memory cache for Google OAuth access token (per security guidelines)
let cachedAccessToken: string | null = null;
let currentGoogleUser: FirebaseUser | null = null;

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

// Inisialisasi listener auth state
export const initGoogleDriveAuth = (
  onAuthChange?: (connected: boolean, user: FirebaseUser | null) => void
) => {
  return onAuthStateChanged(auth, (user) => {
    currentGoogleUser = user;
    if (!user) {
      cachedAccessToken = null;
    }
    if (onAuthChange) {
      onAuthChange(!!user && !!cachedAccessToken, user);
    }
  });
};

export const getCachedDriveToken = (): string | null => {
  return cachedAccessToken;
};

export const getCurrentGoogleUser = (): FirebaseUser | null => {
  return currentGoogleUser;
};

export const connectGoogleDrive = async (): Promise<{ success: boolean; user?: FirebaseUser; token?: string; error?: string }> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses Google Drive.');
    }
    cachedAccessToken = credential.accessToken;
    currentGoogleUser = result.user;
    return {
      success: true,
      user: result.user,
      token: cachedAccessToken,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Google Drive connection error:', err);
    return {
      success: false,
      error: msg,
    };
  }
};

export const disconnectGoogleDrive = async (): Promise<void> => {
  try {
    cachedAccessToken = null;
    currentGoogleUser = null;
    await auth.signOut();
  } catch (err) {
    console.error('Google Drive disconnect error:', err);
  }
};

export interface BackupHistoryItem {
  id: string;
  timestamp: string;
  filename: string;
  sizeBytes: number;
  localDownload: 'Sukses' | 'Gagal';
  driveUpload: 'Sukses' | 'Gagal' | 'Belum Terhubung';
  driveFileId?: string;
  driveLink?: string;
  error?: string;
}

export interface BackupScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'interval';
  dailyTime: string; // e.g. "16:00"
  intervalHours: number; // e.g. 24
  autoDownloadLocal: boolean;
  autoUploadDrive: boolean;
  lastRunTimestamp?: string;
  lastRunStatus?: 'success' | 'partial' | 'failed';
}

const BACKUP_CONFIG_KEY = 'cbt_backup_schedule_config';
const BACKUP_HISTORY_KEY = 'cbt_backup_history_records';

export const getBackupConfig = (): BackupScheduleConfig => {
  try {
    const saved = localStorage.getItem(BACKUP_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return {
    enabled: true,
    frequency: 'daily',
    dailyTime: '16:00',
    intervalHours: 24,
    autoDownloadLocal: true,
    autoUploadDrive: true,
  };
};

export const saveBackupConfig = (config: BackupScheduleConfig): void => {
  try {
    localStorage.setItem(BACKUP_CONFIG_KEY, JSON.stringify(config));
  } catch {}
};

export const getBackupHistory = (): BackupHistoryItem[] => {
  try {
    const saved = localStorage.getItem(BACKUP_HISTORY_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return [];
};

export const addBackupHistory = (item: BackupHistoryItem): void => {
  try {
    const current = getBackupHistory();
    const updated = [item, ...current].slice(0, 30); // Simpan 30 riwayat terakhir
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(updated));
  } catch {}
};

// Buat konten data lengkap untuk arsip sistem
export const generateFullSystemBackup = async (): Promise<{ filename: string; jsonString: string; payload: Record<string, unknown> }> => {
  const [schoolProfile, users, ujian, materi, nilai, announcements] = await Promise.all([
    api.getSchoolProfile().catch(() => null),
    api.getUsers().catch(() => []),
    api.getUjianList('ALL', 'guru').catch(() => []),
    api.getMateriList('ALL').catch(() => []),
    api.getNilaiList().catch(() => []),
    api.getAnnouncements().catch(() => []),
  ]);

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
  const schoolNameSanitized = (schoolProfile?.namaSekolah || 'SDN_HARJOSARI_KIDUL_01')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_');

  const filename = `BACKUP_CBT_${schoolNameSanitized}_${dateStr}.json`;

  const payload = {
    version: 'v2026',
    system: 'E-Learning & CBT System',
    exportedAt: now.toISOString(),
    exportDateFormatted: now.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' }),
    schoolProfile,
    summary: {
      totalUsers: users.length,
      totalUjian: ujian.length,
      totalMateri: materi.length,
      totalNilai: nilai.length,
      totalAnnouncements: announcements.length,
    },
    data: {
      users,
      ujian,
      materi,
      nilai,
      announcements,
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);
  return { filename, jsonString, payload };
};

// Output 1: Trigger unduh file otomatis ke perangkat lokal
export const triggerLocalFileDownload = (filename: string, content: string): boolean => {
  try {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 300);
    return true;
  } catch (err) {
    console.error('Failed to trigger local file download:', err);
    return false;
  }
};

// Output 2: Unggah otomatis file backup ke Google Drive via REST API Multipart
export const uploadBackupFileToGoogleDrive = async (
  filename: string,
  content: string
): Promise<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }> => {
  if (!cachedAccessToken) {
    return {
      success: false,
      error: 'Google Drive belum terhubung atau token akses belum tersedia. Silakan hubungkan akun Google Drive terlebih dahulu.',
    };
  }

  try {
    const metadata = {
      name: filename,
      mimeType: 'application/json',
      description: 'Arsip Backup Otomatis CBT E-Learning SDN Harjosari Kidul 01',
    };

    const boundary = '-------CBTBackupBoundary' + Math.random().toString(36).substring(2);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const multipartBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      content +
      closeDelim;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Drive API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return {
      success: true,
      fileId: data.id,
      webViewLink: data.webViewLink,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Upload to Google Drive error:', err);
    return {
      success: false,
      error: msg,
    };
  }
};

// Eksekusi proses backup lengkap (Menghasilkan 2 output sekaligus: Lokal + Drive)
export const executeCompleteBackup = async (
  forceDrivePromptIfUnconnected = false
): Promise<{
  filename: string;
  localSuccess: boolean;
  driveSuccess: boolean;
  driveLink?: string;
  error?: string;
}> => {
  // 1. Buat arsip data sistem
  const { filename, jsonString } = await generateFullSystemBackup();
  const sizeBytes = new Blob([jsonString]).size;

  // 2. Output 1: Unduh ke perangkat lokal
  const localSuccess = triggerLocalFileDownload(filename, jsonString);

  // 3. Output 2: Unggah ke Google Drive
  let driveSuccess = false;
  let driveLink: string | undefined;
  let driveError: string | undefined;

  if (cachedAccessToken) {
    const driveRes = await uploadBackupFileToGoogleDrive(filename, jsonString);
    driveSuccess = driveRes.success;
    driveLink = driveRes.webViewLink;
    driveError = driveRes.error;
  } else if (forceDrivePromptIfUnconnected) {
    const authRes = await connectGoogleDrive();
    if (authRes.success && cachedAccessToken) {
      const driveRes = await uploadBackupFileToGoogleDrive(filename, jsonString);
      driveSuccess = driveRes.success;
      driveLink = driveRes.webViewLink;
      driveError = driveRes.error;
    } else {
      driveError = authRes.error || 'Autentikasi Google Drive dibatalkan.';
    }
  } else {
    driveError = 'Google Drive belum terhubung saat jadwal backup otomatis berjalan.';
  }

  // 4. Catat riwayat backup
  const historyItem: BackupHistoryItem = {
    id: 'bcp_' + Date.now(),
    timestamp: new Date().toISOString(),
    filename,
    sizeBytes,
    localDownload: localSuccess ? 'Sukses' : 'Gagal',
    driveUpload: driveSuccess ? 'Sukses' : cachedAccessToken ? 'Gagal' : 'Belum Terhubung',
    driveLink,
    error: driveError,
  };
  addBackupHistory(historyItem);

  // 5. Perbarui status terakhir jadwal
  const config = getBackupConfig();
  config.lastRunTimestamp = new Date().toISOString();
  config.lastRunStatus = localSuccess && driveSuccess ? 'success' : localSuccess ? 'partial' : 'failed';
  saveBackupConfig(config);

  return {
    filename,
    localSuccess,
    driveSuccess,
    driveLink,
    error: driveError,
  };
};
