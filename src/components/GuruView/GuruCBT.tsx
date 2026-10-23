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
  FileText,
  Save,
  Loader2,
  RotateCcw,
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
import { api, sortExamsNewestFirst } from '../../services/api';
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
  exportAllExamsSummaryToExcel,
  parseQuestionsFromExcel,
} from '../../utils/excelExamHelper';
import {
  downloadExamWordTemplate,
  exportQuestionsToWord,
  parseQuestionsFromWord,
} from '../../utils/wordExamHelper';

// Penanda sesi pencegahan auto-recover berulang saat pengguna berpindah-pindah tab
let hasCheckedAutoRecoverInCurrentSession = false;

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
  const [poinPenalti, setPoinPenalti] = useState<number>(5);

  // Edit Mode: 'per_soal' (default, requirement 3) vs 'semua'
  const [editMode, setEditMode] = useState<'per_soal' | 'semua'>('per_soal');
  const [currentPerQIdx, setCurrentPerQIdx] = useState(0);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // State untuk penyimpanan per butir soal (asynchronous tanpa keluar formulir)
  const [savingSingleQIdx, setSavingSingleQIdx] = useState<number | null>(null);
  const [savedSingleQIdx, setSavedSingleQIdx] = useState<number | null>(null);
  const [singleSaveToast, setSingleSaveToast] = useState<{ title: string; message: string } | null>(null);

  // School profile & Kisi-Kisi states
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [currentKisiKisi, setCurrentKisiKisi] = useState<KisiKisiItem[] | null>(null);
  const [kisiModalExam, setKisiModalExam] = useState<Ujian | null>(null);
  const [kisiModalQuestions, setKisiModalQuestions] = useState<Question[] | undefined>(undefined);
  const [isKisiModalOpen, setIsKisiModalOpen] = useState(false);
  const [isGenerateSoalModalOpen, setIsGenerateSoalModalOpen] = useState(false);
  const [exportModalExam, setExportModalExam] = useState<Ujian | null>(null);
  const [reviewModalExam, setReviewModalExam] = useState<Ujian | null>(null);
  const [recoverableDraft, setRecoverableDraft] = useState<{
    source: string;
    examMeta?: any;
    questions: Question[];
    count: number;
    timestamp?: string;
  } | null>(null);

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
        message: 'Tidak ada butir soal pada formulir aktif untuk diekspor ke Excel.',
        type: 'warning',
      });
      return;
    }
    try {
      exportQuestionsToExcel(judul || 'Bank_Soal', questions);
      onShowModal({
        isOpen: true,
        title: 'Ekspor Excel Berhasil',
        message: `Berhasil mengekspor ${questions.length} butir soal dari "${judul || 'Bank Soal'}" ke file Excel (.xlsx).`,
        type: 'success',
      });
    } catch (err: any) {
      onShowModal({
        isOpen: true,
        title: 'Gagal Ekspor Excel',
        message: err?.message || 'Terjadi kesalahan saat mengunduh file Excel.',
        type: 'danger',
      });
    }
  };

  const handleImportWordFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseQuestionsFromWord(file);
      if (!parsed || parsed.length === 0) {
        throw new Error('Tidak ada butir soal yang dapat dibaca dari file Word.');
      }
      setQuestions(parsed);
      setCurrentPerQIdx(0);
      onShowModal({
        isOpen: true,
        title: 'Impor Word Berhasil',
        message: `Berhasil mengimpor ${parsed.length} butir soal dari file Word "${file.name}"! Seluruh tipe soal (PG, PGK Kategori, Menjodohkan/MCMA) telah dimasukkan ke bank soal.`,
        type: 'success',
      });
    } catch (err: any) {
      onShowModal({
        isOpen: true,
        title: 'Gagal Impor Word',
        message: err?.message || 'Terjadi kendala saat membaca file Word (.docx). Silakan unduh "Format Word" sebagai panduan baku.',
        type: 'danger',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleExportWord = async () => {
    if (questions.length === 0) {
      onShowModal({
        isOpen: true,
        title: 'Tidak Ada Soal',
        message: 'Tidak ada butir soal pada formulir aktif untuk diekspor ke Word.',
        type: 'warning',
      });
      return;
    }
    try {
      await exportQuestionsToWord(judul || 'Bank_Soal', questions, schoolProfile);
      onShowModal({
        isOpen: true,
        title: 'Ekspor Word Berhasil',
        message: `Berhasil mengekspor ${questions.length} butir soal dari "${judul || 'Bank Soal'}" ke dokumen Word (.docx) lengkap dengan kunci jawaban dan pembahasan!`,
        type: 'success',
      });
    } catch (err: any) {
      onShowModal({
        isOpen: true,
        title: 'Gagal Ekspor Word',
        message: err?.message || 'Terjadi kesalahan saat mengunduh dokumen Word.',
        type: 'danger',
      });
    }
  };

  const handleExportUjianToWord = async (u: Ujian) => {
    let questionsToExport: Question[] = [];
    try {
      const raw = JSON.parse(u.Soal_JSON || '{}');
      if (raw.questions && Array.isArray(raw.questions)) {
        questionsToExport = raw.questions;
      } else if (Array.isArray(raw)) {
        questionsToExport = raw;
      }
    } catch {
      questionsToExport = [];
    }

    if (questionsToExport.length === 0) {
      onShowModal({
        isOpen: true,
        title: 'Tidak Ada Butir Soal',
        message: `Paket ujian "${u.Judul_Ujian}" belum memiliki butir soal untuk diekspor ke Word.`,
        type: 'warning',
      });
      return;
    }

    try {
      await exportQuestionsToWord(u.Judul_Ujian || 'Bank_Soal', questionsToExport, schoolProfile);
      onShowModal({
        isOpen: true,
        title: 'Ekspor Word Berhasil',
        message: `Berhasil mengekspor ${questionsToExport.length} butir soal dari ujian "${u.Judul_Ujian}" ke dokumen Word (.docx).`,
        type: 'success',
      });
    } catch (err: any) {
      onShowModal({
        isOpen: true,
        title: 'Gagal Ekspor Word',
        message: err?.message || 'Terjadi kesalahan saat mengunduh dokumen Word.',
        type: 'danger',
      });
    }
  };

  const handleExportUjianToExcel = (u: Ujian) => {
    let questionsToExport: Question[] = [];
    try {
      const raw = JSON.parse(u.Soal_JSON || '{}');
      if (raw.questions && Array.isArray(raw.questions)) {
        questionsToExport = raw.questions;
      } else if (Array.isArray(raw)) {
        questionsToExport = raw;
      }
    } catch {
      questionsToExport = [];
    }

    if (questionsToExport.length === 0) {
      onShowModal({
        isOpen: true,
        title: 'Tidak Ada Butir Soal',
        message: `Paket ujian "${u.Judul_Ujian}" belum memiliki butir soal untuk diekspor ke Excel.`,
        type: 'warning',
      });
      return;
    }

    try {
      exportQuestionsToExcel(u.Judul_Ujian || 'Bank_Soal', questionsToExport);
      onShowModal({
        isOpen: true,
        title: 'Ekspor Excel Berhasil',
        message: `Berhasil mengekspor ${questionsToExport.length} butir soal dari ujian "${u.Judul_Ujian}" ke file Excel (.xlsx).`,
        type: 'success',
      });
    } catch (err: any) {
      onShowModal({
        isOpen: true,
        title: 'Gagal Ekspor Excel',
        message: err?.message || 'Terjadi kesalahan saat mengunduh file Excel.',
        type: 'danger',
      });
    }
  };

  const handleExportAllExamsCatalog = () => {
    if (ujianList.length === 0) {
      onShowModal({
        isOpen: true,
        title: 'Daftar Kosong',
        message: 'Belum ada paket ujian yang tersimpan untuk diekspor ke Excel.',
        type: 'warning',
      });
      return;
    }
    try {
      exportAllExamsSummaryToExcel(ujianList, schoolProfile || undefined);
      onShowModal({
        isOpen: true,
        title: 'Ekspor Katalog Berhasil',
        message: `Berhasil mengekspor daftar ringkasan ${ujianList.length} paket ujian ke file Excel (.xlsx).`,
        type: 'success',
      });
    } catch (err: any) {
      onShowModal({
        isOpen: true,
        title: 'Gagal Ekspor Excel',
        message: err?.message || 'Terjadi kesalahan saat mengunduh katalog Excel.',
        type: 'danger',
      });
    }
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
      setUjianList((prev) => {
        const remoteArr = uList || [];
        const mergedMap = new Map<string, Ujian>();
        remoteArr.forEach((u) => {
          if (u && u.ID) mergedMap.set(u.ID, u);
        });
        prev.forEach((p) => {
          if (p && p.ID) {
            const existing = mergedMap.get(p.ID);
            if (!existing) {
              mergedMap.set(p.ID, p);
            } else {
              try {
                const existingCount = JSON.parse(existing.Soal_JSON || '{}')?.questions?.length || 0;
                const localCount = JSON.parse(p.Soal_JSON || '{}')?.questions?.length || 0;
                if (localCount > existingCount) {
                  mergedMap.set(p.ID, p);
                }
              } catch {}
            }
          }
        });
        return sortExamsNewestFirst(Array.from(mergedMap.values()));
      });
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
    setPoinPenalti(5);
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
        pembahasan: '',
      },
    ]);
  };

  // Auto-Save naskah soal aktif secara berkala & otomatis saat guru mengetik/menambah soal
  useEffect(() => {
    if (questions.length > 0 && (judul.trim() || questions.some((q) => q.soal?.trim()))) {
      try {
        localStorage.setItem(
          'cbt_active_editor_draft',
          JSON.stringify({
            id,
            judul,
            mapel,
            kelas,
            durasi,
            sesi,
            maxAttempts,
            acakSoal,
            acakOpsi,
            jadwalMulai,
            jadwalSelesai,
            tokenUjian,
            poinPenalti,
            currentKisiKisi,
            questions,
            timestamp: new Date().toISOString(),
          })
        );
      } catch {}
    }
  }, [questions, judul, mapel, kelas, durasi, sesi, maxAttempts, acakSoal, acakOpsi, jadwalMulai, jadwalSelesai, tokenUjian, poinPenalti, currentKisiKisi, id]);

  useEffect(() => {
    if (questions.length === 0) {
      resetForm();
    }

    // Ketentuan 3: Hindari re-trigger pemindaian Auto-Recover saat bernavigasi antar tab
    if (hasCheckedAutoRecoverInCurrentSession) return;
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('cbt_auto_recover_handled') === 'true') {
        hasCheckedAutoRecoverInCurrentSession = true;
        return;
      }
    } catch {}

    // Ketentuan 2: Periksa apakah editor aktif saat ini benar-benar kosong/lebih sedikit dari draft
    const hasActiveContent = questions.some((q) => Boolean(q.soal && q.soal.trim().length > 0));
    const activeQCount = hasActiveContent ? questions.length : 0;

    try {
      const found = api.scanAndRescueDraftQuestions(activeQCount);
      hasCheckedAutoRecoverInCurrentSession = true;
      if (found && found.questions && found.questions.length > activeQCount) {
        setRecoverableDraft(found as any);
      }
    } catch {}
  }, []);

  const handleRestoreDraft = () => {
    if (!recoverableDraft) return;
    const { questions: rescuedQs, examMeta, storageKeyToClean } = recoverableDraft as any;
    setQuestions(rescuedQs);
    if (examMeta?.judul) setJudul(examMeta.judul);
    else if (examMeta?.Judul_Ujian) setJudul(examMeta.Judul_Ujian);
    if (examMeta?.mapel || examMeta?.Mapel) setMapel(examMeta.mapel || examMeta.Mapel);
    if (examMeta?.kelas || examMeta?.Kelas) setKelas(examMeta.kelas || examMeta.Kelas);
    if (examMeta?.durasi || examMeta?.Durasi_Menit) setDurasi(Number(examMeta.durasi || examMeta.Durasi_Menit) || 60);
    if (examMeta?.sesi) setSesi(examMeta.sesi);
    if (examMeta?.tokenUjian || examMeta?.Token_Ujian) setTokenUjian(examMeta.tokenUjian || examMeta.Token_Ujian);
    if (examMeta?.currentKisiKisi) setCurrentKisiKisi(examMeta.currentKisiKisi);
    if (examMeta?.id || examMeta?.ID) setId(examMeta.id || examMeta.ID);
    setCurrentPerQIdx(0);

    // Ketentuan 1: Hapus data cadangan di penyimpanan lokal dan setel flag status pemulihan
    try {
      api.clearRecoveredDraft(storageKeyToClean);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('cbt_auto_recover_handled', 'true');
      }
      localStorage.setItem('cbt_draft_has_recovered', 'true');
    } catch {}

    hasCheckedAutoRecoverInCurrentSession = true;
    setRecoverableDraft(null);

    onShowModal({
      isOpen: true,
      title: 'Naskah Soal Berhasil Dipulihkan! 📝',
      message: `Berhasil mengembalikan ${rescuedQs.length} butir soal dari ${recoverableDraft.source}. Seluruh naskah Anda siap dilanjutkan penyuntingannya atau langsung diterbitkan ke CBT!`,
      type: 'success',
      isConfirm: false,
    });
  };

  const handleDismissDraft = () => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('cbt_auto_recover_handled', 'true');
      }
      if (recoverableDraft) {
        api.clearRecoveredDraft((recoverableDraft as any).storageKeyToClean);
      }
    } catch {}
    hasCheckedAutoRecoverInCurrentSession = true;
    setRecoverableDraft(null);
  };

  const handleEditUjian = (u: Ujian) => {
    setRecoverableDraft(null);
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
        pembahasan: '',
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
        pembahasan: '',
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
        pembahasan: '',
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

  // Penyimpanan Per Butir Soal secara Asynchronous tanpa menutup sesi editor
  const handleSaveSingleQuestion = async (idx: number, updatedQ?: Question) => {
    const targetQ = updatedQ || questions[idx];
    if (!targetQ) return;

    setSavingSingleQIdx(idx);

    // Pastikan state pertanyaan ter-update
    const updatedQuestions = [...questions];
    updatedQuestions[idx] = targetQ;
    setQuestions(updatedQuestions);

    const questionTypeLabel =
      targetQ.type === 'pg'
        ? 'Pilihan Ganda'
        : targetQ.type === 'pgk_kategori'
        ? 'PGK Kategori / Menjodohkan'
        : 'PGK Centang';

    try {
      const res = await api.saveSingleQuestionDraft(
        id || undefined,
        idx,
        targetQ,
        updatedQuestions,
        {
          Judul_Ujian: judul.trim() || 'Draft Ujian Baru',
          Mapel: mapel.trim() || 'Umum',
          Kelas: kelas.trim() || 'Semua',
          Durasi_Menit: Math.max(1, Number(durasi) || 1),
          Token_Ujian: tokenUjian.trim() || undefined,
          Jadwal_Mulai: jadwalMulai || undefined,
          Jadwal_Selesai: jadwalSelesai || undefined,
          Kisi_Kisi_JSON: currentKisiKisi ? JSON.stringify(currentKisiKisi) : undefined,
          Status: 'Aktif',
        }
      );

      // Jika exam belum memiliki ID, ikat ID yang baru dibuat agar update berikutnya terus ke paket yang sama
      if (!id && res.id) {
        setId(res.id);
      }

      setSavedSingleQIdx(idx);
      setSingleSaveToast({
        title: `Butir Soal #${idx + 1} Tersimpan! ✓`,
        message: `Soal ${questionTypeLabel} No. ${idx + 1} berhasil disimpan ke database/penyimpanan. Anda dapat langsung melanjutkan menulis soal berikutnya dengan nyaman!`,
      });

      setTimeout(() => setSavedSingleQIdx(null), 3000);
      setTimeout(() => setSingleSaveToast(null), 4000);

      // Sinkronkan daftar ujian di latar belakang
      api.getUjianList('Semua', 'guru').then((list) => setUjianList(list)).catch(() => {});
    } catch (err) {
      console.warn('Gagal menyimpan butir soal:', err);
      setSingleSaveToast({
        title: `Tersimpan Sementara di Cache Lokal`,
        message: `Butir soal No. ${idx + 1} diamankan di memori peramban. Sesi tetap aktif dan Anda dapat melanjutkan menulis soal.`,
      });
      setTimeout(() => setSingleSaveToast(null), 4000);
    } finally {
      setSavingSingleQIdx(null);
    }
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
    const targetExamId = id || undefined;

    try {
      const res = await api.saveUjian({
        ID: targetExamId,
        Judul_Ujian: judul.trim(),
        Mapel: mapel.trim(),
        Kelas: kelas.trim(),
        Durasi_Menit: Math.max(1, Number(durasi) || 1),
        Jadwal_Mulai: jadwalMulai || undefined,
        Jadwal_Selesai: jadwalSelesai || undefined,
        Token_Ujian: tokenUjian.trim() || undefined,
        Kisi_Kisi_JSON: currentKisiKisi ? JSON.stringify(currentKisiKisi) : undefined,
        soal: payload,
        Status: 'Aktif', // Otomatisasi Status Aktif (Launching)
      });

      setIsSaving(false);

      if (res.success) {
        const savedExam: Ujian = (res as any).ujian || {
          ID: res.id || targetExamId || 'EXAM-' + Date.now(),
          Judul_Ujian: judul.trim(),
          Mapel: mapel.trim(),
          Kelas: kelas.trim(),
          Durasi_Menit: Math.max(1, Number(durasi) || 1),
          Token_Ujian: tokenUjian.trim() || undefined,
          Jadwal_Mulai: jadwalMulai || undefined,
          Jadwal_Selesai: jadwalSelesai || undefined,
          Kisi_Kisi_JSON: currentKisiKisi ? JSON.stringify(currentKisiKisi) : undefined,
          Soal_JSON: JSON.stringify(payload),
          Status: 'Aktif',
        };

        // Langsung masukkan ke state ujianList seketika di posisi teratas agar langsung tampil di Bank Paket Ujian
        setUjianList((prev) => {
          const filtered = prev.filter((u) => u.ID !== savedExam.ID);
          return [savedExam, ...filtered];
        });

        // Simpan cadangan permanen naskah butir soal agar tidak pernah hilang
        try {
          localStorage.setItem(`cbt_backup_exam_${savedExam.ID}`, JSON.stringify(savedExam));
          localStorage.setItem('cbt_last_saved_exam_backup', JSON.stringify(savedExam));
        } catch {}

        // Bersihkan draft aktif karena telah sukses disimpan dan diterbitkan ke database
        try {
          api.clearRecoveredDraft(`cbt_draft_q_${targetExamId || 'current'}`);
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('cbt_auto_recover_handled', 'true');
          }
        } catch {}
        hasCheckedAutoRecoverInCurrentSession = true;
        setRecoverableDraft(null);

        onShowModal({
          isOpen: true,
          title: 'Paket Ujian Aktif & Diterbitkan! 🚀',
          message: `Paket soal "${judul.trim()}" (${questions.length} butir soal) berhasil disimpan dan resmi masuk ke Bank Paket Ujian dengan status otomatis AKTIF / LAUNCHING! Siswa kini langsung dapat mengaksesnya di Beranda CBT.`,
          type: 'success',
          isConfirm: false,
        });

        resetForm();
        fetchUjianAndMaster();
      } else {
        onShowModal({
          isOpen: true,
          title: 'Gagal Menyimpan Ujian',
          message: res.message || 'Terjadi kesalahan saat menyimpan paket ujian.',
          type: 'error',
          isConfirm: false,
        });
      }
    } catch (err: any) {
      setIsSaving(false);
      onShowModal({
        isOpen: true,
        title: 'Gagal Menyimpan Ujian',
        message: err?.message || 'Terjadi kesalahan saat memproses penyimpanan paket ujian.',
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
      Durasi_Menit: Math.max(1, Number(durasi) || 1),
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

        {/* Banner Pemulihan Naskah Soal Terdeteksi */}
        {recoverableDraft && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-200/90 text-amber-900 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-amber-700 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-xs sm:text-sm text-amber-900">
                    Ditemukan Naskah Butir Soal Tersimpan ({recoverableDraft.count} Soal)!
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                    Auto-Recover
                  </span>
                </div>
                <p className="text-xs text-amber-800">
                  {recoverableDraft.examMeta?.judul || recoverableDraft.examMeta?.Judul_Ujian
                    ? `Paket: "${recoverableDraft.examMeta?.judul || recoverableDraft.examMeta?.Judul_Ujian}". `
                    : ''}
                  Sistem mendeteksi naskah butir soal sebelumnya di memori/cache peramban ({recoverableDraft.source}). Klik tombol di samping untuk memulihkan {recoverableDraft.count} butir soal Anda seketika.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 active:scale-95 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-white" />
                <span>Pulihkan {recoverableDraft.count} Soal Sekarang</span>
              </button>
              <button
                type="button"
                onClick={handleDismissDraft}
                className="px-3 py-2 rounded-xl bg-white/90 hover:bg-white text-slate-600 text-xs font-bold border border-amber-200 transition cursor-pointer"
                title="Tutup pemberitahuan pemulihan naskah"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Durasi Ujian (Menit Bebas)
              </label>
              <input
                type="number"
                value={durasi === 0 ? '' : durasi}
                min={1}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setDurasi(0);
                  } else {
                    const num = parseInt(val, 10);
                    setDurasi(isNaN(num) ? 0 : Math.max(1, num));
                  }
                }}
                placeholder="Contoh: 1, 2, 10, 60..."
                required
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-bold"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Durasi bebas tanpa batasan minimal 5 menit (contoh: 1, 2, 15, 60 menit).
              </span>
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

            {/* Action Buttons: Kisi-Kisi, Excel, and Word */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsGenerateSoalModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1"
                title="Buat soal CBT secara otomatis berdasarkan matriks kisi-kisi Kurikulum Merdeka"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Buat dari Kisi-Kisi</span>
              </button>

              {/* Excel Group */}
              <button
                type="button"
                onClick={downloadExamExcelTemplate}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
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
                className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                title="Ekspor Seluruh Butir Soal ke Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>Ekspor Excel</span>
              </button>

              {/* Word Group (Berdampingan dengan Excel untuk seluruh jenis soal) */}
              <button
                type="button"
                onClick={downloadExamWordTemplate}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                title="Unduh Format & Templat Dokumen Word (.docx) Soal (PG, PGK Kategori, Menjodohkan/MCMA)"
              >
                <Download className="w-3 h-3 text-blue-600" />
                <span className="hidden sm:inline">Format Word</span>
              </button>

              <label
                className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                title="Unggah dan Impor Kumpulan Soal dari Berkas Word (.docx)"
              >
                <FileText className="w-3.5 h-3.5 text-blue-100" />
                <span>Impor Word</span>
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleImportWordFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleExportWord}
                className="px-2.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-95 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                title="Ekspor Seluruh Butir Soal ke Dokumen Word (.docx)"
              >
                <FileText className="w-3.5 h-3.5 text-blue-200" />
                <span>Ekspor Word</span>
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
              onSaveSingleQuestion={handleSaveSingleQuestion}
              isSavingQuestion={savingSingleQIdx === currentPerQIdx}
              savedQuestionIdx={savedSingleQIdx}
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
                      {/* Tombol Simpan Per Butir Soal di Card Daftar Panjang */}
                      <button
                        type="button"
                        onClick={() => handleSaveSingleQuestion(qIdx, q)}
                        disabled={savingSingleQIdx === qIdx}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          savedSingleQIdx === qIdx
                            ? 'bg-emerald-700 text-white ring-2 ring-emerald-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        } disabled:opacity-50`}
                        title="Simpan Butir Soal Ini Sekarang (Asynchronous Tanpa Menutup Sesi)"
                      >
                        {savingSingleQIdx === qIdx ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : savedSingleQIdx === qIdx ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            <span>Tersimpan! ✓</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3 text-white" />
                            <span>Simpan Soal</span>
                          </>
                        )}
                      </button>

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
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-medium text-slate-700 line-clamp-2">
                    {q.soal || '(Belum ada teks pertanyaan)'}
                  </p>

                  {/* Kunci Jawaban Badge */}
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

                    <span className={`px-2 py-0.5 rounded-md border font-bold flex items-center gap-1 ${
                      q.pembahasan && q.pembahasan.trim()
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      <Lightbulb className="w-3 h-3 text-amber-600" />
                      <span>{q.pembahasan && q.pembahasan.trim() ? 'Pembahasan Terisi' : 'Pembahasan Belum Diisi'}</span>
                    </span>
                  </div>

                  {/* Input Khusus Pembahasan Soal */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        <span>Kolom Pembahasan Soal No. {qIdx + 1}:</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPerQIdx(qIdx);
                          setEditMode('per_soal');
                        }}
                        className="text-[10px] text-indigo-600 font-bold hover:underline"
                      >
                        Buka Toolbar LaTeX/Rumus
                      </button>
                    </div>
                    <textarea
                      value={q.pembahasan || ''}
                      onChange={(e) => updateQuestionField(qIdx, 'pembahasan', e.target.value)}
                      rows={2}
                      placeholder="Ketikkan pembahasan & langkah penyelesaian materi di sini..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed font-normal"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button (Otomatisasi Status Aktif / Launching) */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500 font-medium">
              💡 Tombol <strong>Simpan Perubahan</strong> otomatis mengatur paket ujian menjadi <strong>Status Aktif (Launching)</strong> sehingga siswa langsung dapat mengaksesnya.
            </span>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Menyimpan & Mengaktifkan Ujian...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{id ? 'Simpan Perubahan & Aktifkan (Launching)' : 'Terbitkan & Aktifkan Ujian CBT (Launching)'}</span>
                </>
              )}
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAllExamsCatalog}
              disabled={isLoading || ujianList.length === 0}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition flex items-center gap-1.5 disabled:opacity-50"
              title="Ekspor Seluruh Katalog Paket Ujian ke File Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Daftar</span>
            </button>
            <button
              onClick={fetchUjianAndMaster}
              disabled={isLoading}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              Refresh
            </button>
          </div>
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
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition w-full overflow-hidden space-y-3"
                >
                  {/* Baris 1 (Header Kartu): Badge Mata Pelajaran, Target Kelas, dan Token Ujian */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                      {u.Mapel}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                      Kelas: {u.Kelas}
                    </span>
                    {u.Token_Ujian && (
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[11px] font-mono border border-amber-200 flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-amber-600" />
                        Token: {u.Token_Ujian}
                      </span>
                    )}
                  </div>

                  {/* Baris 2 (Judul Ujian): Judul Ujian secara utuh di baris tersendiri tanpa dipapit/didampingi tombol di sampingnya (w-full block) */}
                  <div className="w-full">
                    <h4 className="font-bold text-base sm:text-lg text-slate-800 leading-snug break-words">
                      {u.Judul_Ujian}
                    </h4>
                  </div>

                  {/* Baris 3 (Meta Informasi): Durasi menit, jumlah soal, dan batas percobaan */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
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

                  {/* Baris 4 (Baris Tombol Aksi): Satu Kontainer Pembungkus Terpadu (In-Line Pill Container) */}
                  <div className="pt-3 mt-3 border-t border-slate-100 w-full">
                    <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-100/80 rounded-xl border border-slate-200/60 w-full">
                      <button
                        onClick={() => handleOpenKisiKisiForExam(u)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70 transition flex items-center gap-1.5 font-medium text-xs shadow-xs shrink-0"
                        title="Lihat & Kelola Kisi-Kisi Soal"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kisi-Kisi</span>
                      </button>
                      <button
                        onClick={() => setExportModalExam(u)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/70 transition flex items-center gap-1.5 font-medium text-xs shadow-xs shrink-0"
                        title="Cetak & Unduh Dokumen (PDF, Word, Excel)"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>Cetak/Word</span>
                      </button>
                      <button
                        onClick={() => handleExportUjianToExcel(u)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition flex items-center gap-1.5 font-bold text-xs shadow-xs shrink-0 cursor-pointer"
                        title="Ekspor Seluruh Butir Soal ke Excel (.xlsx)"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ekspor Excel</span>
                      </button>
                      <button
                        onClick={() => handleExportUjianToWord(u)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-300 transition flex items-center gap-1.5 font-bold text-xs shadow-xs shrink-0 cursor-pointer"
                        title="Ekspor Seluruh Butir Soal ke Word (.docx)"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ekspor Word</span>
                      </button>
                      <button
                        onClick={() => setReviewModalExam(u)}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/70 transition flex items-center gap-1.5 font-medium text-xs shadow-xs shrink-0"
                        title="Review Kunci Jawaban & Pembahasan Soal"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pembahasan</span>
                      </button>
                      <button
                        onClick={() => handleEditUjian(u)}
                        className="px-3 py-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-600 border border-slate-200 transition flex items-center gap-1.5 font-medium text-xs shadow-xs shrink-0"
                        title="Edit Ujian"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUjian(u)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 transition flex items-center gap-1.5 font-medium text-xs shadow-xs shrink-0"
                        title="Hapus Ujian"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
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

      {/* Floating Notification Toast for Asynchronous Single-Question Save */}
      {singleSaveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl backdrop-blur-md border border-emerald-500/50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs max-w-sm">
            <p className="font-black text-emerald-400">{singleSaveToast.title}</p>
            <p className="text-slate-200 text-[11px] leading-relaxed">{singleSaveToast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
