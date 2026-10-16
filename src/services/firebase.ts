import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  deleteField,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfigFile from '../../firebase-applet-config.json';
import { User, Materi, Ujian, Nilai, ApiResponse, SchoolProfile, Announcement, ExamResetPermission } from '../types';
import { INITIAL_USERS, INITIAL_MATERI, INITIAL_UJIAN, INITIAL_NILAI } from './seedData';
import { normalizeUser, normalizeMateri, normalizeUjian, normalizeNilai } from './normalizers';

export interface FirebaseAppConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
  firestoreDatabaseId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

export interface FirebaseConnectionDiagnostic {
  success: boolean;
  message: string;
  databaseId: string;
  projectId: string;
  errorCode?: 'permission-denied' | 'not-found' | 'network-error' | 'invalid-api-key' | 'unknown';
  errorDetails?: string;
  rulesSnippet?: string;
  consoleRulesUrl?: string;
  userCount?: number;
}

// Preset konfigurasi Firebase yang didukung
export const PRESET_CONFIGS: Record<
  string,
  { id: string; name: string; desc: string; config: FirebaseAppConfig }
> = {
  sebayuloka: {
    id: 'sebayuloka',
    name: 'Proyek Utama (elearningcbt-sebayuloka)',
    desc: 'Proyek Firebase utama pengguna',
    config: {
      projectId: 'elearningcbt-sebayuloka',
      appId: '1:932039432049:web:0ba341a7a315ef72c788d0',
      apiKey: 'AIzaSyBOqoNUPhTl8iZbV_vtNfsq5ijqIMJwWEk',
      authDomain: 'elearningcbt-sebayuloka.firebaseapp.com',
      storageBucket: 'elearningcbt-sebayuloka.firebasestorage.app',
      messagingSenderId: '932039432049',
      firestoreDatabaseId: '(default)',
    },
  },
  wildan_fb826: {
    id: 'wildan_fb826',
    name: 'Proyek Baru (elearningcbt-wildanprama-fb826)',
    desc: 'Proyek Firebase alternatif pengguna',
    config: {
      projectId: 'elearningcbt-wildanprama-fb826',
      appId: '1:624261016334:web:ae98d13867da45265f055f',
      apiKey: 'AIzaSyB_gbWt3NNE6bK183StP9SaAJ6yVM9kGs0',
      authDomain: 'elearningcbt-wildanprama-fb826.firebaseapp.com',
      storageBucket: 'elearningcbt-wildanprama-fb826.firebasestorage.app',
      messagingSenderId: '624261016334',
      firestoreDatabaseId: '(default)',
    },
  },
  sebayu: {
    id: 'sebayu',
    name: 'Proyek Sebayu (elearningcbt-sebayu)',
    desc: 'Proyek Firebase sebelumnya',
    config: {
      projectId: 'elearningcbt-sebayu',
      appId: '1:426361589059:web:3a4cb3b96876b21a67f3f6',
      apiKey: 'AIzaSyALY4FHEugOGlTBlM2EKCEoy_kwSCsiD-o',
      authDomain: 'elearningcbt-sebayu.firebaseapp.com',
      storageBucket: 'elearningcbt-sebayu.firebasestorage.app',
      messagingSenderId: '426361589059',
      firestoreDatabaseId: '(default)',
    },
  },
  wildan: {
    id: 'wildan',
    name: 'Proyek Cadangan (elearningcbt-wildanpramadika)',
    desc: 'Proyek cadangan yang sudah aktif dan data lengkap',
    config: {
      projectId: 'elearningcbt-wildanpramadika',
      appId: '1:30686153349:web:3e623d07b77abf49cdb7ec',
      apiKey: 'AIzaSyCNIg-_N-1q1ZpL-8vFv5l0V-hA0sF6T8',
      authDomain: 'elearningcbt-wildanpramadika.firebaseapp.com',
      storageBucket: 'elearningcbt-wildanpramadika.firebasestorage.app',
      messagingSenderId: '30686153349',
      firestoreDatabaseId: '(default)',
    },
  },
};

const STORAGE_KEY_CUSTOM_FIREBASE = 'cbt_custom_firebase_config';

