import React, { useState, useEffect } from 'react';
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
  Save,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';

interface AdminMasterDataProps {
  onShowModal: (modal: {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
    isConfirm?: boolean;
    onConfirm?: () => void;
  }) => void;
}

export const AdminMasterData: React.FC<AdminMasterDataProps> = ({ onShowModal }) => {
  const [classes, setClasses] = useState<string[]>([]);
  const [mapels, setMapels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Kelas inputs
  const [newClassName, setNewClassName] = useState('');
  const [editingClassIdx, setEditingClassIdx] = useState<number | null>(null);
  const [editClassVal, setEditClassVal] = useState('');

  // Mapel inputs
  const [newMapelName, setNewMapelName] = useState('');
  const [editingMapelIdx, setEditingMapelIdx] = useState<number | null>(null);
  const [editMapelVal, setEditMapelVal] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [c, m] = await Promise.all([api.getMasterKelas(), api.getMasterMapel()]);
      setClasses(c || []);
      setMapels(m || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // KELAS HANDLERS
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newClassName.trim().toUpperCase();
    if (!clean) return;
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
    setNewClassName('');
    setIsSaving(true);
    await api.saveMasterKelas(updated);
    setIsSaving(false);
  };

  const handleSaveEditClass = async (idx: number) => {
    const clean = editClassVal.trim().toUpperCase();
    if (!clean) return;
    const updated = [...classes];
    updated[idx] = clean;
    setClasses(updated);
    setEditingClassIdx(null);
    setIsSaving(true);
    await api.saveMasterKelas(updated);
    setIsSaving(false);
  };

  const handleDeleteClass = (idx: number, name: string) => {
    onShowModal({
      isOpen: true,
      title: 'Hapus Rombel Kelas',
      message: `Yakin ingin menghapus kelas "${name}" dari master data?`,
      type: 'warning',
      isConfirm: true,
      onConfirm: async () => {
        const updated = classes.filter((_, i) => i !== idx);
        setClasses(updated);
        await api.saveMasterKelas(updated);
      },
    });
  };

  // MAPEL HANDLERS
  const handleAddMapel = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newMapelName.trim();
    if (!clean) return;
    if (mapels.some((m) => m.toLowerCase() === clean.toLowerCase())) {
      onShowModal({
        isOpen: true,
        title: 'Mapel Sudah Ada',
        message: `Mata pelajaran "${clean}" sudah terdaftar di sistem.`,
        type: 'warning',
      });
      return;
    }

    const updated = [...mapels, clean];
    setMapels(updated);
    setNewMapelName('');
    setIsSaving(true);
    await api.saveMasterMapel(updated);
    setIsSaving(false);
  };

  const handleSaveEditMapel = async (idx: number) => {
    const clean = editMapelVal.trim();
    if (!clean) return;
    const updated = [...mapels];
    updated[idx] = clean;
    setMapels(updated);
    setEditingMapelIdx(null);
    setIsSaving(true);
    await api.saveMasterMapel(updated);
    setIsSaving(false);
  };

  const handleDeleteMapel = (idx: number, name: string) => {
    onShowModal({
      isOpen: true,
      title: 'Hapus Mata Pelajaran',
      message: `Yakin ingin menghapus mata pelajaran "${name}" dari master data?`,
      type: 'warning',
      isConfirm: true,
      onConfirm: async () => {
        const updated = mapels.filter((_, i) => i !== idx);
        setMapels(updated);
        await api.saveMasterMapel(updated);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800">
              Master Data: Rombel Kelas & Mata Pelajaran
            </h3>
            <p className="text-xs text-slate-500">
              Data ini otomatis menjadi pilihan dropdown saat membuat soal, materi, dan akun siswa
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          Muat Ulang
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KELOLA KELAS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h4 className="font-extrabold text-sm text-slate-800">Daftar Rombel / Kelas</h4>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
              {classes.length} Kelas
            </span>
          </div>

          {/* Add form */}
          <form onSubmit={handleAddClass} className="flex gap-2">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Contoh: 6C, 5A, 4B..."
              className="flex-1 text-xs p-2 rounded-xl border border-slate-300 bg-white uppercase font-bold focus:outline-indigo-600"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </form>

          {/* List */}
          {isLoading ? (
            <div className="p-6 text-center text-xs text-slate-400">Memuat data kelas...</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {classes.map((cls, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  {editingClassIdx === idx ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editClassVal}
                        onChange={(e) => setEditClassVal(e.target.value)}
                        className="flex-1 text-xs p-1.5 rounded-lg border border-indigo-400 bg-white uppercase font-bold"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEditClass(idx)}
                        className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        title="Simpan"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingClassIdx(null)}
                        className="p-1 rounded bg-slate-300 text-slate-700 hover:bg-slate-400"
                        title="Batal"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{cls}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingClassIdx(idx);
                            setEditClassVal(cls);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Edit Nama Kelas"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(idx, cls)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus Kelas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KELOLA MAPEL */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <h4 className="font-extrabold text-sm text-slate-800">Daftar Mata Pelajaran</h4>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
              {mapels.length} Mapel
            </span>
          </div>

          {/* Add form */}
          <form onSubmit={handleAddMapel} className="flex gap-2">
            <input
              type="text"
              value={newMapelName}
              onChange={(e) => setNewMapelName(e.target.value)}
              placeholder="Contoh: Seni Budaya, Bahasa Daerah..."
              className="flex-1 text-xs p-2 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-purple-600"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </form>

          {/* List */}
          {isLoading ? (
            <div className="p-6 text-center text-xs text-slate-400">Memuat data mapel...</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {mapels.map((mpl, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  {editingMapelIdx === idx ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editMapelVal}
                        onChange={(e) => setEditMapelVal(e.target.value)}
                        className="flex-1 text-xs p-1.5 rounded-lg border border-purple-400 bg-white font-semibold"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEditMapel(idx)}
                        className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        title="Simpan"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingMapelIdx(null)}
                        className="p-1 rounded bg-slate-300 text-slate-700 hover:bg-slate-400"
                        title="Batal"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{mpl}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingMapelIdx(idx);
                            setEditMapelVal(mpl);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                          title="Edit Mapel"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMapel(idx, mpl)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus Mapel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
