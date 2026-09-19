import { User, Materi, Ujian, Nilai, ApiResponse } from '../types';
import { INITIAL_USERS, INITIAL_MATERI, INITIAL_UJIAN, INITIAL_NILAI } from './seedData';
import { firebaseService, ensureFirebaseSeeded } from './firebase';
import {
  normalizeUser,
  normalizeMateri,
  normalizeUjian,
  normalizeNilai,
} from './normalizers';

// Re-export normalizers for backward compatibility
export { normalizeUser, normalizeMateri, normalizeUjian, normalizeNilai };

export const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbwCqf1vnHI09ud7lV3pOFgGdShJaqjbv_6y74bv8F5PqKhGpIOLnGUgsLpqSWlGnbAGnQ/exec';

const STORAGE_KEY_GAS_URL = 'cbt_gas_web_app_url';
const STORAGE_KEY_PREFERRED_SOURCE = 'cbt_preferred_data_source';
const STORAGE_KEY_USERS = 'cbt_db_users';
const STORAGE_KEY_MATERI = 'cbt_db_materi';
const STORAGE_KEY_UJIAN = 'cbt_db_ujian';
const STORAGE_KEY_NILAI = 'cbt_db_nilai';

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

function getLocalUjian(): Ujian[] {
  ensureLocalDbInitialized();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_UJIAN) || '[]');
    if (Array.isArray(raw)) {
      return raw.map(normalizeUjian);
    }
    return INITIAL_UJIAN.map(normalizeUjian);
  } catch {
    return INITIAL_UJIAN.map(normalizeUjian);
  }
}

function saveLocalUjian(ujian: Ujian[]) {
  localStorage.setItem(STORAGE_KEY_UJIAN, JSON.stringify(ujian.map(normalizeUjian)));
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

// Unified API Methods supporting Firebase Firestore, Google Apps Script, and Local Storage
export const api = {
  // Test connection to Firebase Firestore
  async testFirebaseConnection(): Promise<{ success: boolean; message: string; databaseId?: string }> {
    const res = await firebaseService.testConnection();
    if (res.success) {
      notifyDataSource('FIREBASE');
    }
    return res;
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
    if (currentDataSource === 'FIREBASE') {
      try {
        const users = await firebaseService.getUsers();
        if (users && users.length > 0) {
          saveLocalUsers(users);
          return users;
        }
      } catch (err) {
        console.warn('Firebase getUsers error, falling back to local:', err);
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

  // 3. MATERI
  async getMateriList(targetKelas: string): Promise<Materi[]> {
    const cleanTarget = (targetKelas || '').toLowerCase();

    if (currentDataSource === 'FIREBASE') {
      try {
        const allMateri = await firebaseService.getMateriList();
        if (Array.isArray(allMateri)) {
          saveLocalMateri(allMateri);
          if (!targetKelas || targetKelas === 'ALL') return [...allMateri].reverse();
          return allMateri
            .filter(
              (m) =>
                m.Kelas === 'Semua' ||
                (m.Kelas || '').toLowerCase() === cleanTarget
            )
            .reverse();
        }
      } catch (err) {
        console.warn('Firebase getMateriList error, fallback to local:', err);
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<Materi[]>('getMateriList', [targetKelas]);
        if (Array.isArray(res)) {
          const normalized = res.map(normalizeMateri);
          saveLocalMateri(normalized);
          return normalized;
        }
      } catch (err) {
        console.warn('GAS getMateriList error, fallback to local:', err);
      }
    }

    const list = getLocalMateri();
    if (!targetKelas || targetKelas === 'ALL') return [...list].reverse();
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
    const cleanTarget = (targetKelas || '').toLowerCase();

    if (currentDataSource === 'FIREBASE') {
      try {
        const allUjian = await firebaseService.getUjianList();
        if (Array.isArray(allUjian)) {
          saveLocalUjian(allUjian);
          if (role === 'guru') return [...allUjian].reverse();
          return allUjian
            .filter(
              (u) =>
                u.Status === 'Aktif' &&
                (!targetKelas ||
                  targetKelas === 'ALL' ||
                  u.Kelas === 'Semua' ||
                  (u.Kelas || '').toLowerCase() === cleanTarget)
            )
            .reverse();
        }
      } catch (err) {
        console.warn('Firebase getUjianList error, fallback to local:', err);
      }
    }

    if (currentDataSource === 'GAS') {
      try {
        const res = await callGasServer<Ujian[]>('getUjianList', [targetKelas, role]);
        if (Array.isArray(res)) {
          const normalized = res.map(normalizeUjian);
          saveLocalUjian(normalized);
          return normalized;
        }
      } catch (err) {
        console.warn('GAS getUjianList error, fallback to local:', err);
      }
    }

    const list = getLocalUjian();
    if (role === 'guru') return [...list].reverse();
    return list
      .filter(
        (u) =>
          u.Status === 'Aktif' &&
          (!targetKelas ||
            targetKelas === 'ALL' ||
            u.Kelas === 'Semua' ||
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
            Soal_JSON: soalJsonStr,
            Status: ujianData.Status || 'Aktif',
          });
          const allUj = await firebaseService.getUjianList();
          saveLocalUjian(allUj);
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

    if (currentDataSource === 'FIREBASE') {
      try {
        const list = await firebaseService.getHasilMurid(namaMurid);
        if (Array.isArray(list)) return list;
      } catch (err) {
        console.warn('Firebase getHasilMurid error:', err);
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
    if (currentDataSource === 'FIREBASE') {
      try {
        const list = await firebaseService.getNilaiList();
        if (Array.isArray(list)) {
          saveLocalNilai(list);
          return list;
        }
      } catch (err) {
        console.warn('Firebase getNilaiList error:', err);
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
};
