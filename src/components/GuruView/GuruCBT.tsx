import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  Plus,
  Trash2,
  Edit,
  Sliders,
  CheckCircle2,
  XCircle,
  Upload,
  Layers,
  Clock,
  HelpCircle,
  Eye,
  CheckSquare,
  Columns,
  Download,
  Printer,
  UploadCloud,
  FileSpreadsheet,
  KeyRound,
  Calendar,
  Sparkles,
  Copy,
  BookOpen,
  Lightbulb,
} from 'lucide-react';
import {
  Ujian,
  Question,
  QuestionType,
  ExamPayload,
  QuestionPG,
  QuestionPGKMCMA,
  QuestionPGKKategori,
  KisiKisiItem,
  SchoolProfile,
} from '../../types';
import { api } from '../../services/api';
import { ModalState } from '../ConfirmModal';
import { MathRenderer } from '../MathRenderer';
import { BulkQuestionModal } from './BulkQuestionModal';
import { PerQuestionEditor } from './PerQuestionEditor';
import { KisiKisiModal } from '../KisiKisiModal';
import { GenerateSoalKisiKisiModal } from './GenerateSoalKisiKisiModal';
import { ExportExamModal } from '../ExportExamModal';
import { ExamReviewModal } from '../ExamReviewModal';
import {
  downloadExamWord,
  printExamDocument,
  downloadSampleQuestionCsv,
} from '../../utils/documentExport';
import {
  downloadExamExcelTemplate,
  exportQuestionsToExcel,
  parseQuestionsFromExcel,
} from '../../utils/excelExamHelper';

interface GuruCBTProps {
  onShowModal: (modal: Partial<ModalState>) => void;
  onViewImage: (url: string, title?: string) => void;
}

