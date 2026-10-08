import { User, Materi, Ujian, Nilai, ApiResponse, SchoolProfile, Announcement } from '../types';
import { INITIAL_USERS, INITIAL_MATERI, INITIAL_UJIAN, INITIAL_NILAI } from './seedData';
import {
  firebaseService,
  ensureFirebaseSeeded,
  FirebaseConnectionDiagnostic,
  FirebaseAppConfig,
  getActiveFirebaseConfig,
  setActiveFirebaseConfig,
  resetActiveFirebaseConfig,
  PRESET_CONFIGS,
  isFirestoreOffline,
} from './firebase';
import {
  normalizeUser,
  normalizeMateri,
  normalizeUjian,
  normalizeNilai,
} from './normalizers';

// Re-export normalizers & Firebase helpers for backward compatibility
export {
  normalizeUser,
  normalizeMateri,
  normalizeUjian,
  normalizeNilai,
  getActiveFirebaseConfig,
  setActiveFirebaseConfig,
  resetActiveFirebaseConfig,
  PRESET_CONFIGS,
  isFirestoreOffline,
};
export type { FirebaseConnectionDiagnostic, FirebaseAppConfig };

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  namaSekolah: 'SD NEGERI HARJOSARI KIDUL 01',
  npsn: '20325432',
  alamat: 'Jl. Raya Harjosari Kidul No. 01, Kec. Adiwerna, Kab. Tegal, Jawa Tengah',
  kepalaSekolah: 'Hj. Siti Rohmah, S.Pd., M.Pd.',
  nipKepalaSekolah: '19680512 199303 2 005',
  tahunAjaran: '2025/2026',
  semester: 'Genap',
  kkmDefault: 75,
  enableMFAAdmin: true,
  adminOTPSecret: '240101',
  sessionTimeoutMinutes: 30,
};

export const DEFAULT_MASTER_KELAS: string[] = [
  '1A',
  '1B',
  '2A',
  '2B',
  '3A',
  '3B',
  '4A',
  '4B',
  '5A',
  '5B',
  '6A',
  '6B',
  'Semua',
];
export const DEFAULT_MASTER_MAPEL: string[] = [
  'Matematika',
  'Bahasa Indonesia',
  'IPA (Ilmu Pengetahuan Alam)',
  'IPS (Ilmu Pengetahuan Sosial)',
  'PPKn (Pendidikan Kewarganegaraan)',
  'Pendidikan Agama & Budi Pekerti',
  'PJOK (Pendidikan Jasmani & Olahraga)',
  'Seni Budaya & Prakarya',
  'Bahasa Jawa',
  'Bahasa Inggris',
  'Umum / Tematik',
];

export const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbwCqf1vnHI09ud7lV3pOFgGdShJaqjbv_6y74bv8F5PqKhGpIOLnGUgsLpqSWlGnbAGnQ/exec';

const STORAGE_KEY_GAS_URL = 'cbt_gas_web_app_url';
const STORAGE_KEY_PREFERRED_SOURCE = 'cbt_preferred_data_source';
const STORAGE_KEY_USERS = 'cbt_db_users';
const STORAGE_KEY_MATERI = 'cbt_db_materi';
const STORAGE_KEY_UJIAN = 'cbt_db_ujian';
const STORAGE_KEY_NILAI = 'cbt_db_nilai';
const STORAGE_KEY_SCHOOL_PROFILE = 'cbt_db_school_profile';
const STORAGE_KEY_MASTER_KELAS = 'cbt_db_master_kelas';
const STORAGE_KEY_MASTER_MAPEL = 'cbt_db_master_mapel';
const STORAGE_KEY_ANNOUNCEMENTS = 'cbt_db_announcements';

// Initialize LocalStorage with seed data if empty
function ensureLocalDbInitialized() {
  if (!localStorage.getItem(STORAGE_KEY_USERS)) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEY_MATERI)) {
    localStorage.setItem(STORAGE_KEY_MATERI, JSON.stringify(INITIAL_MATERI));
  }
  if (!localStorage.getItem(STORAGE_KEY_UJIAN)) {
    localStorage.setItem(STORAGE_KEY_UJIAN, JSON.stringify(INITIAL_UJIAN));
  }
  if (!localStorage.getItem(STORAGE_KEY_NILAI)) {
    localStorage.setItem(STORAGE_KEY_NILAI, JSON.stringify(INITIAL_NILAI));
  }
  if (!localStorage.getItem(STORAGE_KEY_SCHOOL_PROFILE)) {
    localStorage.setItem(STORAGE_KEY_SCHOOL_PROFILE, JSON.stringify(DEFAULT_SCHOOL_PROFILE));
  } else if (!localStorage.getItem('cbt_mfa_initialized_v2')) {
    localStorage.setItem('cbt_mfa_initialized_v2', 'true');
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_SCHOOL_PROFILE) || '{}');
      existing.enableMFAAdmin = true;
      if (!existing.adminOTPSecret) existing.adminOTPSecret = '240101';
      localStorage.setItem(STORAGE_KEY_SCHOOL_PROFILE, JSON.stringify(existing));
    } catch {}
  }
  if (!localStorage.getItem(STORAGE_KEY_MASTER_KELAS)) {
    localStorage.setItem(STORAGE_KEY_MASTER_KELAS, JSON.stringify(DEFAULT_MASTER_KELAS));
  }
  if (!localStorage.getItem(STORAGE_KEY_MASTER_MAPEL)) {
    localStorage.setItem(STORAGE_KEY_MASTER_MAPEL, JSON.stringify(DEFAULT_MASTER_MAPEL));
  }
  if (!localStorage.getItem(STORAGE_KEY_ANNOUNCEMENTS)) {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(
      STORAGE_KEY_ANNOUNCEMENTS,
      JSON.stringify([
        {
          id: 'PENG-01',
          judul: 'Panduan & Jadwal Pelaksanaan Asesmen CBT Semester Genap',
          isi: 'Diberitahukan kepada seluruh Guru dan Siswa, berikut terlampir berkas kisi-kisi dan panduan pelaksanaan asesmen CBT. Dokumen dapat diunduh langsung atau dilihat melalui tautan lampiran di bawah.',
          tanggal: today,
          penulis: 'Hj. Siti Rohmah, M.Pd. (Kepala Sekolah)',
          target: 'semua',
          kategori: 'ujian',
          pinned: true,
          linkUrl: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
          linkTitle: 'Panduan Pelaksanaan & Kisi-Kisi CBT (Google Drive / Docs)',
        },
        {
          id: 'PENG-02',
          judul: 'Selamat Datang di Portal CBT SDN Harjosari Kidul 01',
          isi: 'Sistem CBT kini dilengkapi fitur acak soal, proteksi anti-contek, format soal berstandar nasional, serta papan pengumuman resmi dengan dukungan unduh berkas (PDF, Excel, Word) dan Google Drive.',
          tanggal: today,
          penulis: 'Administrator',
          target: 'semua',
          kategori: 'info',
        },
      ])
    );
  }
}

