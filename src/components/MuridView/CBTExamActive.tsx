import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  AlertTriangle,
  Send,
  ShieldAlert,
  Maximize2,
  Minimize2,
  CheckCircle,
  HelpCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ListFilter,
  X,
  User as UserIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Ujian, Question, QuestionPG, QuestionPGKMCMA, QuestionPGKKategori, User } from '../../types';
import { api } from '../../services/api';
import { MathRenderer } from '../MathRenderer';
import { ModalState } from '../ConfirmModal';

interface CBTExamActiveProps {
  exam: Ujian;
  currentUser: User;
  onFinishExam: () => void;
  onViewImage: (url: string, title?: string) => void;
  onShowModal: (modal: Partial<ModalState>) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const CBTExamActive: React.FC<CBTExamActiveProps> = ({
  exam,
  currentUser,
  onFinishExam,
  onViewImage,
  onShowModal,
}) => {
  const [cheatCount, setCheatCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exam.Durasi_Menit * 60);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isDaftarSoalOpen, setIsDaftarSoalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  // Student answers state
  // Key: question index => value
  // For PG: string ('A' | 'B' | 'C' | 'D')
  // For PGK MCMA: boolean[] (array of boolean matching options)
  // For PGK Kategori: Record<number, 'col1' | 'col2'>
  const [answers, setAnswers] = useState<Record<number, unknown>>({});

  // Prepare shuffled questions
  const activeQuestions: Question[] = useMemo(() => {
    let parsedPayload = { config: {}, questions: [] as Question[] };
    try {
      const raw = JSON.parse(exam.Soal_JSON || '{}');
      if (raw.questions) parsedPayload = raw;
      else if (Array.isArray(raw)) parsedPayload.questions = raw;
    } catch {}

    const cfg = parsedPayload.config as { acak_soal?: boolean; acak_opsi?: boolean };
    let qList = [...(parsedPayload.questions || [])];

    if (cfg.acak_soal !== false) {
      qList = shuffleArray(qList);
    }

    return qList.map((q) => {
      const copy = { ...q };
      if (copy.type === 'pg' && cfg.acak_opsi !== false) {
        const keys: ('a' | 'b' | 'c' | 'd' | 'e')[] = copy.e
          ? ['a', 'b', 'c', 'd', 'e']
          : ['a', 'b', 'c', 'd'];
        const correctKey = String(copy.kunci || 'A').toLowerCase();

        const opts = keys.map((k) => ({
          key: k,
          text: (copy as unknown as Record<string, string>)[k] || '',
          img: copy[`${k}_img` as keyof QuestionPG] as string | undefined,
          isKey: k === correctKey,
        }));

        const shuffled = shuffleArray(opts);
        keys.forEach((k, idx) => {
          (copy as unknown as Record<string, string>)[k] = shuffled[idx].text;
          (copy as unknown as Record<string, string | undefined>)[`${k}_img`] = shuffled[idx].img;
          if (shuffled[idx].isKey) {
            copy.kunci = k.toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E';
          }
        });
      }
      return copy;
    });
  }, [exam]);

  // Anti-cheat tracking
  const cheatCountRef = useRef(cheatCount);
  cheatCountRef.current = cheatCount;
  const isSubmittingRef = useRef(isSubmitting);
  isSubmittingRef.current = isSubmitting;
  const lastCheatTimestampRef = useRef<number>(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmittingRef.current) {
        const now = Date.now();
        // Cooldown 2.5 detik untuk mencegah double trigger pada perangkat mobile/tab switch
        if (now - lastCheatTimestampRef.current < 2500) {
          return;
        }
        lastCheatTimestampRef.current = now;

        const nextCount = cheatCountRef.current + 1;
        setCheatCount(nextCount);
        cheatCountRef.current = nextCount;

        if (nextCount >= 3) {
          // Ketika pelanggaran mencapai batas 3 kali: otomatis keluar dan kumpulkan ujian
          handleSubmitExam(true);
        } else {
          // Pelanggaran ke-1 dan ke-2: JANGAN langsung keluar dari ujian, cukup berikan notifikasi peringatan melanggar
          const sisaKesempatan = 3 - nextCount;
          onShowModal({
            isOpen: true,
            title: `Peringatan Pelanggaran (${nextCount}/3)!`,
            message: `Perhatian!\nAnda terdeteksi meninggalkan halaman ujian (berpindah tab, membuka aplikasi lain, atau meminimalkan browser).\n\nIni adalah pelanggaran ke-${nextCount} dari batas maksimal 3 kali. (Sisa kesempatan: ${sisaKesempatan} kali lagi).\n\nJika melakukan pelanggaran hingga 3 kali, ujian akan OTOMATIS keluar dan jawaban Anda langsung dikirimkan ke guru.`,
            type: 'warning',
            isConfirm: false,
            okText: 'Saya Mengerti, Lanjutkan Ujian',
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Prevent accidental page leave
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSubmittingRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onShowModal({
            isOpen: true,
            title: 'Waktu Ujian Habis!',
            message: 'Waktu pengerjaan telah berakhir. Jawaban Anda akan otomatis dikirim ke server.',
            type: 'info',
            isConfirm: false,
            onConfirm: () => {
              handleSubmitExam(true);
            },
          });
          handleSubmitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Keyboard navigation for authentic CAT experience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentQuestionIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeQuestions.length]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Check if a question is answered
  const isQuestionAnswered = (idx: number): boolean => {
    const ans = answers[idx];
    if (ans === undefined || ans === null) return false;

    const q = activeQuestions[idx];
    if (q.type === 'pg') {
      return typeof ans === 'string' && ans.length > 0;
    } else if (q.type === 'pgk_mcma') {
      return Array.isArray(ans) && ans.some((v) => v === true);
    } else if (q.type === 'pgk_kategori') {
      const obj = ans as Record<number, string>;
      return typeof obj === 'object' && Object.keys(obj).length === q.rows.length;
    }
    return false;
  };

  const answeredCount = activeQuestions.filter((_, idx) => isQuestionAnswered(idx)).length;

  const scrollToQuestion = (idx: number) => {
    const elem = document.getElementById(`soal-box-${idx}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Submit scoring logic
  const handleSubmitExam = async (isForced = false) => {
    if (isSubmittingRef.current) return;
    setIsSubmitting(true);

    let totalEarnedPoints = 0;
    let maxTotalPoints = 0;

    activeQuestions.forEach((q, idx) => {
      const weight = Number(q.bobot) || 1;
      maxTotalPoints += weight;
      const ans = answers[idx];

      if (q.type === 'pg') {
        if (typeof ans === 'string' && ans.toUpperCase() === q.kunci) {
          totalEarnedPoints += weight;
        }
      } else if (q.type === 'pgk_mcma') {
        const options = q.options || [];
        const totalKeys = options.filter((o) => o.isKey).length;
        let correctSelected = 0;
        let wrongSelected = 0;

        const selArr = (ans as boolean[]) || [];
        options.forEach((opt, oIdx) => {
          if (selArr[oIdx] === true) {
            if (opt.isKey) correctSelected++;
            else wrongSelected++;
          }
        });

        if (totalKeys > 0) {
          const ratio = Math.max(0, (correctSelected - wrongSelected) / totalKeys);
          totalEarnedPoints += ratio * weight;
        }
      } else if (q.type === 'pgk_kategori') {
        const rows = q.rows || [];
        const rowAns = (ans as Record<number, 'col1' | 'col2'>) || {};
        if (rows.length > 0) {
          let rowScore = 0;
          rows.forEach((r, rIdx) => {
            if (rowAns[rIdx] === r.key) {
              rowScore++;
            }
          });
          totalEarnedPoints += (rowScore / rows.length) * weight;
        }
      }
    });

    const rawScoreVal = maxTotalPoints > 0 ? (totalEarnedPoints / maxTotalPoints) * 100 : 0;
    const penaltyVal = cheatCountRef.current * 5;
    const finalScoreVal = Math.max(0, rawScoreVal - penaltyVal);

    // Format nilai dengan 2 angka di belakang koma (misal 100,00 atau 95,85)
    const finalScoreNum = Math.round(finalScoreVal * 100) / 100;
    const rawScoreNum = Math.round(rawScoreVal * 100) / 100;

    const formatIndoScore = (num: number): string => {
      return num.toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const rawScoreStr = formatIndoScore(rawScoreNum);
    const penaltyStr = formatIndoScore(penaltyVal);
    const finalScoreStr = formatIndoScore(finalScoreNum);

    const payload = {
      id_ujian: exam.ID,
      judul_ujian: exam.Judul_Ujian,
      nama_murid: currentUser.nama,
      kelas: currentUser.kelas,
      nilai: finalScoreNum,
      pelanggaran: cheatCountRef.current,
    };

    await api.submitHasilUjian(payload);

    if (finalScoreNum >= 75) {
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    const isViolationLimit = cheatCountRef.current >= 3;

    onShowModal({
      isOpen: true,
      title: isViolationLimit ? 'Ujian Dihentikan (3x Pelanggaran)' : 'Ujian Selesai!',
      message: isViolationLimit
        ? `Ujian telah dihentikan secara otomatis oleh sistem karena Anda telah mencapai batas maksimal 3 kali pelanggaran (meninggalkan halaman ujian).\n\nLembar jawaban Anda telah tersimpan dan terkirim ke server guru.\n\nNilai Murni: ${rawScoreStr}\nPenalti Pelanggaran (3x): -${penaltyStr}\n━━━━━━━━━━━━━━━━━━\nNilai Akhir: ${finalScoreStr} / 100,00`
        : `Selamat, Anda telah menyelesaikan ujian!\n\nNilai Murni: ${rawScoreStr}${penaltyVal > 0 ? `\nPenalti Pindah Tab (${cheatCountRef.current}x): -${penaltyStr}` : ''}\n━━━━━━━━━━━━━━━━━━\nNilai Akhir: ${finalScoreStr} / 100,00`,
      type: isViolationLimit ? 'danger' : finalScoreNum >= 75 ? 'success' : 'info',
      isConfirm: false,
      okText: 'Kembali ke Menu Utama',
      onConfirm: () => {
        onFinishExam();
      },
    });
  };

  const confirmSubmit = () => {
    const unanswered = activeQuestions.length - answeredCount;
    let confirmMsg = 'Apakah Anda yakin ingin menyelesaikan dan mengirimkan jawaban ujian ini sekarang?';
    if (unanswered > 0) {
      confirmMsg = `Masih ada ${unanswered} soal yang BELUM dijawab!\n\nApakah Anda tetap ingin mengirimkan lembar ujian sekarang?`;
    }

    onShowModal({
      isOpen: true,
      title: 'Konfirmasi Pengumpulan Jawaban',
      message: confirmMsg,
      type: unanswered > 0 ? 'warning' : 'question',
      isConfirm: true,
      okText: 'Ya, Kumpulkan Jawaban',
      cancelText: 'Lanjutkan Mengerjakan',
      onConfirm: () => {
        handleSubmitExam(false);
      },
    });
  };

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const isTimeCritical = timeLeft < 300; // < 5 minutes

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Sticky Compact Professional CAT Header Bar */}
      <div className="sticky top-14 sm:top-16 z-20 bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-slate-200 px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Exam Info */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-xs shrink-0">
              {exam.Mapel}
            </span>
            <h2 className="font-extrabold text-xs sm:text-sm text-slate-800 truncate" title={exam.Judul_Ujian}>
              {exam.Judul_Ujian}
            </h2>
            <span className="hidden md:inline text-xs text-slate-400">•</span>
            <span className="hidden md:inline text-xs text-slate-500 font-medium">
              Soal {currentQuestionIndex + 1} dari {activeQuestions.length}
            </span>
            <span
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[130px] border border-slate-200 shrink-0"
              title={`Nama Siswa: ${currentUser.nama} (${currentUser.kelas})`}
            >
              <UserIcon className="w-3 h-3 text-indigo-600 shrink-0" />
              <span className="truncate">{currentUser.nama}</span>
            </span>
          </div>

          {/* Right: Controls & Timer */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Timer */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg border font-mono font-black text-xs sm:text-sm ${
                isTimeCritical
                  ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                  : 'bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Daftar Soal Button */}
            <button
              onClick={() => setIsDaftarSoalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs transition active:scale-95"
              title="Buka Daftar Nomor Soal"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="hidden xs:inline">Daftar Soal</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-200 text-indigo-800 text-[10px] font-black">
                {answeredCount}/{activeQuestions.length}
              </span>
            </button>

            {/* View Mode Toggle (CAT per-soal vs Semua) */}
            <button
              onClick={() => setViewMode((prev) => (prev === 'single' ? 'all' : 'single'))}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold hidden sm:flex items-center gap-1"
              title={viewMode === 'single' ? 'Tampilkan Semua Soal' : 'Mode CAT (Per Soal)'}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span className="text-[11px]">{viewMode === 'single' ? 'Per Soal' : 'Semua'}</span>
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hidden md:flex"
              title="Layar Penuh"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Submit */}
            <button
              onClick={confirmSubmit}
              className="flex items-center gap-1 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </div>
        </div>

        {/* Anti-cheat banner if triggered: Slim and neat */}
        {cheatCount > 0 && (
          <div className="mt-2 py-1 px-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">
                Pelanggaran {cheatCount}/3 (Penalti: -{cheatCount * 5} poin).{' '}
                {cheatCount < 3 ? `Sisa toleransi: ${3 - cheatCount}x lagi.` : 'Batas maksimal tercapai!'}
              </span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.2 rounded-full font-black shrink-0 ${
                cheatCount >= 2 ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-600 text-white'
              }`}
            >
              {cheatCount}/3 Pelanggaran
            </span>
          </div>
        )}
      </div>

      {/* Question Items */}
      <div className="space-y-6">
        {(viewMode === 'single'
          ? [activeQuestions[currentQuestionIndex]]
          : activeQuestions
        ).map((q, rawIdx) => {
          const idx = viewMode === 'single' ? currentQuestionIndex : rawIdx;
          const ans = answers[idx];

          return (
            <div
              key={idx}
              id={`soal-box-${idx}`}
              className="bg-white p-5 sm:p-7 rounded-2xl shadow-sm border border-slate-200 space-y-4 scroll-mt-36"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-slate-800">
                    Soal Nomor {idx + 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isQuestionAnswered(idx) ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sudah Dijawab</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-semibold">
                      Belum Dijawab
                    </span>
                  )}
                </div>
              </div>

              {/* Question Image if present */}
              {q.gambar && (
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-w-lg mx-auto">
                  <img
                    src={q.gambar}
                    alt={`Gambar Soal ${idx + 1}`}
                    className="max-h-64 w-full object-contain p-2"
                  />
                  <button
                    onClick={() => onViewImage(q.gambar!, `Gambar Soal Nomor ${idx + 1}`)}
                    className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/75 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm"
                  >
                    <Eye className="w-3.5 h-3.5" /> Perbesar
                  </button>
                </div>
              )}

              {/* Question Text */}
              <div className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
                <MathRenderer content={q.soal} />
              </div>

              {/* Options by Question Type */}

              {/* TYPE 1: PG */}
              {q.type === 'pg' && (
                <div className="space-y-2.5 pt-2">
                  {(
                    ['a', 'b', 'c', 'd', ...((q as QuestionPG).e ? ['e'] : [])] as (
                      | 'a'
                      | 'b'
                      | 'c'
                      | 'd'
                      | 'e'
                    )[]
                  ).map((opt) => {
                    const textVal = (q as QuestionPG)[opt] || '';
                    if (!textVal) return null;

                    const imgVal = q[`${opt}_img` as keyof QuestionPG] as string | undefined;
                    const isSelected = ans === opt.toUpperCase();
                    // Bersihkan jika ada awalan huruf A., B., C., D., E. atau a., b., c., d., e. dari teks opsi
                    const cleanTextVal = textVal.replace(/^[A-Ea-e][\.\)]\s*/, '');

                    return (
                      <label
                        key={opt}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border-2 transition cursor-pointer active:scale-99 ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 shadow-sm'
                            : 'bg-white border-slate-200 hover:bg-slate-50/80 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`q_${idx}`}
                            value={opt.toUpperCase()}
                            checked={isSelected}
                            onChange={() =>
                              setAnswers((prev) => ({
                                ...prev,
                                [idx]: opt.toUpperCase(),
                              }))
                            }
                            className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                          />
                          <div className="text-sm sm:text-base font-semibold text-slate-800">
                            <MathRenderer content={cleanTextVal} className="inline-block" />
                          </div>
                        </div>

                        {imgVal && (
                          <img
                            src={imgVal}
                            alt="Ilustrasi Pilihan Jawaban"
                            className="max-h-24 rounded border object-contain bg-white p-1 ml-8 sm:ml-0"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {/* TYPE 2: PGK MCMA (Multiple Choice Multiple Answer) */}
              {q.type === 'pgk_mcma' && (
                <div className="space-y-2.5 pt-2">
                  <p className="text-xs text-indigo-700 font-semibold italic mb-1">
                    * Pilihlah satu atau lebih jawaban yang menurut Anda benar
                  </p>
                  {(q.options || []).map((opt, oIdx) => {
                    const checkedArr = (ans as boolean[]) || [];
                    const isChecked = !!checkedArr[oIdx];

                    return (
                      <label
                        key={oIdx}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border-2 transition cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/80 border-emerald-600 text-emerald-950 shadow-sm'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const copy = [...checkedArr];
                              copy[oIdx] = e.target.checked;
                              setAnswers((prev) => ({
                                ...prev,
                                [idx]: copy,
                              }));
                            }}
                            className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                          />
                          <div className="text-sm sm:text-base font-semibold">
                            <MathRenderer content={opt.text} className="inline-block" />
                          </div>
                        </div>

                        {opt.img && (
                          <img
                            src={opt.img}
                            alt="Ilustrasi Opsi"
                            className="max-h-24 rounded border object-contain bg-white p-1 ml-8 sm:ml-0"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {/* TYPE 3: PGK Kategori / Tabel */}
              {q.type === 'pgk_kategori' && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-blue-700 font-semibold italic mb-1">
                    * Tentukan kategori untuk masing-masing baris pernyataan di bawah ini
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-blue-200 shadow-sm">
                    <table className="w-full text-xs sm:text-sm text-left border-collapse">
                      <thead className="bg-blue-100 text-blue-900 border-b border-blue-200">
                        <tr>
                          <th className="p-3 font-bold text-slate-800">Pernyataan Soal</th>
                          <th className="p-3 w-28 text-center font-extrabold text-blue-900 border-l border-blue-200">
                            {q.col1 || 'Sebelum'}
                          </th>
                          <th className="p-3 w-28 text-center font-extrabold text-blue-900 border-l border-blue-200">
                            {q.col2 || 'Sesudah'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {(q.rows || []).map((row, rIdx) => {
                          const rowAnsObj = (ans as Record<number, 'col1' | 'col2'>) || {};
                          const currentVal = rowAnsObj[rIdx];

                          return (
                            <tr key={rIdx} className="hover:bg-slate-50 transition">
                              <td className="p-3 font-medium text-slate-800">
                                <MathRenderer content={row.text} />
                                {row.img && (
                                  <img
                                    src={row.img}
                                    alt="Ilustrasi"
                                    className="max-h-20 rounded border object-contain mt-1"
                                  />
                                )}
                              </td>

                              <td className="p-3 text-center border-l border-slate-200">
                                <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-indigo-50 w-full">
                                  <input
                                    type="radio"
                                    name={`q_${idx}_row_${rIdx}`}
                                    value="col1"
                                    checked={currentVal === 'col1'}
                                    onChange={() =>
                                      setAnswers((prev) => ({
                                        ...prev,
                                        [idx]: {
                                          ...rowAnsObj,
                                          [rIdx]: 'col1',
                                        },
                                      }))
                                    }
                                    className="w-5 h-5 text-indigo-600 cursor-pointer"
                                  />
                                </label>
                              </td>

                              <td className="p-3 text-center border-l border-slate-200">
                                <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-indigo-50 w-full">
                                  <input
                                    type="radio"
                                    name={`q_${idx}_row_${rIdx}`}
                                    value="col2"
                                    checked={currentVal === 'col2'}
                                    onChange={() =>
                                      setAnswers((prev) => ({
                                        ...prev,
                                        [idx]: {
                                          ...rowAnsObj,
                                          [rIdx]: 'col2',
                                        },
                                      }))
                                    }
                                    className="w-5 h-5 text-indigo-600 cursor-pointer"
                                  />
                                </label>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CAT Navigation inside question card */}
              {viewMode === 'single' && (
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  <button
                    onClick={() => setIsDaftarSoalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                  >
                    <LayoutGrid className="w-4 h-4 text-indigo-600" />
                    <span>Daftar Soal ({answeredCount}/{activeQuestions.length})</span>
                  </button>

                  {currentQuestionIndex < activeQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition active:scale-95"
                    >
                      <span>Berikutnya</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={confirmSubmit}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                      <span>Selesai & Kirim</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Submit Action Bar (Tampil di Mode Semua Soal) */}
      {viewMode === 'all' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-800 text-sm block">
              Status Pengerjaan: {answeredCount} dari {activeQuestions.length} Soal Dijawab
            </span>
            <span className="text-xs text-slate-500">
              Periksa kembali jawaban Anda sebelum mengirimkan lembar ujian.
            </span>
          </div>

          <button
            onClick={confirmSubmit}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Jawaban Ujian</span>
          </button>
        </div>
      )}

      {/* Modal Dialog Daftar Nomor Soal */}
      {isDaftarSoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-indigo-600" />
                  Daftar Nomor Soal Ujian
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Terjawab: <strong className="text-emerald-600">{answeredCount}</strong> dari {activeQuestions.length} Soal
                </p>
              </div>
              <button
                onClick={() => setIsDaftarSoalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block" />
                <span>Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 inline-block" />
                <span>Belum Dijawab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-indigo-100 border-2 border-indigo-600 inline-block" />
                <span>Sedang Dibuka</span>
              </div>
            </div>

            {/* Numbers Grid */}
            <div className="overflow-y-auto pr-1 flex-1 py-1">
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {activeQuestions.map((_, idx) => {
                  const answered = isQuestionAnswered(idx);
                  const isCurrent = idx === currentQuestionIndex;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        setIsDaftarSoalOpen(false);
                        if (viewMode === 'all') {
                          scrollToQuestion(idx);
                        }
                      }}
                      className={`h-10 rounded-xl font-black text-sm transition flex flex-col items-center justify-center relative ${
                        isCurrent
                          ? 'ring-2 ring-indigo-600 ring-offset-2'
                          : ''
                      } ${
                        answered
                          ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      <span>{idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Klik nomor untuk langsung menuju soal
              </span>
              <button
                onClick={() => setIsDaftarSoalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
