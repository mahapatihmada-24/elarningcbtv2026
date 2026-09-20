import { initializeApp, getApps, getApp } from 'firebase/app';
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
import firebaseConfig from '../../firebase-applet-config.json';
import { User, Materi, Ujian, Nilai, ApiResponse, SchoolProfile, Announcement } from '../types';
import { INITIAL_USERS, INITIAL_MATERI, INITIAL_UJIAN, INITIAL_NILAI } from './seedData';
import { normalizeUser, normalizeMateri, normalizeUjian, normalizeNilai } from './normalizers';

// Inisialisasi Firebase App (Cegah inisialisasi ganda)
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Firestore dengan opsi aman
const resolvedDatabaseId =
  firebaseConfig.firestoreDatabaseId &&
  firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

let firestoreInstance: ReturnType<typeof getFirestore>;
try {
  firestoreInstance = resolvedDatabaseId
    ? initializeFirestore(firebaseApp, { experimentalForceLongPolling: true }, resolvedDatabaseId)
    : initializeFirestore(firebaseApp, { experimentalForceLongPolling: true });
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

// Helper timeout aman
export function withTimeout<T>(promise: Promise<T>, timeoutMs = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Waktu koneksi melebihi batas (${timeoutMs / 1000}s)`));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
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

export async function ensureFirebaseSeeded(): Promise<void> {
  if (hasSeeded || isSeeding) return;
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
  } catch (err) {
    console.warn('Firebase seed tertunda atau offline (mode cadangan lokal tetap aktif):', err);
  } finally {
    isSeeding = false;
  }
}

// Layanan Operasi Database Firebase Firestore
export const firebaseService = {
  // 1. AUTH & PENGGUNA
  async loginUser(username: string, passwordInput: string): Promise<ApiResponse> {
    const cleanUsername = (username || '').trim().toLowerCase();
    await ensureFirebaseSeeded().catch(() => {});

    try {
      const userDocRef = doc(db, COLLECTIONS.USERS, cleanUsername);
      const snap = await withTimeout(getDoc(userDocRef), 6000);

      if (!snap.exists()) {
        const q = query(
          collection(db, COLLECTIONS.USERS),
          where('username', '==', cleanUsername)
        );
        const querySnap = await withTimeout(getDocs(q), 6000);
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
      console.warn('Gagal menghubungi Firestore saat login, beralih ke penyimpanan lokal:', err);
      throw err;
    }
  },

  async getUsers(): Promise<User[]> {
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
    await withTimeout(setDoc(doc(db, COLLECTIONS.MATERI, id), payload), 7000);
    return { success: true, message: 'Materi berhasil disimpan ke Firebase!' };
  },

  async updateMateri(materi: Materi): Promise<ApiResponse> {
    const payload = normalizeMateri(materi);
    await withTimeout(setDoc(doc(db, COLLECTIONS.MATERI, payload.ID), payload), 7000);
    return { success: true, message: 'Materi berhasil diperbarui di Firebase!' };
  },

  async deleteMateri(id: string): Promise<ApiResponse> {
    await withTimeout(deleteDoc(doc(db, COLLECTIONS.MATERI, id)), 7000);
    return { success: true, message: 'Materi berhasil dihapus dari Firebase!' };
  },

  // 3. UJIAN & CBT
  async getUjianList(): Promise<Ujian[]> {
    await ensureFirebaseSeeded().catch(() => {});
    const snap = await withTimeout(getDocs(collection(db, COLLECTIONS.UJIAN)), 7000);
    const list: Ujian[] = [];
    snap.forEach((d) => {
      list.push(normalizeUjian(d.data()));
    });
    return list;
  },

  async addUjian(ujian: Omit<Ujian, 'ID'> & { ID?: string }): Promise<ApiResponse> {
    const id = ujian.ID || 'UJN-' + Date.now();
    const payload = normalizeUjian({ ...ujian, ID: id });
    await withTimeout(setDoc(doc(db, COLLECTIONS.UJIAN, id), payload), 7000);
    return { success: true, message: 'Paket Ujian berhasil disimpan ke Firebase!' };
  },

  async updateUjian(ujian: Ujian): Promise<ApiResponse> {
    const payload = normalizeUjian(ujian);
    await withTimeout(setDoc(doc(db, COLLECTIONS.UJIAN, payload.ID), payload), 7000);
    return { success: true, message: 'Paket Ujian berhasil diperbarui di Firebase!' };
  },

  async deleteUjian(id: string): Promise<ApiResponse> {
    await withTimeout(deleteDoc(doc(db, COLLECTIONS.UJIAN, id)), 7000);
    return { success: true, message: 'Paket Ujian berhasil dihapus dari Firebase!' };
  },

  // 4. NILAI & HASIL UJIAN
  async getHasilMurid(namaMurid: string): Promise<Nilai[]> {
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

    await withTimeout(setDoc(doc(db, COLLECTIONS.NILAI, newId), newNilai), 7000);
    return { success: true, message: 'Hasil ujian berhasil disimpan ke database Firebase!' };
  },

  async resetNilaiMurid(idNilai: string): Promise<ApiResponse> {
    await withTimeout(deleteDoc(doc(db, COLLECTIONS.NILAI, idNilai)), 7000);
    return { success: true, message: 'Akses ujian ulang berhasil diberikan kepada murid!' };
  },

  async updateNilai(nilai: Nilai): Promise<ApiResponse> {
    const payload = normalizeNilai(nilai);
    await withTimeout(setDoc(doc(db, COLLECTIONS.NILAI, payload.ID), payload), 7000);
    return { success: true, message: 'Koreksi nilai berhasil disimpan ke database Firebase!' };
  },

  // 5. PENGATURAN IDENTITAS SEKOLAH & MASTER DATA
  async getSchoolProfile(): Promise<SchoolProfile | null> {
    try {
      const snap = await withTimeout(getDoc(doc(db, COLLECTIONS.SETTINGS, 'school_profile')), 5000);
      if (snap.exists()) {
        return snap.data() as SchoolProfile;
      }
    } catch (err) {
      console.warn('Gagal memuat profil sekolah dari Firebase:', err);
    }
    return null;
  },

  async saveSchoolProfile(profile: SchoolProfile): Promise<ApiResponse> {
    await withTimeout(setDoc(doc(db, COLLECTIONS.SETTINGS, 'school_profile'), profile), 7000);
    return { success: true, message: 'Identitas dan pengaturan sekolah berhasil disimpan ke Firebase!' };
  },

  async getMasterKelas(): Promise<string[] | null> {
    try {
      const snap = await withTimeout(getDoc(doc(db, COLLECTIONS.SETTINGS, 'master_kelas')), 5000);
      if (snap.exists() && Array.isArray(snap.data()?.classes)) {
        return snap.data().classes as string[];
      }
    } catch {}
    return null;
  },

  async saveMasterKelas(classes: string[]): Promise<ApiResponse> {
    await withTimeout(setDoc(doc(db, COLLECTIONS.SETTINGS, 'master_kelas'), { classes }), 7000);
    return { success: true, message: 'Daftar kelas berhasil disimpan!' };
  },

  async getMasterMapel(): Promise<string[] | null> {
    try {
      const snap = await withTimeout(getDoc(doc(db, COLLECTIONS.SETTINGS, 'master_mapel')), 5000);
      if (snap.exists() && Array.isArray(snap.data()?.mapels)) {
        return snap.data().mapels as string[];
      }
    } catch {}
    return null;
  },

  async saveMasterMapel(mapels: string[]): Promise<ApiResponse> {
    await withTimeout(setDoc(doc(db, COLLECTIONS.SETTINGS, 'master_mapel'), { mapels }), 7000);
    return { success: true, message: 'Daftar mata pelajaran berhasil disimpan!' };
  },

  async getAnnouncements(): Promise<Announcement[]> {
    try {
      const snap = await withTimeout(getDocs(collection(db, COLLECTIONS.ANNOUNCEMENTS)), 5000);
      const list: Announcement[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Announcement, 'id'>) }));
      return list;
    } catch {
      return [];
    }
  },

  async saveAnnouncement(item: Announcement): Promise<ApiResponse> {
    const id = item.id || 'PENG-' + Date.now();
    await withTimeout(setDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id), { ...item, id }), 7000);
    return { success: true, message: 'Pengumuman berhasil disimpan!' };
  },

  async deleteAnnouncement(id: string): Promise<ApiResponse> {
    await withTimeout(deleteDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id)), 7000);
    return { success: true, message: 'Pengumuman berhasil dihapus!' };
  },

  // 6. TEST CONNECTION DIAGNOSTIC
  async testConnection(): Promise<{ success: boolean; message: string; databaseId: string }> {
    try {
      // 1. Coba baca koleksi users
      const usersCol = collection(db, COLLECTIONS.USERS);
      const snap = await withTimeout(getDocs(usersCol), 10000);

      // Jika kosong, inisialisasi data awal
      if (snap.empty) {
        ensureFirebaseSeeded().catch(() => {});
        return {
          success: true,
          message: `Berhasil terhubung ke database Firestore (${firebaseConfig.projectId})! Koleksi awal sedang disinkronkan.`,
          databaseId: firebaseConfig.firestoreDatabaseId,
        };
      }

      return {
        success: true,
        message: `Terhubung sukses ke Google Firebase Firestore (${firebaseConfig.projectId})! Ditemukan ${snap.size} akun pengguna aktif.`,
        databaseId: firebaseConfig.firestoreDatabaseId,
      };
    } catch (err: unknown) {
      console.error('Firebase testConnection error:', err);
      const errorObj = err as { code?: string; message?: string };
      const code = errorObj?.code || '';
      const msg = errorObj?.message || String(err);

      let helpfulMsg = msg;
      if (code === 'permission-denied' || msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
        helpfulMsg = 'Akses ditolak (Permission Denied). Pastikan Firestore Rules di Firebase Console diizinkan: "allow read, write: if true;".';
      } else if (code === 'not-found' || msg.includes('not-found') || msg.includes('does not exist')) {
        helpfulMsg = `Database Firestore belum dibuat di proyek "${firebaseConfig.projectId}". Buka Firebase Console > Firestore Database > Buat Database (lokasi asia-southeast1 / (default)).`;
      } else if (code === 'unavailable' || msg.includes('unavailable') || msg.includes('batas waktu') || msg.includes('offline')) {
        helpfulMsg = 'Layanan Firestore sedang menunggu jaringan atau mode offline. Aplikasi tetap aktif menggunakan database lokal secara otomatis.';
      }

      return {
        success: false,
        message: `Status: ${helpfulMsg}`,
        databaseId: firebaseConfig.firestoreDatabaseId,
      };
    }
  },
};
