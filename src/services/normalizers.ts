import { User, Role, Materi, Ujian, Nilai } from '../types';

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
    Token_Ujian: u.Token_Ujian || u.token_ujian || u.token || '',
    Jadwal_Mulai: u.Jadwal_Mulai || u.jadwal_mulai || '',
    Jadwal_Selesai: u.Jadwal_Selesai || u.jadwal_selesai || '',
    Kisi_Kisi_JSON: u.Kisi_Kisi_JSON || u.kisi_kisi_json || '',
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