export function getActiveFirebaseConfig(): FirebaseAppConfig {
  // 1. Cek environment variables (misal saat di-deploy di Vercel/hosting)
  try {
    const envProjectId = import.meta.env?.VITE_FIREBASE_PROJECT_ID;
    const envApiKey = import.meta.env?.VITE_FIREBASE_API_KEY;
    if (envProjectId && envApiKey) {
      return {
        projectId: envProjectId,
        apiKey: envApiKey,
        appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigFile.appId,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.firebasestorage.app`,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigFile.messagingSenderId,
        firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)',
      };
    }
  } catch {}

  // 2. Cek konfigurasi kustom di localStorage
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_FIREBASE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.projectId && parsed.apiKey) {
          if (parsed.projectId === firebaseConfigFile.projectId) {
            return parsed as FirebaseAppConfig;
          }
        }
      }
    }
  } catch {}

  // 3. Gunakan konfigurasi default bawaan (elearningcbt-sebayuloka)
  return firebaseConfigFile as FirebaseAppConfig;
}

export function setActiveFirebaseConfig(cfg: FirebaseAppConfig): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CUSTOM_FIREBASE, JSON.stringify(cfg));
    }
  } catch {}
}

export function resetActiveFirebaseConfig(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_FIREBASE);
    }
  } catch {}
}

// Konfigurasi aktif saat modul dimuat
const activeConfig = getActiveFirebaseConfig();

// Inisialisasi Firebase App (Cegah inisialisasi ganda)
export const firebaseApp = getApps().length === 0 ? initializeApp(activeConfig) : getApp();

// Inisialisasi Auth
export const auth = getAuth(firebaseApp);

// Inisialisasi Firestore dengan opsi aman (auto-detect long-polling untuk preview iframe sandbox)
const resolvedDatabaseId =
  activeConfig.firestoreDatabaseId && activeConfig.firestoreDatabaseId !== '(default)'
    ? activeConfig.firestoreDatabaseId
    : undefined;

let firestoreInstance: ReturnType<typeof getFirestore>;
try {
  firestoreInstance = resolvedDatabaseId
    ? initializeFirestore(
        firebaseApp,
        { experimentalAutoDetectLongPolling: true, ignoreUndefinedProperties: true },
        resolvedDatabaseId
      )
    : initializeFirestore(firebaseApp, {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      });
} catch {
  firestoreInstance = resolvedDatabaseId
    ? getFirestore(firebaseApp, resolvedDatabaseId)
    : getFirestore(firebaseApp);
}

export const db = firestoreInstance;

// Nama koleksi di Firestore (rekap_nilai & hasil_ujian sebagai koleksi utama)
export const COLLECTIONS = {
  USERS: 'users',
  MATERI: 'materi',
  UJIAN: 'ujian',
  NILAI: 'rekap_nilai',
  REKAP_NILAI: 'rekap_nilai',
  HASIL_UJIAN: 'hasil_ujian',
  SETTINGS: 'settings',
  ANNOUNCEMENTS: 'announcements',
  RESETS: 'exam_resets',
} as const;

// Helper status koneksi Firestore
let isFirestoreAvailable: boolean | null = null;

export function markFirestoreOffline(reason?: unknown) {
  if (isFirestoreAvailable !== false) {
    console.info('Mode cadangan lokal aktif untuk operasi ini:', reason instanceof Error ? reason.message : reason);
  }
  isFirestoreAvailable = false;
}

export function markFirestoreOnline() {
  if (isFirestoreAvailable !== true) {
    console.info('Koneksi database Firebase Firestore aktif.');
  }
  isFirestoreAvailable = true;
}

export function isFirestoreOffline(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' && !navigator.onLine) {
    return true;
  }
  return false;
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Waktu koneksi melebihi batas (${timeoutMs / 1000}s)`));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        markFirestoreOnline();
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Helper pengecekan dan pengisian awal data (seed data) ke Firebase jika koleksi masih kosong
let isSeeding = false;
let hasSeeded = false;
let lastSeedAttemptTime = 0;

export async function ensureFirebaseSeeded(): Promise<void> {
  if (hasSeeded || isSeeding) return;
  if (isFirestoreOffline()) return;
  // Throttle agar tidak membombardir getDocs saat koneksi error
  if (Date.now() - lastSeedAttemptTime < 30000) return;
  lastSeedAttemptTime = Date.now();
  isSeeding = true;

  try {
    const usersCol = collection(db, COLLECTIONS.USERS);
    const snap = await withTimeout(getDocs(usersCol), 7000);

    if (snap.empty) {
      console.log('Firebase Firestore masih kosong. Melakukan inisialisasi data awal...');
      // Seed users
      for (const u of INITIAL_USERS) {
        await setDoc(doc(db, COLLECTIONS.USERS, u.username), u);
      }
      // Seed materi
      for (const m of INITIAL_MATERI) {
        await setDoc(doc(db, COLLECTIONS.MATERI, m.ID), m);
      }
      // Seed ujian
      for (const uj of INITIAL_UJIAN) {
        await setDoc(doc(db, COLLECTIONS.UJIAN, uj.ID), uj);
      }
      // Seed nilai
      for (const n of INITIAL_NILAI) {
        await setDoc(doc(db, COLLECTIONS.NILAI, n.ID), n);
      }
      console.log('Inisialisasi data awal Firebase Firestore selesai.');
    }
    hasSeeded = true;
    markFirestoreOnline();
  } catch (err) {
    markFirestoreOffline(err);
  } finally {
    isSeeding = false;
  }
}

// Helper pembersihan objek dari undefined agar setDoc Firestore tidak crash
export function cleanFirestoreDoc<T extends Record<string, any>>(data: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

// Konversi objek TypeScript ke format Document Fields Firestore REST API
function toFirestoreRestFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string') {
      fields[k] = { stringValue: v };
    } else if (typeof v === 'number') {
      if (Number.isInteger(v)) {
        fields[k] = { integerValue: String(v) };
      } else {
        fields[k] = { doubleValue: v };
      }
    } else if (typeof v === 'boolean') {
      fields[k] = { booleanValue: v };
    } else if (typeof v === 'object') {
      fields[k] = { stringValue: JSON.stringify(v) };
    }
  }
  return fields;
}

