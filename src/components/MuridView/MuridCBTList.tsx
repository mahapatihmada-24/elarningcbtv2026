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
} from 'lucide-react';
import { Ujian, Nilai, User } from '../../types';
import { api } from '../../services/api';
import { downloadExamWord, printExamDocument } from '../../utils/documentExport';

interface MuridCBTListProps {
  currentUser: User;
  onStartExam: (exam: Ujian) => void;
}

export const MuridCBTList: React.FC<MuridCBTListProps> = ({ currentUser, onStartExam }) => {
  const [ujianList, setUjianList] = useState<Ujian[]>([]);
  const [hasilList, setHasilList] = useState<Nilai[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [uData, hData] = await Promise.all([
        api.getUjianList(currentUser.kelas || '6A', 'murid'),
        api.getHasilMurid(currentUser.nama),
      ]);
      setUjianList(uData || []);
      setHasilList(hData || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser.kelas, currentUser.nama]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800">
              Daftar Ujian CBT Aktif (Kelas {currentUser.kelas || '6A'})
            </h3>
            <p className="text-xs text-slate-500">
              Ujian berbasis komputer dengan proteksi acak soal dan sistem anti-contek
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          Perbarui Daftar
        </button>
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
            const latestScore =
              studentSubmissions.length > 0
                ? studentSubmissions[studentSubmissions.length - 1].Nilai
                : null;

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
                        {Number(latestScore).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / 100,00
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
                  ) : (
                    <button
                      onClick={() => onStartExam(u)}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
                    >
                      {attemptsCount > 0 ? (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Ulangi Ujian ({attemptsCount + 1}/{maxAttempts === 0 ? '∞' : maxAttempts})</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          <span>Mulai Pengerjaan Ujian</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Student Question Sheet Download & Print (Untuk Belajar & Mengulang) */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => downloadExamWord(u, { includeAnswers: false })}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition flex items-center justify-center gap-1.5"
                      title="Unduh lembar naskah soal LKS untuk belajar dan mengulang"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Soal (.doc)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => printExamDocument(u, { includeAnswers: false })}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] border border-slate-200 transition flex items-center justify-center gap-1"
                      title="Cetak atau simpan soal sebagai PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Cetak</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
