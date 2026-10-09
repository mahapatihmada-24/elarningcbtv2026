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
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Ujian, Question, QuestionPG, QuestionPGKMCMA, QuestionPGKKategori, User, Nilai, getQuestionImages } from '../../types';
import { api } from '../../services/api';
import { MathRenderer } from '../MathRenderer';
import { ModalState } from '../ConfirmModal';
import { ExamReviewModal } from '../ExamReviewModal';

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
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [submittedNilai, setSubmittedNilai] = useState<Nilai | null>(null);

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

    // Proteksi Keamanan: Siswa tidak bisa menutup tab atau navigasi keluar sebelum waktu selesai
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSubmittingRef.current) {
        e.preventDefault();
        e.returnValue = 'Ujian tidak dapat diakhiri sebelum batas waktu habis. Silakan periksa kembali jawaban Anda.';
        return 'Ujian tidak dapat diakhiri sebelum batas waktu habis. Silakan periksa kembali jawaban Anda.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Kunci riwayat browser agar tidak bisa tekan tombol 'Back' untuk keluar
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      if (!isSubmittingRef.current) {
        window.history.pushState(null, '', window.location.href);
        onShowModal({
          isOpen: true,
          title: 'Peringatan Keamanan Ujian',
          message: 'Ujian tidak dapat diakhiri sebelum batas waktu habis. Silakan periksa kembali jawaban Anda.',
          type: 'warning',
          isConfirm: false,
          okText: 'Saya Mengerti, Lanjutkan Ujian',
        });
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Timer interval: Pengakhiran otomatis tepat ketika timer menyentuh angka 00:00
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Pengakhiran Otomatis Saat Timer Habis (00:00)
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

    const submissionPayload = {
      answers,
      questions: activeQuestions,
    };
    const jawabanJsonStr = JSON.stringify(submissionPayload);

    const payload = {
      id_ujian: exam.ID,
      judul_ujian: exam.Judul_Ujian,
      nama_murid: currentUser.nama,
      kelas: currentUser.kelas,
      nilai: finalScoreNum,
      pelanggaran: cheatCountRef.current,
      jawaban_json: jawabanJsonStr,
    };

    await api.submitHasilUjian(payload);

    const newNilaiRecord: Nilai = {
      ID: 'NILAI-' + Date.now(),
      ID_Ujian: exam.ID,
      Judul_Ujian: exam.Judul_Ujian,
      Nama_Murid: currentUser.nama,
      Kelas: currentUser.kelas,
      Nilai: finalScoreNum,
      Pelanggaran: cheatCountRef.current,
      Waktu_Submit: new Date().toISOString(),
      Jawaban_JSON: jawabanJsonStr,
    };

    setSubmittedNilai(newNilaiRecord);

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

    let finishMsg = '';
    if (isViolationLimit) {
      finishMsg = `Ujian telah dihentikan secara otomatis oleh sistem karena Anda telah mencapai batas maksimal 3 kali pelanggaran (meninggalkan halaman ujian).\n\nLembar jawaban Anda telah tersimpan dan terkirim ke server guru.\n\nNilai Murni: ${rawScoreStr}\nPenalti Pelanggaran (3x): -${penaltyStr}\n━━━━━━━━━━━━━━━━━━\nNilai Akhir: ${finalScoreStr} / 100,00`;
    } else {
      finishMsg = `Waktu pengerjaan ujian telah berakhir. Sistem telah mengumpulkan lembar jawaban Anda secara otomatis ke server guru.\n\nNilai Murni: ${rawScoreStr}${penaltyVal > 0 ? `\nPenalti Pindah Tab (${cheatCountRef.current}x): -${penaltyStr}` : ''}\n━━━━━━━━━━━━━━━━━━\nNilai Akhir: ${finalScoreStr} / 100,00`;
    }

    onShowModal({
      isOpen: true,
      title: isViolationLimit ? 'Ujian Dihentikan (3x Pelanggaran)' : 'Ujian Telah Dikumpulkan!',
      message: `${finishMsg}\n\nLembar jawaban Anda telah berhasil dikirimkan ke guru.\nSilakan klik "Lihat Review & Pembahasan" untuk meninjau kunci jawaban dan pembahasan soal.`,
      type: isViolationLimit ? 'danger' : finalScoreNum >= 75 ? 'success' : 'info',
      isConfirm: true,
      okText: 'Lihat Review & Pembahasan',
      cancelText: 'Kembali ke Menu Utama',
      onConfirm: () => {
        setIsReviewOpen(true);
      },
      onCancel: () => {
        onFinishExam();
      },
    });
  };

  const confirmSubmit = () => {
    // Kunci Fitur Selesai Ujian Sebelum Waktu Habis:
    // Tombol 'Selesai Ujian' atau 'Kumpulkan' milik siswa harus di-nonaktifkan (disabled) atau disembunyikan selama timer durasi ujian masih berjalan.
    // Siswa tidak diperbolehkan keluar secara mandiri atau menyelesaikan ujian lebih awal sebelum waktu habis, meskipun seluruh soal sudah diisi.
    // Tampilkan pesan peringatan jika siswa mencoba keluar: 'Ujian tidak dapat diakhiri sebelum batas waktu habis. Silakan periksa kembali jawaban Anda.'
    if (timeLeft > 0) {
      onShowModal({
        isOpen: true,
        title: 'Ujian Tidak Dapat Diakhiri',
        message: 'Ujian tidak dapat diakhiri sebelum batas waktu habis. Silakan periksa kembali jawaban Anda.',
        type: 'warning',
        isConfirm: false,
        okText: 'Saya Mengerti, Periksa Kembali',
      });
      return;
    }

    handleSubmitExam(true);
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

            {/* Submit: Dikunci selama timer berjalan */}
            <button
              onClick={confirmSubmit}
              className={`flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg font-bold text-xs sm:text-sm transition ${
                timeLeft > 0
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed opacity-90'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-95'
              }`}
              title={
                timeLeft > 0
                  ? 'Ujian tidak dapat diakhiri sebelum batas waktu habis. Silakan periksa kembali jawaban Anda.'
                  : 'Kirimkan Lembar Ujian'
              }
            >
              {timeLeft > 0 ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Kumpulkan (Terkunci)</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kirim</span>
                </>
              )}
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

              {/* Question Content: Stimulus, Inline Images & Text */}
              {(() => {
                const questionImages = getQuestionImages(q);
                // Check which images are referenced by [Gambar X] in q.soal
                const referencedIndices = new Set<number>();
                const regexImg = /\[(?:Gambar|Gbr)\s*(\d*)\]/gi;
                let m;
                let autoIdx = 0;
                while ((m = regexImg.exec(q.soal)) !== null) {
                  const idxNum = m[1] ? parseInt(m[1], 10) - 1 : autoIdx++;
                  if (idxNum >= 0 && idxNum < questionImages.length) {
                    referencedIndices.add(idxNum);
                  }
                }

                const unreferencedImages = questionImages
                  .map((img, i) => ({ img, i }))
                  .filter(({ i }) => !referencedIndices.has(i));

                return (
                  <div className="space-y-4">
                    {/* Only show top gallery if there are unreferenced images and no inline image tags */}
                    {unreferencedImages.length > 0 && referencedIndices.size === 0 && (
                      <div className="space-y-2">
                        {unreferencedImages.length === 1 ? (
                          <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-w-lg mx-auto">
                            <img
                              src={unreferencedImages[0].img}
                              alt={`Gambar Soal ${idx + 1}`}
                              className="max-h-64 w-full object-contain p-2 cursor-pointer"
                              onClick={() =>
                                onViewImage(unreferencedImages[0].img, `Gambar Soal Nomor ${idx + 1}`)
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                onViewImage(unreferencedImages[0].img, `Gambar Soal Nomor ${idx + 1}`)
                              }
                              className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/75 hover:bg-black text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm transition"
                            >
                              <Eye className="w-3.5 h-3.5" /> Perbesar
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`grid gap-3 ${
                              unreferencedImages.length === 2
                                ? 'grid-cols-1 sm:grid-cols-2'
                                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                            }`}
                          >
                            {unreferencedImages.map(({ img: imgUrl, i: originalIdx }) => (
                              <div
                                key={originalIdx}
                                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col justify-between"
                              >
                                <div className="px-2.5 py-1 bg-white/95 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold text-indigo-900">
                                  <span>Gambar {originalIdx + 1}</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Zoom</span>
                                </div>
                                <div
                                  className="h-44 sm:h-40 flex items-center justify-center p-2 cursor-pointer"
                                  onClick={() =>
                                    onViewImage(
                                      imgUrl,
                                      `Gambar ${originalIdx + 1} - Soal Nomor ${idx + 1}`
                                    )
                                  }
                                >
                                  <img
                                    src={imgUrl}
                                    alt={`Gambar ${originalIdx + 1} Soal ${idx + 1}`}
                                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-200"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onViewImage(
                                      imgUrl,
                                      `Gambar ${originalIdx + 1} - Soal Nomor ${idx + 1}`
                                    )
                                  }
                                  className="w-full py-1.5 bg-slate-100 group-hover:bg-indigo-600 text-slate-700 group-hover:text-white text-[11px] font-bold transition flex items-center justify-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Perbesar Gambar {originalIdx + 1}</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Question Text with Interspersed Math & Inline Images */}
                    <div className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
                      <MathRenderer
                        content={q.soal}
                        images={questionImages}
                        onViewImage={onViewImage}
                      />
                    </div>

                    {/* If some images were referenced inline and some were not, show remaining unreferenced images below */}
                    {referencedIndices.size > 0 && unreferencedImages.length > 0 && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="text-xs font-bold text-slate-700">Lampiran Tambahan:</div>
                        <div className="flex flex-wrap gap-3">
                          {unreferencedImages.map(({ img: imgUrl, i: originalIdx }) => (
                            <div
                              key={originalIdx}
                              className="border border-slate-200 rounded-lg p-1.5 bg-white cursor-pointer"
                              onClick={() =>
                                onViewImage(imgUrl, `Gambar ${originalIdx + 1} - Soal Nomor ${idx + 1}`)
                              }
                            >
                              <img src={imgUrl} alt={`Gambar ${originalIdx + 1}`} className="max-h-24 rounded object-contain" />
                              <div className="text-[10px] text-center font-bold text-slate-500 mt-1">Gambar {originalIdx + 1}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

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
                    const imgVal = q[`${opt}_img` as keyof QuestionPG] as string | undefined;
                    if (!textVal && !imgVal) return null;

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
                            <span className="font-bold text-indigo-700 mr-2">{opt.toUpperCase()}.</span>
                            {cleanTextVal ? (
                              <MathRenderer content={cleanTextVal} className="inline-block" />
                            ) : null}
                          </div>
                        </div>

                        {imgVal && (
                          <div className="relative group/optimg self-center sm:self-auto shrink-0 mt-2 sm:mt-0">
                            <img
                              src={imgVal}
                              alt={`Pilihan ${opt.toUpperCase()}`}
                              className="max-h-24 sm:max-h-28 rounded-lg border border-slate-200 object-contain bg-white p-1 ml-8 sm:ml-0 cursor-pointer hover:border-indigo-400 transition"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onViewImage(imgVal, `Pilihan ${opt.toUpperCase()} - Soal Nomor ${idx + 1}`);
                              }}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onViewImage(imgVal, `Pilihan ${opt.toUpperCase()} - Soal Nomor ${idx + 1}`);
                              }}
                              className="absolute bottom-1 right-1 opacity-0 group-hover/optimg:opacity-100 bg-black/75 hover:bg-black text-white p-1 rounded-md text-[10px] flex items-center gap-0.5 transition shadow"
                              title="Perbesar gambar"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
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
                    if (!opt.text && !opt.img) return null;

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
                            className="w-5 h-5 text-emerald-600 rounded cursor-pointer shrink-0"
                          />
                          <div className="text-sm sm:text-base font-semibold">
                            {opt.text ? (
                              <MathRenderer content={opt.text} className="inline-block" />
                            ) : (
                              <span className="text-slate-500 italic">Opsi {oIdx + 1}</span>
                            )}
                          </div>
                        </div>

                        {opt.img && (
                          <div className="relative group/optimg self-center sm:self-auto shrink-0 mt-2 sm:mt-0">
                            <img
                              src={opt.img}
                              alt={`Opsi ${oIdx + 1}`}
                              className="max-h-24 sm:max-h-28 rounded-lg border border-slate-200 object-contain bg-white p-1 ml-8 sm:ml-0 cursor-pointer hover:border-emerald-400 transition"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onViewImage(opt.img!, `Opsi ${oIdx + 1} - Soal Nomor ${idx + 1}`);
                              }}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onViewImage(opt.img!, `Opsi ${oIdx + 1} - Soal Nomor ${idx + 1}`);
                              }}
                              className="absolute bottom-1 right-1 opacity-0 group-hover/optimg:opacity-100 bg-black/75 hover:bg-black text-white p-1 rounded-md text-[10px] flex items-center gap-0.5 transition shadow"
                              title="Perbesar gambar"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
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
                                  <div className="relative group/rowimg inline-block mt-1.5">
                                    <img
                                      src={row.img}
                                      alt={`Gambar Pernyataan ${rIdx + 1}`}
                                      className="max-h-24 rounded-lg border border-slate-200 object-contain bg-white p-1 cursor-pointer hover:border-indigo-400 transition"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onViewImage(row.img!, `Pernyataan ${rIdx + 1} - Soal Nomor ${idx + 1}`);
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onViewImage(row.img!, `Pernyataan ${rIdx + 1} - Soal Nomor ${idx + 1}`);
                                      }}
                                      className="absolute bottom-1 right-1 opacity-0 group-hover/rowimg:opacity-100 bg-black/75 hover:bg-black text-white p-1 rounded-md text-[10px] flex items-center gap-0.5 transition shadow"
                                      title="Perbesar gambar"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                  </div>
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
                      className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition ${
                        timeLeft > 0
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-95'
                      }`}
                      title={
                        timeLeft > 0
                          ? 'Ujian tidak dapat diakhiri sebelum batas waktu habis. Silakan periksa kembali jawaban Anda.'
                          : 'Selesai & Kirimkan Jawaban'
                      }
                    >
                      {timeLeft > 0 ? (
                        <>
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span>Selesai (Terkunci s/d 00:00)</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Selesai & Kirim</span>
                        </>
                      )}
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
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">
                Status Pengerjaan: {answeredCount} dari {activeQuestions.length} Soal Dijawab
              </span>
              {timeLeft > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-700" /> Pengakhiran Mandiri Terkunci
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 block mt-0.5">
              {timeLeft > 0
                ? 'Ujian tidak dapat diakhiri sebelum batas waktu habis. Sistem akan otomatis mengumpulkan jawaban tepat ketika timer 00:00.'
                : 'Waktu ujian telah berakhir. Lembar ujian siap dikumpulkan.'}
            </span>
          </div>

          <button
            onClick={confirmSubmit}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-extrabold text-sm shadow-sm transition flex items-center justify-center gap-2 ${
              timeLeft > 0
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
            }`}
            title={
              timeLeft > 0
                ? 'Ujian tidak dapat diakhiri sebelum batas waktu habis. Silakan periksa kembali jawaban Anda.'
                : 'Kirim Jawaban Ujian'
            }
          >
            {timeLeft > 0 ? (
              <>
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Kirim Jawaban (Terkunci s/d 00:00)</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim Jawaban Ujian</span>
              </>
            )}
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

      {/* Review Hasil & Pembahasan Modal */}
      {isReviewOpen && (
        <ExamReviewModal
          isOpen={isReviewOpen}
          onClose={() => {
            setIsReviewOpen(false);
            onFinishExam();
          }}
          ujian={exam}
          questions={activeQuestions}
          nilai={submittedNilai}
          studentAnswers={answers}
          onViewImage={onViewImage}
          userRole="murid"
          isTeacher={false}
        />
      )}
    </div>
  );
};