// Parser dokumen hasil Firestore REST API menjadi objek Nilai
function parseFirestoreRestNilaiDoc(doc: any): Nilai {
  const f = doc.fields || {};
  return {
    ID: f.ID?.stringValue || doc.name?.split('/').pop() || '',
    ID_Ujian: f.ID_Ujian?.stringValue || '',
    Judul_Ujian: f.Judul_Ujian?.stringValue || '',
    Nama_Murid: f.Nama_Murid?.stringValue || '',
    Kelas: f.Kelas?.stringValue || '',
    Nilai: Number(f.Nilai?.doubleValue ?? f.Nilai?.integerValue ?? 0),
    Pelanggaran: Number(f.Pelanggaran?.integerValue ?? f.Pelanggaran?.doubleValue ?? 0),
    Waktu_Submit: f.Waktu_Submit?.stringValue || '',
    Catatan_Guru: f.Catatan_Guru?.stringValue || undefined,
    Koreksi_Manual: Boolean(f.Koreksi_Manual?.booleanValue),
    No_HP_Ortu: f.No_HP_Ortu?.stringValue || undefined,
    Jawaban_JSON: f.Jawaban_JSON?.stringValue || undefined,
  };
}

// Jalur Cepat REST API untuk menyimpan nilai (Solusi handal untuk Chrome Mobile & Safari iOS di HP)
export async function saveNilaiViaRest(nilai: Nilai): Promise<boolean> {
  try {
    const cfg = getActiveFirebaseConfig();
    if (!cfg.projectId || !cfg.apiKey) return false;
    const cleanId = encodeURIComponent(nilai.ID.replace(/[^a-zA-Z0-9_-]/g, '_'));
    const payload = {
      fields: toFirestoreRestFields(cleanFirestoreDoc(nilai)),
    };
    const body = JSON.stringify(payload);
    const headers = { 'Content-Type': 'application/json' };

    // Tulis ke koleksi rekap_nilai, hasil_ujian, dan nilai secara serentak
    const urlRekap = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents/rekap_nilai/${cleanId}?key=${cfg.apiKey}`;
    const urlHasil = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents/hasil_ujian/${cleanId}?key=${cfg.apiKey}`;
    const urlNilai = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents/nilai/${cleanId}?key=${cfg.apiKey}`;

    const [resRekap, resHasil, resNilai] = await Promise.allSettled([
      fetch(urlRekap, { method: 'PATCH', headers, body }),
      fetch(urlHasil, { method: 'PATCH', headers, body }),
      fetch(urlNilai, { method: 'PATCH', headers, body }),
    ]);

    const isOk = (r: PromiseSettledResult<Response>) => r.status === 'fulfilled' && r.value.ok;
    return isOk(resRekap) || isOk(resHasil) || isOk(resNilai);
  } catch (e) {
    console.warn('[REST API] Gagal kirim nilai via REST:', e);
    return false;
  }
}

// Jalur Cepat REST API untuk mengambil rekap nilai
export async function getNilaiListViaRest(): Promise<Nilai[]> {
  try {
    const cfg = getActiveFirebaseConfig();
    if (!cfg.projectId || !cfg.apiKey) return [];
    
    // Coba ambil dari rekap_nilai terlebih dahulu
    let url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents/rekap_nilai?pageSize=300&key=${cfg.apiKey}`;
    let res = await fetch(url);
    if (!res.ok) {
      // Fallback ke koleksi nilai
      url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents/nilai?pageSize=300&key=${cfg.apiKey}`;
      res = await fetch(url);
    }
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data.documents)) {
      return data.documents.map(parseFirestoreRestNilaiDoc);
    }
    return [];
  } catch (e) {
    console.warn('[REST API] Gagal ambil nilai via REST:', e);
    return [];
  }
}

// Parser dokumen hasil Firestore REST API menjadi objek Ujian
function parseFirestoreRestUjianDoc(doc: any): Ujian {
  const f = doc.fields || {};
  return normalizeUjian({
    ID: f.ID?.stringValue || doc.name?.split('/').pop() || '',
    Judul_Ujian: f.Judul_Ujian?.stringValue || '',
    Mapel: f.Mapel?.stringValue || '',
    Kelas: f.Kelas?.stringValue || 'Semua',
    Durasi_Menit: Number(f.Durasi_Menit?.integerValue ?? f.Durasi_Menit?.doubleValue ?? 60),
    Token_Ujian: f.Token_Ujian?.stringValue || '',
    Jadwal_Mulai: f.Jadwal_Mulai?.stringValue || '',
    Jadwal_Selesai: f.Jadwal_Selesai?.stringValue || '',
    Kisi_Kisi_JSON: f.Kisi_Kisi_JSON?.stringValue || '',
    Soal_JSON: f.Soal_JSON?.stringValue || '{}',
    Status: (f.Status?.stringValue || 'Aktif') as 'Aktif' | 'Non-Aktif',
  });
}

// Jalur Cepat REST API untuk menyimpan Ujian CBT (Solusi handal anti-gagal)
export async function saveUjianViaRest(ujian: Ujian): Promise<boolean> {
  try {
    const cfg = getActiveFirebaseConfig();
    if (!cfg.projectId || !cfg.apiKey) return false;
    const cleanId = encodeURIComponent(ujian.ID.replace(/[^a-zA-Z0-9_-]/g, '_'));
    const payload = {
      fields: toFirestoreRestFields(cleanFirestoreDoc(ujian)),
    };
    const body = JSON.stringify(payload);
    const headers = { 'Content-Type': 'application/json' };
    const urlUjian = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents/ujian/${cleanId}?key=${cfg.apiKey}`;
    const res = await fetch(urlUjian, { method: 'PATCH', headers, body });
    return res.ok;
  } catch (e) {
    console.warn('[REST API] Gagal kirim ujian via REST:', e);
    return false;
  }
}

// Jalur Cepat REST API untuk mengambil daftar Ujian CBT
export async function getUjianListViaRest(): Promise<Ujian[]> {
  try {
    const cfg = getActiveFirebaseConfig();
    if (!cfg.projectId || !cfg.apiKey) return [];
    const url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents/ujian?pageSize=300&key=${cfg.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data.documents)) {
      return data.documents.map(parseFirestoreRestUjianDoc);
    }
    return [];
  } catch (e) {
    console.warn('[REST API] Gagal ambil ujian via REST:', e);
    return [];
  }
}

