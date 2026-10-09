import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Award,
  CheckCircle,
  Play,
  RotateCcw,
  AlertCircle,
  Layers,
  Sparkles,
  Download,
  Printer,
  KeyRound,
  Calendar,
  X,
  AlertTriangle,
  BookOpen,
  Lightbulb,
  Lock,
  HeartHandshake,
} from 'lucide-react';
import { Ujian, Nilai, User, SchoolProfile, Question } from '../../types';
import { api } from '../../services/api';
import { downloadExamWord, printExamDocument } from '../../utils/documentExport';
import { KisiKisiModal } from '../KisiKisiModal';
import { ExamReviewModal } from '../ExamReviewModal';
import { ExportExamModal } from '../ExportExamModal';

interface MuridCBTListProps {
  currentUser: User;
  onStartExam: (exam: Ujian) => void;
  onOpenParentPortal?: () => void;
}

export const MuridCBTList: React.FC<MuridCBTListProps> = ({ currentUser, onStartExam, onOpenParentPortal }) => {
  const [ujianList, setUjianList] = useState<Ujian[]>([]);
  const [hasilList, setHasilList] = useState<Nilai[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [filterKelas, setFilterKelas] = useState<string>(currentUser.kelas || 'Semua');

  // Kisi-Kisi Modal
  const [kisiModalExam, setKisiModalExam] = useState<Ujian | null>(null);

  // Token Modal
  const [tokenModalExam, setTokenModalExam] = useState<Ujian | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');

  // Review & Export Modals
  const [reviewModalExam, setReviewModalExam] = useState<{ exam: Ujian; nilai?: Nilai | null } | null>(null);
  const [exportModalExam, setExportModalExam] = useState<Ujian | null>(null);
  const [lockedNotice, setLockedNotice] = useState<{
    title: string;
    message: string;
    total: number;
    answered: number;
  } | null>(null);

  const isAdmin = currentUser.role === 'admin';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const activeClass = isAdmin ? filterKelas : (currentUser.kelas || '6A');
      const [uData, hData, sProfile] = await Promise.all([
        api.getUjianList(activeClass, currentUser.role || 'murid'),
        api.getHasilMurid(currentUser.nama),
        api.getSchoolProfile().catch(() => null),
      ]);
      setUjianList(uData || []);
      setHasilList(hData || []);
      if (sProfile) setSchoolProfile(sProfile);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser.kelas, currentUser.nama, currentUser.role, filterKelas]);

  const handleInitiateExam = (u: Ujian) => {
    // Schedule check (bypassed for admin simulation test)
    const now = new Date();
    if (!isAdmin && u.Jadwal_Mulai) {
      const start = new Date(u.Jadwal_Mulai);
      if (now < start) {
        alert(
          `Ujian ini belum dimulai. Waktu mulai: ${start.toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}`
        );
        return;
      }
    }

    if (!isAdmin && u.Jadwal_Selesai) {
      const end = new Date(u.Jadwal_Selesai);
      if (now > end) {
        alert(
          `Ujian ini telah berakhir pada: ${end.toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}`
        );
        return;
      }
    }

    // Token check
    if (u.Token_Ujian && u.Token_Ujian.trim() !== '') {
      setTokenModalExam(u);
      setTokenInput(isAdmin ? (u.Token_Ujian || '') : '');
      setTokenError('');
      return;
    }

    onStartExam(u);
  };

  const handleVerifyTokenAndStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenModalExam) return;

    const required = (tokenModalExam.Token_Ujian || '').trim().toUpperCase();
    const entered = tokenInput.trim().toUpperCase();

    if (!isAdmin && entered !== required) {
      setTokenError('Token Ujian tidak sesuai. Silakan hubungi Guru / Pengawas.');
      return;
    }

    const exam = tokenModalExam;
    setTokenModalExam(null);
    setTokenInput('');
    setTokenError('');
    onStartExam(exam);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-800">
                Daftar Ujian CBT ({isAdmin ? `Filter: ${filterKelas}` : `Kelas ${currentUser.kelas || '6A'}`})
              </h3>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Mode Akses Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Ujian berbasis komputer dengan proteksi acak soal dan sistem anti-contek
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:outline-indigo-600"
            >
              <option value="Semua">Semua Kelas</option>
              <option value="1A">Kelas 1A</option>
              <option value="1B">Kelas 1B</option>
              <option value="2A">Kelas 2A</option>
              <option value="2B">Kelas 2B</option>
              <option value="3A">Kelas 3A</option>
              <option value="3B">Kelas 3B</option>
              <option value="4A">Kelas 4A</option>
              <option value="4B">Kelas 4B</option>
              <option value="5A">Kelas 5A</option>
              <option value="5B">Kelas 5B</option>
              <option value="6A">Kelas 6A</option>
              <option value="6B">Kelas 6B</option>
            </select>
          )}
          <button
            onClick={fetchData}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            Perbarui Daftar
          </button>
          {onOpenParentPortal && (
            <button
              type="button"
              onClick={onOpenParentPortal}
              title="Akses Portal Orang Tua via PIN untuk memantau nilai & perkembangan belajar"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-100" />
              <span>Portal Orang Tua</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-medium">
          Memuat jadwal ujian CBT...
        </div>
      ) : ujianList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-medium">
          Tidak ada ujian CBT aktif untuk kelas Anda saat ini. Silakan hubungi Guru jika belum muncul.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ujianList.map((u) => {
            let questionCount = 0;
            let sesiTarget = 'Semua';
            let maxAttempts = 1;

            try {
              const raw = JSON.parse(u.Soal_JSON || '{}');
              if (raw.questions) {
                questionCount = raw.questions.length;
                if (raw.config?.sesi) sesiTarget = raw.config.sesi;
                if (raw.config?.max_attempts !== undefined) maxAttempts = raw.config.max_attempts;
              } else if (Array.isArray(raw)) {
                questionCount = raw.length;
              }
            } catch {}

            // Session check
            const matchesSession =
              !sesiTarget ||
              sesiTarget === 'Semua' ||
              (currentUser?.kelas || '').toLowerCase().includes(String(sesiTarget || '').toLowerCase());

            if (!matchesSession) return null;

            // Student attempts calculation
            const studentSubmissions = hasilList.filter((h) => h.ID_Ujian === u.ID);
            const attemptsCount = studentSubmissions.length;
            const isCompletedAndLocked = maxAttempts > 0 && attemptsCount >= maxAttempts;
            const latestSubmission =
              studentSubmissions.length > 0
                ? studentSubmissions[studentSubmissions.length - 1]
                : null;
            const latestScore = latestSubmission ? latestSubmission.Nilai : null;

            // Hitung butir soal yang telah dijawab siswa pada pengerjaan terakhir
            let studentAnsweredCount = 0;
            if (latestSubmission?.Jawaban_JSON) {
              try {
                const rawAnswers = JSON.parse(latestSubmission.Jawaban_JSON);
                let parsedQList: Question[] = [];
                try {
                  const p = JSON.parse(u.Soal_JSON || '{}');
                  parsedQList = p.questions || (Array.isArray(p) ? p : []);
                } catch {}

                studentAnsweredCount = parsedQList.filter((q, idx) => {
                  const a = rawAnswers[idx];
                  if (a === undefined || a === null || a === '') return false;
                  if (q.type === 'pg') return typeof a === 'string' && a.length > 0;
                  if (q.type === 'pgk_mcma') return Array.isArray(a) && a.some((v: any) => v === true);
                  if (q.type === 'pgk_kategori') {
                    const rows = q.rows || [];
                    return typeof a === 'object' && Object.keys(a).length === rows.length;
                  }
                  return true;
                }).length;
              } catch {}
            }
            const isAllAnswered = questionCount > 0 && studentAnsweredCount >= questionCount;

            // Schedule check
            const now = new Date();
            const isUpcoming = u.Jadwal_Mulai ? now < new Date(u.Jadwal_Mulai) : false;
            const isExpired = u.Jadwal_Selesai ? now > new Date(u.Jadwal_Selesai) : false;

            return (
              <div
                key={u.ID}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                      {u.Mapel}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {u.Durasi_Menit} Menit
                    </span>
                  </div>

                  <h4 className="font-extrabold text-base sm:text-lg text-slate-800 leading-snug">
                    {u.Judul_Ujian}
                  </h4>

                  {/* Schedule badges */}
                  {(u.Jadwal_Mulai || u.Jadwal_Selesai || u.Token_Ujian) && (
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {u.Token_Ujian && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200 flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-amber-600" />
                          Token Diperlukan
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                          Belum Dimulai
                        </span>
                      )}
                      {isExpired && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 font-semibold border border-rose-200">
                          Jadwal Berakhir
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      {questionCount} Soal
                    </span>
                    <span>•</span>
                    <span>
                      Percobaan: <strong>{attemptsCount}</strong> /{' '}
                      {maxAttempts === 0 ? 'Bebas' : `${maxAttempts}x`}
                    </span>
                  </div>

                  {latestScore !== null && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Nilai Terakhir:</span>
                      <span
                        className={`text-sm font-black px-2.5 py-0.5 rounded-full ${
                          Number(latestScore) >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {Number(latestScore).toLocaleString('id-ID', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        / 100,00
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {isCompletedAndLocked ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs text-center border border-emerald-200 flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Selesai Dikerjakan ({attemptsCount}x)</span>
                    </div>
                  ) : isUpcoming ? (
                    <button
                      disabled
                      className="w-full py-3 px-4 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Belum Waktunya Ujian</span>
                    </button>
                  ) : isExpired ? (
                    <button
                      disabled
                      className="w-full py-3 px-4 rounded-xl bg-rose-100 text-rose-600 font-bold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Jadwal Ujian Telah Ditutup</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInitiateExam(u)}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
                    >
                      {attemptsCount > 0 ? (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>
                            Ulangi Ujian ({attemptsCount + 1}/{maxAttempts === 0 ? '∞' : maxAttempts})
                          </span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          <span>Mulai Pengerjaan Ujian</span>
                        </>
                      )}
                    </button>
                  )}

                  {attemptsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewModalExam({ exam: u, nilai: latestSubmission });
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 active:scale-98 text-purple-700 font-bold text-xs border border-purple-200 transition flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Lightbulb className="w-4 h-4 text-purple-600" />
                      <span>Review Kunci & Pembahasan Soal</span>
                    </button>
                  )}

                  {/* Student Question Sheet Download & Print & Kisi-Kisi */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setKisiModalExam(u)}
                      className="py-1.5 px-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[11px] border border-teal-200 transition flex items-center justify-center gap-1"
                      title="Lihat Kisi-Kisi Soal & Panduan Belajar Ujian Ini"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                      <span>Kisi-Kisi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportModalExam(u)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 transition flex items-center justify-center gap-1.5"
                      title="Cetak atau Unduh Dokumen Soal (PDF / Word, Naskah / Kunci / Pembahasan)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Cetak / Unduh (.doc & PDF)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TOKEN VERIFICATION MODAL */}
      {tokenModalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h4 className="font-black text-slate-800 text-base">Masukkan Token Ujian</h4>
              </div>
              <button
                onClick={() => setTokenModalExam(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Ujian <strong>"{tokenModalExam.Judul_Ujian}"</strong> dilindungi dengan kode token.
              Silakan minta token kepada Guru / Pengawas di kelas.
            </p>

            <form onSubmit={handleVerifyTokenAndStart} className="space-y-3">
              <div>
                <input
                  type="text"
                  maxLength={10}
                  autoFocus
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value.toUpperCase());
                    setTokenError('');
                  }}
                  placeholder="Ketik Token (misal: ABC123)"
                  className="w-full text-center text-lg font-mono tracking-widest uppercase font-black p-3 rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {tokenError && (
                  <p className="text-xs text-rose-600 font-bold mt-1.5 text-center">{tokenError}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTokenModalExam(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md"
                >
                  Verifikasi & Mulai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KISI-KISI MODAL FOR STUDENTS (READ-ONLY) */}
      {kisiModalExam && (
        <KisiKisiModal
          isOpen={!!kisiModalExam}
          onClose={() => setKisiModalExam(null)}
          ujian={kisiModalExam}
          schoolProfile={schoolProfile}
          readOnly={true}
        />
      )}

      {/* REVIEW HASIL & PEMBAHASAN MODAL */}
      {reviewModalExam && (
        <ExamReviewModal
          isOpen={Boolean(reviewModalExam)}
          onClose={() => setReviewModalExam(null)}
          ujian={reviewModalExam.exam}
          nilai={reviewModalExam.nilai}
          userRole="murid"
          isTeacher={false}
        />
      )}

      {/* EXPORT / CETAK EXAM MODAL: Terkunci khusus naskah soal siswa saja */}
      {exportModalExam && (
        <ExportExamModal
          isOpen={Boolean(exportModalExam)}
          onClose={() => setExportModalExam(null)}
          ujian={exportModalExam}
          userRole="murid"
          isStudent={true}
        />
      )}

      {/* MODAL PERINGATAN REVIEW TERKUNCI KARENA BELUM SEMUA SOAL TERJAWAB */}
      {lockedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-black text-slate-800 text-base">{lockedNotice.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed text-left">{lockedNotice.message}</p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-bold text-left">
                Pengerjaan: {lockedNotice.answered} dari {lockedNotice.total} Butir Soal ({lockedNotice.total - lockedNotice.answered} belum dijawab)
              </div>
            </div>
            <button
              onClick={() => setLockedNotice(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm active:scale-98"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
