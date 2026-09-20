import React, { useMemo } from 'react';
import { X, Printer, Download, Award, FileText, CheckCircle } from 'lucide-react';
import { Nilai, SchoolProfile } from '../types';
import {
  generateRekapNilaiHtml,
  printRekapNilaiDocument,
  downloadRekapNilaiHtml,
  RekapNilaiPrintParams,
} from '../utils/rekapNilaiPrintHelper';

interface RekapNilaiPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  judulUjian: string;
  kelas: string;
  nilaiList: Nilai[];
  schoolProfile?: SchoolProfile | null;
  kkm?: number;
}

export const RekapNilaiPrintModal: React.FC<RekapNilaiPrintModalProps> = ({
  isOpen,
  onClose,
  judulUjian,
  kelas,
  nilaiList,
  schoolProfile,
  kkm = 75,
}) => {
  const printParams: RekapNilaiPrintParams = useMemo(
    () => ({
      judulUjian,
      kelas,
      nilaiList,
      schoolProfile,
      kkm,
    }),
    [judulUjian, kelas, nilaiList, schoolProfile, kkm]
  );

  const htmlContent = useMemo(() => {
    if (!isOpen) return '';
    return generateRekapNilaiHtml(printParams);
  }, [isOpen, printParams]);

  if (!isOpen) return null;

  const handlePrint = () => {
    printRekapNilaiDocument(printParams);
  };

  const handleDownload = () => {
    downloadRekapNilaiHtml(printParams);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-fadeIn">
      <div className="bg-slate-100 w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider">
                  Pratinjau Cetak Laporan Resmi
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Anti-Contek Aktif
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-sm sm:max-w-xl">
                Rekap Nilai: {judulUjian} ({nilaiList.length} Peserta)
              </h3>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
              title="Cetak atau simpan sebagai PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition active:scale-95 cursor-pointer"
              title="Unduh file dokumen HTML mandiri"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh Dokumen</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition ml-1 cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tip banner */}
        <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 text-indigo-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Laporan ini otomatis menyertakan <strong>Kop Surat Resmi</strong>, <strong>Nilai KKM</strong>, dan{' '}
              <strong>Log Catatan Integritas Anti-Contek (Deteksi Pindah Tab)</strong>.
            </span>
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold hidden sm:inline">
            Format: A4 Landscape
          </span>
        </div>

        {/* Document Preview Canvas */}
        <div className="flex-1 bg-slate-300 p-2 sm:p-4 overflow-hidden flex justify-center">
          <iframe
            title="Pratinjau Rekap Nilai"
            srcDoc={htmlContent}
            className="w-full h-full bg-white rounded-lg shadow-lg border border-slate-400"
          />
        </div>
      </div>
    </div>
  );
};