ensureLocalDbInitialized();

export function getGasUrl(): string {
  return localStorage.getItem(STORAGE_KEY_GAS_URL) || DEFAULT_GAS_URL;
}

export function setGasUrl(url: string) {
  localStorage.setItem(STORAGE_KEY_GAS_URL, url.trim());
}

export function resetGasUrl() {
  localStorage.setItem(STORAGE_KEY_GAS_URL, DEFAULT_GAS_URL);
}

// Local Storage Helpers
function getLocalUsers(): User[] {
  ensureLocalDbInitialized();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    if (Array.isArray(raw)) {
      return raw.map(normalizeUser);
    }
    return INITIAL_USERS.map(normalizeUser);
  } catch {
    return INITIAL_USERS.map(normalizeUser);
  }
}

function saveLocalUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users.map(normalizeUser)));
}

function getLocalMateri(): Materi[] {
  ensureLocalDbInitialized();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_MATERI) || '[]');
    if (Array.isArray(raw)) {
      return raw.map(normalizeMateri);
    }
    return INITIAL_MATERI.map(normalizeMateri);
  } catch {
    return INITIAL_MATERI.map(normalizeMateri);
  }
}

function saveLocalMateri(materi: Materi[]) {
  localStorage.setItem(STORAGE_KEY_MATERI, JSON.stringify(materi.map(normalizeMateri)));
}

let inMemoryUjianList: Ujian[] | null = null;

function getLocalUjian(): Ujian[] {
  if (inMemoryUjianList && inMemoryUjianList.length > 0) {
    return inMemoryUjianList;
  }
  ensureLocalDbInitialized();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_UJIAN) || '[]');
    if (Array.isArray(raw)) {
      const list = raw.map(normalizeUjian);
      inMemoryUjianList = list;
      return list;
    }
    const list = INITIAL_UJIAN.map(normalizeUjian);
    inMemoryUjianList = list;
    return list;
  } catch {
    const list = INITIAL_UJIAN.map(normalizeUjian);
    inMemoryUjianList = list;
    return list;
  }
}

function saveLocalUjian(ujian: Ujian[]) {
  inMemoryUjianList = ujian.map(normalizeUjian);
  try {
    localStorage.setItem(STORAGE_KEY_UJIAN, JSON.stringify(inMemoryUjianList));
  } catch (err) {
    console.warn('LocalStorage quota exceeded in saveLocalUjian. Applying safe storage prune.', err);
    try {
      // Clear old ephemeral logs
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('cbt_log_') || k.startsWith('cbt_temp_') || k.startsWith('cbt_draft_'))) {
          localStorage.removeItem(k);
        }
      }
      localStorage.setItem(STORAGE_KEY_UJIAN, JSON.stringify(inMemoryUjianList));
    } catch {
      // If still over quota, store lightweight metadata in localStorage while keeping full questions in memory
      try {
        const lightweight = inMemoryUjianList.map((u) => {
          try {
            const parsed = JSON.parse(u.Soal_JSON || '{}');
            if (parsed && Array.isArray(parsed.questions)) {
              const strippedQ = parsed.questions.map((q: any) => {
                const copy = { ...q };
                if (copy.gambar && copy.gambar.startsWith('data:image')) copy.gambar = '[Gambar Tersimpan]';
                if (Array.isArray(copy.gambar_list)) {
                  copy.gambar_list = copy.gambar_list.map((img: string) =>
                    img.startsWith('data:image') ? '[Gambar Tersimpan]' : img
                  );
                }
                return copy;
              });
              return { ...u, Soal_JSON: JSON.stringify({ ...parsed, questions: strippedQ }) };
            }
          } catch {}
          return u;
        });
        localStorage.setItem(STORAGE_KEY_UJIAN, JSON.stringify(lightweight));
      } catch (finalErr) {
        console.warn('Cannot persist to localStorage:', finalErr);
      }
    }
  }
}

function getLocalNilai(): Nilai[] {
  ensureLocalDbInitialized();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_NILAI) || '[]');
    if (Array.isArray(raw)) {
      return raw.map(normalizeNilai);
    }
    return INITIAL_NILAI.map(normalizeNilai);
  } catch {
    return INITIAL_NILAI.map(normalizeNilai);
  }
}

function saveLocalNilai(nilai: Nilai[]) {
  localStorage.setItem(STORAGE_KEY_NILAI, JSON.stringify(nilai.map(normalizeNilai)));
}

function getLocalSchoolProfile(): SchoolProfile {
  ensureLocalDbInitialized();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_SCHOOL_PROFILE) || '{}');
    return { ...DEFAULT_SCHOOL_PROFILE, ...raw };
  } catch {
    return DEFAULT_SCHOOL_PROFILE;
  }
}

function saveLocalSchoolProfile(profile: SchoolProfile) {
  localStorage.setItem(STORAGE_KEY_SCHOOL_PROFILE, JSON.stringify(profile));
}

