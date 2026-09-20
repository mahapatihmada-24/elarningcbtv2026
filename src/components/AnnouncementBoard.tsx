import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  Edit2,
  Pin,
  Search,
  Filter,
  AlertCircle,
  Calendar,
  BookOpen,
  Info,
  CheckCircle2,
  X,
  Megaphone,
  UserCheck,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Announcement, User } from '../types';
import { api } from '../services/api';
import { ModalState } from './ConfirmModal';

interface AnnouncementBoardProps {
  currentUser: User;
  onShowModal?: (modal: Partial<ModalState>) => void;
  compact?: boolean; // For display on student/teacher dashboards
  onViewAll?: () => void;
}

export const AnnouncementBoard: React.FC<AnnouncementBoardProps> = ({
  currentUser,
  onShowModal,
  compact = false,
  onViewAll,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'semua' | 'penting' | 'ujian' | 'guru' | 'murid'>('semua');

  // Admin form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTarget, setFormTarget] = useState<'semua' | 'guru' | 'murid'>('semua');
  const [formCategory, setFormCategory] = useState<'penting' | 'ujian' | 'libur' | 'info'>('info');
  const [formPinned, setFormPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAnnouncements();
      setAnnouncements(data || []);
    } catch (err) {
      console.warn('Failed to load announcements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const isAdmin = currentUser.role === 'admin';

  // Filter announcements for the current user's role:
  // - Admin sees everything
  // - Guru sees target 'semua' and 'guru'
  // - Murid sees target 'semua' and 'murid'
  const visibleAnnouncements = announcements.filter((item) => {
    if (isAdmin) return true;
    if (currentUser.role === 'guru') {
      return item.target === 'semua' || item.target === 'guru';
    }
    if (currentUser.role === 'murid') {
      return item.target === 'semua' || item.target === 'murid';
    }
    return true;
  });

  const filteredAnnouncements = visibleAnnouncements.filter((item) => {
    // Search
    const q = search.toLowerCase();
    const matchesSearch =
      item.judul.toLowerCase().includes(q) ||
      item.isi.toLowerCase().includes(q) ||
      (item.penulis && item.penulis.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // Filter tab
    if (activeFilter === 'penting') return item.kategori === 'penting';
    if (activeFilter === 'ujian') return item.kategori === 'ujian';
    if (activeFilter === 'guru') return item.target === 'guru';
    if (activeFilter === 'murid') return item.target === 'murid';

    return true;
  });

  // Sort pinned first, then by date descending
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.tanggal || '').localeCompare(a.tanggal || '');
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormTarget('semua');
    setFormCategory('info');
    setFormPinned(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: Announcement) => {
    setEditingId(item.id);
    setFormTitle(item.judul);
    setFormContent(item.isi);
    setFormTarget(item.target || 'semua');
    setFormCategory(item.kategori || 'info');
    setFormPinned(!!item.pinned);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      if (onShowModal) {
        onShowModal({
          isOpen: true,
          title: 'Form Belum Lengkap',
          message: 'Mohon lengkapi judul dan isi pengumuman terlebih dahulu.',
          type: 'warning',
        });
      }
      return;
    }

    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload: Announcement = {
        id: editingId || 'PENG-' + Date.now(),
        judul: formTitle.trim(),
        isi: formContent.trim(),
        tanggal: today,
        penulis: currentUser.nama || 'Administrator',
        target: formTarget,
        kategori: formCategory,
        pinned: formPinned,
      };

      await api.saveAnnouncement(payload);
      await fetchAnnouncements();
      setIsFormOpen(false);

      if (onShowModal) {
        onShowModal({
          isOpen: true,
          title: editingId ? 'Pengumuman Diperbarui' : 'Pengumuman Diterbitkan',
          message: `Pengumuman "${payload.judul}" berhasil disimpan ke sistem!`,
          type: 'success',
        });
      }
    } catch {
      if (onShowModal) {
        onShowModal({
          isOpen: true,
          title: 'Gagal Menyimpan',
          message: 'Terjadi kendala saat menyimpan pengumuman. Silakan coba lagi.',
          type: 'danger',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, judul: string) => {
    if (!onShowModal) return;
    onShowModal({
      isOpen: true,
      title: 'Hapus Pengumuman',
      message: `Yakin ingin menghapus pengumuman "${judul}"? Tindakan ini tidak dapat dibatalkan.`,
      type: 'warning',
      isConfirm: true,
      onConfirm: async () => {
        try {
          await api.deleteAnnouncement(id);
          await fetchAnnouncements();
          onShowModal({
            isOpen: true,
            title: 'Pengumuman Dihapus',
            message: 'Pengumuman berhasil dihapus dari sistem.',
            type: 'info',
          });
        } catch {
          onShowModal({
            isOpen: true,
            title: 'Gagal Menghapus',
            message: 'Terjadi kesalahan saat menghapus pengumuman.',
            type: 'danger',
          });
        }
      },
    });
  };

  const getCategoryBadge = (kategori?: string) => {
    switch (kategori) {
      case 'penting':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Penting
          </span>
        );
      case 'ujian':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
            <BookOpen className="w-3 h-3 text-indigo-600" /> Ujian CBT
          </span>
        );
      case 'libur':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <Calendar className="w-3 h-3 text-emerald-600" /> Libur / Agenda
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 border border-sky-200">
            <Info className="w-3 h-3 text-sky-600" /> Informasi
          </span>
        );
    }
  };

  const getTargetBadge = (target: string) => {
    switch (target) {
      case 'guru':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
            <UserCheck className="w-3 h-3" /> Khusus Guru
          </span>
        );
      case 'murid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
            <GraduationCap className="w-3 h-3" /> Khusus Siswa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Semua Warga Sekolah
          </span>
        );
    }
  };

  // If in compact view (e.g. for student dashboard widget)
  if (compact) {
    const topThree = sortedAnnouncements.slice(0, 3);
    return (
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-800">
                Papan Pengumuman Sekolah
              </h4>
              <p className="text-[11px] text-slate-500">Pemberitahuan & agenda asesmen terkini</p>
            </div>
          </div>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              Lihat Semua →
            </button>
          )}
        </div>

        {topThree.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            Belum ada pengumuman terbaru saat ini.
          </p>
        ) : (
          <div className="space-y-2.5">
            {topThree.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition ${
                  item.kategori === 'penting'
                    ? 'bg-rose-50/60 border-rose-200'
                    : item.pinned
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  {item.pinned && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-200 text-amber-900">
                      <Pin className="w-2.5 h-2.5" /> PIN
                    </span>
                  )}
                  {getCategoryBadge(item.kategori)}
                  <span className="text-[10px] text-slate-400 ml-auto">{item.tanggal}</span>
                </div>
                <h5 className="font-bold text-xs text-slate-800 mb-1">{item.judul}</h5>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                  {item.isi}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-slate-800">
                Papan Pengumuman & Notifikasi Sekolah
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                {visibleAnnouncements.length} Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Informasi resmi, agenda kegiatan, jadwal ujian CBT, dan pengumuman kedinasan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pengumuman</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchAnnouncements}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Segarkan data pengumuman"
          >
            <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
            <span className="hidden sm:inline">Segarkan</span>
          </button>
        </div>
      </div>

      {/* Admin Create / Edit Form Modal Inline */}
      {isFormOpen && isAdmin && (
        <form
          onSubmit={handleSave}
          className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-4 shadow-sm animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs sm:text-sm font-extrabold text-indigo-900">
                {editingId ? 'Edit Pengumuman Sekolah' : 'Buat Pengumuman Baru'}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Judul Pengumuman <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Contoh: Jadwal Penilaian Akhir Semester (PAS) Genap 2025/2026"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Pembaca</label>
              <select
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value as 'semua' | 'guru' | 'murid')}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="semua">Semua (Guru & Siswa)</option>
                <option value="guru">Khusus Bapak/Ibu Guru</option>
                <option value="murid">Khusus Siswa / Murid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Kategori Pengumuman</label>
              <select
                value={formCategory}
                onChange={(e) =>
                  setFormCategory(e.target.value as 'penting' | 'ujian' | 'libur' | 'info')
                }
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="info">📢 Informasi Umum</option>
                <option value="penting">🔴 Penting / Perhatian Khusus</option>
                <option value="ujian">📝 Jadwal / Asesmen CBT</option>
                <option value="libur">🏖️ Libur Sekolah / Kegiatan</option>
              </select>
            </div>

            {/* Pinned Checkbox */}
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="pinAnnouncement"
                checked={formPinned}
                onChange={(e) => setFormPinned(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
              />
              <label
                htmlFor="pinAnnouncement"
                className="text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Pin className="w-3.5 h-3.5 text-amber-600" />
                Sematkan ke bagian teratas (PIN)
              </label>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Isi Informasi Pengumuman <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Tuliskan petunjuk lengkap, ketentuan asesmen, tanggal pelaksanaan, atau instruksi..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-1 border-t border-indigo-200">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Publikasikan Sekarang'}
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveFilter('semua')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeFilter === 'semua'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('penting')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              activeFilter === 'penting'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-slate-200'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            Penting
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ujian')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              activeFilter === 'ujian'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-slate-200'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            Ujian CBT
          </button>
          {(isAdmin || currentUser.role === 'guru') && (
            <button
              type="button"
              onClick={() => setActiveFilter('guru')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeFilter === 'guru'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-purple-700 hover:bg-purple-50 border border-slate-200'
              }`}
            >
              Khusus Guru
            </button>
          )}
          {(isAdmin || currentUser.role === 'murid') && (
            <button
              type="button"
              onClick={() => setActiveFilter('murid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeFilter === 'murid'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-amber-700 hover:bg-amber-50 border border-slate-200'
              }`}
            >
              Khusus Siswa
            </button>
          )}
        </div>

        {/* Search box */}
        <div className="relative min-w-[200px] md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pengumuman..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Announcements List */}
      {sortedAnnouncements.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 space-y-2">
          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-600">Tidak ada pengumuman yang sesuai</p>
          <p className="text-[11px] text-slate-400">
            {search
              ? 'Silakan coba kata kunci pencarian yang lain.'
              : 'Belum ada pengumuman yang diterbitkan untuk kategori ini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAnnouncements.map((item) => {
            const isImportant = item.kategori === 'penting';
            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  item.pinned
                    ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200'
                    : isImportant
                    ? 'bg-rose-50/30 border-rose-200'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.pinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950">
                        <Pin className="w-3 h-3 text-amber-700" /> DISEMATKAN
                      </span>
                    )}
                    {getCategoryBadge(item.kategori)}
                    {getTargetBadge(item.target)}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.tanggal}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-600">{item.penulis}</span>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Edit Pengumuman"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.judul)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus Pengumuman"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mb-2">
                  {item.judul}
                </h4>

                {/* Body Text */}
                <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {item.isi}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
