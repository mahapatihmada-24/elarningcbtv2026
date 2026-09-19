import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Youtube,
  Eye,
  User as UserIcon,
  BookMarked,
  Download,
  Printer,
  FileText,
} from 'lucide-react';
import { Materi, User } from '../../types';
import { api } from '../../services/api';
import { MathRenderer } from '../MathRenderer';
import { extractYoutubeId } from '../YouTubeModal';
import { WordDocumentModal } from '../WordDocumentModal';
import { downloadMateriWord, printMateri } from '../../utils/documentExport';

interface MuridMateriProps {
  currentUser: User;
  onPlayYoutube: (id: string) => void;
  onViewImage: (url: string, title?: string) => void;
}

export const MuridMateri: React.FC<MuridMateriProps> = ({
  currentUser,
  onPlayYoutube,
  onViewImage,
}) => {
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMapel, setFilterMapel] = useState('ALL');
  const [selectedWordMateri, setSelectedWordMateri] = useState<Materi | null>(null);

  const fetchMateri = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMateriList(currentUser?.kelas || '6A');
      setMateriList(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMateri();
  }, [currentUser?.kelas]);

  // Unique subjects
  const subjects = Array.from(new Set(materiList.map((m) => m.Mapel)));

  const filteredMateri = materiList.filter((m) => {
    const sLower = (search || '').toLowerCase();
    const matchesSearch =
      (m.Judul || '').toLowerCase().includes(sLower) ||
      (m.Mapel || '').toLowerCase().includes(sLower) ||
      (m.Konten_Link || '').toLowerCase().includes(sLower);

    const matchesMapel = filterMapel === 'ALL' || m.Mapel === filterMapel;
    return matchesSearch && matchesMapel;
  });

  return (
    <div className="space-y-5">
      {/* Search & Mapel Filter Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800">
              Materi Belajar Siswa (Kelas {currentUser.kelas || '6A'})
            </h3>
            <p className="text-xs text-slate-500">
              Pelajari materi pelajaran dan video panduan dari Guru
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari materi pelajaran..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filterMapel}
            onChange={(e) => setFilterMapel(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
          >
            <option value="ALL">Semua Mapel</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-medium">
          Memuat materi pelajaran untuk kelas {currentUser.kelas}...
        </div>
      ) : filteredMateri.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-medium">
          Belum ada materi pelajaran yang tersedia untuk kelas Anda saat ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMateri.map((m) => {
            const ytId = extractYoutubeId(m.Konten_Link);

            return (
              <div
                key={m.ID}
                className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                      {m.Mapel}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <UserIcon className="w-3 h-3 text-slate-400" />
                      <span>{m.Nama_Guru}</span>
                    </div>
                  </div>

                  <h4 className="font-extrabold text-lg sm:text-xl text-slate-800 leading-snug">
                    {m.Judul}
                  </h4>

                  {m.Gambar_URL && (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img
                        src={m.Gambar_URL}
                        alt={m.Judul}
                        className="max-h-60 w-full object-contain p-2"
                      />
                      <button
                        onClick={() => onViewImage(m.Gambar_URL!, m.Judul)}
                        className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/75 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm hover:bg-black transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ketuk untuk Perbesar
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedWordMateri(m)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition"
                      title="Buka tampilan membaca rapi ala Microsoft Word"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Baca Mode Word</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadMateriWord(m)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition"
                      title="Unduh materi format Word (.doc) untuk dipelajari secara offline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Word (.doc)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => printMateri(m)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] border border-slate-200 transition"
                      title="Cetak atau simpan sebagai PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak / PDF</span>
                    </button>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed max-h-[420px] overflow-y-auto p-1.5 font-sans break-words">
                    <MathRenderer content={m.Konten_Link} />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1 text-slate-500 text-[11px] max-w-xs truncate">
                    <BookMarked className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Sumber: {m.Sumber || 'Materi Guru'}</span>
                  </div>

                  {ytId && (
                    <button
                      onClick={() => onPlayYoutube(ytId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs shadow-sm transition"
                    >
                      <Youtube className="w-4 h-4" />
                      <span>Tonton Video</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Word Document Full Reading Modal */}
      <WordDocumentModal
        isOpen={!!selectedWordMateri}
        onClose={() => setSelectedWordMateri(null)}
        materi={selectedWordMateri}
      />
    </div>
  );
};
