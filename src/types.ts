export type Role = 'admin' | 'guru' | 'murid';

export interface User {
  nama: string;
  username: string;
  password?: string;
  role: Role;
  kelas: string;
}

export interface Materi {
  ID: string;
  Judul: string;
  Mapel: string;
  Kelas: string;
  Konten_Link: string;
  Gambar_URL?: string;
  Sumber?: string;
  Nama_Guru: string;
  CreatedAt?: string;
}

export type QuestionType = 'pg' | 'pgk_mcma' | 'pgk_kategori';

export interface QuestionPG {
  type: 'pg';
  bobot: number;
  soal: string;
  gambar?: string;
  a: string;
  a_img?: string;
  b: string;
  b_img?: string;
  c: string;
  c_img?: string;
  d: string;
  d_img?: string;
  e?: string;
  e_img?: string;
  kunci: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface McmaOption {
  text: string;
  img?: string;
  isKey: boolean;
}

export interface QuestionPGKMCMA {
  type: 'pgk_mcma';
  bobot: number;
  soal: string;
  gambar?: string;
  options: McmaOption[];
}

export interface KategoriRow {
  text: string;
  img?: string;
  key: 'col1' | 'col2';
}

export interface QuestionPGKKategori {
  type: 'pgk_kategori';
  bobot: number;
  soal: string;
  gambar?: string;
  col1: string; // e.g. "Benar" or "Sebelum"
  col2: string; // e.g. "Salah" or "Sesudah"
  rows: KategoriRow[];
}

export type Question = QuestionPG | QuestionPGKMCMA | QuestionPGKKategori;

export interface KisiKisiItem {
  no: number;
  elemen: string;
  subElemen: string;
  kompetensi: string;
  levelKognitif: 'L1' | 'L2' | 'L3';
  konteks: 'Personal' | 'Sosial Budaya' | 'Saintifik' | string;
  indikator: string;
  tipeSoal: string;
  nomorSoal: number;

  // Backward compatibility aliases
  cp_kd?: string;
  materi?: string;
  bentukSoal?: string;
  bobot?: number;
}

export interface ExamConfig {
  sesi: string;
  max_attempts: number;
  acak_soal: boolean;
  acak_opsi: boolean;
  token?: string;
  jadwal_mulai?: string;
  jadwal_selesai?: string;
}

export interface ExamPayload {
  config: ExamConfig;
  questions: Question[];
  kisi_kisi?: KisiKisiItem[];
}

export interface Ujian {
  ID: string;
  Judul_Ujian: string;
  Mapel: string;
  Kelas: string;
  Durasi_Menit: number;
  Soal_JSON: string; // stringified ExamPayload or Question[]
  Status: 'Aktif' | 'Non-Aktif';
  Token_Ujian?: string;
  Jadwal_Mulai?: string;
  Jadwal_Selesai?: string;
  Kisi_Kisi_JSON?: string;
}

export interface Nilai {
  ID: string;
  ID_Ujian: string;
  Judul_Ujian: string;
  Nama_Murid: string;
  Kelas: string;
  Nilai: number;
  Pelanggaran: number;
  Waktu_Submit: string;
  Catatan_Guru?: string;
  Koreksi_Manual?: boolean;
  No_HP_Ortu?: string;
}

export interface SchoolProfile {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  tahunAjaran: string;
  semester: string;
  kkmDefault: number;
  enableMFAAdmin: boolean;
  adminOTPSecret: string;
  sessionTimeoutMinutes: number;
}

export interface Announcement {
  id: string;
  judul: string;
  isi: string;
  tanggal: string;
  penulis: string;
  target: 'semua' | 'guru' | 'murid';
  kategori?: 'penting' | 'ujian' | 'libur' | 'info';
  pinned?: boolean;
  // File upload & link attachment support
  fileData?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  linkUrl?: string;
  linkTitle?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  user?: User;
}