function getLocalMasterKelas(): string[] {
  ensureLocalDbInitialized();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_MASTER_KELAS) || '[]');
    return Array.isArray(raw) && raw.length > 0 ? raw : DEFAULT_MASTER_KELAS;
  } catch {
    return DEFAULT_MASTER_KELAS;
  }
}

function saveLocalMasterKelas(classes: string[]) {
  localStorage.setItem(STORAGE_KEY_MASTER_KELAS, JSON.stringify(classes));
}

function getLocalMasterMapel(): string[] {
  ensureLocalDbInitialized();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_MASTER_MAPEL) || '[]');
    return Array.isArray(raw) && raw.length > 0 ? raw : DEFAULT_MASTER_MAPEL;
  } catch {
    return DEFAULT_MASTER_MAPEL;
  }
}

function saveLocalMasterMapel(mapels: string[]) {
  localStorage.setItem(STORAGE_KEY_MASTER_MAPEL, JSON.stringify(mapels));
}

function getLocalAnnouncements(): Announcement[] {
  ensureLocalDbInitialized();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_ANNOUNCEMENTS) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveLocalAnnouncements(items: Announcement[]) {
  localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(items));
}

// Low-level GAS caller with timeout
async function callGasServer<T>(action: string, args: unknown[] = []): Promise<T> {
  const gasUrl = getGasUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, args }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return data as T;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Status callback for notifying UI of active data source: FIREBASE (default), GAS, or LOCAL
export type DataSource = 'FIREBASE' | 'GAS' | 'LOCAL';

function getInitialDataSource(): DataSource {
  const saved = localStorage.getItem(STORAGE_KEY_PREFERRED_SOURCE) as DataSource;
  if (saved === 'FIREBASE' || saved === 'GAS' || saved === 'LOCAL') {
    return saved;
  }
  return 'FIREBASE';
}

let currentDataSource: DataSource = getInitialDataSource();
const listeners: Array<(src: DataSource) => void> = [];

export function getDataSource(): DataSource {
  return currentDataSource;
}

export function setPreferredDataSource(src: DataSource) {
  localStorage.setItem(STORAGE_KEY_PREFERRED_SOURCE, src);
  notifyDataSource(src);
}

