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
} from 'firebase/firestore';
import firebaseConfigFile from '../../firebase-applet-config.json';
import { User, Materi, Ujian, Nilai, ApiResponse, SchoolProfile, Announcement } from '../types';
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
    ? initializeFirestore(firebaseApp, { experimentalAutoDetectLongPolling: true }, resolvedDatabaseId)
    : initializeFirestore(firebaseApp, { experimentalAutoDetectLongPolling: true });
} catch {
  firestoreInstance = resolvedDatabaseId
    ? getFirestore(firebaseApp, resolvedDatabaseId)
    : getFirestore(firebaseApp);
}

export const db = firestoreInstance;

// Nama koleksi di Firestore
export const COLLECTIONS = {
  USERS: 'users',
  MATERI: 'materi',
  UJIAN: 'ujian',
  NILAI: 'nilai',
  SETTINGS: 'settings',
  ANNOUNCEMENTS: 'announcements',
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
    const snap = await withTimeout(getDocs(collection(db, COLLECTIONS.UJIAN)), 15000);
    const list: Ujian[] = [];
    snap.forEach((d) => {
      list.push(normalizeUjian(d.data()));
    });
    return list;
  },

  async addUjian(ujian: Omit<Ujian, 'ID'> & { ID?: string }): Promise<ApiResponse> {
    const id = ujian.ID || 'UJN-' + Date.now();
    const payload = normalizeUjian({ ...ujian, ID: id });
    await withTimeout(setDoc(doc(db, COLLECTIONS.UJIAN, id), payload), 30000);
    return { success: true, message: 'Paket Ujian berhasil disimpan ke Firebase!' };
  },

  async updateUjian(ujian: Ujian): Promise<ApiResponse> {
    const payload = normalizeUjian(ujian);
    await withTimeout(setDoc(doc(db, COLLECTIONS.UJIAN, payload.ID), payload), 30000);
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
    if (isFirestoreOffline()) throw new Error('Firestore sedang offline');
    await ensureFirebaseSeeded().catch(() => {});
    const snap = await withTimeout(getDocs(collection(db, COLLECTIONS.NILAI)), 7000);
    const list: Nilai[] = [];
    snap.forEach((d) => {
      list.push(normalizeNilai(d.data()));
    });
    return list.reverse();
  },

  async submitHasilUjian(payload: {
    id_ujian: string;
    judul_ujian: string;
    nama_murid: string;
    kelas: string;
    nilai: number;
    pelanggaran: number;
  }): Promise<ApiResponse> {
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}`;

    const newId = 'NILAI-' + Date.now();
    const newNilai: Nilai = {
      ID: newId,
      ID_Ujian: payload.id_ujian,
      Judul_Ujian: payload.judul_ujian,
      Nama_Murid: payload.nama_murid,
      Kelas: payload.kelas,
      Nilai: payload.nilai,
      Pelanggaran: payload.pelanggaran,
      Waktu_Submit: timeStr,
    };

    await withTimeout(setDoc(doc(db, COLLECTIONS.NILAI, newId), newNilai), 5000);
    return { success: true, message: 'Hasil ujian berhasil disimpan ke database Firebase!' };
  },

  async resetNilaiMurid(idNilai: string): Promise<ApiResponse> {
    await withTimeout(deleteDoc(doc(db, COLLECTIONS.NILAI, idNilai)), 5000);
    return { success: true, message: 'Akses ujian ulang berhasil diberikan kepada murid!' };
  },

  async updateNilai(nilai: Nilai): Promise<ApiResponse> {
    const payload = normalizeNilai(nilai);
    await withTimeout(setDoc(doc(db, COLLECTIONS.NILAI, payload.ID), payload), 5000);
    return { success: true, message: 'Koreksi nilai berhasil disimpan ke database Firebase!' };
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
