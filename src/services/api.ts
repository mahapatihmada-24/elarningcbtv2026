import { User, Role, Materi, Ujian, Nilai, ApiResponse } from '../types';
import { INITIAL_USERS, INITIAL_MATERI, INITIAL_UJIAN, INITIAL_NILAI } from './seedData';

export const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbwCqf1vnHI09ud7lV3pOFgGdShJaqjbv_6y74bv8F5PqKhGpIOLnGUgsLpqSWlGnbAGnQ/exec';

const STORAGE_KEY_GAS_URL = 'cbt_gas_web_app_url';
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

// Normalization helpers
export function normalizeUser(u: any): User {
  if (!u) return { nama: '', username: '', role: 'murid', kelas: '-' };
  const rawRole = String(u.role || u.Role || 'murid').toLowerCase();
  const validRole: Role = rawRole === 'admin' || rawRole === 'guru' ? rawRole : 'murid';
  return {
    nama: String(u.nama || u.Nama || ''),
    username: String(u.username || u.Username || ''),
    password: u.password !== undefined || u.Password !== undefined ? String(u.password || u.Password || '') : undefined,
    role: validRole,
    kelas: String(u.kelas || u.Kelas || '-'),
  };
}

export function normalizeMateri(m: any): Materi {
  if (!m) return { ID: '', Judul: '', Mapel: '', Kelas: 'Semua', Konten_Link: '', Nama_Guru: '' };
  return {
    ID: String(m.ID || m.id || ''),
    Judul: String(m.Judul || m.judul || ''),
    Mapel: String(m.Mapel || m.mapel || ''),
    Kelas: String(m.Kelas || m.kelas || 'Semua'),
    Konten_Link: String(m.Konten_Link || m.konten_link || m.konten || ''),
    Gambar_URL: m.Gambar_URL || m.gambar_url || m.gambar ? String(m.Gambar_URL || m.gambar_url || m.gambar) : '',
    Sumber: String(m.Sumber || m.sumber || ''),
    Nama_Guru: String(m.Nama_Guru || m.nama_guru || ''),
    CreatedAt: String(m.CreatedAt || m.createdAt || ''),
  };
}

export function normalizeUjian(u: any): Ujian {
  if (!u) return { ID: '', Judul_Ujian: '', Mapel: '', Kelas: 'Semua', Durasi_Menit: 60, Soal_JSON: '{}', Status: 'Aktif' };
  let soalJson = '{}';
  if (typeof u.Soal_JSON === 'string') {
    soalJson = u.Soal_JSON;
  } else if (typeof u.soal === 'string') {
    soalJson = u.soal;
  } else if (u.Soal_JSON || u.soal) {
    soalJson = JSON.stringify(u.Soal_JSON || u.soal);
  }
  return {
    ID: String(u.ID || u.id || ''),
    Judul_Ujian: String(u.Judul_Ujian || u.judul_ujian || u.judul || ''),
    Mapel: String(u.Mapel || u.mapel || ''),
    Kelas: String(u.Kelas || u.kelas || 'Semua'),
    Durasi_Menit: Number(u.Durasi_Menit ?? u.durasi_menit ?? u.durasi ?? 60),
    Soal_JSON: soalJson,
    Status: (u.Status || u.status || 'Aktif') as 'Aktif' | 'Non-Aktif',
  };
}