export const GuruCBT: React.FC<GuruCBTProps> = ({ onShowModal, onViewImage }) => {
  const [ujianList, setUjianList] = useState<Ujian[]>([]);
  const [classList, setClassList] = useState<string[]>(['6A', '6B', '5A', '5B', 'Semua']);
  const [mapelList, setMapelList] = useState<string[]>([
    'Matematika',
    'Bahasa Indonesia',
    'IPAS',
    'Pendidikan Pancasila',
    'PJOK',
    'Seni Rupa',
    'Bahasa Inggris',
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [id, setId] = useState('');
  const [judul, setJudul] = useState('');
  const [mapel, setMapel] = useState('Matematika');
  const [kelas, setKelas] = useState('6A');
  const [durasi, setDurasi] = useState(60);
  const [sesi, setSesi] = useState('Semua');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [acakSoal, setAcakSoal] = useState(true);
  const [acakOpsi, setAcakOpsi] = useState(true);

  // New features: Jadwal & Token
  const [jadwalMulai, setJadwalMulai] = useState('');
  const [jadwalSelesai, setJadwalSelesai] = useState('');
  const [tokenUjian, setTokenUjian] = useState('');

  // Edit Mode: 'per_soal' (default, requirement 3) vs 'semua'
  const [editMode, setEditMode] = useState<'per_soal' | 'semua'>('per_soal');
  const [currentPerQIdx, setCurrentPerQIdx] = useState(0);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // School profile & Kisi-Kisi states
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [currentKisiKisi, setCurrentKisiKisi] = useState<KisiKisiItem[] | null>(null);
  const [kisiModalExam, setKisiModalExam] = useState<Ujian | null>(null);
  const [kisiModalQuestions, setKisiModalQuestions] = useState<Question[] | undefined>(undefined);
  const [isKisiModalOpen, setIsKisiModalOpen] = useState(false);
  const [isGenerateSoalModalOpen, setIsGenerateSoalModalOpen] = useState(false);
  const [exportModalExam, setExportModalExam] = useState<Ujian | null>(null);
  const [reviewModalExam, setReviewModalExam] = useState<Ujian | null>(null);

  const generateRandomToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTokenUjian(res);
  };

  const handleApplyBulkQuestions = (newQuestions: Question[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setQuestions(newQuestions);
      setCurrentPerQIdx(0);
    } else {
      setQuestions((prev) => [...prev, ...newQuestions]);
    }
    onShowModal({
      isOpen: true,
      title: 'Import Soal Berhasil',
      message: `${newQuestions.length} butir soal berhasil ${
        mode === 'replace' ? 'menggantikan soal sebelumnya' : 'ditambahkan ke daftar soal'
      }.`,
      type: 'success',
      isConfirm: false,
    });
  };

  const handleApplyGeneratedQuestions = (
    newQuestions: Question[],
    targetKisiKisi: KisiKisiItem[],
    mode: 'replace' | 'append'
  ) => {
    if (mode === 'replace') {
      setQuestions(newQuestions);
      setCurrentPerQIdx(0);
      setCurrentKisiKisi(targetKisiKisi);
    } else {
      setQuestions((prev) => [...prev, ...newQuestions]);
      setCurrentKisiKisi((prev) => [...(prev || []), ...targetKisiKisi]);
    }
    onShowModal({
      isOpen: true,
      title: 'Soal Berhasil Dibuat Berdasarkan Kisi-Kisi',
      message: `${newQuestions.length} butir soal telah berhasil dirancang dan diterapkan ke dalam rancangan ujian CBT.`,
      type: 'success',
      isConfirm: false,
    });
  };

  const handleImportExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseQuestionsFromExcel(file);
      if (!parsed || parsed.length === 0) {
        throw new Error('Tidak ada soal yang dapat dibaca dari file Excel.');
      }
      setQuestions(parsed);
      setCurrentPerQIdx(0);
      onShowModal({
        isOpen: true,
        title: 'Import Excel Berhasil',
        message: `Berhasil mengimpor ${parsed.length} butir soal dari file "${file.name}"!`,
        type: 'success',
      });
    } catch (err: any) {
      onShowModal({
        isOpen: true,
        title: 'Gagal Impor Excel',
        message: err?.message || 'Terjadi kendala saat membaca file Excel.',
        type: 'danger',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleExportExcel = () => {
    if (questions.length === 0) {
      onShowModal({
        isOpen: true,
        title: 'Tidak Ada Soal',
        message: 'Tidak ada butir soal untuk diekspor ke Excel.',
        type: 'warning',
      });
      return;
    }
    exportQuestionsToExcel(judul || 'Bank_Soal', questions);
  };

  const fetchUjianAndMaster = async () => {
    setIsLoading(true);
    try {
      const [uList, mList, kList, sProfile] = await Promise.all([
        api.getUjianList('ALL', 'guru'),
        api.getMasterMapel(),
        api.getMasterKelas(),
        api.getSchoolProfile().catch(() => null),
      ]);
      setUjianList(uList || []);
      if (sProfile) setSchoolProfile(sProfile);
      if (Array.isArray(mList) && mList.length > 0) {
        setMapelList(mList);
        if (!mapel) setMapel(mList[0]);
      }
      if (Array.isArray(kList) && kList.length > 0) {
        setClassList(kList);
        if (!kelas) setKelas(kList[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUjianAndMaster();
  }, []);

  const resetForm = () => {
    setId('');
    setJudul('');
    setMapel(mapelList[0] || 'Matematika');
    setKelas(classList[0] || '6A');
    setDurasi(60);
    setSesi('Semua');
    setMaxAttempts(1);
    setAcakSoal(true);
    setAcakOpsi(true);
    setJadwalMulai('');
    setJadwalSelesai('');
    setTokenUjian('');
    setCurrentKisiKisi(null);
    setCurrentPerQIdx(0);
    setQuestions([
      {
        type: 'pg',
        bobot: 1,
        soal: '',
        a: '',
        b: '',
        c: '',
        d: '',
        kunci: 'A',
      },
    ]);
  };

  useEffect(() => {
    if (questions.length === 0) {
      resetForm();
    }
  }, []);

  const handleEditUjian = (u: Ujian) => {
    setId(u.ID);
    setJudul(u.Judul_Ujian);
    setMapel(u.Mapel);
    setKelas(u.Kelas);
    setDurasi(u.Durasi_Menit);
    setJadwalMulai(u.Jadwal_Mulai || '');
    setJadwalSelesai(u.Jadwal_Selesai || '');
    setTokenUjian(u.Token_Ujian || '');
    setCurrentPerQIdx(0);

    try {
      const raw = JSON.parse(u.Soal_JSON || '{}');
      if (raw.kisi_kisi) {
        setCurrentKisiKisi(raw.kisi_kisi);
      } else if (u.Kisi_Kisi_JSON) {
        try {
          setCurrentKisiKisi(JSON.parse(u.Kisi_Kisi_JSON));
        } catch {
          setCurrentKisiKisi(null);
        }
      } else {
        setCurrentKisiKisi(null);
      }

      if (raw.questions) {
        setQuestions(raw.questions);
        if (raw.config) {
          setSesi(raw.config.sesi || 'Semua');
          setMaxAttempts(raw.config.max_attempts !== undefined ? raw.config.max_attempts : 1);
          setAcakSoal(raw.config.acak_soal !== undefined ? raw.config.acak_soal : true);
          setAcakOpsi(raw.config.acak_opsi !== undefined ? raw.config.acak_opsi : true);
        }
      } else if (Array.isArray(raw)) {
        setQuestions(raw);
      }
    } catch {
      setQuestions([]);
      setCurrentKisiKisi(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async (u: Ujian) => {
    const newStatus = u.Status === 'Aktif' ? 'Non-Aktif' : 'Aktif';
    const res = await api.toggleStatusUjian(u.ID, newStatus);
    if (res.success) {
      fetchUjianAndMaster();
    }
  };

  const handleDeleteUjian = (u: Ujian) => {
    onShowModal({
      isOpen: true,
      title: 'Hapus Ujian CBT',
      message: `Apakah Anda yakin ingin menghapus ujian "${u.Judul_Ujian}" secara permanen?`,
      type: 'danger',
      isConfirm: true,
      okText: 'Hapus Permanen',
      onConfirm: async () => {
        const res = await api.deleteUjian(u.ID);
        if (res.success) {
          onShowModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Ujian CBT telah dihapus.',
            type: 'success',
            isConfirm: false,
          });
          fetchUjianAndMaster();
        }
      },
    });
  };

  // Question manipulation
  const addQuestion = (type: QuestionType = 'pg') => {
    let newQ: Question;
    if (type === 'pg') {
      newQ = {
        type: 'pg',
        bobot: 1,
        soal: '',
        a: '',
        b: '',
        c: '',
        d: '',
        kunci: 'A',
      };
    } else if (type === 'pgk_mcma') {
      newQ = {
        type: 'pgk_mcma',
        bobot: 1,
        soal: '',
        options: [
          { text: '', isKey: true },
          { text: '', isKey: false },
          { text: '', isKey: false },
          { text: '', isKey: false },
        ],
      };
    } else {
      newQ = {
        type: 'pgk_kategori',
        bobot: 1,
        soal: '',
        col1: 'Benar',
        col2: 'Salah',
        rows: [
          { text: 'Pernyataan 1', key: 'col1' },
          { text: 'Pernyataan 2', key: 'col2' },
        ],
      };
    }

    setQuestions((prev) => {
      const updated = [...prev, newQ];
      setCurrentPerQIdx(updated.length - 1);
      return updated;
    });
  };

  const handleDuplicateQuestion = (idx: number) => {
    const target = questions[idx];
    if (!target) return;
    const cloned = JSON.parse(JSON.stringify(target));
    const updated = [...questions];
    updated.splice(idx + 1, 0, cloned);
    setQuestions(updated);
    setCurrentPerQIdx(idx + 1);
    onShowModal({
      isOpen: true,
      title: 'Soal Diduplikasi',
      message: `Butir soal No. ${idx + 1} berhasil diduplikasi ke No. ${idx + 2}.`,
      type: 'success',
    });
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    if (currentPerQIdx >= questions.length - 1) {
      setCurrentPerQIdx(Math.max(0, questions.length - 2));
    }
  };

  const updateQuestionField = (index: number, field: string, value: unknown) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      } as Question;
      return updated;
    });
  };

  const handleUploadImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    onDone: (base64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const maxDim = 800;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          onDone(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUjian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || questions.length === 0) {
      onShowModal({
        isOpen: true,
        title: 'Form Belum Lengkap',
        message: 'Judul ujian dan minimal 1 butir soal harus diisi.',
        type: 'warning',
        isConfirm: false,
      });
      return;
    }

    const payload: ExamPayload = {
      config: {
        sesi: sesi.trim() || 'Semua',
        max_attempts: Number(maxAttempts),
        acak_soal: acakSoal,
        acak_opsi: acakOpsi,
      },
      questions,
      kisi_kisi: currentKisiKisi || undefined,
    };

    setIsSaving(true);
    const res = await api.saveUjian({
      ID: id || undefined,
      Judul_Ujian: judul.trim(),
      Mapel: mapel.trim(),
      Kelas: kelas.trim(),
      Durasi_Menit: Number(durasi),
      Jadwal_Mulai: jadwalMulai || undefined,
      Jadwal_Selesai: jadwalSelesai || undefined,
      Token_Ujian: tokenUjian.trim() || undefined,
      Kisi_Kisi_JSON: currentKisiKisi ? JSON.stringify(currentKisiKisi) : undefined,
      soal: payload,
      Status: 'Aktif',
    });
    setIsSaving(false);

    if (res.success) {
      onShowModal({
        isOpen: true,
        title: 'Berhasil Diterbitkan',
        message: res.message || 'Ujian CBT telah berhasil disimpan dan disinkronkan.',
        type: 'success',
        isConfirm: false,
      });
      resetForm();
      fetchUjianAndMaster();
    } else {
      onShowModal({
        isOpen: true,
        title: 'Gagal',
        message: res.message || 'Terjadi kesalahan.',
        type: 'error',
        isConfirm: false,
      });
    }
  };

  const handleOpenKisiKisiForExam = (u: Ujian) => {
    setKisiModalExam(u);
    setKisiModalQuestions(undefined);
    setIsKisiModalOpen(true);
  };

  const handleOpenKisiKisiForCurrentForm = () => {
    const currentTransient: Ujian = {
      ID: id || 'DRAFT',
      Judul_Ujian: judul || 'Ujian Baru (Draft)',
      Mapel: mapel,
      Kelas: kelas,
      Durasi_Menit: Number(durasi) || 60,
      Soal_JSON: JSON.stringify({
        config: { sesi, max_attempts: maxAttempts, acak_soal: acakSoal, acak_opsi: acakOpsi },
        questions,
        kisi_kisi: currentKisiKisi || undefined,
      }),
      Status: 'Aktif',
      Token_Ujian: tokenUjian,
      Jadwal_Mulai: jadwalMulai,
      Jadwal_Selesai: jadwalSelesai,
      Kisi_Kisi_JSON: currentKisiKisi ? JSON.stringify(currentKisiKisi) : undefined,
    };
    setKisiModalExam(currentTransient);
    setKisiModalQuestions(questions.length > 0 ? questions : undefined);
    setIsKisiModalOpen(true);
  };

  const handleSaveKisiKisiFromModal = async (newItems: KisiKisiItem[]) => {
    if (!kisiModalExam) return;

    // If modal was opened from current form draft
    if (kisiModalExam.ID === 'DRAFT' || kisiModalExam.ID === id) {
      setCurrentKisiKisi(newItems);
      onShowModal({
        isOpen: true,
        title: 'Kisi-Kisi Tersimpan di Draft',
        message: 'Kisi-kisi soal telah disinkronkan ke dalam rancangan ujian ini.',
        type: 'success',
      });
      return;
    }

    // Modal was opened from bank exam card
    let payload: ExamPayload;
    try {
      const raw = JSON.parse(kisiModalExam.Soal_JSON || '{}');
      if (raw && raw.questions) {
        payload = { ...raw, kisi_kisi: newItems };
      } else if (Array.isArray(raw)) {
        payload = {
          config: { sesi: 'Semua', max_attempts: 1, acak_soal: true, acak_opsi: true },
          questions: raw,
          kisi_kisi: newItems,
        };
      } else {
        payload = {
          config: { sesi: 'Semua', max_attempts: 1, acak_soal: true, acak_opsi: true },
          questions: [],
          kisi_kisi: newItems,
        };
      }
    } catch {
      payload = {
        config: { sesi: 'Semua', max_attempts: 1, acak_soal: true, acak_opsi: true },
        questions: [],
        kisi_kisi: newItems,
      };
    }

    const res = await api.saveUjian({
      ...kisiModalExam,
      Kisi_Kisi_JSON: JSON.stringify(newItems),
      soal: payload,
    });

    if (res.success) {
      setKisiModalExam({
        ...kisiModalExam,
        Kisi_Kisi_JSON: JSON.stringify(newItems),
        Soal_JSON: JSON.stringify(payload),
      });
      fetchUjianAndMaster();
      onShowModal({
        isOpen: true,
        title: 'Kisi-Kisi Berhasil Disimpan',
        message: 'Kisi-kisi soal telah diperbarui dan disimpan ke paket ujian.',
        type: 'success',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form Ujian & Bank Soal */}
      <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-bold text-base text-indigo-700 flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-indigo-600" />
            <span>{id ? 'Edit Ujian CBT' : 'Pembuat Ujian & Bank Soal CBT'}</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGenerateSoalModalOpen(true)}
              className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold flex items-center gap-1.5 transition shadow-xs"
              title="Buat butir-butir soal CBT otomatis dari matriks kisi-kisi atau standar kurikulum"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Buat Soal dari Kisi-Kisi</span>
            </button>
            <button
              type="button"
              onClick={handleOpenKisiKisiForCurrentForm}
              className="text-xs px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold border border-teal-200 flex items-center gap-1.5 transition shadow-xs"
              title="Lihat, generate, atau edit kisi-kisi untuk butir soal yang sedang dirancang"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              <span>Kisi-Kisi Soal</span>
            </button>
            {id && (
              <button
                onClick={resetForm}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
              >
                Batal Edit
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveUjian} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Asesmen / Ujian <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="misal: Asesmen Formatif Bab 2: Bilangan Pecahan"
              required
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
              <select
                value={mapel}
                onChange={(e) => setMapel(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-indigo-500"
              >
                {mapelList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Kelas</label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-indigo-500"
              >
                {classList.map((c) => (
                  <option key={c} value={c}>
                    Kelas {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (Menit)</label>
              <input
                type="number"
                value={durasi}
                min={5}
                max={240}
                onChange={(e) => setDurasi(Number(e.target.value))}
                placeholder="60"
                required
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>
          </div>

          {/* JADWAL UJIAN & TOKEN (Requirement 14 & 16) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Jadwal Pelaksanaan & Token Akses Ujian
              </span>
              <span className="text-[11px] text-slate-500">Opsional untuk keamanan sesi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Waktu Mulai
                </label>
                <input
                  type="datetime-local"
                  value={jadwalMulai}
                  onChange={(e) => setJadwalMulai(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Batas Selesai
                </label>
                <input
                  type="datetime-local"
                  value={jadwalSelesai}
                  onChange={(e) => setJadwalSelesai(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Token Ujian Siswa
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    maxLength={10}
                    value={tokenUjian}
                    onChange={(e) => setTokenUjian(e.target.value.toUpperCase())}
                    placeholder="Contoh: CBT24A"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono uppercase font-bold text-indigo-700"
                  />
                  <button
                    type="button"
                    onClick={generateRandomToken}
                    className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0"
                    title="Buat Token Acak 6 Karakter"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pengaturan Khusus Ujian & Proteksi */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-indigo-900">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Pengaturan Khusus & Proteksi Anti-Contek</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Sesi Peserta Ujian
                </label>
                <input
                  type="text"
                  value={sesi}
                  onChange={(e) => setSesi(e.target.value)}
                  placeholder="Semua / Sesi 1 / Sesi 2"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Batas Percobaan Pengerjaan
                </label>
                <select
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-semibold"
                >
                  <option value={1}>Maksimal 1 Kali Pengerjaan</option>
                  <option value={2}>Maksimal 2 Kali (Dapat Ulang 1x)</option>
                  <option value={3}>Maksimal 3 Kali</option>
                  <option value={0}>Bebas Tanpa Batas</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              <label className="inline-flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acakSoal}
                  onChange={(e) => setAcakSoal(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="ml-2">Acak Urutan Soal Siswa</span>
              </label>

              <label className="inline-flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acakOpsi}
                  onChange={(e) => setAcakOpsi(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="ml-2">Acak Pilihan Jawaban (A, B, C, D)</span>
              </label>
            </div>
          </div>

          {/* ACTION BAR: EXCEL IMPORT/EXPORT & VIEW MODE TOGGLE */}
          <div className="p-3 bg-slate-100 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditMode('per_soal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  editMode === 'per_soal'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                Mode Per Halaman (Per Soal)
              </button>
              <button
                type="button"
                onClick={() => setEditMode('semua')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  editMode === 'semua'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                Mode Tampilkan Semua
              </button>
            </div>

            {/* Excel Actions & Kisi-Kisi Generator */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsGenerateSoalModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1"
                title="Buat soal CBT secara otomatis berdasarkan matriks kisi-kisi Kurikulum Merdeka"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Buat dari Kisi-Kisi</span>
              </button>

              <button
                type="button"
                onClick={downloadExamExcelTemplate}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-xs transition flex items-center gap-1"
                title="Unduh Format Excel Soal"
              >
                <Download className="w-3 h-3 text-emerald-600" />
                <span className="hidden sm:inline">Format Excel</span>
              </button>

              <label
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                title="Unggah Soal dari Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Impor Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleImportExcelFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                title="Ekspor Seluruh Butir Soal ke Excel"
              >
                <Download className="w-3 h-3 text-slate-600" />
                <span className="hidden sm:inline">Ekspor Excel</span>
              </button>
            </div>
          </div>

          {/* EDIT SOAL PER HALAMAN (REQUIREMENT 3: Bank Soal > Kode > Unit > Soal) */}
          {editMode === 'per_soal' ? (
            <PerQuestionEditor
              examCode={id || 'DRAFT'}
              examUnit={mapel}
              questions={questions}
              currentIdx={currentPerQIdx}
              onSelectIndex={(idx) => setCurrentPerQIdx(idx)}
              onUpdateQuestion={(idx, updated) => {
                const copy = [...questions];
                copy[idx] = updated;
                setQuestions(copy);
              }}
              onAddQuestion={(t) => addQuestion(t)}
              onRemoveQuestion={(idx) => removeQuestion(idx)}
              onDuplicateQuestion={(idx) => handleDuplicateQuestion(idx)}
              onSwitchToAllView={() => setEditMode('semua')}
              onViewImage={onViewImage}
              onOpenGenerateKisiKisi={() => setIsGenerateSoalModalOpen(true)}
            />
          ) : (
            /* MODE TAMPILKAN SEMUA SOAL */
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-bold text-slate-600">
                  Menampilkan Seluruh {questions.length} Butir Soal
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => addQuestion('pg')}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200"
                  >
                    + PG
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuestion('pgk_mcma')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200"
                  >
                    + PGK Centang
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuestion('pgk_kategori')}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200"
                  >
                    + PGK Tabel
                  </button>
                </div>
              </div>

              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        {qIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-indigo-700 uppercase">
                        {q.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPerQIdx(qIdx);
                          setEditMode('per_soal');
                        }}
                        className="text-xs text-indigo-600 font-bold hover:underline"
                      >
                        Edit di Mode Per Halaman
                      </button>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIdx)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-medium text-slate-700 line-clamp-2">
                    {q.soal || '(Belum ada teks pertanyaan)'}
                  </p>

                  {/* Kunci Jawaban & Pembahasan Badge */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-indigo-600" />
                      <span>
                        Kunci:{' '}
                        {q.type === 'pg'
                          ? `Opsi ${(q as QuestionPG).kunci || 'A'}`
                          : q.type === 'pgk_mcma'
                          ? `${((q as QuestionPGKMCMA).options || []).filter((o) => o.isKey).length} Opsi`
                          : `${(q as QuestionPGKKategori).rows?.length || 0} Pernyataan`}
                      </span>
                    </span>

                    {q.pembahasan && q.pembahasan.trim() ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-amber-600" />
                        <span className="line-clamp-1 max-w-[280px]">
                          Pembahasan: {q.pembahasan}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        (Belum ada pembahasan)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan Ujian...' : id ? 'Simpan Perubahan' : 'Terbitkan Ujian CBT'}
            </button>
          </div>
        </form>
      </div>

      {/* Daftar Paket Ujian */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base text-slate-800">Bank Paket Ujian</h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
              {ujianList.length} Paket
            </span>
          </div>
          <button
            onClick={fetchUjianAndMaster}
            disabled={isLoading}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            Memuat daftar ujian...
          </div>
        ) : ujianList.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            Belum ada paket ujian yang diterbitkan.
          </div>
        ) : (
          <div className="space-y-3">
            {ujianList.map((u) => {
              let questionCount = 0;
              let sesiText = 'Semua';
              let maxAttemptsText = '1x';

              try {
                const raw = JSON.parse(u.Soal_JSON || '{}');
                if (raw.questions) {
                  questionCount = raw.questions.length;
                  if (raw.config?.sesi) sesiText = raw.config.sesi;
                  if (raw.config?.max_attempts !== undefined) {
                    maxAttemptsText =
                      raw.config.max_attempts === 0 ? 'Bebas' : `${raw.config.max_attempts}x`;
                  }
                } else if (Array.isArray(raw)) {
                  questionCount = raw.length;
                }
              } catch {}

              const isAktif = u.Status === 'Aktif';

              return (
                <div
                  key={u.ID}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 transition space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                          {u.Mapel}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                          Kelas: {u.Kelas}
                        </span>
                        {u.Token_Ujian && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px] font-mono border border-amber-200 flex items-center gap-1">
                            <KeyRound className="w-2.5 h-2.5 text-amber-600" />
                            Token: {u.Token_Ujian}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-800 leading-snug">
                        {u.Judul_Ujian}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {u.Durasi_Menit} Menit
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          {questionCount} Soal
                        </span>
                        <span>Maks: {maxAttemptsText}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenKisiKisiForExam(u)}
                        className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition flex items-center gap-1 font-semibold text-xs px-2"
                        title="Lihat & Kelola Kisi-Kisi Soal"
                      >
                        <BookOpen className="w-4 h-4 text-teal-600" />
                        <span className="hidden sm:inline">Kisi-Kisi</span>
                      </button>
                      <button
                        onClick={() => setExportModalExam(u)}
                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1 font-semibold text-xs px-2"
                        title="Cetak & Unduh Dokumen (PDF & Word: Naskah / Kunci / Pembahasan)"
                      >
                        <Printer className="w-4 h-4 text-indigo-600" />
                        <span className="hidden sm:inline">Cetak/Word</span>
                      </button>
                      <button
                        onClick={() => setReviewModalExam(u)}
                        className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition flex items-center gap-1 font-semibold text-xs px-2"
                        title="Review Kunci Jawaban & Pembahasan Soal"
                      >
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <span className="hidden sm:inline">Pembahasan</span>
                      </button>
                      <button
                        onClick={() => handleEditUjian(u)}
                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        title="Edit Ujian"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUjian(u)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                        title="Hapus Ujian"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`px-3 py-1 rounded-full font-bold transition flex items-center gap-1 ${
                        isAktif
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {isAktif ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>Status: {u.Status || 'Aktif'}</span>
                    </button>
                    <span className="text-[11px] text-slate-400">ID: {u.ID.slice(-8)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bulk Question Import Modal */}
      <BulkQuestionModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onApplyQuestions={handleApplyBulkQuestions}
      />

      {/* Kisi-Kisi Soal Modal */}
      {isKisiModalOpen && kisiModalExam && (
        <KisiKisiModal
          isOpen={isKisiModalOpen}
          onClose={() => {
            setIsKisiModalOpen(false);
            setKisiModalExam(null);
            setKisiModalQuestions(undefined);
          }}
          ujian={kisiModalExam}
          questions={kisiModalQuestions}
          schoolProfile={schoolProfile}
          guruName="Guru Mata Pelajaran"
          readOnly={false}
          onSaveKisiKisi={handleSaveKisiKisiFromModal}
          onGenerateQuestionsRequest={(items) => {
            setIsKisiModalOpen(false);
            setCurrentKisiKisi(items);
            setIsGenerateSoalModalOpen(true);
          }}
        />
      )}

      {/* Generate Soal dari Kisi-Kisi Modal */}
      {isGenerateSoalModalOpen && (
        <GenerateSoalKisiKisiModal
          isOpen={isGenerateSoalModalOpen}
          onClose={() => setIsGenerateSoalModalOpen(false)}
          kisiKisiList={currentKisiKisi || []}
          mapel={mapel}
          kelas={kelas}
          onApplyQuestions={handleApplyGeneratedQuestions}
          onUpdateKisiKisi={(newItems) => setCurrentKisiKisi(newItems)}
        />
      )}

      {/* Export / Cetak Exam Modal */}
      {exportModalExam && (
        <ExportExamModal
          isOpen={Boolean(exportModalExam)}
          onClose={() => setExportModalExam(null)}
          ujian={exportModalExam}
          userRole="guru"
          isStudent={false}
        />
      )}

      {/* Review Soal & Pembahasan Modal */}
      {reviewModalExam && (
        <ExamReviewModal
          isOpen={Boolean(reviewModalExam)}
          onClose={() => setReviewModalExam(null)}
          ujian={reviewModalExam}
          onViewImage={onViewImage}
          userRole="guru"
          isTeacher={true}
        />
      )}
    </div>
  );
};
