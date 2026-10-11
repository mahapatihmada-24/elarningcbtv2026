import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Lightbulb,
  FileCheck,
  Sparkles,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { Ujian, Question } from '../types';
import { printExamDocument, downloadExamWord } from '../utils/documentExport';
import { exportQuestionsToExcel } from '../utils/excelExamHelper';

interface ExportExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  ujian: Ujian | null;
  userRole?: 'guru' | 'murid' | 'admin';
  isStudent?: boolean;
}

export const ExportExamModal: React.FC<ExportExamModalProps> = ({
  isOpen,
  onClose,
  ujian,
  userRole,
  isStudent = false,
}) => {
  const isStudentView = isStudent || userRole === 'murid';
  const [selectedType, setSelectedType] = useState<'student' | 'with_answers' | 'with_pembahasan'>('student');
  const [deniedWarning, setDeniedWarning] = useState<string | null>(null);

  if (!isOpen || !ujian) return null;

  let questionCount = 0;
  try {
    const raw = JSON.parse(ujian.Soal_JSON || '{}');
    if (raw.questions && Array.isArray(raw.questions)) {
      questionCount = raw.questions.length;
    } else if (Array.isArray(raw)) {
      questionCount = raw.length;
    }
  } catch {}

  const handleSelectType = (type: 'student' | 'with_answers' | 'with_pembahasan') => {
    if (isStudentView && type !== 'student') {
      setDeniedWarning('Akses Ditolak: Opsi cetak kunci jawaban dan pembahasan hanya boleh diakses oleh akun Guru/Admin.');
      return;
    }
    setDeniedWarning(null);
    setSelectedType(type);
  };

  const handlePrint = () => {
    // Keamanan ketat: Jika akun siswa, selalu paksa false untuk kunci dan pembahasan
    const includeAnswers = isStudentView ? false : (selectedType === 'with_answers' || selectedType === 'with_pembahasan');
    const includePembahasan = isStudentView ? false : (selectedType === 'with_pembahasan');
    printExamDocument(ujian, { includeAnswers, includePembahasan });
  };

  const handleDownloadWord = () => {
    // Keamanan ketat: Jika akun siswa, selalu paksa false untuk kunci dan pembahasan
    const includeAnswers = isStudentView ? false : (selectedType === 'with_answers' || selectedType === 'with_pembahasan');
    const includePembahasan = isStudentView ? false : (selectedType === 'with_pembahasan');
    downloadExamWord(ujian, { includeAnswers, includePembahasan });
  };

  const handleDownloadExcel = () => {
    let questionsToExport: Question[] = [];
    try {
      const raw = JSON.parse(ujian.Soal_JSON || '{}');
      if (raw.questions && Array.isArray(raw.questions)) {
        questionsToExport = raw.questions;
      } else if (Array.isArray(raw)) {
        questionsToExport = raw;
      }
    } catch {
      questionsToExport = [];
    }

    if (questionsToExport.length === 0) {
      setDeniedWarning('Tidak ada butir soal pada naskah ujian ini untuk diekspor ke Excel.');
      return;
    }

    // Jika murid, amankan kunci jawaban
    if (isStudentView) {
      questionsToExport = questionsToExport.map((q) => {
        if (q.type === 'pg') {
          return { ...q, kunci: 'A' as const, pembahasan: '' };
        } else if (q.type === 'pgk_mcma') {
          return { ...q, options: q.options.map((o) => ({ ...o, isKey: false })), pembahasan: '' };
        }
        return { ...q, pembahasan: '' };
      });
    }

    try {
      exportQuestionsToExcel(ujian.Judul_Ujian || 'Bank_Soal', questionsToExport);
    } catch (err: any) {
      setDeniedWarning(err?.message || 'Gagal mengunduh file Excel.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                Cetak & Unduh Dokumen Soal
              </h3>
              <p className="text-xs text-indigo-100/90 mt-0.5">
                {isStudentView
                  ? 'Naskah Soal Siswa (Lembar Ujian Mandiri)'
                  : 'Pilih format naskah, kunci jawaban, dan pembahasan soal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white active:scale-95"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Student Restriction Notice */}
          {isStudentView && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-black block">Aturan Keamanan Akun Siswa:</span>
                <p className="leading-relaxed text-amber-800 text-[11px]">
                  Siswa hanya diperbolehkan mencetak/mengunduh <strong>Naskah Soal Siswa (Lembar Ujian)</strong> saja.
                  Opsi cetak kunci jawaban dan pembahasan hanya dapat diakses oleh akun Guru/Admin.
                </p>
              </div>
            </div>
          )}

          {deniedWarning && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
              <Lock className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-bold">{deniedWarning}</span>
            </div>
          )}

          {/* Info Card Ujian */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">
                {ujian.Mapel}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                Kelas: {ujian.Kelas}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
                {questionCount} Butir Soal
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-900 leading-snug pt-0.5">
              {ujian.Judul_Ujian}
            </h4>
          </div>

          {/* Opsi Konten Dokumen */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wide block">
              1. Pilih Isi Dokumen Soal:
            </label>

            {/* Option 1: Naskah Soal Siswa */}
            <div
              onClick={() => handleSelectType('student')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                selectedType === 'student'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedType === 'student'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    Naskah Soal Siswa (Lembar Ujian)
                  </h5>
                  <input
                    type="radio"
                    name="export_content_type"
                    checked={selectedType === 'student'}
                    onChange={() => handleSelectType('student')}
                    className="w-4 h-4 text-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Hanya berisi soal dan opsi jawaban (tanpa kunci & tanpa pembahasan). Cocok untuk lembar kerja atau naskah ujian cetak siswa.
                </p>
              </div>
            </div>

            {/* Option 2: Naskah Soal + Kunci Jawaban */}
            <div
              onClick={() => handleSelectType('with_answers')}
              className={`p-3.5 rounded-2xl border-2 transition flex items-start gap-3 ${
                isStudentView
                  ? 'border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed'
                  : selectedType === 'with_answers'
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-xs cursor-pointer'
                  : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isStudentView
                    ? 'bg-slate-200 text-slate-400'
                    : selectedType === 'with_answers'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isStudentView ? <Lock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h5 className={`text-xs sm:text-sm font-extrabold ${isStudentView ? 'text-slate-500' : 'text-slate-900'}`}>
                      Soal + Kunci Jawaban
                    </h5>
                    {isStudentView && (
                      <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-600 font-extrabold text-[9px] uppercase flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Khusus Guru
                      </span>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="export_content_type"
                    disabled={isStudentView}
                    checked={!isStudentView && selectedType === 'with_answers'}
                    onChange={() => handleSelectType('with_answers')}
                    className="w-4 h-4 text-emerald-600 disabled:opacity-40"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {isStudentView
                    ? 'Dinonaktifkan: Opsi kunci jawaban terkunci untuk akun siswa demi menjaga integritas soal ujian.'
                    : 'Menampilkan naskah soal dengan kunci jawaban yang ditandai tebal/berwarna dan tabel kunci jawaban. Cocok untuk pegangan guru.'}
                </p>
              </div>
            </div>

            {/* Option 3: Soal + Kunci + Pembahasan */}
            <div
              onClick={() => handleSelectType('with_pembahasan')}
              className={`p-3.5 rounded-2xl border-2 transition flex items-start gap-3 ${
                isStudentView
                  ? 'border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed'
                  : selectedType === 'with_pembahasan'
                  ? 'border-purple-600 bg-purple-50/70 shadow-xs cursor-pointer'
                  : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isStudentView
                    ? 'bg-slate-200 text-slate-400'
                    : selectedType === 'with_pembahasan'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isStudentView ? <Lock className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h5 className={`text-xs sm:text-sm font-extrabold ${isStudentView ? 'text-slate-500' : 'text-slate-900'}`}>
                      Lengkap: Soal + Kunci + Pembahasan
                    </h5>
                    {isStudentView ? (
                      <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-600 font-extrabold text-[9px] uppercase flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Khusus Guru
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded-md bg-purple-200 text-purple-900 font-extrabold text-[9px] uppercase">
                        Lengkap
                      </span>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="export_content_type"
                    disabled={isStudentView}
                    checked={!isStudentView && selectedType === 'with_pembahasan'}
                    onChange={() => handleSelectType('with_pembahasan')}
                    className="w-4 h-4 text-purple-600 disabled:opacity-40"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {isStudentView
                    ? 'Dinonaktifkan: Opsi pembahasan lengkap terkunci untuk akun siswa dan hanya dapat dicetak oleh Guru / Admin.'
                    : 'Menampilkan naskah soal, tanda kunci jawaban, dan kotak pembahasan materi lengkap per butir soal. Cocok untuk bank soal dan modul remedial.'}
                </p>
              </div>
            </div>
          </div>

          {/* Opsi Eksekusi / Format Dokumen */}
          <div className="pt-2 border-t border-slate-200 space-y-2.5">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wide block">
              2. Pilih Format Aksi:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={handlePrint}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4 text-indigo-300" />
                <span>Cetak / PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadWord}
                className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4 text-blue-200" />
                <span>Unduh Word</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadExcel}
                className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Unduh Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
