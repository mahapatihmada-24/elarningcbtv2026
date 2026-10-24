import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Clock,
  Award,
  CheckCircle,
  CheckCircle2,
  Play,
  RotateCcw,
  AlertCircle,
  Layers,
  Sparkles,
  Download,
  Printer,
  KeyRound,
  Calendar,
  X,
  AlertTriangle,
  BookOpen,
  Lightbulb,
  Lock,
  Search,
  Filter,
  FileQuestion,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Ujian, Nilai, User, SchoolProfile, Question, ExamResetPermission } from '../../types';
import { api } from '../../services/api';
import { STANDARD_JENIS_UJIAN } from '../GuruView/GuruCBT';
import { KisiKisiModal } from '../KisiKisiModal';
import { ExamReviewModal } from '../ExamReviewModal';
import { ExportExamModal } from '../ExportExamModal';
import { formatScore } from '../../utils/formatHelper';

interface MuridCBTListProps {
  currentUser: User;
  onStartExam: (exam: Ujian) => void;
}

export const MuridCBTList: React.FC<MuridCBTListProps> = ({ currentUser, onStartExam }) => {
  const [ujianList, setUjianList] = useState<Ujian[]>([]);
  const [hasilList, setHasilList] = useState<Nilai[]>([]);
  const [resetsList, setResetsList] = useState<ExamResetPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [filterKelas, setFilterKelas] = useState<string>(currentUser.kelas || 'Semua');

  // Filter & Search States (Seragam dengan tampilan Guru & Admin untuk kemudahan pengelompokan)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState('ALL');
  const [filterMapel, setFilterMapel] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Kisi-Kisi Modal
  const [kisiModalExam, setKisiModalExam] = useState<Ujian | null>(null);

  // Token Modal
  const [tokenModalExam, setTokenModalExam] = useState<Ujian | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');

  // Review & Export Modals
  const [reviewModalExam, setReviewModalExam] = useState<{ exam: Ujian; nilai?: Nilai | null } | null>(null);
  const [exportModalExam, setExportModalExam] = useState<Ujian | null>(null);
  const [lockedNotice, setLockedNotice] = useState<{
    title: string;
    message: string;
    total: number;
    answered: number;
  } | null>(null);

  const isAdmin = currentUser.role === 'admin';

  const fetchData = useCallback(async (silent?: boolean | unknown) => {
    if (silent !== true) setIsLoading(true);
    try {
      const activeClass = isAdmin ? filterKelas : (currentUser.kelas || '6A');
      const [uData, hData, sProfile, rData] = await Promise.all([
        api.getUjianList(activeClass, currentUser.role || 'murid'),
        api.getHasilMurid(currentUser.nama),
        api.getSchoolProfile().catch(() => null),
        api.getExamResets(currentUser.nama).catch(() => []),
      ]);
      setUjianList(uData || []);
      setHasilList(hData || []);
      if (sProfile) setSchoolProfile(sProfile);
      setResetsList(rData || []);
    } finally {
      if (silent !== true) setIsLoading(false);
    }
  }, [isAdmin, filterKelas, currentUser.kelas, currentUser.role, currentUser.nama]);

  useEffect(() => {
    fetchData(false);

    const handleSync = () => {
      fetchData(true);
    };

    const handleStorage = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key === 'cbt_nilai' ||
        e.key === 'cbt_nilai_sync_event' ||
        e.key === 'cbt_db_exam_resets' ||
        e.key === 'cbt_resets_sync_event'
      ) {
        fetchData(true);
      }
    };

    window.addEventListener('cbt-nilai-updated', handleSync);
    window.addEventListener('cbt-resets-updated', handleSync);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener('cbt-nilai-updated', handleSync);
      window.removeEventListener('cbt-resets-updated', handleSync);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleSync);
    };
  }, [fetchData]);

  // Helper pemformat tanggal seragam dengan GuruCBT
  const formatExamDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return dateStr;
    }
  };

  // Helper kode singkat paket ujian seragam dengan GuruCBT
  const getExamCode = (u: Ujian) => {
    if (u.ID && u.ID.startsWith('EX-')) {
      return u.ID.substring(3, 10).toUpperCase();
    }
    const words = (u.Judul_Ujian || u.Mapel || 'CBT').split(/\s+/);
    if (words.length >= 2) {
      return (words[0].substring(0, 3) + '-' + words[1].substring(0, 3)).toUpperCase();
    }
    return (u.Mapel || 'CBT').substring(0, 6).toUpperCase();
  };

  // Daftar mapel unik dari paket ujian yang tersedia untuk dropdown filter
  const availableMapelList = useMemo(() => {
    const set = new Set<string>();
    ujianList.forEach((u) => {
      if (u.Mapel && u.Mapel.trim()) set.add(u.Mapel.trim());
    });
    return Array.from(set).sort();
  }, [ujianList]);

  // Penyaringan & Pengelompokan Paket Ujian untuk Siswa
  const filteredUjianList = useMemo(() => {
    return ujianList.filter((u) => {
      let sesiTarget = 'Semua';
      let maxAttempts = 1;
      let examJenis = u.Jenis_Ujian || '';

      try {
        const raw = JSON.parse(u.Soal_JSON || '{}');
        if (raw.config) {
          if (raw.config.sesi) sesiTarget = raw.config.sesi;
          if (raw.config.max_attempts !== undefined) maxAttempts = raw.config.max_attempts;
          if (raw.config.jenis && !examJenis) examJenis = raw.config.jenis;
        }
      } catch {}

      // 1. Pengecekan Sesi Kelas
      const matchesSession =
        !sesiTarget ||
        sesiTarget === 'Semua' ||
        (currentUser?.kelas || '').toLowerCase().includes(String(sesiTarget || '').toLowerCase());

      if (!matchesSession) return false;

      // 2. Pencarian Teks Bebas (judul, mapel, jenis, kelas, token)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (u.Judul_Ujian || '').toLowerCase().includes(q);
        const matchMapel = (u.Mapel || '').toLowerCase().includes(q);
        const matchJenis = examJenis.toLowerCase().includes(q);
        const matchKelas = (u.Kelas || '').toLowerCase().includes(q);
        const matchToken = (u.Token_Ujian || '').toLowerCase().includes(q);
        if (!matchTitle && !matchMapel && !matchJenis && !matchKelas && !matchToken) {
          return false;
        }
      }

      // 3. Filter Jenis Ujian
      if (filterJenis !== 'ALL') {
        const j = (examJenis || 'Penilaian Harian').toLowerCase();
        if (j !== filterJenis.toLowerCase()) return false;
      }

      // 4. Filter Mata Pelajaran
      if (filterMapel !== 'ALL') {
        if ((u.Mapel || '').toLowerCase() !== filterMapel.toLowerCase()) return false;
      }

      // 5. Filter Status Pengerjaan Siswa
      if (filterStatus !== 'ALL') {
        const studentSubmissions = hasilList.filter((h) => h.ID_Ujian === u.ID);
        const attemptsCount = studentSubmissions.length;
        const activeReset = resetsList.find(
          (r) =>
            r.idUjian === u.ID &&
            r.status === 'granted' &&
            r.namaMurid?.trim().toLowerCase() === (currentUser.nama || '').trim().toLowerCase()
        );
        const hasResetPermission = Boolean(activeReset);
        const isCompleted = !hasResetPermission && maxAttempts > 0 && attemptsCount >= maxAttempts;

        if (filterStatus === 'Selesai' && !isCompleted) return false;
        if (filterStatus === 'Belum' && isCompleted) return false;
        if (filterStatus === 'Reset' && !hasResetPermission) return false;
      }

      return true;
    });
  }, [ujianList, hasilList, resetsList, currentUser, searchQuery, filterJenis, filterMapel, filterStatus]);

  const handleInitiateExam = (u: Ujian) => {
    const now = new Date();
    if (!isAdmin && u.Jadwal_Mulai) {
      const start = new Date(u.Jadwal_Mulai);
      if (now < start) {
        alert(
          `Ujian ini belum dimulai. Waktu mulai: ${start.toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}`
        );
        return;
      }
    }

    if (!isAdmin && u.Jadwal_Selesai) {
      const end = new Date(u.Jadwal_Selesai);
      if (now > end) {
        alert(
          `Ujian ini telah berakhir pada: ${end.toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}`
        );
        return;
      }
    }

    // Pengecekan token
    if (u.Token_Ujian && u.Token_Ujian.trim() !== '') {
      setTokenModalExam(u);
      setTokenInput(isAdmin ? (u.Token_Ujian || '') : '');
      setTokenError('');
      return;
    }

    onStartExam(u);
  };

  const handleVerifyTokenAndStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenModalExam) return;

    const required = (tokenModalExam.Token_Ujian || '').trim().toUpperCase();
    const entered = tokenInput.trim().toUpperCase();

    if (!isAdmin && entered !== required) {
      setTokenError('Token Ujian tidak sesuai. Silakan hubungi Guru / Pengawas.');
      return;
    }

    const exam = tokenModalExam;
    setTokenModalExam(null);
    setTokenInput('');
    setTokenError('');
    onStartExam(exam);
  };

  return (
    <div className="space-y-4">
      {/* Bar Filter & Pencarian (Seragam dengan Tampilan Guru & Admin untuk Memudahkan Pengelompokan) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Kolom Pencarian */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mata pelajaran, judul ujian, jenis, token..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Filter Jenis Asesmen / Ujian */}
            <div className="relative">
              <select
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value)}
                className="py-2 pl-3 pr-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Jenis Ujian</option>
                {STANDARD_JENIS_UJIAN.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Mata Pelajaran */}
            <div className="relative">
              <select
                value={filterMapel}
                onChange={(e) => setFilterMapel(e.target.value)}
                className="py-2 pl-3 pr-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Mapel</option>
                {availableMapelList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status Pengerjaan */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="py-2 pl-3 pr-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="Belum">Belum / Siap Dikerjakan</option>
                <option value="Selesai">Sudah Selesai</option>
                <option value="Reset">Izin Ulang Diberikan</option>
              </select>
            </div>

            {/* Dropdown Pilihan Kelas jika dibuka oleh Akun Admin */}
            {isAdmin && (
              <div className="relative">
                <select
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  className="py-2 pl-3 pr-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="Semua">Semua Kelas</option>
                  <option value="1A">Kelas 1A</option>
                  <option value="1B">Kelas 1B</option>
                  <option value="2A">Kelas 2A</option>
                  <option value="2B">Kelas 2B</option>
                  <option value="3A">Kelas 3A</option>
                  <option value="3B">Kelas 3B</option>
                  <option value="4A">Kelas 4A</option>
                  <option value="4B">Kelas 4B</option>
                  <option value="5A">Kelas 5A</option>
                  <option value="5B">Kelas 5B</option>
                  <option value="6A">Kelas 6A</option>
                  <option value="6B">Kelas 6B</option>
                </select>
              </div>
            )}

            {/* Tombol Reset Filter */}
            {(searchQuery || filterJenis !== 'ALL' || filterMapel !== 'ALL' || filterStatus !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterJenis('ALL');
                  setFilterMapel('ALL');
                  setFilterStatus('ALL');
                }}
                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition whitespace-nowrap cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Counter Info & Tombol Perbarui */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500">
          <span className="font-medium">
            Menampilkan <strong className="text-slate-800">{filteredUjianList.length}</strong> dari{' '}
            <strong className="text-slate-800">{ujianList.length}</strong> paket
          </span>
          <button
            type="button"
            onClick={() => fetchData(false)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Perbarui
          </button>
        </div>
      </div>

      {/* Grid Card Ujian Berformat Kartu Persis Seperti di Role Guru & Admin */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
          <span>Memuat katalog dan daftar ujian CBT...</span>
        </div>
      ) : filteredUjianList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileQuestion className="w-6 h-6" />
          </div>
          <p className="font-semibold text-sm">
            {searchQuery || filterJenis !== 'ALL' || filterMapel !== 'ALL' || filterStatus !== 'ALL'
              ? 'Tidak ada paket ujian yang cocok dengan filter pencarian.'
              : 'Belum ada paket ujian CBT aktif untuk kelas Anda saat ini.'}
          </p>
          {(searchQuery || filterJenis !== 'ALL' || filterMapel !== 'ALL' || filterStatus !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterJenis('ALL');
                setFilterMapel('ALL');
                setFilterStatus('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              Reset Filter Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredUjianList.map((u) => {
            let questionCount = 0;
            let maxAttempts = 1;
            let examMulai = u.Jadwal_Mulai || u.Waktu_Mulai || '';
            let examSelesai = u.Jadwal_Selesai || u.Waktu_Selesai || '';
            let isAcakSoal = u.Acak_Soal ?? true;
            let isAcakOpsi = u.Acak_Opsi ?? true;
            let isTampilNilai = u.Tampilkan_Nilai ?? true;
            let examJenis = u.Jenis_Ujian || '';

            try {
              const raw = JSON.parse(u.Soal_JSON || '{}');
              if (raw.config) {
                if (raw.config.jadwal_mulai) examMulai = raw.config.jadwal_mulai;
                if (raw.config.jadwal_selesai) examSelesai = raw.config.jadwal_selesai;
                if (raw.config.acak_soal !== undefined) isAcakSoal = raw.config.acak_soal;
                if (raw.config.acak_opsi !== undefined) isAcakOpsi = raw.config.acak_opsi;
                if (raw.config.tampilkan_nilai !== undefined) isTampilNilai = raw.config.tampilkan_nilai;
                if (raw.config.jenis && !examJenis) examJenis = raw.config.jenis;
                if (raw.config.max_attempts !== undefined) maxAttempts = raw.config.max_attempts;
              }
              if (raw.questions) {
                questionCount = raw.questions.length;
              } else if (Array.isArray(raw)) {
                questionCount = raw.length;
              }
            } catch {}

            // Kalkulasi pengerjaan siswa
            const studentSubmissions = hasilList.filter((h) => h.ID_Ujian === u.ID);
            const attemptsCount = studentSubmissions.length;

            // Periksa izin pengerjaan ulang yang diberikan guru/admin
            const activeReset = resetsList.find(
              (r) =>
                r.idUjian === u.ID &&
                r.status === 'granted' &&
                r.namaMurid?.trim().toLowerCase() === (currentUser.nama || '').trim().toLowerCase()
            );
            const hasResetPermission = Boolean(activeReset);

            const isCompletedAndLocked = !hasResetPermission && maxAttempts > 0 && attemptsCount >= maxAttempts;
            const latestSubmission =
              studentSubmissions.length > 0
                ? studentSubmissions[studentSubmissions.length - 1]
                : null;
            const latestScore = latestSubmission
              ? latestSubmission.Nilai
              : activeReset?.nilaiSebelumnya !== undefined
              ? activeReset.nilaiSebelumnya
              : null;

            // Pengecekan jadwal pelaksanaan
            const now = new Date();
            const isUpcoming = examMulai ? now < new Date(examMulai) : false;
            const isExpired = examSelesai ? now > new Date(examSelesai) : false;
            const isAktif = u.Status === 'Aktif' && !isExpired && !isUpcoming;

            return (
              <div
                key={u.ID}
                className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:border-slate-300"
              >
                {/* Header Kartu Dinamis: Sama seperti role Guru & Admin */}
                <div
                  className={`p-4 text-white relative transition-colors ${
                    hasResetPermission
                      ? 'bg-[#d97706]' // Amber jika ada izin reset
                      : isCompletedAndLocked
                      ? 'bg-[#2563eb]' // Biru jika sudah tuntas
                      : isExpired
                      ? 'bg-[#c0392b]' // Merah jika jadwal berakhir
                      : isUpcoming
                      ? 'bg-[#546e7a]' // Abu-abu jika belum mulai
                      : isAktif
                      ? 'bg-[#1e824c]' // Hijau terang standar CBT aktif
                      : 'bg-[#546e7a]'
                  }`}
                >
                  <BookOpen className="w-10 h-10 text-white/30 absolute top-3.5 right-3.5 pointer-events-none" />
                  <div className="pr-10 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xl font-black tracking-wide leading-tight uppercase drop-shadow-xs">
                        {getExamCode(u)}
                      </h4>
                      {hasResetPermission && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-amber-900 shadow-xs animate-pulse">
                          IZIN RESET
                        </span>
                      )}
                      {isCompletedAndLocked && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-blue-900 shadow-xs">
                          SELESAI
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs font-semibold text-white/95 line-clamp-1 tracking-wide drop-shadow-xs"
                      title={u.Judul_Ujian}
                    >
                      {u.Judul_Ujian.toUpperCase()}
                    </p>
                    <p className="text-[11px] font-medium text-white/90 pt-1 line-clamp-1">
                      Kelas: {u.Kelas || 'Semua Kelas'} • {u.Mapel}
                    </p>
                  </div>
                </div>

                {/* Tengah Kartu: 11 Baris Informasi dengan Pola Zebra Stripes Persis Role Guru/Admin */}
                <div className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  {/* Baris 1: Jenis */}
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#f8f9fa]">
                    <span className="text-slate-500">Jenis</span>
                    <span className="font-bold text-slate-800" title={examJenis || 'Penilaian Harian'}>
                      {examJenis || 'Penilaian Harian'}
                    </span>
                  </div>

                  {/* Baris 2: Mulai */}
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-white">
                    <span className="text-slate-500">Mulai</span>
                    <span className="font-mono text-[11px] text-slate-700">
                      {formatExamDate(examMulai)}
                    </span>
                  </div>

                  {/* Baris 3: Sampai */}
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#f8f9fa]">
                    <span className="text-slate-500">Sampai</span>
                    <span className="font-mono text-[11px] text-slate-700">
                      {formatExamDate(examSelesai)}
                    </span>
                  </div>

                  {/* Baris 4: Durasi */}
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-white">
                    <span className="text-slate-500">Durasi</span>
                    <span className="font-bold text-slate-800">{u.Durasi_Menit || 0} menit</span>
                  </div>

                  {/* Baris 5: Acak Soal */}
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#f8f9fa]">
                    <span className="text-slate-500">Acak Soal</span>
                    <span className="font-bold text-slate-800">{isAcakSoal ? 'Ya' : 'Tidak'}</span>
                  </div>

                  {/* Baris 6: Acak Jawaban */}
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-white">
                    <span className="text-slate-500">Acak Jawaban</span>
                    <span className="font-bold text-slate-800">{isAcakOpsi ? 'Ya' : 'Tidak'}</span>
                  </div>

                  {/* Baris 7: Hasil Tampil */}
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#f8f9fa]">
                    <span className="text-slate-500">Hasil Tampil</span>
                    <span className="font-bold text-slate-800">
                      {isTampilNilai ? 'Ya' : 'Tidak'}
                    </span>
                  </div>

                  {/* Baris 8: Gunakan Token */}
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-white">
                    <span className="text-slate-500">Gunakan Token</span>
                    <span className="font-bold text-slate-800">
                      {u.Token_Ujian ? `Ya (${isAdmin ? u.Token_Ujian : 'Diperlukan'})` : 'Tidak'}
                    </span>
                  </div>

                  {/* Baris 9: Jumlah Soal */}
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#f8f9fa]">
                    <span className="text-slate-500">Jumlah Soal</span>
                    <span className="font-bold text-slate-800">{questionCount} Butir Soal</span>
                  </div>

                  {/* Baris 10: Status */}
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-white">
                    <span className="text-slate-500">Status</span>
                    <span
                      className={`font-black ${
                        hasResetPermission
                          ? 'text-amber-700'
                          : isCompletedAndLocked
                          ? 'text-blue-700'
                          : isExpired
                          ? 'text-rose-600'
                          : isUpcoming
                          ? 'text-slate-500'
                          : 'text-[#1e824c]'
                      }`}
                    >
                      {hasResetPermission
                        ? 'Izin Ulang Diberikan'
                        : isCompletedAndLocked
                        ? 'Selesai Dikerjakan'
                        : isExpired
                        ? 'Jadwal Ditutup'
                        : isUpcoming
                        ? 'Belum Dimulai'
                        : 'Siap Dikerjakan'}
                    </span>
                  </div>

                  {/* Baris 11: Percobaan & Nilai */}
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#f8f9fa]">
                    <span className="text-slate-500">Nilai & Sesi</span>
                    <span className="font-black text-slate-800 flex items-center gap-1.5">
                      {latestScore !== null ? (
                        <>
                          <span className={Number(latestScore) >= 75 ? 'text-emerald-700' : 'text-rose-600'}>
                            {formatScore(latestScore)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            ({attemptsCount}/{maxAttempts === 0 ? '∞' : `${maxAttempts}x`})
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-500 font-medium">
                          Belum Ada ({attemptsCount}/{maxAttempts === 0 ? '∞' : `${maxAttempts}x`})
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Strip Aksi Cepat Tambahan: Status, Kisi-kisi, Cetak Naskah, Review Pembahasan */}
                <div className="px-3 py-2 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 ${
                      hasResetPermission
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : isCompletedAndLocked
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : isExpired
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : isUpcoming
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {hasResetPermission ? (
                      <>
                        <RotateCcw className="w-3 h-3 text-amber-700" />
                        <span>Izin Ulang</span>
                      </>
                    ) : isCompletedAndLocked ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-blue-700" />
                        <span>Tuntas</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Aktif</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setKisiModalExam(u)}
                      className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition cursor-pointer"
                      title="Lihat Kisi-Kisi Soal & Panduan Belajar"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportModalExam(u)}
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                      title="Cetak & Unduh Naskah Soal (.doc & PDF)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    {attemptsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isTampilNilai) {
                            alert('Guru mengatur hasil nilai dan kunci jawaban tidak ditampilkan sementara.');
                            return;
                          }
                          setReviewModalExam({ exam: u, nilai: latestSubmission });
                        }}
                        className="p-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition cursor-pointer"
                        title="Review Pembahasan & Kunci Soal"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bagian Bawah Kartu: Tombol Aksi Utama Pengerjaan Ujian */}
                <div className="p-2.5 bg-slate-100/70 border-t border-slate-200">
                  {hasResetPermission ? (
                    <button
                      type="button"
                      onClick={() => handleInitiateExam(u)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                      title="Mulai Ujian Ulang Berdasarkan Izin Guru/Admin"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-white" />
                      <span>Mulai Pengerjaan Ulang</span>
                    </button>
                  ) : isCompletedAndLocked ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <div className="flex-1 py-2 px-2.5 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Selesai ({attemptsCount}x)</span>
                      </div>
                      {isTampilNilai && (
                        <button
                          type="button"
                          onClick={() => setReviewModalExam({ exam: u, nilai: latestSubmission })}
                          className="py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition cursor-pointer shrink-0"
                          title="Lihat Kunci & Pembahasan Soal"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-white" />
                          <span>Review</span>
                        </button>
                      )}
                    </div>
                  ) : isUpcoming ? (
                    <button
                      type="button"
                      disabled
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-slate-200 text-slate-500 font-bold text-xs cursor-not-allowed"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Belum Waktunya Ujian</span>
                    </button>
                  ) : isExpired ? (
                    <button
                      type="button"
                      disabled
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs cursor-not-allowed"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Jadwal Ujian Telah Ditutup</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleInitiateExam(u)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white text-white" />
                      <span>
                        {attemptsCount > 0
                          ? `Ulangi Ujian (${attemptsCount + 1}/${maxAttempts === 0 ? '∞' : maxAttempts})`
                          : 'Mulai Kerjakan Ujian'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TOKEN VERIFICATION MODAL */}
      {tokenModalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h4 className="font-black text-slate-800 text-base">Masukkan Token Ujian</h4>
              </div>
              <button
                onClick={() => setTokenModalExam(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Ujian <strong>"{tokenModalExam.Judul_Ujian}"</strong> dilindungi dengan kode token.
              Silakan minta token kepada Guru / Pengawas di kelas.
            </p>

            <form onSubmit={handleVerifyTokenAndStart} className="space-y-3">
              <div>
                <input
                  type="text"
                  maxLength={10}
                  autoFocus
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value.toUpperCase());
                    setTokenError('');
                  }}
                  placeholder="Ketik Token (misal: ABC123)"
                  className="w-full text-center text-lg font-mono tracking-widest uppercase font-black p-3 rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {tokenError && (
                  <p className="text-xs text-rose-600 font-bold mt-1.5 text-center">{tokenError}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTokenModalExam(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  Verifikasi & Mulai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KISI-KISI MODAL FOR STUDENTS (READ-ONLY) */}
      {kisiModalExam && (
        <KisiKisiModal
          isOpen={!!kisiModalExam}
          onClose={() => setKisiModalExam(null)}
          ujian={kisiModalExam}
          schoolProfile={schoolProfile}
          readOnly={true}
        />
      )}

      {/* REVIEW HASIL & PEMBAHASAN MODAL */}
      {reviewModalExam && (
        <ExamReviewModal
          isOpen={Boolean(reviewModalExam)}
          onClose={() => setReviewModalExam(null)}
          ujian={reviewModalExam.exam}
          nilai={reviewModalExam.nilai}
          userRole="murid"
          isTeacher={false}
        />
      )}

      {/* EXPORT / CETAK EXAM MODAL: Terkunci khusus naskah soal siswa saja */}
      {exportModalExam && (
        <ExportExamModal
          isOpen={Boolean(exportModalExam)}
          onClose={() => setExportModalExam(null)}
          ujian={exportModalExam}
          userRole="murid"
          isStudent={true}
        />
      )}

      {/* MODAL PERINGATAN REVIEW TERKUNCI KARENA BELUM SEMUA SOAL TERJAWAB */}
      {lockedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-black text-slate-800 text-base">{lockedNotice.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed text-left">{lockedNotice.message}</p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-bold text-left">
                Pengerjaan: {lockedNotice.answered} dari {lockedNotice.total} Butir Soal ({lockedNotice.total - lockedNotice.answered} belum dijawab)
              </div>
            </div>
            <button
              onClick={() => setLockedNotice(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm active:scale-98"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
