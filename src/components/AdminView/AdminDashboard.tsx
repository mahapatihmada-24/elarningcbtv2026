import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  Award,
  BookOpen,
  Settings,
  Bell,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Database,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { User, Ujian, Nilai, Materi, Announcement, SchoolProfile } from '../../types';
import { api, getDataSource } from '../../services/api';

interface AdminDashboardProps {
  currentUser: User;
  onNavigateTab: (tab: string) => void;
  onShowModal: (modal: {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
    isConfirm?: boolean;
    onConfirm?: () => void;
  }) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onNavigateTab,
  onShowModal,
}) => {
  const [stats, setStats] = useState({
    totalMurid: 0,
    totalGuru: 0,
    totalUjian: 0,
    totalMateri: 0,
    totalNilai: 0,
    avgNilai: 0,
    activeUjian: 0,
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New announcement form state
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTarget, setNewTarget] = useState<'semua' | 'guru' | 'murid'>('semua');
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [users, ujianList, materiList, nilaiList, annList, profile] = await Promise.all([
        api.getUsers(),
        api.getUjianList('ALL', 'guru'),
        api.getMateriList('ALL'),
        api.getNilaiList(),
        api.getAnnouncements(),
        api.getSchoolProfile(),
      ]);

      const muridCount = (users || []).filter((u) => u.role === 'murid').length;
      const guruCount = (users || []).filter((u) => u.role === 'guru').length;
      const activeUj = (ujianList || []).filter((u) => u.Status === 'Aktif').length;

      let totalScore = 0;
      (nilaiList || []).forEach((n) => {
        totalScore += Number(n.Nilai || 0);
      });
      const avg = nilaiList && nilaiList.length > 0 ? totalScore / nilaiList.length : 0;

      setStats({
        totalMurid: muridCount,
        totalGuru: guruCount,
        totalUjian: (ujianList || []).length,
        totalMateri: (materiList || []).length,
        totalNilai: (nilaiList || []).length,
        avgNilai: avg,
        activeUjian: activeUj,
      });

      setAnnouncements(annList || []);
      setSchoolProfile(profile);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(false);

    // Sinkronisasi otomatis real-time saat siswa menyelesaikan ujian
    const handleSync = () => {
      fetchDashboardData(true);
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'cbt_nilai' || e.key === 'cbt_nilai_sync_event') {
        fetchDashboardData(true);
      }
    };

    window.addEventListener('cbt-nilai-updated', handleSync);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleSync);

    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 5000);

    return () => {
      window.removeEventListener('cbt-nilai-updated', handleSync);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleSync);
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      onShowModal({
        isOpen: true,
        title: 'Form Belum Lengkap',
        message: 'Mohon isi judul dan teks isi pengumuman terlebih dahulu.',
        type: 'warning',
      });
      return;
    }

    setIsSavingAnnouncement(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.saveAnnouncement({
        id: 'PENG-' + Date.now(),
        judul: newTitle.trim(),
        isi: newContent.trim(),
        tanggal: today,
        penulis: currentUser.nama || 'Administrator',
        target: newTarget,
      });

      setNewTitle('');
      setNewContent('');
      setIsAddAnnouncementOpen(false);
      const updated = await api.getAnnouncements();
      setAnnouncements(updated);

      onShowModal({
        isOpen: true,
        title: 'Pengumuman Diterbitkan',
        message: 'Pengumuman sekolah berhasil dipublikasikan!',
        type: 'success',
      });
    } catch {
      onShowModal({
        isOpen: true,
        title: 'Gagal Menyimpan',
        message: 'Terjadi kendala saat menyimpan pengumuman.',
        type: 'danger',
      });
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = (id: string, judul: string) => {
    onShowModal({
      isOpen: true,
      title: 'Hapus Pengumuman',
      message: `Yakin ingin menghapus pengumuman "${judul}"?`,
      type: 'warning',
      isConfirm: true,
      onConfirm: async () => {
        await api.deleteAnnouncement(id);
        const updated = await api.getAnnouncements();
        setAnnouncements(updated);
      },
    });
  };

  const currentDs = getDataSource();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Administrator Utama
              </span>
              <span className="text-xs text-indigo-200">
                DB: <strong>{currentDs}</strong>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {schoolProfile?.namaSekolah || 'SD Negeri Harjosari Kidul 01'}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl leading-relaxed">
              Selamat datang kembali, <strong>{currentUser.nama}</strong>! Panel kontrol terpusat
              untuk mengelola akun guru & murid, master kelas, bank soal CBT, rekapitulasi nilai,
              serta identitas sekolah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('murid_cbt')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold border border-white/20 transition flex items-center gap-2"
              title="Coba tampilan aplikasi sebagai Murid"
            >
              <Eye className="w-4 h-4" />
              <span>Simulasi Mode Siswa</span>
            </button>
            <button
              onClick={() => onNavigateTab('admin_settings')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-bold shadow-md transition flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>Pengaturan Sekolah</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Murid */}
        <div
          onClick={() => onNavigateTab('admin-users')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Total Murid</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{isLoading ? '...' : stats.totalMurid}</div>
          <p className="text-[11px] text-slate-400 mt-1">Siswa Terdaftar</p>
        </div>

        {/* Total Guru */}
        <div
          onClick={() => onNavigateTab('admin-users')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Total Guru</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{isLoading ? '...' : stats.totalGuru}</div>
          <p className="text-[11px] text-slate-400 mt-1">Tenaga Pendidik</p>
        </div>

        {/* Bank Soal */}
        <div
          onClick={() => onNavigateTab('guru-cbt')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Paket Ujian</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{isLoading ? '...' : stats.totalUjian}</div>
          <p className="text-[11px] text-purple-600 font-semibold mt-1">
            {stats.activeUjian} Ujian Aktif
          </p>
        </div>

        {/* Materi */}
        <div
          onClick={() => onNavigateTab('guru-materi')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Bahan Materi</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{isLoading ? '...' : stats.totalMateri}</div>
          <p className="text-[11px] text-slate-400 mt-1">Modul Pembelajaran</p>
        </div>

        {/* Hasil Ujian */}
        <div
          onClick={() => onNavigateTab('guru-nilai')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Hasil Submit</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{isLoading ? '...' : stats.totalNilai}</div>
          <p className="text-[11px] text-slate-400 mt-1">Lembar Jawaban</p>
        </div>

        {/* Nilai Rata-rata */}
        <div
          onClick={() => onNavigateTab('guru-nilai')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Rerata Nilai</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700">
            {isLoading ? '...' : stats.avgNilai.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">KKM: {schoolProfile?.kkmDefault || 75}</p>
        </div>
      </div>

      {/* Quick Access Navigation */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
          <span>Pintasan Cepat Seluruh Menu (Akses Penuh Admin)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigateTab('admin_users')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600">
                  Manajemen Pengguna
                </h4>
                <p className="text-xs text-slate-500">Tambah, edit, reset sandi, import Excel</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
          </button>

          <button
            onClick={() => onNavigateTab('admin_master')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600">
                  Master Kelas & Mapel
                </h4>
                <p className="text-xs text-slate-500">Kelola rombel & daftar mata pelajaran</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
          </button>

          <button
            onClick={() => onNavigateTab('guru_cbt')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600">
                  Bank Soal & CBT
                </h4>
                <p className="text-xs text-slate-500">Jadwal, token, edit per soal, ekspor/impor Excel</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
          </button>

          <button
            onClick={() => onNavigateTab('guru_nilai')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600">
                  Rekap Nilai & Koreksi
                </h4>
                <p className="text-xs text-slate-500">Filter bank soal, koreksi, WA wali murid</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
          </button>
        </div>
      </div>

      {/* Announcements & Notifications Section */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800">
                Papan Pengumuman & Notifikasi Sekolah
              </h3>
              <p className="text-xs text-slate-500">
                Pesan ini tampil di beranda guru dan siswa untuk informasi jadwal ujian atau libur
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddAnnouncementOpen(!isAddAnnouncementOpen)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddAnnouncementOpen ? 'Tutup Form' : 'Tambah Pengumuman'}</span>
          </button>
        </div>

        {/* Add Announcement Modal/Form */}
        {isAddAnnouncementOpen && (
          <form
            onSubmit={handleCreateAnnouncement}
            className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3"
          >
            <h4 className="text-xs font-extrabold text-indigo-900">Buat Pengumuman Baru</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Judul Pengumuman <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Jadwal Penilaian Tengah Semester (PTS) Genap 2025"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Pembaca</label>
                <select
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value as 'semua' | 'guru' | 'murid')}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-indigo-600"
                >
                  <option value="semua">Semua (Guru & Murid)</option>
                  <option value="guru">Khusus Guru Saja</option>
                  <option value="murid">Khusus Murid Saja</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Isi Pengumuman <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
                placeholder="Tuliskan detail informasi, petunjuk pelaksanaan, atau batas waktu..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-indigo-600"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddAnnouncementOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSavingAnnouncement}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {isSavingAnnouncement ? 'Menyimpan...' : 'Publikasikan'}
              </button>
            </div>
          </form>
        )}

        {/* Announcements List */}
        {announcements.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Belum ada pengumuman aktif. Klik "Tambah Pengumuman" di atas untuk membuat pengumuman
            baru.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-slate-300 transition"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{item.judul}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.target === 'semua'
                          ? 'bg-blue-100 text-blue-700'
                          : item.target === 'guru'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      Target: {item.target.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.tanggal} • Oleh: {item.penulis}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {item.isi}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteAnnouncement(item.id, item.judul)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition self-end sm:self-center"
                  title="Hapus Pengumuman"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
