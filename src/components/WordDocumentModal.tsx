import React, { useState } from 'react';
import { X, Download, Printer, FileText, ZoomIn, ZoomOut } from 'lucide-react';
import { Materi } from '../types';
import { MathRenderer } from './MathRenderer';
import { downloadMateriWord, printMateri } from '../utils/documentExport';

interface WordDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  materi: Materi | null;
}

export const WordDocumentModal: React.FC<WordDocumentModalProps> = ({
  isOpen,
  onClose,
  materi,
}) => {
  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 3>(1); // 1 = normal, 2 = larger, 3 = extra large

  if (!isOpen || !materi) return null;

  const fontClasses =
    zoomLevel === 1
      ? 'text-sm sm:text-base leading-relaxed'
      : zoomLevel === 2
      ? 'text-base sm:text-lg leading-loose'
      : 'text-lg sm:text-xl leading-loose';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-100 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Bar styled like Microsoft Word Ribbon / Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-4 py-3 sm:px-6 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                  Pratinjau Dokumen (Microsoft Word Style)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-100 text-[10px] font-semibold">
                  {materi.Mapel} • Kelas {materi.Kelas}
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base truncate max-w-md sm:max-w-xl text-white">
                {materi.Judul}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom text controls */}
            <div className="hidden sm:flex items-center bg-white/10 rounded-lg p-0.5 text-xs text-white">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => (z > 1 ? ((z - 1) as 1 | 2) : 1))}
                className="p-1.5 hover:bg-white/20 rounded"
                title="Perkecil Teks"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px]">{zoomLevel * 100}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => (z < 3 ? ((z + 1) as 2 | 3) : 3))}
                className="p-1.5 hover:bg-white/20 rounded"
                title="Perbesar Teks"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Download Word button */}
            <button
              type="button"
              onClick={() => downloadMateriWord(materi)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition active:scale-95"
              title="Unduh file .doc untuk Microsoft Word"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh Word (.doc)</span>
              <span className="sm:hidden">.doc</span>
            </button>

            {/* Print / PDF button */}
            <button
              type="button"
              onClick={() => printMateri(materi)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs shadow transition active:scale-95"
              title="Cetak atau simpan sebagai PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak / PDF</span>
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Word Document Canvas Paper */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-8 bg-slate-200 flex justify-center">
          <div className="bg-white text-slate-900 w-full max-w-3xl min-h-[750px] p-6 sm:p-12 rounded-lg shadow-xl border border-slate-300 font-serif">
            {/* Official School Kop Surat */}
            <div className="text-center border-b-2 border-double border-slate-800 pb-3 mb-6 font-sans">
              <div className="text-xs sm:text-sm font-extrabold uppercase text-slate-600 tracking-wider">
                Dinas Pendidikan dan Kebudayaan Kabupaten Tegal
              </div>
              <h2 className="text-base sm:text-xl font-black uppercase text-blue-900 my-1 tracking-tight">
                SD NEGERI HARJOSARI KIDUL 01
              </h2>
              <p className="text-[11px] text-slate-500 italic">
                Jl. Raya Harjosari Kidul No. 01, Kec. Adiwerna, Kab. Tegal, Jawa Tengah 52194
              </p>
            </div>

            {/* Metadata Table */}
            <div className="mb-6 font-sans bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-500">Mata Pelajaran:</span>{' '}
                <strong className="text-slate-900">{materi.Mapel}</strong>
              </div>
              <div>
                <span className="text-slate-500">Target Kelas:</span>{' '}
                <strong className="text-slate-900">{materi.Kelas}</strong>
              </div>
              <div>
                <span className="text-slate-500">Guru Pengajar:</span>{' '}
                <strong className="text-slate-900">{materi.Nama_Guru}</strong>
              </div>
              <div>
                <span className="text-slate-500">Sumber Referensi:</span>{' '}
                <strong className="text-slate-900">{materi.Sumber || 'Bahan Ajar Guru'}</strong>
              </div>
            </div>

            {/* Document Title */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-center text-slate-900 mb-6 uppercase tracking-normal leading-snug">
              {materi.Judul}
            </h1>

            {/* Banner Image if any */}
            {materi.Gambar_URL && (
              <div className="mb-6 text-center">
                <img
                  src={materi.Gambar_URL}
                  alt={materi.Judul}
                  className="max-h-80 mx-auto rounded-xl shadow-sm border border-slate-200"
                />
                <p className="text-xs text-slate-500 italic mt-1.5 font-sans">
                  Ilustrasi: {materi.Judul}
                </p>
              </div>
            )}

            {/* Main Reading Narration (Justified, Indented, Clean Word Typography) */}
            <div className={`text-slate-800 text-justify text-balance font-normal ${fontClasses} space-y-4`}>
              <MathRenderer content={materi.Konten_Link} />
            </div>

            {/* Footer */}
            <div className="mt-12 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-400 font-sans">
              <span>Sistem Pembelajaran Digital • SD Negeri Harjosari Kidul 01</span>
              <span>Dokumen Bahan Ajar Resmi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
