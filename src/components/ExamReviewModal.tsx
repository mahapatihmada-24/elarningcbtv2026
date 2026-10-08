import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  Award,
  AlertTriangle,
  FileText,
  KeyRound,
  Filter,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { Ujian, Question, QuestionPG, QuestionPGKMCMA, QuestionPGKKategori, Nilai, getQuestionImages } from '../types';
import { MathRenderer } from './MathRenderer';
import { printExamDocument, downloadExamWord } from '../utils/documentExport';

interface ExamReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ujian: Ujian;
  nilai?: Nilai | null;
  studentAnswers?: Record<number, any>;
  onViewImage?: (url: string, title?: string) => void;
  userRole?: 'guru' | 'murid' | 'admin';
  isTeacher?: boolean;
}

export const ExamReviewModal: React.FC<ExamReviewModalProps> = ({
  isOpen,
  onClose,
  ujian,
  nilai,
  studentAnswers,
  onViewImage,
  userRole,
  isTeacher = false,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'correct' | 'wrong' | 'has_pembahasan'>('all');

  if (!isOpen) return null;

  const isTeacherView = userRole === 'guru' || userRole === 'admin' || isTeacher;

  let questions: Question[] = [];
  try {
    const raw = JSON.parse(ujian.Soal_JSON || '{}');
    if (raw.questions && Array.isArray(raw.questions)) {
      questions = raw.questions;
    } else if (Array.isArray(raw)) {
      questions = raw;
    }
  } catch {}

  // Resolve student answers from props or from saved Nilai.Jawaban_JSON
  let resolvedAnswers: Record<number, any> = studentAnswers || {};
  if (Object.keys(resolvedAnswers).length === 0 && nilai?.Jawaban_JSON) {
    try {
      resolvedAnswers = JSON.parse(nilai.Jawaban_JSON);
    } catch {}
  }

  const isQuestionAnswered = (q: Question, ans: any): boolean => {
    if (ans === undefined || ans === null || ans === '') return false;
    if (q.type === 'pg') {
      return typeof ans === 'string' && ans.length > 0;
    } else if (q.type === 'pgk_mcma') {
      return Array.isArray(ans) && ans.some((v) => v === true);
    } else if (q.type === 'pgk_kategori') {
      const obj = ans as Record<number, string>;
      return typeof obj === 'object' && Object.keys(obj).length === (q.rows?.length || 0);
    }
    return true;
  };

  const totalQuestions = questions.length;
  const answeredCount = questions.filter((q, idx) => isQuestionAnswered(q, resolvedAnswers[idx])).length;
  const isAllAnswered = totalQuestions > 0 && answeredCount >= totalQuestions;

  // Syarat Kemunculan Review, Kunci, & Pembahasan:
  // Kunci jawaban dan pembahasan soal baru boleh terbuka/muncul jika siswa sudah menjawab dan mengumpulkan seluruh butir soal.
  // Jika soal yang dikerjakan belum lengkap (misal baru 10 dari 20 soal), sistem harus menolak dan menyembunyikan tampilan review, kunci jawaban, serta pembahasan.
  if (!isTeacherView && !isAllAnswered) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-rose-200 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Akses Review Terkunci</span>
            </div>
            <h3 className="font-black text-slate-900 text-lg leading-tight">
              Syarat Kunci & Pembahasan Belum Terpenuhi
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed text-left">
              Sesuai dengan ketentuan sistem CBT, kunci jawaban dan pembahasan soal baru boleh terbuka jika Anda telah menjawab dan mengumpulkan <strong>seluruh butir soal</strong> ({totalQuestions} soal lengkap).
            </p>
            <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-2xl text-xs text-rose-900 font-medium text-left space-y-1">
              <div className="flex justify-between">
                <span>Total Soal Ujian:</span>
                <strong>{totalQuestions} Butir</strong>
              </div>
              <div className="flex justify-between">
                <span>Soal yang Terjawab:</span>
                <strong className="text-rose-700">{answeredCount} Butir</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-rose-200 text-rose-800 font-bold">
                <span>Belum Terjawab:</span>
                <span>{totalQuestions - answeredCount} Butir</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic text-left">
              *Tampilan review, kunci jawaban, dan pembahasan disembunyikan demi menjaga integritas evaluasi pembelajaran.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-md active:scale-98"
          >
            Kembali ke Menu Utama
          </button>
        </div>
      </div>
    );
  }

  const hasStudentAnswers = Object.keys(resolvedAnswers).length > 0;

  // Determine correct/wrong for each question
  const questionStatusMap: Record<number, { isCorrect: boolean; isPartial?: boolean }> = {};

  questions.forEach((q, idx) => {
    const ans = resolvedAnswers[idx];
    if (ans === undefined) {
      questionStatusMap[idx] = { isCorrect: false };
      return;
    }

    if (q.type === 'pg') {
      const isCorrect = String(ans).toUpperCase() === String(q.kunci).toUpperCase();
      questionStatusMap[idx] = { isCorrect };
    } else if (q.type === 'pgk_mcma') {
      const selected = Array.isArray(ans) ? (ans as number[]) : [];
      const correctKeys = (q.options || [])
        .map((o, oIdx) => (o.isKey ? oIdx : -1))
        .filter((i) => i >= 0);
      const isExactMatch =
        selected.length === correctKeys.length &&
        selected.every((i) => correctKeys.includes(i));
      questionStatusMap[idx] = { isCorrect: isExactMatch };
    } else if (q.type === 'pgk_kategori') {
      const rowAns = (ans as Record<number, 'col1' | 'col2'>) || {};
      const rows = q.rows || [];
      const allCorrect = rows.every((r, rIdx) => rowAns[rIdx] === r.key);
      questionStatusMap[idx] = { isCorrect: allCorrect };
    } else {
      questionStatusMap[idx] = { isCorrect: false };
    }
  });

  const correctCount = questions.filter((_, idx) => questionStatusMap[idx]?.isCorrect).length;
  const wrongCount = totalQuestions - correctCount;

  const filteredQuestions = questions.map((q, idx) => ({ q, idx })).filter(({ q, idx }) => {
    if (filterMode === 'correct') return questionStatusMap[idx]?.isCorrect;
    if (filterMode === 'wrong') return !questionStatusMap[idx]?.isCorrect;
    if (filterMode === 'has_pembahasan') return Boolean(q.pembahasan && q.pembahasan.trim());
    return true;
  });

  const scoreVal = nilai?.Nilai !== undefined ? Number(nilai.Nilai) : null;

  const handlePrint = () => {
    // Keamanan cetak: Siswa hanya diperbolehkan mencetak naskah soal siswa (tanpa kunci & pembahasan)
    printExamDocument(ujian, {
      includeAnswers: isTeacherView,
      includePembahasan: isTeacherView,
    });
  };

  const handleDownloadWord = () => {
    // Keamanan unduh: Siswa hanya diperbolehkan mengunduh naskah soal siswa (tanpa kunci & pembahasan)
    downloadExamWord(ujian, {
      includeAnswers: isTeacherView,
      includePembahasan: isTeacherView,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[92vh] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-800 via-indigo-700 to-indigo-800 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Lightbulb className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                  Review Hasil & Pembahasan Ujian
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider">
                  Kunci & Pembahasan
                </span>
              </div>
              <p className="text-xs text-indigo-100/90 mt-0.5">
                {ujian.Mapel} • Kelas {ujian.Kelas} • {ujian.Judul_Ujian}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition"
              title={isTeacherView ? 'Cetak Lengkap dengan Kunci & Pembahasan' : 'Cetak Naskah Soal Siswa (Kunci & Pembahasan dilindungi khusus Guru)'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isTeacherView ? 'Cetak Lengkap' : 'Cetak Soal (PDF)'}</span>
            </button>
            <button
              onClick={handleDownloadWord}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition"
              title={isTeacherView ? 'Unduh Lengkap dengan Kunci & Pembahasan (.doc)' : 'Unduh Naskah Soal Siswa (.doc) (Kunci & Pembahasan dilindungi khusus Guru)'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isTeacherView ? 'Unduh Word' : 'Unduh Soal (.doc)'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition text-white"
              title="Tutup Review"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score Summary Card */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Score or Attempts */}
            <div className="flex items-center gap-3">
              {scoreVal !== null ? (
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border ${
                      scoreVal >= 75
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                        : 'bg-rose-100 border-rose-300 text-rose-800'
                    }`}
                  >
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Nilai Akhir Siswa:
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-black text-slate-900">
                        {scoreVal.toLocaleString('id-ID', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">/ 100,00</span>
                      <span
                        className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ml-1 ${
                          scoreVal >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {scoreVal >= 75 ? 'Tuntas (KKM 75)' : 'Perlu Remedial'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Review Lembar Pembahasan Soal</span>
                </div>
              )}
            </div>

            {/* Middle: Stats */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 font-bold text-slate-700">
                Total: <strong>{totalQuestions}</strong> Soal
              </span>
              {hasStudentAnswers && (
                <>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{correctCount} Benar</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 font-bold text-rose-800 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{wrongCount} Salah</span>
                  </span>
                </>
              )}
            </div>

            {/* Right: Quick print/download for mobile */}
            <div className="flex sm:hidden items-center gap-1.5 w-full pt-1">
              <button
                onClick={() => printExamDocument(ujian, { includeAnswers: true, includePembahasan: true })}
                className="flex-1 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / PDF</span>
              </button>
              <button
                onClick={() => downloadExamWord(ujian, { includeAnswers: true, includePembahasan: true })}
                className="flex-1 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh .doc</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-3 mt-2 border-t border-slate-200/80 text-xs">
            <span className="font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              Filter:
            </span>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua ({totalQuestions})
            </button>
            {hasStudentAnswers && (
              <>
                <button
                  onClick={() => setFilterMode('correct')}
                  className={`px-3 py-1 rounded-xl font-bold transition ${
                    filterMode === 'correct'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Jawaban Benar ({correctCount})
                </button>
                <button
                  onClick={() => setFilterMode('wrong')}
                  className={`px-3 py-1 rounded-xl font-bold transition ${
                    filterMode === 'wrong'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Jawaban Salah ({wrongCount})
                </button>
              </>
            )}
            <button
              onClick={() => setFilterMode('has_pembahasan')}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                filterMode === 'has_pembahasan'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Dengan Pembahasan
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {filteredQuestions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-sm">Tidak ada butir soal pada filter ini.</p>
            </div>
          ) : (
            filteredQuestions.map(({ q, idx }) => {
              const qImages = getQuestionImages(q);
              const status = questionStatusMap[idx];
              const ans = resolvedAnswers[idx];

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4 sm:p-5 transition hover:border-indigo-200"
                >
                  {/* Top Bar Butir Soal */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                        {idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] uppercase">
                        {q.type.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Bobot: {q.bobot || 1}
                      </span>
                    </div>

                    {/* Student Result Badge */}
                    {hasStudentAnswers && (
                      <div className="flex items-center gap-1.5">
                        {status?.isCorrect ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Jawaban Benar</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-xs flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Jawaban Salah</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Question Stem / Narasi */}
                  <div className="text-slate-900 leading-relaxed text-xs sm:text-sm">
                    <MathRenderer
                      content={q.soal}
                      images={qImages}
                      onViewImage={onViewImage}
                      className="font-medium"
                    />
                  </div>

                  {/* Opsi Jawaban Sesuai Tipe */}
                  {q.type === 'pg' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {(
                        ['a', 'b', 'c', 'd', ...((q as QuestionPG).e !== undefined ? ['e'] : [])] as (
                          | 'a'
                          | 'b'
                          | 'c'
                          | 'd'
                          | 'e'
                        )[]
                      ).map((letter) => {
                        const letterUpper = letter.toUpperCase();
                        const isCorrectKey = String((q as QuestionPG).kunci).toUpperCase() === letterUpper;
                        const isStudentChoice = String(ans).toUpperCase() === letterUpper;
                        const optText = (q as QuestionPG)[letter] || '';
                        const optImg = (q as QuestionPG)[`${letter}_img` as keyof QuestionPG] as string | undefined;

                        let cardStyle = 'bg-white border-slate-200 text-slate-800';
                        if (isCorrectKey) {
                          cardStyle = 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400 text-emerald-950 font-semibold';
                        } else if (isStudentChoice && !isCorrectKey) {
                          cardStyle = 'bg-rose-50 border-rose-300 text-rose-950';
                        }

                        return (
                          <div
                            key={letter}
                            className={`p-3 rounded-xl border transition space-y-1.5 ${cardStyle}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs uppercase flex items-center gap-1.5">
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black ${
                                  isCorrectKey
                                    ? 'bg-emerald-600 text-white'
                                    : isStudentChoice
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {letterUpper}
                                </span>
                                <span>Pilihan {letterUpper}</span>
                              </span>

                              <div className="flex items-center gap-1">
                                {isCorrectKey && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Kunci Benar</span>
                                  </span>
                                )}
                                {isStudentChoice && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    isCorrectKey
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                                  }`}>
                                    Jawaban Anda
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-xs pt-0.5">
                              <MathRenderer content={optText} onViewImage={onViewImage} />
                            </div>

                            {optImg && (
                              <img
                                src={optImg}
                                alt={`Opsi ${letterUpper}`}
                                className="max-h-24 rounded-lg border border-slate-200 cursor-pointer object-contain mt-1"
                                onClick={() => optImg && onViewImage?.(optImg, `Opsi ${letterUpper}`)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'pgk_mcma' && (
                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-bold text-slate-600">
                        Opsi Pernyataan (Jawaban Benar Lebih dari Satu):
                      </div>
                      {((q as QuestionPGKMCMA).options || []).map((opt, oIdx) => {
                        const isKey = opt.isKey;
                        const isStudentSelected = Array.isArray(ans) && (ans as number[]).includes(oIdx);

                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-xl border flex items-start gap-2.5 transition ${
                              isKey
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                                : isStudentSelected
                                ? 'bg-rose-50 border-rose-300 text-rose-950'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                                isKey ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {oIdx + 1}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 text-xs">
                              <MathRenderer content={opt.text} onViewImage={onViewImage} />
                              {opt.img && (
                                <img
                                  src={opt.img}
                                  alt={`Opsi ${oIdx + 1}`}
                                  className="max-h-24 rounded-lg border border-slate-200 cursor-pointer object-contain mt-1"
                                  onClick={() => opt.img && onViewImage?.(opt.img, `Opsi ${oIdx + 1}`)}
                                />
                              )}
                            </div>
                            <div className="shrink-0 flex items-center gap-1 text-[10px] font-bold">
                              {isKey && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                                  ✓ Kunci Benar
                                </span>
                              )}
                              {isStudentSelected && (
                                <span className={`px-2 py-0.5 rounded-full ${
                                  isKey ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  Dipilih Anda
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'pgk_kategori' && (
                    <div className="overflow-x-auto pt-2">
                      <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800">
                            <th className="p-2.5 border border-slate-200 font-bold">Pernyataan</th>
                            <th className="p-2.5 border border-slate-200 text-center font-bold w-24">
                              {(q as QuestionPGKKategori).col1 || 'Benar'}
                            </th>
                            <th className="p-2.5 border border-slate-200 text-center font-bold w-24">
                              {(q as QuestionPGKKategori).col2 || 'Salah'}
                            </th>
                            <th className="p-2.5 border border-slate-200 text-center font-bold w-36">
                              Status Jawaban
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {((q as QuestionPGKKategori).rows || []).map((row, rIdx) => {
                            const studentRowAns = (ans as Record<number, 'col1' | 'col2'>)?.[rIdx];
                            const isCorrectRow = studentRowAns === row.key;

                            return (
                              <tr key={rIdx} className="hover:bg-slate-50">
                                <td className="p-2.5 border border-slate-200">
                                  <MathRenderer content={row.text} onViewImage={onViewImage} />
                                </td>
                                <td className={`p-2.5 border border-slate-200 text-center font-bold ${
                                  row.key === 'col1' ? 'bg-emerald-100 text-emerald-900' : ''
                                }`}>
                                  {row.key === 'col1' ? '✓ Kunci' : studentRowAns === 'col1' ? 'Pilihan Anda' : '-'}
                                </td>
                                <td className={`p-2.5 border border-slate-200 text-center font-bold ${
                                  row.key === 'col2' ? 'bg-emerald-100 text-emerald-900' : ''
                                }`}>
                                  {row.key === 'col2' ? '✓ Kunci' : studentRowAns === 'col2' ? 'Pilihan Anda' : '-'}
                                </td>
                                <td className="p-2.5 border border-slate-200 text-center">
                                  {studentRowAns ? (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isCorrectRow ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {isCorrectRow ? 'Tepat' : 'Keliru'}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* KOTAK PEMBAHASAN SOAL */}
                  <div className="mt-3 p-3.5 bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-amber-50/80 border border-amber-200/90 rounded-2xl space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                      <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Lightbulb className="w-3.5 h-3.5" />
                      </div>
                      <span className="uppercase tracking-wide">💡 Pembahasan Soal:</span>
                    </div>

                    <div className="text-slate-800 text-xs sm:text-sm pl-8 leading-relaxed font-normal">
                      {q.pembahasan && q.pembahasan.trim() ? (
                        <MathRenderer
                          content={q.pembahasan}
                          onViewImage={onViewImage}
                          className="text-slate-900"
                        />
                      ) : (
                        <p className="text-slate-500 italic text-xs">
                          {q.type === 'pg'
                            ? `Kunci jawaban yang benar adalah pilihan ${(q as QuestionPG).kunci || 'A'}. (Belum ada catatan pembahasan tertulis untuk butir soal ini).`
                            : `(Belum ada catatan pembahasan khusus untuk butir soal ini. Silakan diskusikan bersama guru).`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Menampilkan {filteredQuestions.length} dari {totalQuestions} butir soal
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition active:scale-95 shadow-md ml-auto"
          >
            Tutup Review
          </button>
        </div>
      </div>
    </div>
  );
};