export function normalizeNilai(n: any): Nilai {
  if (!n) return { ID: '', ID_Ujian: '', Judul_Ujian: '', Nama_Murid: '', Kelas: '', Nilai: 0, Pelanggaran: 0, Waktu_Submit: '' };
  return {
    ID: String(n.ID || n.id || ''),
    ID_Ujian: String(n.ID_Ujian || n.id_ujian || ''),
    Judul_Ujian: String(n.Judul_Ujian || n.judul_ujian || ''),
    Nama_Murid: String(n.Nama_Murid || n.nama_murid || ''),
    Kelas: String(n.Kelas || n.kelas || ''),
    Nilai: Number(n.Nilai ?? n.nilai ?? 0),
    Pelanggaran: Number(n.Pelanggaran ?? n.pelanggaran ?? 0),
    Waktu_Submit: String(n.Waktu_Submit || n.waktu_submit || ''),
  };
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

// Status callback for notifying UI if connected to GAS or Local Storage
export type DataSource = 'GAS' | 'LOCAL';
let currentDataSource: DataSource = 'LOCAL';
const listeners: Array<(src: DataSource) => void> = [];

export function getDataSource(): DataSource {
  return currentDataSource;
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

// Unified API Methods matching code.gs
export const api = {
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
      notifyDataSource('LOCAL');
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Gagal terhubung ke GAS: ${msg}. Sistem beralih ke Mode Lokal.` };
    }
  },

  // 1. AUTH
  async loginUser(username: string, password: string): Promise<ApiResponse> {
    try {
      const res = await callGasServer<ApiResponse>('loginUser', [username, password]);
      if (res && typeof res.success === 'boolean') {
        notifyDataSource('GAS');
        if (res.user) {
          res.user = normalizeUser(res.user);
        }
        return res;
      }
      throw new Error('Respon login dari GAS tidak valid');
    } catch {
      notifyDataSource('LOCAL');
      // Fallback to local storage
      const users = getLocalUsers();
      const cleanUsername = (username || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();
      const matched = users.find(
        (u) =>
          (u.username || '').trim().toLowerCase() === cleanUsername &&
          (u.password || '').trim() === cleanPassword
      );
      if (matched) {
        return {
          success: true,
          message: 'Berhasil masuk (Penyimpanan Lokal)',
          user: normalizeUser(matched),
        };
      }
      return {
        success: false,
        message: 'Username atau Password yang Anda masukkan salah!',
      };
    }
  },

  // 2. USERS
  async getUsers(): Promise<User[]> {
    try {
      const res = await callGasServer<User[]>('getUsers', []);
      if (Array.isArray(res)) {
        notifyDataSource('GAS');
        const normalized = res.map(normalizeUser);
        saveLocalUsers(normalized);
        return normalized;
      }
      throw new Error('Format respon pengguna dari GAS tidak valid');
    } catch {
      notifyDataSource('LOCAL');
      return getLocalUsers();
    }
  },

  async addUser(userData: User): Promise<ApiResponse> {
    const cleanUser = normalizeUser(userData);
    try {
      const res = await callGasServer<ApiResponse>('addUser', [cleanUser]);
      if (res && res.success) {
        notifyDataSource('GAS');
        // also keep local in sync
        const users = getLocalUsers();
        users.push(cleanUser);
        saveLocalUsers(users);
        return res;
      }
      throw new Error(res?.message || 'Gagal menambahkan pengguna via GAS');
    } catch (err: unknown) {
      notifyDataSource('LOCAL');
      const users = getLocalUsers();
      if (users.some((u) => (u.username || '').toLowerCase() === (cleanUser.username || '').toLowerCase())) {
        return { success: false, message: 'Username sudah digunakan oleh akun lain!' };
      }
      users.push(cleanUser);
      saveLocalUsers(users);
      return { success: true, message: 'Pengguna baru berhasil ditambahkan ke sistem!' };
    }
  },

  async deleteUser(username: string): Promise<ApiResponse> {
    const cleanU = (username || '').trim();
    try {
      const res = await callGasServer<ApiResponse>('deleteUser', [cleanU]);
      if (res && res.success) {
        notifyDataSource('GAS');
        const users = getLocalUsers().filter((u) => (u.username || '').trim() !== cleanU);
        saveLocalUsers(users);
        return res;
      }
      throw new Error(res?.message || 'Gagal menghapus user via GAS');
    } catch {
      notifyDataSource('LOCAL');
      const users = getLocalUsers().filter((u) => (u.username || '').trim() !== cleanU);
      saveLocalUsers(users);
      return { success: true, message: 'Pengguna berhasil dihapus!' };
    }
  },

  // 3. MATERI
  async getMateriList(targetKelas: string): Promise<Materi[]> {
    try {
      const res = await callGasServer<Materi[]>('getMateriList', [targetKelas]);
      if (Array.isArray(res)) {
        notifyDataSource('GAS');
        const normalized = res.map(normalizeMateri);
        saveLocalMateri(normalized);
        return normalized;
      }
      throw new Error('Invalid materi response from GAS');
    } catch {
      notifyDataSource('LOCAL');
      const list = getLocalMateri();
      const cleanTarget = (targetKelas || '').toLowerCase();
      if (!targetKelas || targetKelas === 'ALL') return [...list].reverse();
      return list
        .filter(
          (m) =>
            m.Kelas === 'Semua' ||
            (m.Kelas || '').toLowerCase() === cleanTarget
        )
        .reverse();
    }
  },

  async saveMateri(materiData: Partial<Materi>): Promise<ApiResponse> {
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
      if (res && res.success) {
        notifyDataSource('GAS');
        return res;
      }
      throw new Error(res?.message || 'Gagal simpan materi ke GAS');
    } catch {
      notifyDataSource('LOCAL');
      const list = getLocalMateri();
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
    }
  },

  async deleteMateri(id: string): Promise<ApiResponse> {
    try {
      const res = await callGasServer<ApiResponse>('deleteMateri', [id]);
      if (res && res.success) {
        notifyDataSource('GAS');
        saveLocalMateri(getLocalMateri().filter((m) => m.ID !== id));
        return res;
      }
      throw new Error(res?.message || 'Gagal hapus materi via GAS');
    } catch {
      notifyDataSource('LOCAL');
      saveLocalMateri(getLocalMateri().filter((m) => m.ID !== id));
      return { success: true, message: 'Materi berhasil dihapus!' };
    }
  },

  // 4. UJIAN & CBT
  async getUjianList(targetKelas: string, role: string): Promise<Ujian[]> {
    try {
      const res = await callGasServer<Ujian[]>('getUjianList', [targetKelas, role]);
      if (Array.isArray(res)) {
        notifyDataSource('GAS');
        const normalized = res.map(normalizeUjian);
        saveLocalUjian(normalized);
        return normalized;
      }
      throw new Error('Invalid ujian response from GAS');
    } catch {
      notifyDataSource('LOCAL');
      const list = getLocalUjian();
      if (role === 'guru') return [...list].reverse();
      const cleanTarget = (targetKelas || '').toLowerCase();
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
    }
  },

  async saveUjian(ujianData: Partial<Ujian> & { soal: unknown }): Promise<ApiResponse> {
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
      if (res && res.success) {
        notifyDataSource('GAS');
        return res;
      }
      throw new Error(res?.message || 'Gagal simpan ujian ke GAS');
    } catch {
      notifyDataSource('LOCAL');
      const list = getLocalUjian();
      const soalJsonStr =
        typeof ujianData.soal === 'string' ? ujianData.soal : JSON.stringify(ujianData.soal);

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
    }
  },

  async toggleStatusUjian(id: string, newStatus: 'Aktif' | 'Non-Aktif'): Promise<ApiResponse> {
    try {
      const res = await callGasServer<ApiResponse>('toggleStatusUjian', [id, newStatus]);
      if (res && res.success) {
        notifyDataSource('GAS');
        const list = getLocalUjian();
        const found = list.find((u) => u.ID === id);
        if (found) {
          found.Status = newStatus;
          saveLocalUjian(list);
        }
        return res;
      }
      throw new Error(res?.message || 'Gagal mengubah status ujian di GAS');
    } catch {
      notifyDataSource('LOCAL');
      const list = getLocalUjian();
      const found = list.find((u) => u.ID === id);
      if (found) {
        found.Status = newStatus;
        saveLocalUjian(list);
        return { success: true, message: `Status ujian berhasil diubah menjadi ${newStatus}!` };
      }
      return { success: false, message: 'Ujian tidak ditemukan!' };
    }
  },

  async deleteUjian(id: string): Promise<ApiResponse> {
    try {
      const res = await callGasServer<ApiResponse>('deleteUjian', [id]);
      if (res && res.success) {
        notifyDataSource('GAS');
        saveLocalUjian(getLocalUjian().filter((u) => u.ID !== id));
        return res;
      }
      throw new Error(res?.message || 'Gagal menghapus ujian di GAS');
    } catch {
      notifyDataSource('LOCAL');
      saveLocalUjian(getLocalUjian().filter((u) => u.ID !== id));
      return { success: true, message: 'Ujian berhasil dihapus secara permanen!' };
    }
  },

  // 5. NILAI & HASIL CBT
  async getHasilMurid(namaMurid: string): Promise<Nilai[]> {
    const cleanTarget = (namaMurid || '').trim().toLowerCase();
    try {
      const res = await callGasServer<Nilai[]>('getHasilMurid', [namaMurid]);
      if (Array.isArray(res)) {
        notifyDataSource('GAS');
        return res.map(normalizeNilai);
      }
      throw new Error('Invalid hasil murid response from GAS');
    } catch {
      notifyDataSource('LOCAL');
      return getLocalNilai().filter(
        (n) => (n.Nama_Murid || '').trim().toLowerCase() === cleanTarget
      );
    }
  },

  async getNilaiList(): Promise<Nilai[]> {
    try {
      const res = await callGasServer<Nilai[]>('getNilaiList', []);
      if (Array.isArray(res)) {
        notifyDataSource('GAS');
        const normalized = res.map(normalizeNilai);
        saveLocalNilai(normalized);
        return normalized;
      }
      throw new Error('Invalid nilai list response from GAS');
    } catch {
      notifyDataSource('LOCAL');
      return [...getLocalNilai()].reverse();
    }
  },

  async submitHasilUjian(payload: {
    id_ujian: string;
    judul_ujian: string;
    nama_murid: string;
    kelas: string;
    nilai: number;
    pelanggaran: number;
  }): Promise<ApiResponse> {
    try {
      const res = await callGasServer<ApiResponse>('submitHasilUjian', [payload]);
      if (res && res.success) {
        notifyDataSource('GAS');
        return res;
      }
      throw new Error(res?.message || 'Gagal menyimpan hasil ujian ke GAS');
    } catch {
      notifyDataSource('LOCAL');
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
    }
  },

  async resetNilaiMurid(idNilai: string): Promise<ApiResponse> {
    try {
      const res = await callGasServer<ApiResponse>('resetNilaiMurid', [idNilai]);
      if (res && res.success) {
        notifyDataSource('GAS');
        saveLocalNilai(getLocalNilai().filter((n) => n.ID !== idNilai));
        return res;
      }
      throw new Error(res?.message || 'Gagal reset nilai murid di GAS');
    } catch {
      notifyDataSource('LOCAL');
      const list = getLocalNilai().filter((n) => n.ID !== idNilai);
      saveLocalNilai(list);
      return { success: true, message: 'Akses ujian ulang berhasil diberikan kepada murid!' };
    }
  },
};
