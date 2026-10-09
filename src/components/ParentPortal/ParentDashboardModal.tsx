import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  Award,
  HeartHandshake,
  X,
  Printer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Search,
  Filter,
  RefreshCw,
  BookOpen,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Layers,
  HelpCircle,
  Clock,
  Eye,
  KeyRound,
} from 'lucide-react';
import { User, Nilai, Ujian, SchoolProfile, Question, QuestionPG, QuestionPGKMCMA, QuestionPGKKategori, getQuestionImages } from '../../types';
import { api } from '../../services/api';
import { MathRenderer } from '../MathRenderer';
import { printParentReportDocument } from '../../utils/parentReportPrintHelper';

interface ParentDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: User;
  onViewImage?: (url: string, title?: string) => void;
}

type TabType = 'ringkasan' | 'rekap_grafik' | 'review_pembahasan' | 'catatan_rapor';

export const ParentDashboardModal: React.FC<ParentDashboardModalProps> = ({
  isOpen,
  onClose,
  student,
  onViewImage,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('ringkasan');
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [ujianList, setUjianList] = useState<Ujian[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter in Rekap Nilai
  const [filterMapel, setFilterMapel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'tuntas' | 'remedial'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Exam for Review Pembahasan
  const [selectedReviewNilaiId, setSelectedReviewNilaiId] = useState<string>('');
  const [reviewFilterMode, setReviewFilterMode] = useState<'all' | 'wrong' | 'correct'>('wrong');

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [hasil, exams, profile] = await Promise.all([
        api.getHasilMurid(student.nama),
        api.getUjianList(student.kelas || 'Semua', 'guru'),
        api.getSchoolProfile().catch(() => null),
      ]);
      setNilaiList(hasil || []);
      setUjianList(exams || []);
      if (profile) setSchoolProfile(profile);

      // Auto select first exam for review if exists
      if (hasil && hasil.length > 0) {
        setSelectedReviewNilaiId(hasil[0].ID);
      }
    } catch (err) {
      console.warn('Gagal memuat data portal orang tua:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, student.nama, student.kelas]);

  if (!isOpen) return null;

  const kkm = schoolProfile?.kkmDefault || 75;

  // Key Calculations
  const totalExams = nilaiList.length;
  const numericNilai = nilaiList.map((n) => Number(n.Nilai || 0));
  const avgScore =
    totalExams > 0
      ? (numericNilai.reduce((a, b) => a + b, 0) / totalExams).toFixed(2)
      : '0.00';
  const highestScore = totalExams > 0 ? Math.max(...numericNilai).toFixed(2) : '0.00';
  const lowestScore = totalExams > 0 ? Math.min(...numericNilai).toFixed(2) : '0.00';
  const tuntasCount = nilaiList.filter((n) => Number(n.Nilai || 0) >= kkm).length;
  const remedialCount = totalExams - tuntasCount;
  const tuntasPercentage = totalExams > 0 ? Math.round((tuntasCount / totalExams) * 100) : 0;
  const totalPelanggaran = nilaiList.reduce((acc, curr) => acc + (curr.Pelanggaran || 0), 0);
  const isDisciplined = totalPelanggaran === 0;

  // Filtered Nilai for Rekap Table
  const filteredNilaiList = nilaiList.filter((n) => {
    const score = Number(n.Nilai || 0);
    const matchesSearch =
      (n.Judul_Ujian || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.Catatan_Guru || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'tuntas'
        ? score >= kkm
        : score < kkm;
    const matchesMapel =
      filterMapel === 'all'
        ? true
        : (n.Judul_Ujian || '').toLowerCase().includes(filterMapel.toLowerCase());
    return matchesSearch && matchesStatus && matchesMapel;
  });

  // Unique Subjects for filter
  const subjectList = ['Matematika', 'IPA', 'Bahasa Indonesia', 'Bahasa Inggris', 'Pendidikan Pancasila', 'IPS', 'PJOK', 'Pendidikan Agama'];

  // Current selected exam & questions for Review Tab
  const selectedNilai = nilaiList.find((n) => n.ID === selectedReviewNilaiId) || nilaiList[0];
  const selectedUjian = selectedNilai
    ? ujianList.find(
        (u) =>
          u.ID === selectedNilai.ID_Ujian ||
          (u.Judul_Ujian &&
            selectedNilai.Judul_Ujian &&
            u.Judul_Ujian.trim().toLowerCase() === selectedNilai.Judul_Ujian.trim().toLowerCase())
      )
    : null;

  // Parse questions and student answers from Nilai.Jawaban_JSON and Ujian.Soal_JSON
  let examQuestions: Question[] = [];
  let studentAnswers: Record<string | number, any> = {};

  if (selectedNilai?.Jawaban_JSON) {
    try {
      const parsed =
        typeof selectedNilai.Jawaban_JSON === 'string'
          ? JSON.parse(selectedNilai.Jawaban_JSON)
          : selectedNilai.Jawaban_JSON;

      if (parsed && typeof parsed === 'object') {
        if (parsed.answers && typeof parsed.answers === 'object') {
          studentAnswers = parsed.answers;
        } else if (parsed.userAnswers && typeof parsed.userAnswers === 'object') {
          studentAnswers = parsed.userAnswers;
        } else {
          studentAnswers = parsed;
        }

        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          examQuestions = parsed.questions;
        }
      }
    } catch (e) {
      console.warn('Gagal mem-parse Jawaban_JSON:', e);
    }
  }

  // Fallback to selectedUjian.Soal_JSON if questions still empty
  if (examQuestions.length === 0 && selectedUjian?.Soal_JSON) {
    try {
      const raw =
        typeof selectedUjian.Soal_JSON === 'string'
          ? JSON.parse(selectedUjian.Soal_JSON)
          : selectedUjian.Soal_JSON;
      if (raw.questions && Array.isArray(raw.questions)) {
        examQuestions = raw.questions;
      } else if (Array.isArray(raw)) {
        examQuestions = raw;
      }
    } catch (e) {
      console.warn('Gagal mem-parse Soal_JSON dari ujian terpilih:', e);
    }
  }

  // Fallback searching any matching ujian in ujianList by title
  if (examQuestions.length === 0 && selectedNilai) {
    const fallbackUjian = ujianList.find(
      (u) =>
        (u.Judul_Ujian &&
          selectedNilai.Judul_Ujian &&
          u.Judul_Ujian.toLowerCase().includes(selectedNilai.Judul_Ujian.toLowerCase())) ||
        (selectedNilai.Judul_Ujian &&
          u.Judul_Ujian &&
          selectedNilai.Judul_Ujian.toLowerCase().includes(u.Judul_Ujian.toLowerCase()))
    );
    if (fallbackUjian?.Soal_JSON) {
      try {
        const raw =
          typeof fallbackUjian.Soal_JSON === 'string'
            ? JSON.parse(fallbackUjian.Soal_JSON)
            : fallbackUjian.Soal_JSON;
        if (raw.questions && Array.isArray(raw.questions)) {
          examQuestions = raw.questions;
        } else if (Array.isArray(raw)) {
          examQuestions = raw;
        }
      } catch {}
    }
  }

  // Helper untuk mendapatkan jawaban siswa per butir soal
  const getStudentAnswerForQuestion = (idx: number, q: Question) => {
    if (studentAnswers[idx] !== undefined) return studentAnswers[idx];
    if (studentAnswers[String(idx)] !== undefined) return studentAnswers[String(idx)];
    if ((q as any).id && studentAnswers[(q as any).id] !== undefined) return studentAnswers[(q as any).id];
    return undefined;
  };

  // Status kelengkapan pengerjaan
  const isQuestionAnswered = (q: Question, ans: any): boolean => {
    if (ans === undefined || ans === null || ans === '') return false;
    if (q.type === 'pg') {
      return typeof ans === 'string' && ans.trim().length > 0;
    } else if (q.type === 'pgk_mcma') {
      return Array.isArray(ans) && ans.some((v) => v === true || typeof v === 'number');
    } else if (q.type === 'pgk_kategori') {
      return typeof ans === 'object' && Object.keys(ans).length > 0;
    }
    return true;
  };

  const totalQuestions = examQuestions.length;
  let answeredCount = examQuestions.filter((q, idx) =>
    isQuestionAnswered(q, getStudentAnswerForQuestion(idx, q))
  ).length;

  if (answeredCount === 0 && totalQuestions > 0 && selectedNilai) {
    if (Object.keys(studentAnswers).length > 0) {
      answeredCount = Math.min(totalQuestions, Object.keys(studentAnswers).length);
    } else if (selectedNilai.Nilai !== undefined) {
      answeredCount = totalQuestions;
    }
  }

  // Syarat Pembukaan Pembahasan di Portal Orang Tua:
  // HARUS LANGSUNG TERBUKA apabila hasil ujian siswa sudah memiliki status Selesai / Sudah Dikirim (Submitted)
  // atau sudah memiliki nilai akhir (termasuk nilai 0.00 sekalipun jika ujian memang sudah selesai/dikirim).
  const isSubmittedExam = Boolean(
    selectedNilai &&
      (selectedNilai.Nilai !== undefined ||
        selectedNilai.Waktu_Submit ||
        selectedNilai.ID ||
        selectedNilai.Jawaban_JSON)
  );
  const isReviewUnlocked = Boolean(selectedNilai && isSubmittedExam);

  // Correct / Wrong assessment
  const isAnswerCorrect = (q: Question, ans: any): boolean => {
    if (ans === undefined || ans === null || ans === '') return false;
    if (q.type === 'pg') {
      const studentAnsStr = String(ans).trim().toUpperCase();
      const keyStr = String((q as QuestionPG).kunci || '').trim().toUpperCase();
      return studentAnsStr.length > 0 && studentAnsStr === keyStr;
    } else if (q.type === 'pgk_mcma') {
      const mcma = q as QuestionPGKMCMA;
      if (!Array.isArray(ans)) return false;
      const isSelected = (oIdx: number) =>
        ans[oIdx] === true || (ans as any[]).includes(oIdx);
      return (
        mcma.options.length > 0 &&
        mcma.options.every((opt, optIdx) => Boolean(opt.isKey) === Boolean(isSelected(optIdx)))
      );
    } else if (q.type === 'pgk_kategori') {
      const kat = q as QuestionPGKKategori;
      if (!ans || typeof ans !== 'object') return false;
      return (
        kat.rows.length > 0 &&
        kat.rows.every((row, rIdx) => {
          const choice = ans[rIdx] ?? ans[String(rIdx)];
          return choice === row.key;
        })
      );
    }
    return false;
  };

  // Questions with status
  const analyzedQuestions = examQuestions.map((q, idx) => {
    const ans = getStudentAnswerForQuestion(idx, q);
    const correct = isAnswerCorrect(q, ans);
    return {
      index: idx,
      question: q,
      studentAnswer: ans,
      isCorrect: correct,
    };
  });

  const wrongCount = analyzedQuestions.filter((item) => !item.isCorrect).length;
  const correctCount = analyzedQuestions.filter((item) => item.isCorrect).length;

  const displayQuestions = analyzedQuestions.filter((item) => {
    if (reviewFilterMode === 'all') return true;
    if (reviewFilterMode === 'wrong') return !item.isCorrect;
    if (reviewFilterMode === 'correct') return item.isCorrect;
    return true;
  });

  // Print Handlers
  const handlePrintReport = () => {
    printParentReportDocument({
      student,
      nilaiList,
      schoolProfile,
      kkm,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-50 rounded-3xl max-w-5xl w-full h-[95vh] sm:h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* ============================================================== */}
        {/* TOP HEADER: BRANDING & STUDENT INFO                            */}
        {/* ============================================================== */}
        <header className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 text-white p-3.5 sm:p-4.5 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-yellow-300 shadow-inner shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-300/40 text-emerald-200">
                  Portal Orang Tua
                </span>
                <span className="text-[10px] text-teal-200 hidden sm:inline">
                  • Pendampingan Belajar Siswa
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white truncate leading-tight">
                {student.nama}
              </h2>
              <p className="text-[11px] text-teal-200 leading-none">
                Kelas: <strong className="text-white">{student.kelas}</strong> | SDN Harjosari Kidul 01 | Standar KKM: <strong className="text-yellow-300">{kkm}</strong>
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReport}
              title="Cetak Rekap Nilai & Rapor Perkembangan (PDF)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold transition shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-yellow-300" />
              <span className="hidden sm:inline">Cetak Rapor (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-rose-600 border border-white/20 text-white transition active:scale-95"
              title="Keluar dari Portal Orang Tua"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ============================================================== */}
        {/* SUB NAVIGATION TABS (4 MENUS)                                  */}
        {/* ============================================================== */}
        <nav className="bg-white border-b border-slate-200 px-3 sm:px-6 flex overflow-x-auto gap-2 sm:gap-4 shrink-0 shadow-2xs">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`py-3 px-3 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'ringkasan'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-emerald-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Ringkasan</span>
          </button>

          <button
            onClick={() => setActiveTab('rekap_grafik')}
            className={`py-3 px-3 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'rekap_grafik'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-emerald-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Rekap Nilai & Grafik</span>
          </button>

          <button
            onClick={() => setActiveTab('review_pembahasan')}
            className={`py-3 px-3 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'review_pembahasan'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-emerald-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Review Pembahasan Soal</span>
            {totalExams > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {totalExams} Ujian
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('catatan_rapor')}
            className={`py-3 px-3 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'catatan_rapor'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-emerald-700'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Catatan Guru & Rapor</span>
          </button>
        </nav>

        {/* ============================================================== */}
        {/* MAIN BODY AREA                                                 */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-semibold text-slate-600">
                Memuat basis data hasil belajar ananda...
              </p>
            </div>
          ) : (
            <>
              {/* ======================================================== */}
              {/* TAB 1: DASHBOARD RINGKASAN                               */}
              {/* ======================================================== */}
              {activeTab === 'ringkasan' && (
                <div className="space-y-6">
                  {/* Hero Welcome Card */}
                  <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
                    <div className="relative z-10 space-y-2 max-w-2xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-emerald-100 text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Halo Ayah & Bunda!</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black">
                        Pendampingan Belajar Ananda {student.nama}
                      </h3>
                      <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                        Portal ini menyajikan statistik perkembangan belajar, lembar jawaban, serta catatan evaluasi guru secara langsung untuk mendukung bimbingan belajar yang efektif di rumah.
                      </p>
                    </div>
                  </div>

                  {/* 4 Core Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Rata-Rata Nilai */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Rata-Rata Nilai
                        </span>
                        <Award className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl sm:text-3xl font-black ${
                          parseFloat(avgScore) >= kkm ? 'text-emerald-700' : 'text-rose-600'
                        }`}>
                          {avgScore}
                        </span>
                        <span className="text-xs text-slate-400">/ 100</span>
                      </div>
                      <div className="text-[11px] font-medium flex items-center gap-1">
                        {parseFloat(avgScore) >= kkm ? (
                          <span className="text-emerald-600 font-bold">✓ Di Atas KKM ({kkm})</span>
                        ) : (
                          <span className="text-rose-600 font-bold">⚠️ Perlu Penguatan KKM ({kkm})</span>
                        )}
                      </div>
                    </div>

                    {/* Total Ujian */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Total Ujian CBT
                        </span>
                        <FileText className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900">
                          {totalExams}
                        </span>
                        <span className="text-xs text-slate-400">Ujian Diselesaikan</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Semua tersimpan di rekap nilai
                      </div>
                    </div>

                    {/* Ketuntasan KKM */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Ketuntasan (KKM)
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                          {tuntasPercentage}%
                        </span>
                        <span className="text-xs text-slate-400">({tuntasCount}/{totalExams})</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${tuntasPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Integritas Anti-Contek */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Fokus & Kejujuran
                        </span>
                        <ShieldCheck className="w-4 h-4 text-teal-600" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xl sm:text-2xl font-black ${
                          isDisciplined ? 'text-teal-700' : 'text-amber-600'
                        }`}>
                          {isDisciplined ? '100% Tertib' : `${totalPelanggaran}x Peringatan`}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {isDisciplined ? 'Fokus tanpa keluar layar CBT' : 'Tercatat berpindah tab'}
                      </div>
                    </div>
                  </div>

                  {/* Nilai Ekstrem & Catatan Bimbingan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ringkasan Prestasi */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>Rangkuman Rentang Nilai</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                            Nilai Tertinggi
                          </span>
                          <span className="text-2xl font-black text-emerald-700">
                            {highestScore}
                          </span>
                          <span className="text-[10px] text-emerald-600 block mt-0.5">
                            Pencapaian Terbaik
                          </span>
                        </div>
                        <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100">
                          <span className="text-[11px] font-bold text-rose-800 uppercase block">
                            Nilai Terendah
                          </span>
                          <span className="text-2xl font-black text-rose-700">
                            {lowestScore}
                          </span>
                          <span className="text-[10px] text-rose-600 block mt-0.5">
                            Fokus Pendampingan
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Ujian Tuntas (Nilai ≥ {kkm}):</span>
                          <strong className="text-emerald-700">{tuntasCount} Ujian</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Ujian Perlu Remedial (Nilai &lt; {kkm}):</span>
                          <strong className="text-rose-700">{remedialCount} Ujian</strong>
                        </div>
                      </div>
                    </div>

                    {/* Tips Pendampingan Belajar Rumah */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>Rekomendasi Pendampingan Ayah & Bunda</span>
                        </h4>
                        <ul className="mt-3 space-y-2 text-xs text-slate-600 leading-relaxed">
                          <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              1
                            </span>
                            <span>
                              Buka tab <strong>"Review Pembahasan"</strong> untuk melihat butir soal yang dijawab salah oleh ananda agar dapat dibahas bersama.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              2
                            </span>
                            <span>
                              Beri apresiasi atas usaha ananda, terutama bila telah berusaha disiplin dan tidak meninggalkan layar ujian.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              3
                            </span>
                            <span>
                              Periksa masukan guru pada tab <strong>"Catatan Guru & Rapor"</strong> dan cetak laporannya bila dibutuhkan.
                            </span>
                          </li>
                        </ul>
                      </div>

                      <button
                        onClick={() => setActiveTab('review_pembahasan')}
                        className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs"
                      >
                        <span>Mulai Bahas Soal Bersama Ananda</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 2: REKAP NILAI & GRAFIK PERKEMBANGAN                 */}
              {/* ======================================================== */}
              {activeTab === 'rekap_grafik' && (
                <div className="space-y-6">
                  {/* GRAFIK TREN NILAI DARI WAKTU KE WAKTU */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                          <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
                          <span>Grafik Tren Perkembangan Nilai Siswa</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          Memperlihatkan pergerakan nilai ujian CBT ananda dari waktu ke waktu dibanding garis standar KKM ({kkm}).
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          Nilai Ujian
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 font-bold border border-rose-200">
                          <span className="w-2.5 h-0.5 bg-rose-500 border-t border-dashed" />
                          Garis KKM ({kkm})
                        </span>
                      </div>
                    </div>

                    {/* SVG Interactive Trend Chart */}
                    {nilaiList.length > 0 ? (
                      <div className="relative pt-2 pb-6">
                        <div className="h-64 sm:h-72 w-full">
                          {(() => {
                            // Sort chronologically for trend
                            const sorted = [...nilaiList].reverse();
                            const width = 800;
                            const height = 240;
                            const padding = { top: 20, right: 30, bottom: 40, left: 45 };
                            const innerWidth = width - padding.left - padding.right;
                            const innerHeight = height - padding.top - padding.bottom;

                            const getY = (val: number) => {
                              const clamp = Math.max(0, Math.min(100, val));
                              return padding.top + innerHeight - (clamp / 100) * innerHeight;
                            };

                            const getX = (idx: number) => {
                              if (sorted.length === 1) return padding.left + innerWidth / 2;
                              return padding.left + (idx / (sorted.length - 1)) * innerWidth;
                            };

                            // Points
                            const points = sorted.map((n, idx) => ({
                              x: getX(idx),
                              y: getY(Number(n.Nilai || 0)),
                              nilai: Number(n.Nilai || 0),
                              title: n.Judul_Ujian,
                              date: n.Waktu_Submit ? n.Waktu_Submit.slice(0, 10) : '',
                            }));

                            const pathD = points.reduce((acc, p, i) => {
                              return `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
                            }, '');

                            const areaD = sorted.length > 1
                              ? `${pathD} L ${points[points.length - 1].x} ${getY(0)} L ${points[0].x} ${getY(0)} Z`
                              : '';

                            const kkmY = getY(kkm);

                            return (
                              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                                <defs>
                                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                  </linearGradient>
                                </defs>

                                {/* Background Grid Lines */}
                                {[0, 25, 50, 75, 100].map((gridVal) => {
                                  const gy = getY(gridVal);
                                  return (
                                    <g key={gridVal}>
                                      <line
                                        x1={padding.left}
                                        y1={gy}
                                        x2={width - padding.right}
                                        y2={gy}
                                        stroke="#e2e8f0"
                                        strokeWidth="1"
                                        strokeDasharray="4 4"
                                      />
                                      <text
                                        x={padding.left - 8}
                                        y={gy + 4}
                                        textAnchor="end"
                                        fontSize="10"
                                        fill="#94a3b8"
                                        fontWeight="600"
                                      >
                                        {gridVal}
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* KKM Line */}
                                <line
                                  x1={padding.left}
                                  y1={kkmY}
                                  x2={width - padding.right}
                                  y2={kkmY}
                                  stroke="#f43f5e"
                                  strokeWidth="1.5"
                                  strokeDasharray="6 4"
                                />
                                <text
                                  x={width - padding.right}
                                  y={kkmY - 6}
                                  textAnchor="end"
                                  fontSize="9.5"
                                  fill="#f43f5e"
                                  fontWeight="bold"
                                >
                                  Batas KKM ({kkm})
                                </text>

                                {/* Area Fill */}
                                {areaD && <path d={areaD} fill="url(#areaGrad)" />}

                                {/* Line Path */}
                                {points.length > 1 && (
                                  <path
                                    d={pathD}
                                    fill="none"
                                    stroke="#059669"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                )}

                                {/* Data Points & Labels */}
                                {points.map((p, idx) => (
                                  <g key={idx} className="group cursor-pointer">
                                    <circle
                                      cx={p.x}
                                      cy={p.y}
                                      r="6"
                                      fill={p.nilai >= kkm ? '#10b981' : '#f43f5e'}
                                      stroke="#ffffff"
                                      strokeWidth="2.5"
                                      className="transition-transform duration-200 group-hover:scale-125"
                                    />
                                    {/* Score Tag Above Point */}
                                    <rect
                                      x={p.x - 18}
                                      y={p.y - 24}
                                      width="36"
                                      height="16"
                                      rx="4"
                                      fill={p.nilai >= kkm ? '#065f46' : '#9f1239'}
                                    />
                                    <text
                                      x={p.x}
                                      y={p.y - 12}
                                      textAnchor="middle"
                                      fontSize="9"
                                      fill="#ffffff"
                                      fontWeight="bold"
                                    >
                                      {p.nilai.toFixed(2)}
                                    </text>

                                    {/* X Label (Exam Name / Index) */}
                                    <text
                                      x={p.x}
                                      y={height - 12}
                                      textAnchor="middle"
                                      fontSize="9"
                                      fill="#64748b"
                                      fontWeight="600"
                                    >
                                      U#{idx + 1}
                                    </text>
                                  </g>
                                ))}
                              </svg>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        Belum ada data nilai ujian untuk ditampilkan dalam grafik.
                      </div>
                    )}
                  </div>

                  {/* TABEL RIWAYAT NILAI CBT */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                          <FileText className="w-4.5 h-4.5 text-emerald-600" />
                          <span>Riwayat Lengkap Nilai CBT Harian</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          Daftar seluruh ujian yang telah diselesaikan ananda beserta status ketuntasan.
                        </p>
                      </div>

                      {/* Filters */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {/* Search input */}
                        <div className="relative flex-1 sm:w-48">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari judul ujian..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                          />
                        </div>

                        {/* Status filter */}
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value as any)}
                          className="py-1.5 px-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold focus:outline-emerald-500"
                        >
                          <option value="all">Semua Status</option>
                          <option value="tuntas">Tuntas (≥ {kkm})</option>
                          <option value="remedial">Remedial (&lt; {kkm})</option>
                        </select>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/80 text-slate-600 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-3.5 text-center">No</th>
                            <th className="py-3 px-3.5">Waktu Submit</th>
                            <th className="py-3 px-3.5">Judul Ujian</th>
                            <th className="py-3 px-3.5 text-center">Nilai</th>
                            <th className="py-3 px-3.5 text-center">Status</th>
                            <th className="py-3 px-3.5 text-center">Integritas</th>
                            <th className="py-3 px-3.5">Catatan Guru</th>
                            <th className="py-3 px-3.5 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredNilaiList.length > 0 ? (
                            filteredNilaiList.map((n, idx) => {
                              const numNilai = Number(n.Nilai || 0);
                              const isTuntas = numNilai >= kkm;
                              const countPelanggaran = n.Pelanggaran || 0;

                              return (
                                <tr key={n.ID || idx} className="hover:bg-slate-50/80 transition">
                                  <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                                    {idx + 1}
                                  </td>
                                  <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap">
                                    {n.Waktu_Submit ? n.Waktu_Submit.slice(0, 16) : '-'}
                                  </td>
                                  <td className="py-3 px-3.5 font-bold text-slate-900">
                                    {n.Judul_Ujian}
                                  </td>
                                  <td className="py-3 px-3.5 text-center">
                                    <span className={`inline-block font-black text-sm px-2.5 py-0.5 rounded-lg ${
                                      isTuntas
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {numNilai.toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3.5 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                      isTuntas
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                      {isTuntas ? 'Tuntas' : 'Remedial'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                                    {countPelanggaran === 0 ? (
                                      <span className="text-emerald-700 font-bold text-[11px]">
                                        ✓ 100% Tertib
                                      </span>
                                    ) : (
                                      <span className="text-amber-700 font-bold text-[11px]">
                                        ⚠️ {countPelanggaran}x Pindah
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3.5 text-slate-600 italic">
                                    {n.Catatan_Guru || '-'}
                                  </td>
                                  <td className="py-3 px-3.5 text-center">
                                    <button
                                      onClick={() => {
                                        setSelectedReviewNilaiId(n.ID);
                                        setActiveTab('review_pembahasan');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold transition flex items-center gap-1 mx-auto"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Bahas</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-400">
                                Tidak ada data nilai yang sesuai dengan pencarian atau filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 3: REVIEW PEMBAHASAN SOAL                            */}
              {/* ======================================================== */}
              {activeTab === 'review_pembahasan' && (
                <div className="space-y-6">
                  {/* Exam Selector Top Bar */}
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                        Bahan Pendampingan Belajar Rumah
                      </span>
                      <h4 className="font-black text-slate-900 text-sm sm:text-base">
                        Review Jawaban, Kunci & Pembahasan Soal
                      </h4>
                    </div>

                    {/* Selector Dropdown */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
                        Pilih Ujian:
                      </label>
                      <select
                        value={selectedReviewNilaiId}
                        onChange={(e) => setSelectedReviewNilaiId(e.target.value)}
                        className="w-full md:w-72 p-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:outline-emerald-500"
                      >
                        {nilaiList.map((n) => (
                          <option key={n.ID} value={n.ID}>
                            {n.Judul_Ujian} (Nilai: {Number(n.Nilai || 0).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Status Ketersediaan Review Pembahasan */}
                  {!isReviewUnlocked ? (
                    <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-4 max-w-lg mx-auto">
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                        <Lock className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider">
                          Belum Ada Ujian Selesai
                        </span>
                        <h4 className="text-lg font-black text-slate-900">
                          Review Pembahasan Belum Tersedia
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed text-center">
                          Lembar pembahasan soal akan otomatis terbuka setelah ananda menyelesaikan dan mengumpulkan ujian CBT.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* UNLOCKED: RENDER FULL REVIEW PEMBAHASAN */
                    <div className="space-y-4">
                      {/* Summary Banner for Selected Exam */}
                      <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm sm:text-base">
                              {selectedNilai?.Judul_Ujian}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                              Number(selectedNilai?.Nilai || 0) >= kkm
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              Nilai: {Number(selectedNilai?.Nilai || 0).toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Total {totalQuestions} Soal • Benar: <strong className="text-emerald-700">{correctCount}</strong> • Salah: <strong className="text-rose-700">{wrongCount}</strong>
                          </p>
                        </div>

                        {/* Question Filter Pills */}
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
                          <button
                            onClick={() => setReviewFilterMode('wrong')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                              reviewFilterMode === 'wrong'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-rose-700'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Soal Salah Saja ({wrongCount})</span>
                          </button>

                          <button
                            onClick={() => setReviewFilterMode('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                              reviewFilterMode === 'all'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Semua Soal ({totalQuestions})</span>
                          </button>

                          <button
                            onClick={() => setReviewFilterMode('correct')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                              reviewFilterMode === 'correct'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-emerald-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Soal Benar ({correctCount})</span>
                          </button>
                        </div>
                      </div>

                      {/* Info Notice for Parents */}
                      {reviewFilterMode === 'wrong' && wrongCount > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            <strong>Mode Pendampingan:</strong> Menampilkan {wrongCount} butir soal yang dijawab salah oleh ananda. Gunakan kotak pembahasan di bawah untuk memandu konsep materi kepada ananda.
                          </span>
                        </div>
                      )}

                      {/* List of Questions */}
                      {displayQuestions.length > 0 ? (
                        <div className="space-y-4">
                          {displayQuestions.map(({ index, question, studentAnswer, isCorrect }) => {
                            const questionImages = getQuestionImages(question);

                            return (
                              <div
                                key={index}
                                className={`bg-white rounded-3xl p-5 sm:p-6 border shadow-2xs space-y-4 transition ${
                                  isCorrect ? 'border-emerald-200' : 'border-rose-300 ring-1 ring-rose-200/50'
                                }`}
                              >
                                {/* Question Header */}
                                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                                      {index + 1}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500 uppercase">
                                      {question.type === 'pg'
                                        ? 'Pilihan Ganda'
                                        : question.type === 'pgk_mcma'
                                        ? 'Pilihan Ganda Kompleks (MCMA)'
                                        : 'Kategori / Benar-Salah'}
                                    </span>
                                  </div>

                                  {/* Result Badge */}
                                  <div>
                                    {isCorrect ? (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Dijawab Benar</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black">
                                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Jawaban Salah</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Question Text & Images */}
                                <div className="space-y-3">
                                  <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                                    <MathRenderer content={question.soal} />
                                  </div>

                                  {questionImages.length > 0 && (
                                    <div className="flex flex-wrap gap-2 my-2 justify-center">
                                      {questionImages.map((imgUrl, iIdx) => (
                                        <img
                                          key={iIdx}
                                          src={imgUrl}
                                          alt={`Stimulus ${iIdx + 1}`}
                                          onClick={() => onViewImage && onViewImage(imgUrl, `Gambar Soal No. ${index + 1}`)}
                                          className="max-h-60 rounded-xl border border-slate-200 object-contain cursor-pointer hover:opacity-90 shadow-2xs"
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Answers Comparison */}
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                                  {question.type === 'pg' && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-500 font-bold">Jawaban Ananda:</span>
                                        <span className={`px-2 py-0.5 rounded-lg font-black ${
                                          isCorrect
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-rose-100 text-rose-800'
                                        }`}>
                                          Pilihan {studentAnswer || '(Kosong)'}
                                        </span>
                                      </div>
                                      {!isCorrect && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-slate-500 font-bold">Kunci Jawaban Benar:</span>
                                          <span className="px-2 py-0.5 rounded-lg font-black bg-emerald-100 text-emerald-800">
                                            Pilihan {(question as QuestionPG).kunci}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {question.type === 'pgk_mcma' && (
                                    <div className="space-y-1.5">
                                      <span className="font-bold text-slate-700 block">Pilihan Jawaban:</span>
                                      {(question as QuestionPGKMCMA).options.map((opt, oIdx) => {
                                        const isChosen = Boolean(
                                          studentAnswer &&
                                            (studentAnswer[oIdx] === true ||
                                              (Array.isArray(studentAnswer) && studentAnswer.includes(oIdx)))
                                        );
                                        const isKey = Boolean(opt.isKey);
                                        return (
                                          <div
                                            key={oIdx}
                                            className={`p-2 rounded-xl flex items-center justify-between ${
                                              isKey
                                                ? 'bg-emerald-100/60 text-emerald-900 font-bold'
                                                : isChosen && !isKey
                                                ? 'bg-rose-100/60 text-rose-900 font-bold'
                                                : 'text-slate-600'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <span>{isChosen ? '☑' : '☐'}</span>
                                              <span>{opt.text}</span>
                                            </div>
                                            <span className="text-[10px]">
                                              {isKey ? '✓ Kunci Benar' : isChosen ? '✗ Dipilih Ananda' : ''}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {question.type === 'pgk_kategori' && (
                                    <div className="space-y-1.5">
                                      <span className="font-bold text-slate-700 block">Baris Pernyataan:</span>
                                      {(question as QuestionPGKKategori).rows.map((row, rIdx) => {
                                        const studentChoice = studentAnswer ? (studentAnswer[rIdx] ?? studentAnswer[String(rIdx)]) : null;
                                        const isRowCorrect = studentChoice === row.key;
                                        return (
                                          <div
                                            key={rIdx}
                                            className={`p-2 rounded-xl flex justify-between items-center text-xs ${
                                              isRowCorrect ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'
                                            }`}
                                          >
                                            <span>{row.text}</span>
                                            <span className="font-black">
                                              Kunci: {row.key === 'col1' ? (question as QuestionPGKKategori).col1 : (question as QuestionPGKKategori).col2}
                                              {studentChoice && !isRowCorrect ? ` (Ananda: ${studentChoice === 'col1' ? (question as QuestionPGKKategori).col1 : (question as QuestionPGKKategori).col2})` : !studentChoice ? ' (Ananda: Kosong)' : ''}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                {/* KOTAK PEMBAHASAN SOAL KHUSUS PENDAMPINGAN ORANG TUA */}
                                <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 space-y-2">
                                  <div className="flex items-center gap-2 text-emerald-900">
                                    <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                                    <span className="text-xs font-black uppercase tracking-wider">
                                      💡 Pembahasan & Panduan Materi untuk Orang Tua:
                                    </span>
                                  </div>

                                  <div className="text-xs text-slate-700 leading-relaxed pl-6 border-l-2 border-emerald-400">
                                    {question.pembahasan && question.pembahasan.trim() ? (
                                      <MathRenderer content={question.pembahasan} />
                                    ) : (
                                      <span className="italic text-slate-400">
                                        (Belum ada catatan pembahasan tertulis khusus untuk butir soal ini. Silakan diskusikan bersama ananda sesuai konsep materi pelajaran).
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-slate-500 text-xs bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                          <FileText className="w-8 h-8 text-indigo-500 mx-auto" />
                          <p className="font-bold text-slate-700">
                            {reviewFilterMode === 'wrong' && totalQuestions > 0
                              ? 'Selamat! Tidak ada butir soal yang dijawab salah oleh ananda pada ujian ini. Semua soal dijawab dengan benar! 🎉'
                              : totalQuestions === 0
                              ? `Naskah butir soal sedang disinkronkan dari bank soal. Ujian "${selectedNilai?.Judul_Ujian}" telah selesai dengan nilai akhir ${Number(selectedNilai?.Nilai || 0).toFixed(2)}.`
                              : 'Tidak ada butir soal yang sesuai dengan filter yang dipilih.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 4: CATATAN GURU & RAPOR                              */}
              {/* ======================================================== */}
              {activeTab === 'catatan_rapor' && (
                <div className="space-y-6">
                  {/* Action Banner: Download & Print PDF */}
                  <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-300" />
                        <h4 className="text-base font-black">
                          Dokumen Resmi Rapor Perkembangan Belajar
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300">
                        Unduh atau cetak rekap nilai resmi ber-KOP SD Negeri Harjosari Kidul 01 untuk portofolio ananda.
                      </p>
                    </div>

                    <button
                      onClick={handlePrintReport}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-black text-xs text-white shadow-lg transition active:scale-95 flex items-center gap-2 shrink-0"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak Rekap Nilai & Rapor (PDF)</span>
                    </button>
                  </div>

                  {/* REKAPITULASI CAPAIAN PER MATA PELAJARAN */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>Rekapitulasi Nilai per Mata Pelajaran</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {subjectList.map((mapel) => {
                        const examsForMapel = nilaiList.filter((n) =>
                          (n.Judul_Ujian || '').toLowerCase().includes(mapel.toLowerCase())
                        );
                        if (examsForMapel.length === 0) return null;

                        const sum = examsForMapel.reduce((a, b) => a + Number(b.Nilai || 0), 0);
                        const mAvg = (sum / examsForMapel.length).toFixed(2);
                        const numM = parseFloat(mAvg);
                        const isTuntas = numM >= kkm;

                        return (
                          <div
                            key={mapel}
                            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2 hover:bg-white hover:border-emerald-300 transition"
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-900 text-xs">{mapel}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isTuntas
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {isTuntas ? 'Tuntas' : 'Remedial'}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-slate-800">{mAvg}</span>
                              <span className="text-[11px] text-slate-400">
                                ({examsForMapel.length} Ujian)
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Predikat: <strong>{numM >= 90 ? 'A' : numM >= 80 ? 'B' : numM >= kkm ? 'C' : 'D'}</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CATATAN EVALUASI & UMPAN BALIK DARI GURU */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Catatan Khusus dari Guru Kelas & Pengajar</span>
                    </h4>

                    {nilaiList.some((n) => n.Catatan_Guru && n.Catatan_Guru.trim()) ? (
                      <div className="space-y-3">
                        {nilaiList
                          .filter((n) => n.Catatan_Guru && n.Catatan_Guru.trim())
                          .map((n, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-indigo-950 font-bold">
                                <span>{n.Judul_Ujian}</span>
                                <span className="text-[10px] text-indigo-600">
                                  {n.Waktu_Submit ? n.Waktu_Submit.slice(0, 10) : ''}
                                </span>
                              </div>
                              <p className="text-slate-700 italic">
                                "{n.Catatan_Guru}"
                              </p>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
                        <p>
                          Secara keseluruhan, ananda <strong>{student.nama}</strong> memiliki rerata nilai <strong>{avgScore}</strong> dengan tingkat ketuntasan <strong>{tuntasPercentage}%</strong>.
                        </p>
                        <p className="text-slate-500 italic">
                          (Catatan per butir evaluasi belum dicatat khusus oleh guru. Guru kelas akan memperbarui catatan berkala menjelang pengisian rapor semester).
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ============================================================== */}
        {/* FOOTER: STATUS & EXIT                                          */}
        {/* ============================================================== */}
        <footer className="bg-white border-t border-slate-200 px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Mode Pantau Orang Tua • Data Terhubung Read-Only</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReport}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition"
            >
              Cetak Rapor
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-xs"
            >
              Keluar Portal
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