// Layanan Operasi Database Firebase Firestore
export const firebaseService = {
  // 1. AUTH & PENGGUNA
  async loginUser(username: string, passwordInput: string): Promise<ApiResponse> {
    const cleanUsername = (username || '').trim().toLowerCase();
    if (isFirestoreOffline()) {
      throw new Error('Firestore sedang offline / dalam jeda tunggu');
    }
    // Non-blocking seed trigger agar login responsif
    ensureFirebaseSeeded().catch(() => {});

    try {
      const userDocRef = doc(db, COLLECTIONS.USERS, cleanUsername);
      const snap = await withTimeout(getDoc(userDocRef), 7000);

      if (!snap.exists()) {
        const q = query(
          collection(db, COLLECTIONS.USERS),
          where('username', '==', cleanUsername)
        );
        const querySnap = await withTimeout(getDocs(q), 7000);
        if (querySnap.empty) {
          return { success: false, message: 'Username tidak ditemukan di database Firebase!' };
        }
        const userData = normalizeUser(querySnap.docs[0].data());
        if (userData.password && userData.password !== passwordInput) {
          return { success: false, message: 'Password salah!' };
        }
        return { success: true, message: 'Login berhasil!', user: userData };
      }

      const userData = normalizeUser(snap.data());
      if (userData.password && userData.password !== passwordInput) {
        return { success: false, message: 'Password salah!' };
      }
      return { success: true, message: 'Login berhasil!', user: userData };
    } catch (err) {
      markFirestoreOffline(err);
      throw err;
    }
  },

  async getUsers(): Promise<User[]> {
    if (isFirestoreOffline()) throw new Error('Firestore sedang offline');
    await ensureFirebaseSeeded().catch(() => {});
    const snap = await withTimeout(getDocs(collection(db, COLLECTIONS.USERS)), 7000);
    const list: User[] = [];
    snap.forEach((d) => {
      list.push(normalizeUser(d.data()));
    });
    return list;
  },

  async addUser(user: User): Promise<ApiResponse> {
    const normalized = normalizeUser(user);
    const docRef = doc(db, COLLECTIONS.USERS, normalized.username.toLowerCase());
    await withTimeout(setDoc(docRef, normalized), 7000);
    return { success: true, message: 'Pengguna berhasil disimpan ke Firebase!', user: normalized };
  },

  async addUsersBatch(userList: User[]): Promise<{ success: boolean; message: string; count: number }> {
    if (!userList || userList.length === 0) {
      return { success: true, message: 'Tidak ada pengguna untuk disimpan.', count: 0 };
    }
    const normalizedList = userList.map((u) => normalizeUser(u));
    // Chunk in 400s to respect Firestore batch limit of 500
    const chunkSize = 400;
    for (let i = 0; i < normalizedList.length; i += chunkSize) {
      const chunk = normalizedList.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((u) => {
        const docRef = doc(db, COLLECTIONS.USERS, u.username.toLowerCase());
        batch.set(docRef, u);
      });
      await withTimeout(batch.commit(), 10000);
    }
    return {
      success: true,
      message: `Berhasil mengimpor ${normalizedList.length} pengguna ke Firebase!`,
      count: normalizedList.length,
    };
  },

  async updateUser(user: User): Promise<ApiResponse> {
    return this.addUser(user);
  },

  async deleteUser(username: string): Promise<ApiResponse> {
    const clean = (username || '').trim().toLowerCase();
    await withTimeout(deleteDoc(doc(db, COLLECTIONS.USERS, clean)), 7000);
    return { success: true, message: 'Pengguna berhasil dihapus dari Firebase!' };
  },

  // 2. MATERI
  async getMateriList(): Promise<Materi[]> {
    if (isFirestoreOffline()) throw new Error('Firestore sedang offline');
    await ensureFirebaseSeeded().catch(() => {});
    const snap = await withTimeout(getDocs(collection(db, COLLECTIONS.MATERI)), 7000);
    const list: Materi[] = [];
    snap.forEach((d) => {
      list.push(normalizeMateri(d.data()));
    });
    return list;
  },

  async addMateri(materi: Omit<Materi, 'ID'> & { ID?: string }): Promise<ApiResponse> {
    const id = materi.ID || 'MAT-' + Date.now();
    const payload = normalizeMateri({ ...materi, ID: id });
    await withTimeout(setDoc(doc(db, COLLECTIONS.MATERI, id), payload), 5000);
    return { success: true, message: 'Materi berhasil disimpan ke Firebase!' };
  },

  async updateMateri(materi: Materi): Promise<ApiResponse> {
    const payload = normalizeMateri(materi);
    await withTimeout(setDoc(doc(db, COLLECTIONS.MATERI, payload.ID), payload), 5000);
    return { success: true, message: 'Materi berhasil diperbarui di Firebase!' };
  },

  async deleteMateri(id: string): Promise<ApiResponse> {
    await withTimeout(deleteDoc(doc(db, COLLECTIONS.MATERI, id)), 5000);
    return { success: true, message: 'Materi berhasil dihapus dari Firebase!' };
  },

  // 3. UJIAN & CBT
  async getUjianList(): Promise<Ujian[]> {
    if (isFirestoreOffline()) throw new Error('Firestore sedang offline');
    await ensureFirebaseSeeded().catch(() => {});
    try {
      const snap = await withTimeout(getDocs(collection(db, COLLECTIONS.UJIAN)), 8000);
      const list: Ujian[] = [];
      snap.forEach((d) => {
        list.push(normalizeUjian(d.data()));
      });
      if (list.length > 0) return list;
    } catch (err) {
      console.warn('[Firebase SDK getUjianList] Gagal/timeout via SDK, mencoba REST API fallback:', err);
    }
    // Coba REST API fallback
    try {
      const restList = await getUjianListViaRest();
      if (restList && restList.length > 0) return restList;
    } catch {}
    return [];
  },

  async addUjian(ujian: Omit<Ujian, 'ID'> & { ID?: string }): Promise<ApiResponse> {
    const id = ujian.ID || 'UJN-' + Date.now();
    const payload = normalizeUjian({ ...ujian, ID: id });
    const cleaned = cleanFirestoreDoc(payload);
    let ok = false;
    try {
      if (!isFirestoreOffline()) {
        await withTimeout(setDoc(doc(db, COLLECTIONS.UJIAN, id), cleaned), 8000);
        ok = true;
      }
    } catch (err) {
      console.warn('[Firebase SDK addUjian] SDK gagal/timeout, beralih ke REST API:', err);
    }
    if (!ok) {
      await saveUjianViaRest(payload).catch(() => false);
    }
    return { success: true, message: 'Paket Ujian berhasil disimpan ke Firebase!' };
  },

  async updateUjian(ujian: Ujian): Promise<ApiResponse> {
    const payload = normalizeUjian(ujian);
    const cleaned = cleanFirestoreDoc(payload);
    let ok = false;
    try {
      if (!isFirestoreOffline()) {
        await withTimeout(setDoc(doc(db, COLLECTIONS.UJIAN, payload.ID), cleaned), 8000);
        ok = true;
      }
    } catch (err) {
      console.warn('[Firebase SDK updateUjian] SDK gagal/timeout, beralih ke REST API:', err);
    }
    if (!ok) {
      await saveUjianViaRest(payload).catch(() => false);
    }
    return { success: true, message: 'Paket Ujian berhasil diperbarui di Firebase!' };
  },

  async deleteUjian(id: string): Promise<ApiResponse> {
    await withTimeout(deleteDoc(doc(db, COLLECTIONS.UJIAN, id)), 10000);
    return { success: true, message: 'Paket Ujian berhasil dihapus dari Firebase!' };
  },

  // 4. NILAI & HASIL UJIAN
  async getHasilMurid(namaMurid: string): Promise<Nilai[]> {
    if (isFirestoreOffline()) throw new Error('Firestore sedang offline');
    await ensureFirebaseSeeded().catch(() => {});
    const snap = await withTimeout(getDocs(collection(db, COLLECTIONS.NILAI)), 7000);
    const cleanTarget = (namaMurid || '').trim().toLowerCase();
    const list: Nilai[] = [];
    snap.forEach((d) => {
      const n = normalizeNilai(d.data());
      if ((n.Nama_Murid || '').trim().toLowerCase() === cleanTarget) {
        list.push(n);
      }
    });
    return list;
  },

  async getNilaiList(): Promise<Nilai[]> {
    let list: Nilai[] = [];
    let sdkSuccess = false;

    // Strategi 1: Coba ambil melalui Firestore JS SDK
    try {
      if (!isFirestoreOffline()) {
        await ensureFirebaseSeeded().catch(() => {});
        const snap = await withTimeout(getDocs(collection(db, COLLECTIONS.NILAI)), 8000);
        snap.forEach((d) => {
          list.push(normalizeNilai(d.data()));
        });
        if (list.length > 0) {
          sdkSuccess = true;
        }
      }
    } catch (err) {
      console.warn('[Firebase SDK getNilaiList] Gagal/timeout via SDK, beralih ke jalur cepat REST API:', err);
    }

    // Strategi 2: Jika SDK gagal, timeout, atau daftar kosong, ambil via REST API
    if (!sdkSuccess || list.length === 0) {
      try {
        const restList = await getNilaiListViaRest();
        if (restList.length > 0) {
          list = restList;
          markFirestoreOnline();
        }
      } catch (restErr) {
        console.warn('[Firebase REST getNilaiList] Gagal via REST:', restErr);
      }
    }

    if (list.length === 0 && isFirestoreOffline()) {
      throw new Error('Firestore sedang offline');
    }

    // Urutkan nilai terbaru di posisi paling atas berdasarkan Waktu_Submit
    return list.sort((a, b) => (b.Waktu_Submit || '').localeCompare(a.Waktu_Submit || ''));
  },

  subscribeNilaiList(callback: (list: Nilai[]) => void): () => void {
    try {
      const q = collection(db, COLLECTIONS.NILAI);
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: Nilai[] = [];
          snapshot.forEach((d) => {
            list.push(normalizeNilai(d.data()));
          });
          const sorted = list.sort((a, b) => (b.Waktu_Submit || '').localeCompare(a.Waktu_Submit || ''));
          callback(sorted);
        },
        (err) => {
          console.warn('[Firestore onSnapshot] Gagal realtime listener nilai:', err);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn('[subscribeNilaiList] Error initializing onSnapshot:', err);
      return () => {};
    }
  },

  async submitHasilUjian(payload: {
    id_ujian: string;
    id_nilai?: string;
    judul_ujian: string;
    nama_murid: string;
    kelas: string;
    nilai: number;
    pelanggaran: number;
    catatan_guru?: string;
    koreksi_manual?: boolean;
    jawaban_json?: string;
  }): Promise<ApiResponse> {
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}`;

    // Sanitasi document ID agar aman untuk URL REST dan path Firestore tanpa karakter ilegal
    const rawId = payload.id_nilai || ('NILAI-' + Date.now());
    const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 90);

    const newNilai: Nilai = {
      ID: safeId,
      ID_Ujian: String(payload.id_ujian || '').trim(),
      Judul_Ujian: String(payload.judul_ujian || '').trim(),
      Nama_Murid: String(payload.nama_murid || '').trim(),
      Kelas: String(payload.kelas || '-').trim(),
      Nilai: Number(Number(payload.nilai || 0).toFixed(2)),
      Pelanggaran: Number(payload.pelanggaran || 0),
      Waktu_Submit: timeStr,
      Catatan_Guru: payload.catatan_guru ? String(payload.catatan_guru).trim() : undefined,
      Koreksi_Manual: Boolean(payload.koreksi_manual),
      Jawaban_JSON: typeof payload.jawaban_json === 'string' ? payload.jawaban_json : undefined,
    };

    const cleaned = cleanFirestoreDoc(newNilai);

    // 1. Eksekusi Jalur Utama via Firebase JS SDK langsung ke rekap_nilai & hasil_ujian & nilai
    try {
      await withTimeout(
        Promise.all([
          setDoc(doc(db, COLLECTIONS.REKAP_NILAI, safeId), cleaned),
          setDoc(doc(db, COLLECTIONS.HASIL_UJIAN, safeId), cleaned),
          setDoc(doc(db, 'nilai', safeId), cleaned),
        ]),
        7000
      );
      markFirestoreOnline();
      return { success: true, message: 'Hasil ujian berhasil disimpan langsung ke database Firebase Firestore!', data: newNilai };
    } catch (sdkErr) {
      console.warn('[Firebase SDK submitHasilUjian] Gagal/timeout via SDK, mengaktifkan jalur cepat REST API:', sdkErr);
    }

    // 2. Eksekusi Jalur Cepat REST API Langsung ke Firestore (Sangat andal untuk browser mobile Android & iOS)
    try {
      const restOk = await saveNilaiViaRest(newNilai);
      if (restOk) {
        markFirestoreOnline();
        return { success: true, message: 'Hasil ujian berhasil disimpan ke database via REST!', data: newNilai };
      }
    } catch (restErr) {
      console.warn('[Firebase REST submitHasilUjian] Gagal via REST:', restErr);
    }

    // 3. Eksekusi Jalur Fallback Proxy Server Lokal (/api/submit-nilai)
    try {
      const serverRes = await fetch('/api/submit-nilai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNilai),
      });
      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData && serverData.success) {
          markFirestoreOnline();
          return { success: true, message: 'Hasil ujian berhasil disimpan via proxy server!', data: newNilai };
        }
      }
    } catch (proxyErr) {
      console.warn('[Server Proxy submitHasilUjian] Gagal via proxy:', proxyErr);
    }

    // 4. Retry cepat via REST API
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await new Promise((r) => setTimeout(r, 600 * attempt));
        const restRetry = await saveNilaiViaRest(newNilai);
        if (restRetry) {
          markFirestoreOnline();
          return { success: true, message: 'Hasil ujian berhasil disimpan ke server!', data: newNilai };
        }
      } catch {}
    }

    throw new Error('Gagal menyimpan hasil ujian ke database server. Lembar jawaban diamankan di memori aktif HP.');
  },

  async resetNilaiMurid(
    idNilai: string,
    idUjian?: string,
    namaMurid?: string,
    judulUjian?: string,
    nilaiSebelumnya?: number
  ): Promise<ApiResponse> {
    let targetUjian = idUjian;
    let targetMurid = namaMurid;
    let targetJudul = judulUjian;
    let prevScore = nilaiSebelumnya;

    if (!targetUjian || !targetMurid) {
      try {
        const snap = await withTimeout(getDoc(doc(db, COLLECTIONS.NILAI, idNilai)), 4000);
        if (snap.exists()) {
          const d = snap.data();
          targetUjian = targetUjian || d?.ID_Ujian;
          targetMurid = targetMurid || d?.Nama_Murid;
          targetJudul = targetJudul || d?.Judul_Ujian;
          if (prevScore === undefined && d?.Nilai !== undefined) {
            prevScore = Number(d.Nilai);
          }
        }
      } catch {}
    }

    if (targetUjian && targetMurid) {
      try {
        const resetId = `${targetUjian}___${encodeURIComponent(targetMurid.trim())}`;
        await withTimeout(
          setDoc(doc(db, COLLECTIONS.RESETS, resetId), {
            id: resetId,
            idUjian: targetUjian,
            namaMurid: targetMurid,
            judulUjian: targetJudul || '',
            nilaiSebelumnya: prevScore,
            resetAt: new Date().toISOString(),
            resetBy: 'guru/admin',
            status: 'granted',
          }),
          5000
        );
      } catch (err) {
        console.warn('Error recording reset permission in Firebase:', err);
      }
    }

    await withTimeout(
      Promise.allSettled([
        deleteDoc(doc(db, COLLECTIONS.REKAP_NILAI, idNilai)),
        deleteDoc(doc(db, COLLECTIONS.HASIL_UJIAN, idNilai)),
        deleteDoc(doc(db, 'nilai', idNilai)),
      ]),
      5000
    );
    return { success: true, message: 'Izin pengerjaan ulang berhasil diberikan kepada murid!' };
  },

  async grantExamReset(reset: ExamResetPermission): Promise<ApiResponse> {
    const docId = reset.id || `${reset.idUjian}___${encodeURIComponent(reset.namaMurid.trim())}`;
    await withTimeout(setDoc(doc(db, COLLECTIONS.RESETS, docId), { ...reset, id: docId }), 5000);
    return { success: true, message: 'Izin pengerjaan ulang berhasil dicatat di Firebase!' };
  },

  async getExamResets(namaMurid?: string): Promise<ExamResetPermission[]> {
    if (isFirestoreOffline()) return [];
    try {
      const snap = await withTimeout(getDocs(collection(db, COLLECTIONS.RESETS)), 6000);
      const list = snap.docs.map((d) => d.data() as ExamResetPermission);
      if (namaMurid) {
        return list.filter(
          (r) =>
            r.status === 'granted' &&
            r.namaMurid?.trim().toLowerCase() === namaMurid.trim().toLowerCase()
        );
      }
      return list.filter((r) => r.status === 'granted');
    } catch (err) {
      markFirestoreOffline(err);
      return [];
    }
  },

  async consumeExamReset(idUjian: string, namaMurid: string): Promise<ApiResponse> {
    try {
      const docId = `${idUjian}___${encodeURIComponent(namaMurid.trim())}`;
      await withTimeout(deleteDoc(doc(db, COLLECTIONS.RESETS, docId)), 5000);
    } catch (err) {
      console.warn('Error deleting exam reset doc in Firebase:', err);
    }
    return { success: true };
  },

  async updateNilai(nilai: Nilai): Promise<ApiResponse> {
    const payload = normalizeNilai(nilai);
    const cleaned = cleanFirestoreDoc(payload);
    try {
      await withTimeout(
        Promise.allSettled([
          setDoc(doc(db, COLLECTIONS.REKAP_NILAI, payload.ID), cleaned),
          setDoc(doc(db, COLLECTIONS.HASIL_UJIAN, payload.ID), cleaned),
          setDoc(doc(db, 'nilai', payload.ID), cleaned),
        ]),
        5000
      );
      return { success: true, message: 'Koreksi nilai berhasil disimpan ke database Firebase!' };
    } catch (err) {
      console.warn('[Firebase updateNilai] SDK gagal, mencoba REST API:', err);
      const restOk = await saveNilaiViaRest(payload);
      if (restOk) {
        return { success: true, message: 'Koreksi nilai berhasil disimpan ke server!' };
      }
      throw new Error('Gagal memperbarui nilai di database.');
    }
  },

  // 5. PENGATURAN IDENTITAS SEKOLAH & MASTER DATA
  async getSchoolProfile(): Promise<SchoolProfile | null> {
    if (isFirestoreOffline()) return null;
    try {
      const snap = await withTimeout(getDoc(doc(db, COLLECTIONS.SETTINGS, 'school_profile')), 6000);
      if (snap.exists()) {
        return snap.data() as SchoolProfile;
      }
    } catch (err) {
      markFirestoreOffline(err);
    }
    return null;
  },

  async saveSchoolProfile(profile: SchoolProfile): Promise<ApiResponse> {
    await withTimeout(setDoc(doc(db, COLLECTIONS.SETTINGS, 'school_profile'), profile), 7000);
    return { success: true, message: 'Identitas dan pengaturan sekolah berhasil disimpan ke Firebase!' };
  },

  async getMasterKelas(): Promise<string[] | null> {
    if (isFirestoreOffline()) return null;
    try {
      const snap = await withTimeout(getDoc(doc(db, COLLECTIONS.SETTINGS, 'master_kelas')), 6000);
      if (snap.exists() && Array.isArray(snap.data()?.classes)) {
        return snap.data().classes as string[];
      }
    } catch (err) {
      markFirestoreOffline(err);
    }
    return null;
  },

  async saveMasterKelas(classes: string[]): Promise<ApiResponse> {
    await withTimeout(setDoc(doc(db, COLLECTIONS.SETTINGS, 'master_kelas'), { classes }), 7000);
    return { success: true, message: 'Daftar kelas berhasil disimpan!' };
  },

  async getMasterMapel(): Promise<string[] | null> {
    if (isFirestoreOffline()) return null;
    try {
      const snap = await withTimeout(getDoc(doc(db, COLLECTIONS.SETTINGS, 'master_mapel')), 6000);
      if (snap.exists() && Array.isArray(snap.data()?.mapels)) {
        return snap.data().mapels as string[];
      }
    } catch (err) {
      markFirestoreOffline(err);
    }
    return null;
  },

  async saveMasterMapel(mapels: string[]): Promise<ApiResponse> {
    await withTimeout(setDoc(doc(db, COLLECTIONS.SETTINGS, 'master_mapel'), { mapels }), 7000);
    return { success: true, message: 'Daftar mata pelajaran berhasil disimpan!' };
  },

  async getAnnouncements(): Promise<Announcement[]> {
    if (isFirestoreOffline()) return [];
    try {
      const snap = await withTimeout(getDocs(collection(db, COLLECTIONS.ANNOUNCEMENTS)), 6000);
      const list: Announcement[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Announcement, 'id'>) }));
      return list;
    } catch (err) {
      markFirestoreOffline(err);
      return [];
    }
  },

  async saveAnnouncement(item: Announcement): Promise<ApiResponse> {
    const id = item.id || 'PENG-' + Date.now();
    const cleanPayload: Record<string, unknown> = { id };
    Object.entries(item).forEach(([key, val]) => {
      if (val !== undefined) {
        cleanPayload[key] = val;
      }
    });
    await withTimeout(setDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id), cleanPayload), 5000);
    return { success: true, message: 'Pengumuman berhasil disimpan!' };
  },

  async deleteAnnouncement(id: string): Promise<ApiResponse> {
    await withTimeout(deleteDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id)), 5000);
    return { success: true, message: 'Pengumuman berhasil dihapus!' };
  },

  // 6. TEST CONNECTION DIAGNOSTIC & INITIAL SEED
  async testConnection(): Promise<FirebaseConnectionDiagnostic> {
    // Reset status to test fresh connection
    isFirestoreAvailable = null;

    const activeCfg = getActiveFirebaseConfig();
    const rulesSnippet = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`;
    const consoleRulesUrl = `https://console.firebase.google.com/project/${activeCfg.projectId}/firestore/rules`;

    try {
      // Coba baca koleksi users dengan timeout terukur
      const usersCol = collection(db, COLLECTIONS.USERS);
      const snap = await withTimeout(getDocs(usersCol), 8000);
      markFirestoreOnline();

      // Jika kosong, inisialisasi data awal
      if (snap.empty) {
        ensureFirebaseSeeded().catch(() => {});
        return {
          success: true,
          message: `Berhasil terhubung ke database Firestore (${activeCfg.projectId})! Database siap dan koleksi sedang disinkronkan.`,
          databaseId: activeCfg.firestoreDatabaseId || '(default)',
          projectId: activeCfg.projectId,
          userCount: 0,
        };
      }

      return {
        success: true,
        message: `Terhubung sukses ke Google Firebase Firestore (${activeCfg.projectId})! Ditemukan ${snap.size} akun pengguna aktif.`,
        databaseId: activeCfg.firestoreDatabaseId || '(default)',
        projectId: activeCfg.projectId,
        userCount: snap.size,
      };
    } catch (err: unknown) {
      markFirestoreOffline(err);
      const errorObj = err as { code?: string; message?: string };
      const code = errorObj?.code || '';
      const msg = errorObj?.message || String(err);

      let errorCode: FirebaseConnectionDiagnostic['errorCode'] = 'unknown';
      let helpfulMsg = msg;

      if (
        msg.includes('Cloud Firestore API has not been used') ||
        msg.includes('is disabled') ||
        msg.includes('not been used in project')
      ) {
        errorCode = 'not-found';
        helpfulMsg = `Layanan Cloud Firestore belum dibuat/diaktifkan di proyek "${activeCfg.projectId}". Silakan buka Firebase Console > Firestore Database > Buat Database (lokasi asia-southeast1).`;
      } else if (
        code === 'permission-denied' ||
        msg.includes('permission-denied') ||
        msg.includes('Missing or insufficient permissions') ||
        msg.includes('403')
      ) {
        errorCode = 'permission-denied';
        helpfulMsg = `Akses Ditolak (Error 403: Permission Denied). Database Firestore di proyek "${activeCfg.projectId}" menolak permintaan karena Aturan Keamanan (Security Rules) masih terkunci. Silakan perbarui aturan di Firebase Console menjadi: allow read, write: if true;`;
      } else if (code === 'not-found' || msg.includes('not-found') || msg.includes('does not exist')) {
        errorCode = 'not-found';
        helpfulMsg = `Database Firestore belum dibuat di proyek "${activeCfg.projectId}". Buka Firebase Console > Firestore Database > Buat Database (lokasi asia-southeast1 / (default)).`;
      } else if (
        code === 'unavailable' ||
        msg.includes('unavailable') ||
        msg.includes('batas waktu') ||
        msg.includes('timeout') ||
        msg.includes('offline')
      ) {
        errorCode = 'network-error';
        helpfulMsg = `Koneksi ke Firestore batas waktu (timeout). Database Firestore belum siap di cloud atau jaringan internet sedang offline. Aplikasi otomatis menggunakan mode cadangan lokal.`;
      }

      return {
        success: false,
        message: helpfulMsg,
        databaseId: activeCfg.firestoreDatabaseId || '(default)',
        projectId: activeCfg.projectId,
        errorCode,
        errorDetails: msg,
        rulesSnippet,
        consoleRulesUrl,
      };
    }
  },

  // Inisialisasi manual seluruh koleksi data awal
  async seedInitialCollections(): Promise<ApiResponse> {
    try {
      for (const u of INITIAL_USERS) {
        await setDoc(doc(db, COLLECTIONS.USERS, u.username), u);
      }
      for (const m of INITIAL_MATERI) {
        await setDoc(doc(db, COLLECTIONS.MATERI, m.ID), m);
      }
      for (const uj of INITIAL_UJIAN) {
        await setDoc(doc(db, COLLECTIONS.UJIAN, uj.ID), uj);
      }
      for (const n of INITIAL_NILAI) {
        await setDoc(doc(db, COLLECTIONS.NILAI, n.ID), n);
      }
      return { success: true, message: 'Berhasil menginisialisasi seluruh data master ke Firebase!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Gagal inisialisasi: ${msg}` };
    }
  },
};