export function subscribeDataSource(fn: (src: DataSource) => void) {
  listeners.push(fn);
  fn(currentDataSource);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notifyDataSource(src: DataSource) {
  if (currentDataSource !== src) {
    currentDataSource = src;
    listeners.forEach((fn) => fn(src));
  }
}

// Auto-seed Firebase on initial startup in background
ensureFirebaseSeeded().catch(() => {});

let inFlightSchoolProfilePromise: Promise<SchoolProfile> | null = null;

// Unified API Methods supporting Firebase Firestore, Google Apps Script, and Local Storage
export const api = {
  // Test connection to Firebase Firestore
  async testFirebaseConnection(): Promise<FirebaseConnectionDiagnostic> {
    const res = await firebaseService.testConnection();
    if (res.success) {
      notifyDataSource('FIREBASE');
    }
    return res;
  },

  // Manual seed to Firebase
  async seedInitialFirebaseCollections(): Promise<ApiResponse> {
    return firebaseService.seedInitialCollections();
  },

  // Test connection to GAS
  async testGasConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await callGasServer<User[]>('getUsers', []);
      if (Array.isArray(res)) {
        notifyDataSource('GAS');
        return { success: true, message: 'Berhasil terhubung ke Google Apps Script!' };
      }
      return { success: false, message: 'Respon dari Google Apps Script tidak sesuai format.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Gagal terhubung ke GAS: ${msg}.` };
    }
  },

  // 1. AUTH
  async loginUser(username: string, password: string): Promise<ApiResponse> {
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Prioritize Firebase Firestore
    if (currentDataSource === 'FIREBASE') {
      try {
        const res = await firebaseService.loginUser(cleanUsername, cleanPassword);
        if (res.success && res.user) {
          notifyDataSource('FIREBASE');
          // Cache user to local storage
          const users = getLocalUsers();
          const existingIdx = users.findIndex((u) => u.username.toLowerCase() === cleanUsername);
          if (existingIdx !== -1) {
            users[existingIdx] = res.user;
          } else {
            users.push(res.user);
          }
          saveLocalUsers(users);
          return res;
        }

        // If not found in Firebase yet, check local users as resilient fallback
        const localUsers = getLocalUsers();
        const localMatch = localUsers.find(
          (u) =>
            (u.username || '').trim().toLowerCase() === cleanUsername &&
            (u.password || '').trim() === cleanPassword
        );
        if (localMatch) {
          firebaseService.addUser(localMatch).catch(() => {});
          return {
            success: true,
            message: 'Berhasil masuk!',
            user: normalizeUser(localMatch),
          };
        }
        return res;
      } catch (err: unknown) {
        console.warn('Firebase login error, falling back to local storage:', err);
      }
    }

    // Try Google Apps Script if selected
    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<ApiResponse>('loginUser', [cleanUsername, cleanPassword]);
        if (res && typeof res.success === 'boolean') {
          notifyDataSource('GAS');
          if (res.user) {
            res.user = normalizeUser(res.user);
          }
          return res;
        }
      } catch {
        console.warn('GAS login error, checking local storage');
      }
    }

    // Fallback to local storage
    const users = getLocalUsers();
    const matched = users.find(
      (u) =>
        (u.username || '').trim().toLowerCase() === cleanUsername &&
        (u.password || '').trim() === cleanPassword
    );
    if (matched) {
      return {
        success: true,
        message: 'Berhasil masuk (Mode Lokal Offline)',
        user: normalizeUser(matched),
      };
    }
    return {
      success: false,
      message: 'Username atau Password yang Anda masukkan salah!',
    };
  },

  // 2. USERS
  async getUsers(): Promise<User[]> {
    if (currentDataSource === 'FIREBASE' && !isFirestoreOffline()) {
      try {
        const users = await firebaseService.getUsers();
        if (users && users.length > 0) {
          saveLocalUsers(users);
          return users;
        }
      } catch (err) {
        // Fall back to local
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<User[]>('getUsers', []);
        if (Array.isArray(res)) {
          const normalized = res.map(normalizeUser);
          saveLocalUsers(normalized);
          return normalized;
        }
      } catch (err) {
        console.warn('GAS getUsers error, falling back to local:', err);
      }
    }

    return getLocalUsers();
  },

  async addUser(userData: User): Promise<ApiResponse> {
    const cleanUser = normalizeUser(userData);

    // Save to Firebase
    if (currentDataSource === 'FIREBASE') {
      try {
        const res = await firebaseService.addUser(cleanUser);
        const users = getLocalUsers();
        users.push(cleanUser);
        saveLocalUsers(users);
        return res;
      } catch (err: unknown) {
        console.warn('Firebase addUser error:', err);
      }
    }

    // Save to GAS
    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<ApiResponse>('addUser', [cleanUser]);
        if (res && res.success) {
          const users = getLocalUsers();
          users.push(cleanUser);
          saveLocalUsers(users);
          return res;
        }
      } catch (err) {
        console.warn('GAS addUser error:', err);
      }
    }

    // Fallback to local storage
    const users = getLocalUsers();
    if (users.some((u) => (u.username || '').toLowerCase() === (cleanUser.username || '').toLowerCase())) {
      return { success: false, message: 'Username sudah digunakan oleh akun lain!' };
    }
    users.push(cleanUser);
    saveLocalUsers(users);
    return { success: true, message: 'Pengguna baru berhasil ditambahkan!' };
  },

  async addUsersBatch(userList: User[]): Promise<{ success: boolean; message: string; count: number }> {
    if (!userList || userList.length === 0) {
      return { success: true, message: 'Tidak ada data pengguna yang dipilih.', count: 0 };
    }

    const cleanUsers = userList.map((u) => normalizeUser(u));

    // 1. Sync to Firebase
    if (currentDataSource === 'FIREBASE') {
      try {
        const res = await firebaseService.addUsersBatch(cleanUsers);
        // Sync local cache
        const local = getLocalUsers();
        cleanUsers.forEach((nu) => {
          const idx = local.findIndex((l) => (l.username || '').toLowerCase() === nu.username.toLowerCase());
          if (idx >= 0) local[idx] = nu;
          else local.push(nu);
        });
        saveLocalUsers(local);
        return res;
      } catch (err) {
        console.warn('Firebase addUsersBatch error:', err);
      }
    }

    // 2. Fallback local
    const local = getLocalUsers();
    cleanUsers.forEach((nu) => {
      const idx = local.findIndex((l) => (l.username || '').toLowerCase() === nu.username.toLowerCase());
      if (idx >= 0) local[idx] = nu;
      else local.push(nu);
    });
    saveLocalUsers(local);
    return {
      success: true,
      message: `Berhasil menyimpan ${cleanUsers.length} akun pengguna!`,
      count: cleanUsers.length,
    };
  },

  async deleteUser(username: string): Promise<ApiResponse> {
    const cleanU = (username || '').trim();

    if (currentDataSource === 'FIREBASE') {
      try {
        const res = await firebaseService.deleteUser(cleanU);
        const users = getLocalUsers().filter((u) => (u.username || '').trim() !== cleanU);
        saveLocalUsers(users);
        return res;
      } catch (err) {
        console.warn('Firebase deleteUser error:', err);
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<ApiResponse>('deleteUser', [cleanU]);
        if (res && res.success) {
          const users = getLocalUsers().filter((u) => (u.username || '').trim() !== cleanU);
          saveLocalUsers(users);
          return res;
        }
      } catch (err) {
        console.warn('GAS deleteUser error:', err);
      }
    }

    const users = getLocalUsers().filter((u) => (u.username || '').trim() !== cleanU);
    saveLocalUsers(users);
    return { success: true, message: 'Pengguna berhasil dihapus!' };
  },

  async updateUser(user: User): Promise<ApiResponse> {
    const cleanUser = normalizeUser(user);

    if (currentDataSource === 'FIREBASE') {
      try {
        const res = await firebaseService.updateUser(cleanUser);
        const users = getLocalUsers();
        const idx = users.findIndex(
          (u) => (u.username || '').toLowerCase() === cleanUser.username.toLowerCase()
        );
        if (idx >= 0) users[idx] = cleanUser;
        else users.push(cleanUser);
        saveLocalUsers(users);
        return res;
      } catch (err) {
        console.warn('Firebase updateUser error:', err);
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<ApiResponse>('updateUser', [cleanUser]);
        if (res && res.success) {
          const users = getLocalUsers();
          const idx = users.findIndex(
            (u) => (u.username || '').toLowerCase() === cleanUser.username.toLowerCase()
          );
          if (idx >= 0) users[idx] = cleanUser;
          else users.push(cleanUser);
          saveLocalUsers(users);
          return res;
        }
      } catch (err) {
        console.warn('GAS updateUser error:', err);
      }
    }

    const users = getLocalUsers();
    const idx = users.findIndex(
      (u) => (u.username || '').toLowerCase() === cleanUser.username.toLowerCase()
    );
    if (idx >= 0) users[idx] = cleanUser;
    else users.push(cleanUser);
    saveLocalUsers(users);
    return { success: true, message: 'Data pengguna berhasil diperbarui!' };
  },

  async resetUserPassword(username: string, newPassword = '123456'): Promise<ApiResponse> {
    const cleanU = (username || '').trim().toLowerCase();
    const users = getLocalUsers();
    const target = users.find((u) => (u.username || '').toLowerCase() === cleanU);
    if (!target) {
      return { success: false, message: 'Pengguna tidak ditemukan!' };
    }
    target.password = newPassword;
    return this.updateUser(target);
  },

  // 3. MATERI
  async getMateriList(targetKelas: string): Promise<Materi[]> {
    const cleanTarget = (targetKelas || '').trim().toLowerCase();
    const isAllClasses = !cleanTarget || cleanTarget === 'all' || cleanTarget === 'semua';

    if (currentDataSource === 'FIREBASE' && !isFirestoreOffline()) {
      try {
        const allMateri = await firebaseService.getMateriList();
        if (Array.isArray(allMateri)) {
          saveLocalMateri(allMateri);
          if (isAllClasses) return [...allMateri].reverse();
          return allMateri
            .filter(
              (m) =>
                m.Kelas === 'Semua' ||
                (m.Kelas || '').toLowerCase() === cleanTarget
            )
            .reverse();
        }
      } catch (err) {
        // Fall back to local
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<Materi[]>('getMateriList', [targetKelas]);
        if (Array.isArray(res)) {
          const normalized = res.map(normalizeMateri);
          saveLocalMateri(normalized);
          if (isAllClasses) return normalized;
          return normalized.filter(
            (m) =>
              m.Kelas === 'Semua' ||
              (m.Kelas || '').toLowerCase() === cleanTarget
          );
        }
      } catch (err) {
        console.warn('GAS getMateriList error, fallback to local:', err);
      }
    }

    const list = getLocalMateri();
    if (isAllClasses) return [...list].reverse();
    return list
      .filter(
        (m) =>
          m.Kelas === 'Semua' ||
          (m.Kelas || '').toLowerCase() === cleanTarget
      )
      .reverse();
  },

  async saveMateri(materiData: Partial<Materi>): Promise<ApiResponse> {
    const list = getLocalMateri();

    if (currentDataSource === 'FIREBASE') {
      try {
        if (materiData.ID) {
          const res = await firebaseService.updateMateri(normalizeMateri(materiData));
          const idx = list.findIndex((m) => m.ID === materiData.ID);
          if (idx !== -1) list[idx] = normalizeMateri({ ...list[idx], ...materiData });
          saveLocalMateri(list);
          return res;
        } else {
          const res = await firebaseService.addMateri(materiData as Omit<Materi, 'ID'>);
          const allM = await firebaseService.getMateriList();
          saveLocalMateri(allM);
          return res;
        }
      } catch (err) {
        console.warn('Firebase saveMateri error, using local:', err);
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<ApiResponse>('saveMateri', [
          {
            id: materiData.ID || '',
            judul: materiData.Judul || '',
            mapel: materiData.Mapel || '',
            kelas: materiData.Kelas || '',
            konten_link: materiData.Konten_Link || '',
            gambar_url: materiData.Gambar_URL || '',
            sumber: materiData.Sumber || '',
            nama_guru: materiData.Nama_Guru || '',
          },
        ]);
        if (res && res.success) return res;
      } catch (err) {
        console.warn('GAS saveMateri error:', err);
      }
    }

    if (materiData.ID) {
      const idx = list.findIndex((m) => m.ID === materiData.ID);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          ...materiData,
          ID: materiData.ID,
        } as Materi;
        saveLocalMateri(list);
        return { success: true, message: 'Materi berhasil diperbarui!' };
      }
    }

    const newMateri: Materi = {
      ID: 'MAT-' + Date.now(),
      Judul: materiData.Judul || 'Materi Baru',
      Mapel: materiData.Mapel || 'Umum',
      Kelas: materiData.Kelas || 'Semua',
      Konten_Link: materiData.Konten_Link || '',
      Gambar_URL: materiData.Gambar_URL || '',
      Sumber: materiData.Sumber || '',
      Nama_Guru: materiData.Nama_Guru || 'Guru',
    };
    list.push(newMateri);
    saveLocalMateri(list);
    return { success: true, message: 'Materi berhasil disimpan!' };
  },

  async deleteMateri(id: string): Promise<ApiResponse> {
    if (currentDataSource === 'FIREBASE') {
      try {
        const res = await firebaseService.deleteMateri(id);
        saveLocalMateri(getLocalMateri().filter((m) => m.ID !== id));
        return res;
      } catch (err) {
        console.warn('Firebase deleteMateri error:', err);
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<ApiResponse>('deleteMateri', [id]);
        if (res && res.success) {
          saveLocalMateri(getLocalMateri().filter((m) => m.ID !== id));
          return res;
        }
      } catch (err) {
        console.warn('GAS deleteMateri error:', err);
      }
    }

    saveLocalMateri(getLocalMateri().filter((m) => m.ID !== id));
    return { success: true, message: 'Materi berhasil dihapus!' };
  },

  // 4. UJIAN & CBT
  async getUjianList(targetKelas: string, role: string): Promise<Ujian[]> {
    const cleanTarget = (targetKelas || '').trim().toLowerCase();
    const isAllClasses = !cleanTarget || cleanTarget === 'all' || cleanTarget === 'semua';
    const isPrivileged = role === 'guru' || role === 'admin';

    if (currentDataSource === 'FIREBASE' && !isFirestoreOffline()) {
      try {
        const allUjian = await firebaseService.getUjianList();
        if (Array.isArray(allUjian)) {
          saveLocalUjian(allUjian);
          if (isPrivileged) {
            if (isAllClasses) return [...allUjian].reverse();
            return allUjian
              .filter(
                (u) =>
                  u.Kelas === 'Semua' ||
                  (u.Kelas || '').toLowerCase() === cleanTarget
              )
              .reverse();
          }
          // Murid role: only active tests
          if (isAllClasses) {
            return allUjian.filter((u) => u.Status === 'Aktif').reverse();
          }
          return allUjian
            .filter(
              (u) =>
                u.Status === 'Aktif' &&
                (u.Kelas === 'Semua' ||
                  (u.Kelas || '').toLowerCase() === cleanTarget)
            )
            .reverse();
        }
      } catch (err) {
        // Fall back to local
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<Ujian[]>('getUjianList', [targetKelas, role]);
        if (Array.isArray(res)) {
          const normalized = res.map(normalizeUjian);
          saveLocalUjian(normalized);
          if (isPrivileged) {
            if (isAllClasses) return normalized;
            return normalized.filter(
              (u) =>
                u.Kelas === 'Semua' ||
                (u.Kelas || '').toLowerCase() === cleanTarget
            );
          }
          if (isAllClasses) {
            return normalized.filter((u) => u.Status === 'Aktif');
          }
          return normalized.filter(
            (u) =>
              u.Status === 'Aktif' &&
              (u.Kelas === 'Semua' ||
                (u.Kelas || '').toLowerCase() === cleanTarget)
          );
        }
      } catch (err) {
        console.warn('GAS getUjianList error, fallback to local:', err);
      }
    }

    const list = getLocalUjian();
    if (isPrivileged) {
      if (isAllClasses) return [...list].reverse();
      return list
        .filter(
          (u) =>
            u.Kelas === 'Semua' ||
            (u.Kelas || '').toLowerCase() === cleanTarget
        )
        .reverse();
    }
    if (isAllClasses) {
      return list.filter((u) => u.Status === 'Aktif').reverse();
    }
    return list
      .filter(
        (u) =>
          u.Status === 'Aktif' &&
          (u.Kelas === 'Semua' ||
            (u.Kelas || '').toLowerCase() === cleanTarget)
      )
      .reverse();
  },

  async saveUjian(ujianData: Partial<Ujian> & { soal: unknown }): Promise<ApiResponse> {
    const list = getLocalUjian();
    const soalJsonStr =
      typeof ujianData.soal === 'string' ? ujianData.soal : JSON.stringify(ujianData.soal);

    if (currentDataSource === 'FIREBASE') {
      try {
        if (ujianData.ID) {
          const payload: Ujian = {
            ID: ujianData.ID,
            Judul_Ujian: ujianData.Judul_Ujian || 'Ujian',
            Mapel: ujianData.Mapel || 'Umum',
            Kelas: ujianData.Kelas || 'Semua',
            Durasi_Menit: Number(ujianData.Durasi_Menit) || 60,
            Token_Ujian: ujianData.Token_Ujian || '',
            Jadwal_Mulai: ujianData.Jadwal_Mulai || '',
            Jadwal_Selesai: ujianData.Jadwal_Selesai || '',
            Kisi_Kisi_JSON: ujianData.Kisi_Kisi_JSON || '',
            Soal_JSON: soalJsonStr,
            Status: ujianData.Status || 'Aktif',
          };
          const res = await firebaseService.updateUjian(payload);
          const idx = list.findIndex((u) => u.ID === ujianData.ID);
          if (idx !== -1) list[idx] = payload;
          saveLocalUjian(list);
          return res;
        } else {
          const res = await firebaseService.addUjian({
            Judul_Ujian: ujianData.Judul_Ujian || 'Ujian Baru',
            Mapel: ujianData.Mapel || 'Umum',
            Kelas: ujianData.Kelas || 'Semua',
            Durasi_Menit: Number(ujianData.Durasi_Menit) || 60,
            Token_Ujian: ujianData.Token_Ujian || '',
            Jadwal_Mulai: ujianData.Jadwal_Mulai || '',
            Jadwal_Selesai: ujianData.Jadwal_Selesai || '',
            Kisi_Kisi_JSON: ujianData.Kisi_Kisi_JSON || '',
            Soal_JSON: soalJsonStr,
            Status: ujianData.Status || 'Aktif',
          });
          try {
            const allUj = await firebaseService.getUjianList();
            if (allUj && allUj.length > 0) {
              saveLocalUjian(allUj);
            }
          } catch (fetchErr) {
            console.warn('Could not refresh exam list from Firebase immediately:', fetchErr);
          }
          return res;
        }
      } catch (err) {
        console.warn('Firebase saveUjian error:', err);
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<ApiResponse>('saveUjian', [
          {
            id: ujianData.ID || '',
            judul_ujian: ujianData.Judul_Ujian || '',
            mapel: ujianData.Mapel || '',
            kelas: ujianData.Kelas || '',
            durasi: ujianData.Durasi_Menit || 60,
            token_ujian: ujianData.Token_Ujian || '',
            jadwal_mulai: ujianData.Jadwal_Mulai || '',
            jadwal_selesai: ujianData.Jadwal_Selesai || '',
            soal: ujianData.soal,
            status: ujianData.Status || 'Aktif',
          },
        ]);
        if (res && res.success) return res;
      } catch (err) {
        console.warn('GAS saveUjian error:', err);
      }
    }

    if (ujianData.ID) {
      const idx = list.findIndex((u) => u.ID === ujianData.ID);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          Judul_Ujian: ujianData.Judul_Ujian || list[idx].Judul_Ujian,
          Mapel: ujianData.Mapel || list[idx].Mapel,
          Kelas: ujianData.Kelas || list[idx].Kelas,
          Durasi_Menit: Number(ujianData.Durasi_Menit) || list[idx].Durasi_Menit,
          Token_Ujian: ujianData.Token_Ujian !== undefined ? ujianData.Token_Ujian : list[idx].Token_Ujian,
          Jadwal_Mulai: ujianData.Jadwal_Mulai !== undefined ? ujianData.Jadwal_Mulai : list[idx].Jadwal_Mulai,
          Jadwal_Selesai: ujianData.Jadwal_Selesai !== undefined ? ujianData.Jadwal_Selesai : list[idx].Jadwal_Selesai,
          Kisi_Kisi_JSON: ujianData.Kisi_Kisi_JSON !== undefined ? ujianData.Kisi_Kisi_JSON : list[idx].Kisi_Kisi_JSON,
          Soal_JSON: soalJsonStr,
          Status: ujianData.Status || list[idx].Status,
        };
        saveLocalUjian(list);
        return { success: true, message: 'Ujian CBT berhasil diperbarui!' };
      }
    }

    const newUjian: Ujian = {
      ID: 'EXAM-' + Date.now(),
      Judul_Ujian: ujianData.Judul_Ujian || 'Ujian Baru',
      Mapel: ujianData.Mapel || 'Matematika',
      Kelas: ujianData.Kelas || '6A',
      Durasi_Menit: Number(ujianData.Durasi_Menit) || 60,
      Token_Ujian: ujianData.Token_Ujian || '',
      Jadwal_Mulai: ujianData.Jadwal_Mulai || '',
      Jadwal_Selesai: ujianData.Jadwal_Selesai || '',
      Kisi_Kisi_JSON: ujianData.Kisi_Kisi_JSON || '',
      Soal_JSON: soalJsonStr,
      Status: (ujianData.Status as 'Aktif' | 'Non-Aktif') || 'Aktif',
    };
    list.push(newUjian);
    saveLocalUjian(list);
    return { success: true, message: 'Ujian CBT berhasil diterbitkan!' };
  },

  async toggleStatusUjian(id: string, newStatus: 'Aktif' | 'Non-Aktif'): Promise<ApiResponse> {
    const list = getLocalUjian();
    const found = list.find((u) => u.ID === id);

    if (currentDataSource === 'FIREBASE') {
      try {
        if (found) {
          const updated = { ...found, Status: newStatus };
          const res = await firebaseService.updateUjian(updated);
          found.Status = newStatus;
          saveLocalUjian(list);
          return res;
        }
      } catch (err) {
        console.warn('Firebase toggleStatusUjian error:', err);
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<ApiResponse>('toggleStatusUjian', [id, newStatus]);
        if (res && res.success) {
          if (found) {
            found.Status = newStatus;
            saveLocalUjian(list);
          }
          return res;
        }
      } catch (err) {
        console.warn('GAS toggleStatusUjian error:', err);
      }
    }

    if (found) {
      found.Status = newStatus;
      saveLocalUjian(list);
      return { success: true, message: `Status ujian berhasil diubah menjadi ${newStatus}!` };
    }
    return { success: false, message: 'Ujian tidak ditemukan!' };
  },

  async deleteUjian(id: string): Promise<ApiResponse> {
    if (currentDataSource === 'FIREBASE') {
      try {
        const res = await firebaseService.deleteUjian(id);
        saveLocalUjian(getLocalUjian().filter((u) => u.ID !== id));
        return res;
      } catch (err) {
        console.warn('Firebase deleteUjian error:', err);
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<ApiResponse>('deleteUjian', [id]);
        if (res && res.success) {
          saveLocalUjian(getLocalUjian().filter((u) => u.ID !== id));
          return res;
        }
      } catch (err) {
        console.warn('GAS deleteUjian error:', err);
      }
    }

    saveLocalUjian(getLocalUjian().filter((u) => u.ID !== id));
    return { success: true, message: 'Ujian berhasil dihapus secara permanen!' };
  },

  // 5. NILAI & HASIL CBT
  async getHasilMurid(namaMurid: string): Promise<Nilai[]> {
    const cleanTarget = (namaMurid || '').trim().toLowerCase();

    if (currentDataSource === 'FIREBASE' && !isFirestoreOffline()) {
      try {
        const list = await firebaseService.getHasilMurid(namaMurid);
        if (Array.isArray(list)) return list;
      } catch (err) {
        // Fall back to local
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<Nilai[]>('getHasilMurid', [namaMurid]);
        if (Array.isArray(res)) return res.map(normalizeNilai);
      } catch (err) {
        console.warn('GAS getHasilMurid error:', err);
      }
    }

    return getLocalNilai().filter(
      (n) => (n.Nama_Murid || '').trim().toLowerCase() === cleanTarget
    );
  },

  async getNilaiList(): Promise<Nilai[]> {
    if (currentDataSource === 'FIREBASE' && !isFirestoreOffline()) {
      try {
        const list = await firebaseService.getNilaiList();
        if (Array.isArray(list)) {
          saveLocalNilai(list);
          return list;
        }
      } catch (err) {
        // Fall back to local
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<Nilai[]>('getNilaiList', []);
        if (Array.isArray(res)) {
          const normalized = res.map(normalizeNilai);
          saveLocalNilai(normalized);
          return normalized;
        }
      } catch (err) {
        console.warn('GAS getNilaiList error:', err);
      }
    }

    return [...getLocalNilai()].reverse();
  },

  async submitHasilUjian(payload: {
    id_ujian: string;
    judul_ujian: string;
    nama_murid: string;
    kelas: string;
    nilai: number;
    pelanggaran: number;
    jawaban_json?: string;
  }): Promise<ApiResponse> {
    if (currentDataSource === 'FIREBASE') {
      try {
        const res = await firebaseService.submitHasilUjian(payload);
        return res;
      } catch (err) {
        console.warn('Firebase submitHasilUjian error:', err);
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<ApiResponse>('submitHasilUjian', [payload]);
        if (res && res.success) return res;
      } catch (err) {
        console.warn('GAS submitHasilUjian error:', err);
      }
    }

    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}`;

    const list = getLocalNilai();
    const newNilai: Nilai = {
      ID: 'NILAI-' + Date.now(),
      ID_Ujian: payload.id_ujian,
      Judul_Ujian: payload.judul_ujian,
      Nama_Murid: payload.nama_murid,
      Kelas: payload.kelas,
      Nilai: payload.nilai,
      Pelanggaran: payload.pelanggaran,
      Waktu_Submit: timeStr,
      Jawaban_JSON: payload.jawaban_json,
    };
    list.push(newNilai);
    saveLocalNilai(list);
    return { success: true, message: 'Hasil ujian berhasil disimpan ke sistem!' };
  },

  async resetNilaiMurid(idNilai: string): Promise<ApiResponse> {
    if (currentDataSource === 'FIREBASE') {
      try {
        const res = await firebaseService.resetNilaiMurid(idNilai);
        saveLocalNilai(getLocalNilai().filter((n) => n.ID !== idNilai));
        return res;
      } catch (err) {
        console.warn('Firebase resetNilaiMurid error:', err);
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<ApiResponse>('resetNilaiMurid', [idNilai]);
        if (res && res.success) {
          saveLocalNilai(getLocalNilai().filter((n) => n.ID !== idNilai));
          return res;
        }
      } catch (err) {
        console.warn('GAS resetNilaiMurid error:', err);
      }
    }

    const list = getLocalNilai().filter((n) => n.ID !== idNilai);
    saveLocalNilai(list);
    return { success: true, message: 'Akses ujian ulang berhasil diberikan kepada murid!' };
  },

  async updateNilai(nilai: Nilai): Promise<ApiResponse> {
    const cleanNilai = normalizeNilai(nilai);

    if (currentDataSource === 'FIREBASE') {
      try {
        const res = await firebaseService.updateNilai(cleanNilai);
        const list = getLocalNilai();
        const idx = list.findIndex((n) => n.ID === cleanNilai.ID);
        if (idx >= 0) list[idx] = cleanNilai;
        else list.push(cleanNilai);
        saveLocalNilai(list);
        return res;
      } catch (err) {
        console.warn('Firebase updateNilai error:', err);
      }
    }

    const list = getLocalNilai();
    const idx = list.findIndex((n) => n.ID === cleanNilai.ID);
    if (idx >= 0) list[idx] = cleanNilai;
    else list.push(cleanNilai);
    saveLocalNilai(list);
    return { success: true, message: 'Koreksi nilai berhasil disimpan!' };
  },

  // 5. PENGATURAN IDENTITAS SEKOLAH & MASTER DATA
  async getSchoolProfile(): Promise<SchoolProfile> {
    if (inFlightSchoolProfilePromise) return inFlightSchoolProfilePromise;

    inFlightSchoolProfilePromise = (async () => {
      try {
        if (currentDataSource === 'FIREBASE' && !isFirestoreOffline()) {
          try {
            const p = await firebaseService.getSchoolProfile();
            if (p) {
              saveLocalSchoolProfile(p);
              return p;
            }
          } catch {
            // Fall back to local
          }
        }
        return getLocalSchoolProfile();
      } finally {
        inFlightSchoolProfilePromise = null;
      }
    })();

    return inFlightSchoolProfilePromise;
  },

  async saveSchoolProfile(profile: SchoolProfile): Promise<ApiResponse> {
    saveLocalSchoolProfile(profile);
    if (currentDataSource === 'FIREBASE') {
      try {
        const res = await firebaseService.saveSchoolProfile(profile);
        return res;
      } catch (err) {
        console.warn('Firebase saveSchoolProfile error:', err);
      }
    }
    return { success: true, message: 'Identitas sekolah berhasil diperbarui!' };
  },

  async getMasterKelas(): Promise<string[]> {
    if (currentDataSource === 'FIREBASE' && !isFirestoreOffline()) {
      try {
        const c = await firebaseService.getMasterKelas();
        if (Array.isArray(c) && c.length > 0) {
          saveLocalMasterKelas(c);
          return c;
        }
      } catch (err) {
        // Fall back to local
      }
    }
    return getLocalMasterKelas();
  },

  async saveMasterKelas(classes: string[]): Promise<ApiResponse> {
    saveLocalMasterKelas(classes);
    if (currentDataSource === 'FIREBASE') {
      try {
        const res = await firebaseService.saveMasterKelas(classes);
        return res;
      } catch (err) {
        console.warn('Firebase saveMasterKelas error:', err);
      }
    }
    return { success: true, message: 'Daftar kelas berhasil disimpan!' };
  },

  async getMasterMapel(): Promise<string[]> {
    if (currentDataSource === 'FIREBASE' && !isFirestoreOffline()) {
      try {
        const m = await firebaseService.getMasterMapel();
        if (Array.isArray(m) && m.length > 0) {
          saveLocalMasterMapel(m);
          return m;
        }
      } catch (err) {
        // Fall back to local
      }
    }
    return getLocalMasterMapel();
  },

  async saveMasterMapel(mapels: string[]): Promise<ApiResponse> {
    saveLocalMasterMapel(mapels);
    if (currentDataSource === 'FIREBASE') {
      try {
        const res = await firebaseService.saveMasterMapel(mapels);
        return res;
      } catch (err) {
        console.warn('Firebase saveMasterMapel error:', err);
      }
    }
    return { success: true, message: 'Daftar mata pelajaran berhasil disimpan!' };
  },

  // 6. PENGUMUMAN SEKOLAH
  async getAnnouncements(): Promise<Announcement[]> {
    if (currentDataSource === 'FIREBASE' && !isFirestoreOffline()) {
      try {
        const list = await firebaseService.getAnnouncements();
        if (Array.isArray(list) && list.length > 0) {
          saveLocalAnnouncements(list);
          return list;
        }
      } catch (err) {
        // Fall back to local
      }
    }
    return getLocalAnnouncements();
  },

  async saveAnnouncement(item: Announcement): Promise<ApiResponse> {
    const list = getLocalAnnouncements();
    const id = item.id || 'PENG-' + Date.now();
    const newItem = { ...item, id };
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) list[idx] = newItem;
    else list.unshift(newItem);
    saveLocalAnnouncements(list);

    if (currentDataSource === 'FIREBASE') {
      try {
        await firebaseService.saveAnnouncement(newItem);
      } catch (err) {
        console.warn('Firebase saveAnnouncement error:', err);
      }
    }
    return { success: true, message: 'Pengumuman berhasil dipublikasikan!' };
  },

  async deleteAnnouncement(id: string): Promise<ApiResponse> {
    const list = getLocalAnnouncements().filter((p) => p.id !== id);
    saveLocalAnnouncements(list);

    if (currentDataSource === 'FIREBASE') {
      try {
        await firebaseService.deleteAnnouncement(id);
      } catch (err) {
        console.warn('Firebase deleteAnnouncement error:', err);
      }
    }
    return { success: true, message: 'Pengumuman berhasil dihapus!' };
  },
};
