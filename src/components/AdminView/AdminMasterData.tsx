import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Layers,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Lock,
  Search,
  CheckCircle2,
  Loader2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { User } from '../../types';
import { api, DEFAULT_MASTER_KELAS, DEFAULT_MASTER_MAPEL } from '../../services/api';

interface AdminMasterDataProps {
  currentUser?: User;
  onShowModal: (modal: {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
    isConfirm?: boolean;
    onConfirm?: () => void;
  }) => void;
}

export const AdminMasterData: React.FC<AdminMasterDataProps> = ({
  currentUser,
  onShowModal,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const [classes, setClasses] = useState<string[]>([]);
  const [mapels, setMapels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search filters
  const [searchClass, setSearchClass] = useState('');
  const [searchMapel, setSearchMapel] = useState('');

  // Inline Kelas inputs
  const [newClassName, setNewClassName] = useState('');
  const [editingClassIdx, setEditingClassIdx] = useState<number | null>(null);
  const [editClassVal, setEditClassVal] = useState('');
  const [isSavingClass, setIsSavingClass] = useState(false);

  // Inline Mapel inputs
  const [newMapelName, setNewMapelName] = useState('');
  const [editingMapelIdx, setEditingMapelIdx] = useState<number | null>(null);
  const [editMapelVal, setEditMapelVal] = useState('');
  const [isSavingMapel, setIsSavingMapel] = useState(false);

  // Modal dialog states for adding
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [modalClassInput, setModalClassInput] = useState('');
  const [isAddMapelModalOpen, setIsAddMapelModalOpen] = useState(false);
  const [modalMapelInput, setModalMapelInput] = useState('');

  const classInputRef = useRef<HTMLInputElement>(null);
  const mapelInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [c, m] = await Promise.all([api.getMasterKelas(), api.getMasterMapel()]);
      setClasses(c && c.length > 0 ? c : DEFAULT_MASTER_KELAS);
      setMapels(m && m.length > 0 ? m : DEFAULT_MASTER_MAPEL);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper check for admin authorization
  const assertAdmin = (): boolean => {
    if (!isAdmin) {
      onShowModal({
        isOpen: true,
        title: 'Akses Ditolak',
        message:
          'Hanya Administrator Utama yang memiliki wewenang untuk menambah, mengubah, atau menghapus Master Kelas dan Daftar Mata Pelajaran.',
        type: 'danger',
      });
      return false;
    }
    return true;
  };

  // ================= KELAS HANDLERS =================
  const handleAddClass = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!assertAdmin()) return;

    const clean = newClassName.trim().toUpperCase();
    if (!clean) {
      onShowModal({
        isOpen: true,
        title: 'Nama Kelas Belum Diisi',
        message:
          'Silakan ketikkan kode atau nama rombel kelas pada kolom input (contoh: 6C, 5B, 4A) sebelum menekan tombol Tambah.',
        type: 'warning',
      });
      classInputRef.current?.focus();
      return;
    }

    if (classes.includes(clean)) {
      onShowModal({
        isOpen: true,
        title: 'Kelas Sudah Terdaftar',
        message: `Rombel Kelas "${clean}" sudah ada di dalam daftar master data.`,
        type: 'warning',
      });
      return;
    }

    const updated = [...classes, clean];
    setClasses(updated);
    setNewClassName('');
    setIsSavingClass(true);

    try {
      await api.saveMasterKelas(updated);
      onShowModal({
        isOpen: true,
        title: 'Kelas Berhasil Ditambahkan',
        message: `Rombel Kelas "${clean}" berhasil ditambahkan dan disimpan ke master data sekolah.`,
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      onShowModal({
        isOpen: true,
        title: 'Gagal Menyimpan',
        message: 'Terjadi kendala saat menyimpan kelas baru. Silakan coba lagi.',
        type: 'danger',
      });
    } finally {
      setIsSavingClass(false);
    }
  };

  const handleModalAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assertAdmin()) return;

    const clean = modalClassInput.trim().toUpperCase();
    if (!clean) {
      onShowModal({
        isOpen: true,
        title: 'Nama Kelas Belum Diisi',
        message: 'Silakan masukkan nama atau kode kelas (contoh: 6C, 5B, 4A).',
        type: 'warning',
      });
      return;
    }

    if (classes.includes(clean)) {
      onShowModal({
        isOpen: true,
        title: 'Kelas Sudah Ada',
        message: `Kelas "${clean}" sudah terdaftar di sistem.`,
        type: 'warning',
      });
      return;
    }

    const updated = [...classes, clean];
    setClasses(updated);
    setModalClassInput('');
    setIsAddClassModalOpen(false);
    setIsSavingClass(true);

    try {
      await api.saveMasterKelas(updated);
      onShowModal({
        isOpen: true,
        title: 'Kelas Berhasil Ditambahkan',
        message: `Kelas "${clean}" berhasil disimpan ke master data sekolah.`,
        type: 'success',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingClass(false);
    }
  };

  const handleQuickAddClass = async (classNameToAdd: string) => {
    if (!assertAdmin()) return;
    const clean = classNameToAdd.trim().toUpperCase();
    if (classes.includes(clean)) return;

    const updated = [...classes, clean];
    setClasses(updated);
    setIsSavingClass(true);
    try {
      await api.saveMasterKelas(updated);
      onShowModal({
        isOpen: true,
        title: 'Kelas Ditambahkan',
        message: `Kelas "${clean}" berhasil ditambahkan ke daftar.`,
        type: 'success',
      });
    } finally {
      setIsSavingClass(false);
    }
  };

  const handleSaveEditClass = async (idx: number) => {
    if (!assertAdmin()) return;
    const clean = editClassVal.trim().toUpperCase();
    if (!clean) return;

    const updated = [...classes];
    const oldName = updated[idx];
    updated[idx] = clean;
    setClasses(updated);
    setEditingClassIdx(null);
    setIsSavingClass(true);

    try {
      await api.saveMasterKelas(updated);
      onShowModal({
        isOpen: true,
        title: 'Perubahan Disimpan',
        message: `Nama kelas "${oldName}" berhasil diperbarui menjadi "${clean}".`,
        type: 'success',
      });
    } finally {
      setIsSavingClass(false);
    }
  };

  const handleDeleteClass = (idx: number, name: string) => {
    if (!assertAdmin()) return;

    onShowModal({
      isOpen: true,
      title: 'Hapus Rombel Kelas',
      message: `Yakin ingin menghapus kelas "${name}" dari master data? Pilihan kelas ini tidak akan muncul lagi di formulir pembuatan ujian dan pendaftaran siswa baru.`,
      type: 'warning',
      isConfirm: true,
      onConfirm: async () => {
        const updated = classes.filter((_, i) => i !== idx);
        setClasses(updated);
        setIsSavingClass(true);
        try {
          await api.saveMasterKelas(updated);
          onShowModal({
            isOpen: true,
            title: 'Kelas Berhasil Dihapus',
            message: `Kelas "${name}" telah dihapus dari master data.`,
            type: 'info',
          });
        } finally {
          setIsSavingClass(false);
        }
      },
    });
  };

  const handleResetDefaultClasses = () => {
    if (!assertAdmin()) return;
    onShowModal({
      isOpen: true,
      title: 'Pulihkan Kelas Bawaan',
      message:
        'Apakah Anda yakin ingin memulihkan daftar rombel kelas ke daftar standar bawaan sekolah (Kelas 1A s/d 6B)?',
      type: 'warning',
      isConfirm: true,
      onConfirm: async () => {
        setClasses(DEFAULT_MASTER_KELAS);
        setIsSavingClass(true);
        try {
          await api.saveMasterKelas(DEFAULT_MASTER_KELAS);
          onShowModal({
            isOpen: true,
            title: 'Kelas Dipulihkan',
            message: 'Daftar rombel kelas telah dikembalikan ke standar bawaan.',
            type: 'success',
          });
        } finally {
          setIsSavingClass(false);
        }
      },
    });
  };

  // ================= MAPEL HANDLERS =================
  const handleAddMapel = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!assertAdmin()) return;

    const clean = newMapelName.trim();
    if (!clean) {
      onShowModal({
        isOpen: true,
        title: 'Nama Mata Pelajaran Belum Diisi',
        message:
          'Silakan ketikkan nama mata pelajaran pada kolom input (contoh: Seni Budaya, Bahasa Daerah, Bahasa Inggris) sebelum menekan tombol Tambah.',
        type: 'warning',
      });
      mapelInputRef.current?.focus();
      return;
    }

    if (mapels.some((m) => m.toLowerCase() === clean.toLowerCase())) {
      onShowModal({
        isOpen: true,
        title: 'Mata Pelajaran Sudah Terdaftar',
        message: `Mata pelajaran "${clean}" sudah ada di dalam daftar master data.`,
        type: 'warning',
      });
      return;
    }

    const updated = [...mapels, clean];
    setMapels(updated);
    setNewMapelName('');
    setIsSavingMapel(true);

    try {
      await api.saveMasterMapel(updated);
      onShowModal({
        isOpen: true,
        title: 'Mata Pelajaran Berhasil Ditambahkan',
        message: `Mata pelajaran "${clean}" berhasil ditambahkan dan disimpan ke master data kurikulum.`,
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      onShowModal({
        isOpen: true,
        title: 'Gagal Menyimpan',
        message: 'Terjadi kendala saat menyimpan mata pelajaran baru. Silakan coba lagi.',
        type: 'danger',
      });
    } finally {
      setIsSavingMapel(false);
    }
  };

  const handleModalAddMapel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assertAdmin()) return;

    const clean = modalMapelInput.trim();
    if (!clean) {
      onShowModal({
        isOpen: true,
        title: 'Nama Mata Pelajaran Belum Diisi',
        message: 'Silakan masukkan nama mata pelajaran (contoh: Bahasa Daerah, Seni Budaya).',
        type: 'warning',
      });
      return;
    }

    if (mapels.some((m) => m.toLowerCase() === clean.toLowerCase())) {
      onShowModal({
        isOpen: true,
        title: 'Mata Pelajaran Sudah Ada',
        message: `Mata pelajaran "${clean}" sudah terdaftar di sistem.`,
        type: 'warning',
      });
      return;
    }

    const updated = [...mapels, clean];
    setMapels(updated);
    setModalMapelInput('');
    setIsAddMapelModalOpen(false);
    setIsSavingMapel(true);

    try {
      await api.saveMasterMapel(updated);
      onShowModal({
        isOpen: true,
        title: 'Mata Pelajaran Ditambahkan',
        message: `Mata pelajaran "${clean}" berhasil disimpan ke kurikulum.`,
        type: 'success',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingMapel(false);
    }
  };

  const handleQuickAddMapel = async (mapelNameToAdd: string) => {
    if (!assertAdmin()) return;
    const clean = mapelNameToAdd.trim();
    if (mapels.some((m) => m.toLowerCase() === clean.toLowerCase())) return;

    const updated = [...mapels, clean];
    setMapels(updated);
    setIsSavingMapel(true);
    try {
      await api.saveMasterMapel(updated);
      onShowModal({
        isOpen: true,
        title: 'Mapel Ditambahkan',
        message: `Mata pelajaran "${clean}" berhasil ditambahkan ke daftar.`,
        type: 'success',
      });
    } finally {
      setIsSavingMapel(false);
    }
  };

  const handleSaveEditMapel = async (idx: number) => {
    if (!assertAdmin()) return;
    const clean = editMapelVal.trim();
    if (!clean) return;

    const updated = [...mapels];
    const oldName = updated[idx];
    updated[idx] = clean;
    setMapels(updated);
    setEditingMapelIdx(null);
    setIsSavingMapel(true);

    try {
      await api.saveMasterMapel(updated);
      onShowModal({
        isOpen: true,
        title: 'Perubahan Disimpan',
        message: `Mata pelajaran "${oldName}" berhasil diperbarui menjadi "${clean}".`,
        type: 'success',
      });
    } finally {
      setIsSavingMapel(false);
    }
  };

  const handleDeleteMapel = (idx: number, name: string) => {
    if (!assertAdmin()) return;

    onShowModal({
      isOpen: true,
      title: 'Hapus Mata Pelajaran',
      message: `Yakin ingin menghapus mata pelajaran "${name}" dari master data? Pilihan ini tidak akan muncul lagi di opsi mata pelajaran CBT dan materi baru.`,
      type: 'warning',
      isConfirm: true,
      onConfirm: async () => {
        const updated = mapels.filter((_, i) => i !== idx);
        setMapels(updated);
        setIsSavingMapel(true);
        try {
          await api.saveMasterMapel(updated);
          onShowModal({
            isOpen: true,
            title: 'Mapel Berhasil Dihapus',
            message: `Mata pelajaran "${name}" telah dihapus dari master data.`,
            type: 'info',
          });
        } finally {
          setIsSavingMapel(false);
        }
      },
    });
  };

  const handleResetDefaultMapels = () => {
    if (!assertAdmin()) return;
    onShowModal({
      isOpen: true,
      title: 'Pulihkan Mapel Bawaan',
      message:
        'Apakah Anda yakin ingin memulihkan daftar mata pelajaran ke daftar standar kurikulum sekolah dasar?',
      type: 'warning',
      isConfirm: true,
      onConfirm: async () => {
        setMapels(DEFAULT_MASTER_MAPEL);
        setIsSavingMapel(true);
        try {
          await api.saveMasterMapel(DEFAULT_MASTER_MAPEL);
          onShowModal({
            isOpen: true,
            title: 'Mapel Dipulihkan',
            message: 'Daftar mata pelajaran telah dikembalikan ke standar bawaan.',
            type: 'success',
          });
        } finally {
          setIsSavingMapel(false);
        }
      },
    });
  };

  // Filtered lists for search
  const filteredClasses = classes.filter((c) =>
    c.toLowerCase().includes(searchClass.trim().toLowerCase())
  );

  const filteredMapels = mapels.filter((m) =>
    m.toLowerCase().includes(searchMapel.trim().toLowerCase())
  );

  // Suggested classes not yet in list
  const suggestedClasses = [
    '1A',
    '1B',
    '2A',
    '2B',
    '3A',
    '3B',
    '4A',
    '4B',
    '5A',
    '5B',
    '6A',
    '6B',
    '6C',
    'Semua',
  ].filter((c) => !classes.includes(c));

  // Suggested mapels not yet in list
  const suggestedMapels = [
    'Matematika',
    'Bahasa Indonesia',
    'IPAS (Ilmu Pengetahuan Alam & Sosial)',
    'Pendidikan Pancasila',
    'Pendidikan Agama Islam',
    'PJOK',
    'Seni Rupa',
    'Seni Musik',
    'Bahasa Inggris',
    'Bahasa Jawa',
    'Informatika / TIK',
    'Muatan Lokal',
  ].filter((m) => !mapels.some((curr) => curr.toLowerCase() === m.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Role Notice Banner */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
          <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
              <span>Mode Akses Terbatas (Hanya Baca)</span>
            </h4>
            <p className="leading-relaxed">
              Anda saat ini masuk dengan peran{' '}
              <strong className="uppercase">{currentUser?.role || 'Pengguna'}</strong>. Sesuai
              kebijakan keamanan sistem,{' '}
              <strong>
                hanya Administrator Utama yang memiliki hak untuk menambah, mengedit, atau menghapus
              </strong>{' '}
              Master Data Rombel Kelas dan Mata Pelajaran.
            </p>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-100">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-slate-800">
                Master Data: Rombel Kelas & Mata Pelajaran
              </h3>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Hak Akses Penuh
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Data master menjadi rujukan opsi pemilihan saat menyusun paket CBT, materi
              pembelajaran, dan pendaftaran siswa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition flex items-center gap-1.5"
            title="Muat ulang data dari database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Two Column Grid: Classes & Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ================= KELOLA KELAS ================= */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Header of Kelas card */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Daftar Rombel / Kelas</h4>
                  <p className="text-[11px] text-slate-400">Total {classes.length} kelas terdaftar</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setIsAddClassModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-xs transition flex items-center gap-1"
                      title="Buka dialog tambah kelas"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Kelas</span>
                    </button>
                    <button
                      onClick={handleResetDefaultClasses}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                      title="Pulihkan kelas standar bawaan"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Inline Add Form */}
            {isAdmin ? (
              <form onSubmit={handleAddClass} className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600">
                  Tambah Kelas Cepat
                </label>
                <div className="flex gap-2">
                  <input
                    ref={classInputRef}
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Contoh: 6C, 5A, 4B..."
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 bg-white uppercase font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSavingClass}
                  />
                  <button
                    type="submit"
                    disabled={isSavingClass}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-indigo-300 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  >
                    {isSavingClass ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Tambah</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Hanya admin yang dapat menambah rombel kelas.</span>
              </div>
            )}

            {/* Quick Suggestions if any */}
            {isAdmin && suggestedClasses.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Saran Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedClasses.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleQuickAddClass(c)}
                      className="px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200/60 transition"
                      title={`Klik untuk langsung menambahkan Kelas ${c}`}
                    >
                      + {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Filter */}
            <div className="relative pt-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={searchClass}
                onChange={(e) => setSearchClass(e.target.value)}
                placeholder="Cari nama rombel kelas..."
                className="w-full text-xs pl-8.5 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* List */}
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span>Memuat data rombel kelas...</span>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                {searchClass ? 'Tidak ada kelas yang cocok dengan pencarian.' : 'Belum ada kelas terdaftar.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredClasses.map((cls, idx) => {
                  const originalIdx = classes.indexOf(cls);
                  return (
                    <div
                      key={cls + originalIdx}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 flex items-center justify-between gap-2 transition"
                    >
                      {editingClassIdx === originalIdx && isAdmin ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editClassVal}
                            onChange={(e) => setEditClassVal(e.target.value)}
                            className="flex-1 text-xs p-1.5 rounded-lg border border-indigo-500 bg-white uppercase font-bold focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEditClass(originalIdx)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                            title="Simpan Perubahan"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingClassIdx(null)}
                            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
                            title="Batal"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                              {originalIdx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{cls}</span>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingClassIdx(originalIdx);
                                  setEditClassVal(cls);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                title="Edit Nama Kelas"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClass(originalIdx, cls)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Hapus Kelas"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Rombel aktif: {classes.length}</span>
            <span className="text-indigo-600 font-semibold">Tersinkronisasi</span>
          </div>
        </div>

        {/* ================= KELOLA MAPEL ================= */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Header of Mapel card */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Daftar Mata Pelajaran</h4>
                  <p className="text-[11px] text-slate-400">Total {mapels.length} mapel terdaftar</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setIsAddMapelModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-xs transition flex items-center gap-1"
                      title="Buka dialog tambah mata pelajaran"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Mapel</span>
                    </button>
                    <button
                      onClick={handleResetDefaultMapels}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                      title="Pulihkan mapel standar kurikulum"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Inline Add Form */}
            {isAdmin ? (
              <form onSubmit={handleAddMapel} className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600">
                  Tambah Mapel Cepat
                </label>
                <div className="flex gap-2">
                  <input
                    ref={mapelInputRef}
                    type="text"
                    value={newMapelName}
                    onChange={(e) => setNewMapelName(e.target.value)}
                    placeholder="Contoh: Seni Budaya, Bahasa Daerah..."
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isSavingMapel}
                  />
                  <button
                    type="submit"
                    disabled={isSavingMapel}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:bg-purple-300 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  >
                    {isSavingMapel ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Tambah</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Hanya admin yang dapat menambah mata pelajaran.</span>
              </div>
            )}

            {/* Quick Suggestions if any */}
            {isAdmin && suggestedMapels.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  Saran Kurikulum:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedMapels.slice(0, 4).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleQuickAddMapel(m)}
                      className="px-2 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold border border-purple-200/60 transition"
                      title={`Klik untuk menambahkan ${m}`}
                    >
                      + {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Filter */}
            <div className="relative pt-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={searchMapel}
                onChange={(e) => setSearchMapel(e.target.value)}
                placeholder="Cari mata pelajaran..."
                className="w-full text-xs pl-8.5 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* List */}
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                <span>Memuat data mata pelajaran...</span>
              </div>
            ) : filteredMapels.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                {searchMapel ? 'Tidak ada mata pelajaran yang cocok.' : 'Belum ada mapel terdaftar.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredMapels.map((mpl, idx) => {
                  const originalIdx = mapels.indexOf(mpl);
                  return (
                    <div
                      key={mpl + originalIdx}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 flex items-center justify-between gap-2 transition"
                    >
                      {editingMapelIdx === originalIdx && isAdmin ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editMapelVal}
                            onChange={(e) => setEditMapelVal(e.target.value)}
                            className="flex-1 text-xs p-1.5 rounded-lg border border-purple-500 bg-white font-semibold focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEditMapel(originalIdx)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                            title="Simpan Perubahan"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingMapelIdx(null)}
                            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
                            title="Batal"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
                              {originalIdx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{mpl}</span>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingMapelIdx(originalIdx);
                                  setEditMapelVal(mpl);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                                title="Edit Mata Pelajaran"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMapel(originalIdx, mpl)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Hapus Mapel"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Mapel aktif: {mapels.length}</span>
            <span className="text-purple-600 font-semibold">Tersinkronisasi</span>
          </div>
        </div>
      </div>

      {/* ================= DEDICATED POPUP MODALS ================= */}

      {/* 1. Modal Tambah Kelas */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900">Tambah Rombel Kelas Baru</h3>
              </div>
              <button
                onClick={() => setIsAddClassModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Tambahkan rombel kelas baru ke master data sekolah. Kelas ini otomatis tersedia di
              seluruh formulir CBT, bahan ajar materi, dan manajemen data siswa.
            </p>

            <form onSubmit={handleModalAddClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama / Kode Kelas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalClassInput}
                  onChange={(e) => setModalClassInput(e.target.value)}
                  placeholder="Contoh: 6C, 5B, 4A, 1B"
                  className="w-full text-sm p-3 rounded-xl border border-slate-300 bg-white font-bold uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              {suggestedClasses.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400">Pilih Cepat Rekomendasi:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {suggestedClasses.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setModalClassInput(c)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700 text-xs font-bold transition"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingClass}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-indigo-300 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  {isSavingClass ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Kelas</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Tambah Mapel */}
      {isAddMapelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Tambah Mata Pelajaran Baru
                </h3>
              </div>
              <button
                onClick={() => setIsAddMapelModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Tambahkan mata pelajaran baru ke kurikulum sekolah. Mapel ini otomatis menjadi opsi
              pilihan bagi seluruh guru saat membuat paket soal CBT atau mengunggah materi belajar.
            </p>

            <form onSubmit={handleModalAddMapel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalMapelInput}
                  onChange={(e) => setModalMapelInput(e.target.value)}
                  placeholder="Contoh: Bahasa Daerah, Seni Budaya, PJOK"
                  className="w-full text-sm p-3 rounded-xl border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              {suggestedMapels.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400">Pilih Cepat Rekomendasi:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {suggestedMapels.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModalMapelInput(m)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 text-xs font-semibold transition"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMapelModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingMapel}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:bg-purple-300 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  {isSavingMapel ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Mapel</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
