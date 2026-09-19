import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  PenSquare,
  Trash2,
  Bold,
  Italic,
  Underline,
  Table as TableIcon,
  Sigma,
  Image as ImageIcon,
  Youtube,
  Upload,
  ExternalLink,
  Search,
  Eye,
  FileText,
  Download,
  Printer,
  List,
  ListOrdered,
  Heading2,
  Pilcrow,
  Calculator,
} from 'lucide-react';
import { Materi, User } from '../../types';
import { api } from '../../services/api';
import { MathRenderer } from '../MathRenderer';
import { extractYoutubeId } from '../YouTubeModal';
import { ModalState } from '../ConfirmModal';
import { InsertImageModal } from './InsertImageModal';
import { WordDocumentModal } from '../WordDocumentModal';
import { MathSymbolModal } from '../MathSymbolModal';
import { downloadMateriWord, printMateri } from '../../utils/documentExport';

interface GuruMateriProps {
  currentUser: User;
  onPlayYoutube: (id: string) => void;
  onViewImage: (url: string, title?: string) => void;
  onShowModal: (modal: Partial<ModalState>) => void;
}

export const GuruMateri: React.FC<GuruMateriProps> = ({
  currentUser,
  onPlayYoutube,
  onViewImage,
  onShowModal,
}) => {
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');

  // Form states
  const [id, setId] = useState('');
  const [judul, setJudul] = useState('');
  const [mapel, setMapel] = useState('Matematika');
  const [kelas, setKelas] = useState('6A');
  const [konten, setKonten] = useState('');
  const [gambarUrl, setGambarUrl] = useState('');
  const [sumber, setSumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isInsertImageOpen, setIsInsertImageOpen] = useState(false);
  const [previewWordMateri, setPreviewWordMateri] = useState<Materi | null>(null);
  const [isMathSymbolModalOpen, setIsMathSymbolModalOpen] = useState(false);
  const [mathSymbolModalTab, setMathSymbolModalTab] = useState<'palet' | 'rangkuman'>('palet');

  const QUICK_MATH_SYMBOLS = [
    { label: '+', value: '+' },
    { label: '-', value: '-' },
    { label: '×', value: '×' },
    { label: '÷', value: '÷' },
    { label: '±', value: '±' },
    { label: '=', value: '=' },
    { label: '≠', value: '≠' },
    { label: '>', value: '>' },
    { label: '<', value: '<' },
    { label: '≥', value: '≥' },
    { label: '≤', value: '≤' },
    { label: '≈', value: '≈' },
    { label: '√', value: '√' },
    { label: '√(x)', value: '\\(\\sqrt{x}\\)' },
    { label: 'a/b', value: '\\(\\frac{a}{b}\\)' },
    { label: 'π', value: 'π' },
    { label: '∞', value: '∞' },
    { label: '%', value: '%' },
    { label: 'x²', value: '²' },
    { label: 'x³', value: '³' },
    { label: '°', value: '°' },
    { label: '∠', value: '∠' },
    { label: '△', value: '△' },
    { label: 'Σ', value: 'Σ' },
    { label: '∈', value: '∈' },
  ];

  const fetchMateri = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMateriList('ALL');
      setMateriList(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMateri();
  }, []);

  const resetForm = () => {
    setId('');
    setJudul('');
    setMapel('Matematika');
    setKelas('6A');
    setKonten('');
    setGambarUrl('');
    setSumber('');
  };

  const handleEdit = (m: Materi) => {
    setId(m.ID);
    setJudul(m.Judul);
    setMapel(m.Mapel);
    setKelas(m.Kelas);
    setKonten(m.Konten_Link);
    setGambarUrl(m.Gambar_URL || '');
    setSumber(m.Sumber || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (m: Materi) => {
    onShowModal({
      isOpen: true,
      title: 'Hapus Materi',
      message: `Apakah Anda yakin ingin menghapus materi "${m.Judul}"?`,
      type: 'danger',
      isConfirm: true,
      okText: 'Hapus Materi',
      onConfirm: async () => {
        const res = await api.deleteMateri(m.ID);
        if (res.success) {
          onShowModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Materi berhasil dihapus.',
            type: 'success',
            isConfirm: false,
          });
          fetchMateri();
        }
      },
    });
  };

  // Image file upload with canvas compression
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          setGambarUrl(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleInsertFormatting = (tag: string) => {
    const textarea = document.getElementById('matKontenTextarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (!selectedText) {
      onShowModal({
        isOpen: true,
        title: 'Petunjuk Format',
        message: 'Sorot/blok teks terlebih dahulu untuk menerapkan format (tebal, miring, atau garis bawah).',
        type: 'info',
        isConfirm: false,
      });
      return;
    }

    const replacement = `<${tag}>${selectedText}</${tag}>`;
    const updated = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    setKonten(updated);
  };

  const handleInsertTable = () => {
    const tableHtml = `\n<table class="w-full border-collapse border border-slate-300 text-xs sm:text-sm my-3 rounded-lg overflow-hidden shadow-sm">
  <thead>
    <tr class="bg-indigo-50 font-bold text-indigo-900">
      <th class="border border-slate-300 p-2 text-left">No.</th>
      <th class="border border-slate-300 p-2 text-left">Topik Bahasan</th>
      <th class="border border-slate-300 p-2 text-left">Keterangan</th>
    </tr>
  </thead>
  <tbody class="bg-white">
    <tr class="hover:bg-slate-50">
      <td class="border border-slate-300 p-2">1</td>
      <td class="border border-slate-300 p-2">Contoh Konsep A</td>
      <td class="border border-slate-300 p-2">Penjelasan rincian</td>
    </tr>
  </tbody>
</table>\n`;
    setKonten((prev) => prev + tableHtml);
  };

  const handleInsertFraction = () => {
    setKonten((prev) => prev + ' \\(\\frac{a}{b}\\) ');
  };

  const handleInsertMathSymbol = (snippet: string) => {
    const textarea = document.getElementById('matKontenTextarea') as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart ?? konten.length;
      const end = textarea.selectionEnd ?? konten.length;
      const before = konten.substring(0, start);
      const after = konten.substring(end);
      setKonten(before + snippet + after);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + snippet.length, start + snippet.length);
      }, 50);
    } else {
      setKonten((prev) => prev + snippet);
    }
  };

  const handleInsertInlineImage = (snippet: string) => {
    const textarea = document.getElementById('matKontenTextarea') as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart ?? konten.length;
      const end = textarea.selectionEnd ?? konten.length;
      const before = konten.substring(0, start);
      const after = konten.substring(end);
      setKonten(before + snippet + after);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + snippet.length, start + snippet.length);
      }, 50);
    } else {
      setKonten((prev) => prev + snippet);
    }
  };

  const handleInsertList = (type: 'bullet' | 'number') => {
    const textarea = document.getElementById('matKontenTextarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart ?? konten.length;
    const end = textarea.selectionEnd ?? konten.length;
    const selected = konten.substring(start, end).trim();

    let snippet = '';
    if (selected) {
      const lines = selected.split('\n');
      snippet = lines
        .map((l, idx) => (type === 'bullet' ? `• ${l.replace(/^[•\-\*\d\.]+\s*/, '')}` : `${idx + 1}. ${l.replace(/^[•\-\*\d\.]+\s*/, '')}`))
        .join('\n');
    } else {
      snippet = type === 'bullet'
        ? '\n• Poin materi pertama\n• Poin materi kedua\n• Poin materi ketiga\n'
        : '\n1. Langkah atau butir ke-1\n2. Langkah atau butir ke-2\n3. Langkah atau butir ke-3\n';
    }

    const before = konten.substring(0, start);
    const after = konten.substring(end);
    setKonten(before + snippet + after);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 50);
  };

  const handleInsertHeading = () => {
    const textarea = document.getElementById('matKontenTextarea') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart ?? konten.length;
    const end = textarea.selectionEnd ?? konten.length;
    const selected = konten.substring(start, end).trim();

    const snippet = selected ? `\n<b>${selected}</b>\n` : '\n<b>[Sub-Judul Bahasan]</b>\n';
    const before = konten.substring(0, start);
    const after = konten.substring(end);
    setKonten(before + snippet + after);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 50);
  };

  const handleInsertParagraphGap = () => {
    const textarea = document.getElementById('matKontenTextarea') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart ?? konten.length;
    const end = textarea.selectionEnd ?? konten.length;
    const before = konten.substring(0, start);
    const after = konten.substring(end);
    const snippet = '\n\n';
    setKonten(before + snippet + after);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 50);
  };

  const handlePreviewCurrentAsWord = () => {
    if (!judul.trim() && !konten.trim()) {
      onShowModal({
        isOpen: true,
        title: 'Pratinjau Word',
        message: 'Silakan isi judul atau narasi materi terlebih dahulu untuk melihat pratinjau Word.',
        type: 'warning',
        isConfirm: false,
      });
      return;
    }
    setPreviewWordMateri({
      ID: id || 'preview',
      Judul: judul || 'Draf Dokumen Pembelajaran',
      Mapel: mapel,
      Kelas: kelas,
      Konten_Link: konten,
      Gambar_URL: gambarUrl,
      Sumber: sumber,
      Nama_Guru: currentUser?.nama || 'Guru Pengajar',
      CreatedAt: new Date().toISOString(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !konten.trim()) {
      onShowModal({
        isOpen: true,
        title: 'Form Belum Lengkap',
        message: 'Judul dan isi penjelasan materi wajib diisi.',
        type: 'warning',
        isConfirm: false,
      });
      return;
    }

    setIsSaving(true);
    const res = await api.saveMateri({
      ID: id || undefined,
      Judul: judul.trim(),
      Mapel: mapel.trim(),
      Kelas: kelas.trim(),
      Konten_Link: konten.trim(),
      Gambar_URL: gambarUrl.trim(),
      Sumber: sumber.trim(),
      Nama_Guru: currentUser.nama,
    });
    setIsSaving(false);

    if (res.success) {
      onShowModal({
        isOpen: true,
        title: 'Berhasil Disimpan',
        message: res.message || 'Materi pembelajaran berhasil disimpan ke database.',
        type: 'success',
        isConfirm: false,
      });
      resetForm();
      fetchMateri();
    } else {
      onShowModal({
        isOpen: true,
        title: 'Gagal Menyimpan',
        message: res.message || 'Terjadi kesalahan.',
        type: 'error',
        isConfirm: false,
      });
    }
  };

  const filteredMateri = materiList.filter((m) => {
    const sLower = (search || '').toLowerCase();
    const matchesSearch =
      (m.Judul || '').toLowerCase().includes(sLower) ||
      (m.Mapel || '').toLowerCase().includes(sLower) ||
      (m.Konten_Link || '').toLowerCase().includes(sLower);

    const matchesClass =
      selectedClass === 'ALL' ||
      m.Kelas === 'Semua' ||
      (m.Kelas || '').toLowerCase() === (selectedClass || '').toLowerCase();

    return matchesSearch && matchesClass;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form Input Materi */}
      <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
          <h3 className="font-bold text-base text-indigo-700 flex items-center gap-2">
            <PenSquare className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>{id ? 'Edit Materi Pembelajaran' : 'Unggah Materi Baru'}</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMathSymbolModalTab('rangkuman');
                setIsMathSymbolModalOpen(true);
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1 transition shadow-2xs"
              title="Buka Kamus & Rangkuman Simbol Matematika Lengkap"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Kamus Simbol Matematika</span>
              <span className="sm:hidden">Simbol</span>
            </button>
            {id && (
              <button
                onClick={resetForm}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Batal Edit
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Judul Materi</label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="misal: Operasi Hitung Campuran Bilangan Bulat"
              required
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
              <input
                type="text"
                value={mapel}
                onChange={(e) => setMapel(e.target.value)}
                placeholder="Matematika / IPAS / PAI"
                required
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Kelas</label>
              <input
                type="text"
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                placeholder="6A / Semua"
                required
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Quick Toolbar for content formatting */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Isi Penjelasan & Rangkuman Materi
              </label>
              <span className="text-[10px] text-slate-400">Dukungan LaTeX ($...$)</span>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-100 rounded-t-xl border border-b-0 border-slate-300 text-xs">
              <button
                type="button"
                onClick={() => handleInsertFormatting('b')}
                title="Tebal (Bold) - Blok teks lalu klik"
                className="p-1.5 bg-white hover:bg-indigo-50 rounded text-slate-700 border border-slate-200"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting('i')}
                title="Miring (Italic) - Blok teks lalu klik"
                className="p-1.5 bg-white hover:bg-indigo-50 rounded text-slate-700 border border-slate-200"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting('u')}
                title="Garis Bawah (Underline) - Blok teks lalu klik"
                className="p-1.5 bg-white hover:bg-indigo-50 rounded text-slate-700 border border-slate-200"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 border-r border-slate-300 my-auto mx-0.5" />

              <button
                type="button"
                onClick={handleInsertHeading}
                title="Sisipkan Sub-Judul Bahasan Tebal"
                className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-indigo-50 rounded text-slate-700 font-semibold border border-slate-200 text-[11px]"
              >
                <Heading2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sub-Judul</span>
              </button>

              <button
                type="button"
                onClick={() => handleInsertList('bullet')}
                title="Sisipkan Daftar Poin (Bullet List •)"
                className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-indigo-50 rounded text-slate-700 font-semibold border border-slate-200 text-[11px]"
              >
                <List className="w-3.5 h-3.5 text-indigo-600" />
                <span>• Poin</span>
              </button>

              <button
                type="button"
                onClick={() => handleInsertList('number')}
                title="Sisipkan Daftar Penomoran (1. 2. 3.)"
                className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-indigo-50 rounded text-slate-700 font-semibold border border-slate-200 text-[11px]"
              >
                <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. Nomor</span>
              </button>

              <button
                type="button"
                onClick={handleInsertParagraphGap}
                title="Sisipkan Jeda Antar Paragraf (Enter 2x)"
                className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-indigo-50 rounded text-slate-700 font-semibold border border-slate-200 text-[11px]"
              >
                <Pilcrow className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Jeda Paragraf</span>
              </button>

              <div className="h-4 border-r border-slate-300 my-auto mx-0.5" />

              <button
                type="button"
                onClick={handleInsertTable}
                className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-indigo-50 rounded text-blue-700 font-semibold border border-slate-200 text-[11px]"
              >
                <TableIcon className="w-3 h-3 text-blue-600" />
                <span>Tabel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMathSymbolModalTab('palet');
                  setIsMathSymbolModalOpen(true);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 rounded text-amber-900 font-bold border border-amber-300 text-[11px] transition shadow-xs"
                title="Buka Palet & Kamus Lambang/Simbol Matematika Lengkap"
              >
                <Calculator className="w-3 h-3 text-amber-700" />
                <span>Simbol MTK</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInsertImageOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 rounded text-emerald-800 font-bold border border-emerald-300 text-[11px] transition shadow-xs"
                title="Sisipkan Gambar di Posisi Narasi Teks"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Gambar</span>
              </button>

              <div className="ml-auto flex items-center">
                <button
                  type="button"
                  onClick={handlePreviewCurrentAsWord}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-700 hover:bg-blue-800 rounded text-white font-bold text-[11px] transition shadow-xs"
                  title="Lihat Pratinjau Rapi Seperti Microsoft Word"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Mode Word</span>
                </button>
              </div>
            </div>

            {/* Quick Math Symbols Strip */}
            <div className="flex items-center gap-1 overflow-x-auto px-2 py-1.5 bg-slate-50 border-x border-b border-slate-200 text-xs scrollbar-thin">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider pl-1 shrink-0 flex items-center gap-1 mr-0.5">
                <Calculator className="w-3 h-3 text-indigo-600" />
                <span>Cepat:</span>
              </span>
              {QUICK_MATH_SYMBOLS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleInsertMathSymbol(s.value)}
                  title={`Sisipkan simbol ${s.label}`}
                  className="px-2 py-0.5 rounded bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-700 font-bold border border-slate-200 text-xs transition shadow-2xs shrink-0 active:scale-95"
                >
                  {s.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMathSymbolModalTab('palet');
                  setIsMathSymbolModalOpen(true);
                }}
                className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold border border-indigo-200 text-[11px] transition shrink-0 ml-auto whitespace-nowrap"
              >
                + Kamus Simbol...
              </button>
            </div>

            <textarea
              id="matKontenTextarea"
              value={konten}
              onChange={(e) => setKonten(e.target.value)}
              rows={10}
              placeholder="Tuliskan materi pelajaran, contoh soal, atau tempel link video YouTube (https://www.youtube.com/watch?v=...)...&#10;&#10;Contoh format rapi:&#10;1. Judul Bahasan&#10;Berikut rincian materi:&#10;• Poin pertama&#10;• Poin kedua&#10;&#10;Tekan Enter untuk baris baru, atau Enter 2x untuk paragraf baru."
              required
              className="w-full text-xs sm:text-sm p-3 rounded-b-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed font-sans"
            />
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 mt-1 px-1">
              <span className="flex items-center gap-1">
                <span>💡</span>
                <span>
                  Tekan <strong>Enter</strong> untuk baris baru, atau <strong>Enter 2x</strong> untuk jeda paragraf baru yang rapi.
                </span>
              </span>
              <span>{konten.length} karakter</span>
            </div>
          </div>

          {/* Gambar Banner / Ilustrasi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Gambar Materi (Upload dari Galeri / Kamera atau URL)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Pilih File Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>

              <input
                type="url"
                value={gambarUrl.startsWith('data:') ? '' : gambarUrl}
                onChange={(e) => setGambarUrl(e.target.value)}
                placeholder="Atau link URL Gambar..."
                className="w-full text-xs p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {gambarUrl && (
              <div className="relative mt-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                <img
                  src={gambarUrl}
                  alt="Preview"
                  className="h-28 w-full object-contain rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={() => setGambarUrl('')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-rose-600 text-white text-xs shadow hover:bg-rose-700"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sumber Rujukan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sumber Rujukan Buku</label>
            <input
              type="text"
              value={sumber}
              onChange={(e) => setSumber(e.target.value)}
              placeholder="misal: Buku IPAS Kelas 6 Kemendikbudristek Bab 3 Hal. 45"
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : id ? 'Simpan Perubahan' : 'Terbitkan Materi'}
            </button>
            {id && (
              <button
                type="button"
                onClick={resetForm}
                className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Daftar Materi Pembelajaran */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-800">Daftar Materi Diterbitkan</h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              {filteredMateri.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari materi..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
            >
              <option value="ALL">Semua Kelas</option>
              <option value="6A">Kelas 6A</option>
              <option value="Semua">Umum (Semua)</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            Memuat materi pembelajaran...
          </div>
        ) : filteredMateri.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            Belum ada materi pembelajaran yang cocok.
          </div>
        ) : (
          <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
            {filteredMateri.map((m) => {
              const ytId = extractYoutubeId(m.Konten_Link);
              return (
                <div
                  key={m.ID}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 transition space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px]">
                          {m.Mapel}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[11px]">
                          Kelas: {m.Kelas}
                        </span>
                      </div>
                      <h4 className="font-bold text-base sm:text-lg text-slate-800 leading-snug">
                        {m.Judul}
                      </h4>
                      <p className="text-xs text-slate-500">Oleh: {m.Nama_Guru}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setPreviewWordMateri(m)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                        title="Pratinjau Word Document"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadMateriWord(m)}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                        title="Unduh File Microsoft Word (.doc)"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => printMateri(m)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                        title="Cetak / Simpan PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(m)}
                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                        title="Edit Materi"
                      >
                        <PenSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                        title="Hapus Materi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {m.Gambar_URL && (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img
                        src={m.Gambar_URL}
                        alt={m.Judul}
                        className="max-h-56 w-full object-contain p-2"
                      />
                      <button
                        onClick={() => onViewImage(m.Gambar_URL!, m.Judul)}
                        className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 hover:bg-black text-white text-[11px] px-2.5 py-1 rounded-lg backdrop-blur-sm transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Perbesar
                      </button>
                    </div>
                  )}

                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed max-h-[420px] overflow-y-auto p-1.5 break-words">
                    <MathRenderer content={m.Konten_Link} />
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <span>
                      Sumber: <strong>{m.Sumber || '-'}</strong>
                    </span>

                    {ytId && (
                      <button
                        onClick={() => onPlayYoutube(ytId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm transition active:scale-95"
                      >
                        <Youtube className="w-4 h-4" />
                        <span>Putar Video YouTube</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inline Image Insertion Modal */}
      <InsertImageModal
        isOpen={isInsertImageOpen}
        onClose={() => setIsInsertImageOpen(false)}
        onInsert={handleInsertInlineImage}
      />

      {/* Microsoft Word Style Preview Modal */}
      <WordDocumentModal
        isOpen={!!previewWordMateri}
        onClose={() => setPreviewWordMateri(null)}
        materi={previewWordMateri}
      />

      {/* Kamus & Palet Simbol Matematika Modal */}
      <MathSymbolModal
        isOpen={isMathSymbolModalOpen}
        onClose={() => setIsMathSymbolModalOpen(false)}
        onInsert={(snippet) => {
          handleInsertMathSymbol(snippet);
          setIsMathSymbolModalOpen(false);
        }}
        initialTab={mathSymbolModalTab}
      />
    </div>
  );
};
