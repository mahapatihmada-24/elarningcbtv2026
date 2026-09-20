import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Printer,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Edit3,
  Eye,
  CheckCircle2,
  BookOpen,
  Search,
  PieChart,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { Ujian, Question, KisiKisiItem, SchoolProfile } from '../types';
import {
  extractKisiKisiFromUjian,
  generateAutoKisiKisi,
  exportKisiKisiToExcel,
  exportKisiKisiToWord,
  printKisiKisiDocument,
} from '../utils/kisiKisiHelper';

interface KisiKisiModalProps {
  isOpen: boolean;
  onClose: () => void;
  ujian: Ujian;
  questions?: Question[];
  schoolProfile?: SchoolProfile | null;
  guruName?: string;
  readOnly?: boolean;
  onSaveKisiKisi?: (newItems: KisiKisiItem[]) => Promise<void> | void;
  onGenerateQuestionsRequest?: (items: KisiKisiItem[]) => void;
}

export const KisiKisiModal: React.FC<KisiKisiModalProps> = ({
  isOpen,
  onClose,
  ujian,
  questions,
  schoolProfile,
  guruName = 'Guru Mata Pelajaran',
  readOnly = false,
  onSaveKisiKisi,
  onGenerateQuestionsRequest,
}) => {
  const [items, setItems] = useState<KisiKisiItem[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit' | 'stats'>('preview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  const schoolName = schoolProfile?.namaSekolah || 'SD NEGERI CONTOH';

  // Extract or generate items when modal opens or ujian changes
  useEffect(() => {
    if (isOpen && ujian) {
      const extracted = extractKisiKisiFromUjian(ujian, questions);
      setItems(extracted);
      setActiveTab('preview');
      setSearchTerm('');
      setSaveSuccessMessage('');
    }
  }, [isOpen, ujian, questions]);

  // Statistics on cognitive levels, contexts, elements & question types
  const stats = useMemo(() => {
    const total = items.length;
    let l1Count = 0;
    let l2Count = 0;
    let l3Count = 0;
    const materiMap = new Map<string, number>();
    const elemenMap = new Map<string, number>();
    const konteksMap = new Map<string, number>();
    const bentukMap = new Map<string, number>();

    items.forEach((it) => {
      if (it.levelKognitif === 'L1') l1Count++;
      else if (it.levelKognitif === 'L3') l3Count++;
      else l2Count++;

      const mat = (it.materi || it.elemen || 'Umum').trim();
      materiMap.set(mat, (materiMap.get(mat) || 0) + 1);

      const el = (it.elemen || it.materi || 'Umum').trim();
      elemenMap.set(el, (elemenMap.get(el) || 0) + 1);

      const ktx = (it.konteks || 'Personal').trim();
      konteksMap.set(ktx, (konteksMap.get(ktx) || 0) + 1);

      const btk = (it.tipeSoal || it.bentukSoal || 'Pilihan Ganda').trim();
      bentukMap.set(btk, (bentukMap.get(btk) || 0) + 1);
    });

    return {
      total,
      l1: l1Count,
      l2: l2Count,
      l3: l3Count,
      l1Pct: total > 0 ? Math.round((l1Count / total) * 100) : 0,
      l2Pct: total > 0 ? Math.round((l2Count / total) * 100) : 0,
      l3Pct: total > 0 ? Math.round((l3Count / total) * 100) : 0,
      materiList: Array.from(materiMap.entries()),
      elemenList: Array.from(elemenMap.entries()),
      konteksList: Array.from(konteksMap.entries()),
      bentukList: Array.from(bentukMap.entries()),
    };
  }, [items]);

  // Filtered items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (it) =>
        (it.elemen || '').toLowerCase().includes(term) ||
        (it.subElemen || '').toLowerCase().includes(term) ||
        (it.kompetensi || '').toLowerCase().includes(term) ||
        (it.konteks || '').toLowerCase().includes(term) ||
        (it.tipeSoal || '').toLowerCase().includes(term) ||
        (it.materi || '').toLowerCase().includes(term) ||
        (it.indikator || '').toLowerCase().includes(term) ||
        (it.cp_kd || '').toLowerCase().includes(term) ||
        String(it.nomorSoal).includes(term)
    );
  }, [items, searchTerm]);

  if (!isOpen) return null;

  // Auto-generate handler
  const handleAutoGenerate = () => {
    if (items.length > 0) {
      if (!confirm('Hasilkan ulang kisi-kisi otomatis dari butir soal? Perubahan manual sebelumnya akan digantikan.')) {
        return;
      }
    }
    const generated = generateAutoKisiKisi(questions || [], ujian.Mapel, ujian.Kelas);
    setItems(generated);
    setSaveSuccessMessage('Kisi-kisi berhasil digenerate otomatis berdasarkan analisis butir soal!');
    setTimeout(() => setSaveSuccessMessage(''), 3500);
  };

  // Add new item row
  const handleAddItem = () => {
    const nextNo = items.length + 1;
    const newItem: KisiKisiItem = {
      no: nextNo,
      nomorSoal: nextNo,
      elemen: ujian.Mapel || 'Elemen Pembelajaran',
      subElemen: 'Materi Pokok',
      kompetensi: `Peserta didik mampu memahami dan menguasai capaian pembelajaran ${ujian.Mapel || 'materi'}.`,
      levelKognitif: 'L2',
      konteks: 'Personal',
      indikator: 'Disajikan permasalahan kontekstual, peserta didik dapat menyelesaikan soal dengan tepat.',
      tipeSoal: 'Pilihan Ganda',
      cp_kd: `Peserta didik mampu memahami dan menguasai capaian pembelajaran ${ujian.Mapel || 'materi'}.`,
      materi: 'Materi Pokok',
      bentukSoal: 'Pilihan Ganda',
      bobot: 1,
    };
    setItems([...items, newItem]);
  };

  // Remove row
  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index).map((it, i) => ({
      ...it,
      no: i + 1,
      nomorSoal: i + 1,
    }));
    setItems(updated);
  };

  // Update cell with automatic sync for backward compatibility aliases
  const handleUpdateItem = (index: number, field: keyof KisiKisiItem, value: any) => {
    const updated = [...items];
    const target = { ...updated[index], [field]: value };

    // Keep aliases synced
    if (field === 'elemen' && !target.subElemen) {
      target.materi = value;
    } else if (field === 'subElemen') {
      target.materi = value;
    } else if (field === 'kompetensi') {
      target.cp_kd = value;
    } else if (field === 'tipeSoal') {
      target.bentukSoal = value;
    } else if (field === 'materi') {
      target.subElemen = value;
    } else if (field === 'cp_kd') {
      target.kompetensi = value;
    } else if (field === 'bentukSoal') {
      target.tipeSoal = value;
    }

    updated[index] = target;
    setItems(updated);
  };

  // Save changes
  const handleSave = async () => {
    if (!onSaveKisiKisi) return;
    setIsSaving(true);
    try {
      await onSaveKisiKisi(items);
      setSaveSuccessMessage('Kisi-kisi soal berhasil disimpan ke paket ujian!');
      setTimeout(() => setSaveSuccessMessage(''), 3500);
    } catch (err) {
      alert('Gagal menyimpan kisi-kisi: ' + err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
                  {readOnly ? 'Kisi-Kisi & Panduan Belajar Ujian' : 'Kisi-Kisi Penulisan Soal Ujian'}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200">
                  {ujian.Mapel || 'Umum'} • Kelas {ujian.Kelas || '-'}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">
                {ujian.Judul_Ujian} • Alokasi Waktu: {ujian.Durasi_Menit || 60} Menit • {items.length} Butir Soal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar & Navigation Tabs */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Matriks Kisi-Kisi
            </button>
            {!readOnly && (
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'edit'
                    ? 'bg-white text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editor Interaktif
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700">
                  {items.length}
                </span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'stats'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              Sebaran Kognitif & Materi
            </button>
          </div>

          {/* Export & Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {!readOnly && (
              <>
                {onGenerateQuestionsRequest && (
                  <button
                    type="button"
                    onClick={() => onGenerateQuestionsRequest(items)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                    title="Buat butir-butir soal CBT otomatis berdasarkan matriks kisi-kisi ini"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Buat Soal dari Kisi-Kisi</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                  title="Generate otomatis CP/KD, Materi Pokok, dan Indikator dari butir soal ujian"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Auto-Generate dari Soal
                </button>
                {onSaveKisiKisi && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSave}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                    title="Simpan kisi-kisi ke dalam paket ujian"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? 'Menyimpan...' : 'Simpan Kisi-Kisi'}
                  </button>
                )}
              </>
            )}

            {/* Print & Exports */}
            <div className="h-5 w-px bg-slate-300 mx-0.5 hidden sm:block" />

            <button
              type="button"
              onClick={() =>
                printKisiKisiDocument({
                  ujian,
                  items,
                  schoolProfile,
                  guruName,
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
              title="Cetak atau Simpan PDF format resmi A4 Landscape"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Cetak / PDF
            </button>

            <button
              type="button"
              onClick={() =>
                exportKisiKisiToWord({
                  ujian,
                  items,
                  schoolProfile,
                  guruName,
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium flex items-center gap-1.5 transition"
              title="Unduh dokumen Microsoft Word (.doc) lengkap dengan Kop Sekolah"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Word (.doc)
            </button>

            <button
              type="button"
              onClick={() =>
                exportKisiKisiToExcel({
                  ujian,
                  items,
                  schoolProfile,
                  guruName,
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium flex items-center gap-1.5 transition"
              title="Unduh format spreadsheet Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccessMessage && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{saveSuccessMessage}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* Tab 1: Formal Preview Matrix */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Search & Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari materi pokok, indikator, atau nomor soal..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Level Kognitif:</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-bold">
                    L1: {stats.l1} ({stats.l1Pct}%)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 font-bold">
                    L2: {stats.l2} ({stats.l2Pct}%)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-pink-100 text-pink-700 font-bold">
                    L3: {stats.l3} ({stats.l3Pct}%)
                  </span>
                </div>
              </div>

              {/* Document Header Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-400 block font-medium">Satuan Pendidikan</span>
                    <span className="font-bold text-slate-800">
                      {schoolProfile?.namaSekolah || 'SD NEGERI HARJOSARI KIDUL 01'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Mata Pelajaran & Kelas</span>
                    <span className="font-bold text-slate-800">
                      {ujian.Mapel || 'Matematika'} • Kelas {ujian.Kelas || '6'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Tahun Ajaran & Semester</span>
                    <span className="font-bold text-slate-800">
                      {schoolProfile?.tahunAjaran || '2025/2026'} ({schoolProfile?.semester || 'Genap'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Alokasi & Bentuk Asesmen</span>
                    <span className="font-bold text-slate-800">
                      {ujian.Durasi_Menit || 60} Menit • {items.length} Soal (PG & PGK)
                    </span>
                  </div>
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                        <th className="py-2.5 px-3 text-center w-10 border-r border-slate-200">No</th>
                        <th className="py-2.5 px-3 w-36 border-r border-slate-200">Elemen</th>
                        <th className="py-2.5 px-3 w-40 border-r border-slate-200">Sub Elemen</th>
                        <th className="py-2.5 px-3 w-56 border-r border-slate-200">Kompetensi</th>
                        <th className="py-2.5 px-2.5 text-center w-24 border-r border-slate-200">Level Kognitif</th>
                        <th className="py-2.5 px-2.5 text-center w-24 border-r border-slate-200">Konteks</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Indikator</th>
                        <th className="py-2.5 px-3 text-center w-32 border-r border-slate-200">Tipe Soal</th>
                        <th className="py-2.5 px-2.5 text-center w-16 border-r border-slate-200">Nomor Soal</th>
                        <th className="py-2.5 px-2 text-center w-12">Skor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-400">
                            Tidak ada butir kisi-kisi yang cocok dengan pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((it, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-indigo-50/40 transition-colors odd:bg-white even:bg-slate-50/50"
                          >
                            <td className="py-2.5 px-3 text-center font-medium text-slate-500 border-r border-slate-200">
                              {it.no || idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 border-r border-slate-200">
                              {it.elemen || it.materi || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 border-r border-slate-200">
                              {it.subElemen || it.materi || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 text-justify leading-relaxed border-r border-slate-200">
                              {it.kompetensi || it.cp_kd || '-'}
                            </td>
                            <td className="py-2.5 px-2.5 text-center border-r border-slate-200">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                  it.levelKognitif === 'L1'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : it.levelKognitif === 'L3'
                                    ? 'bg-pink-100 text-pink-800 border border-pink-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {it.levelKognitif || 'L2'}
                              </span>
                            </td>
                            <td className="py-2.5 px-2.5 text-center border-r border-slate-200">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  it.konteks === 'Saintifik'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : it.konteks === 'Sosial Budaya'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                                }`}
                              >
                                {it.konteks || 'Personal'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 text-justify leading-relaxed border-r border-slate-200">
                              {it.indikator || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600 border-r border-slate-200 font-medium">
                              {it.tipeSoal || it.bentukSoal || 'Pilihan Ganda'}
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-bold text-slate-900 border-r border-slate-200">
                              {it.nomorSoal || idx + 1}
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-600 font-medium">
                              {it.bobot || 1}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Student Study Tips Notice */}
              {readOnly && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-800">
                  <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-blue-900 mb-0.5">Petunjuk Belajar Siswa:</h4>
                    <p className="leading-relaxed text-blue-700">
                      Gunakan daftar materi pokok dan indikator di atas untuk fokus mempersiapkan diri
                      menghadapi ujian. Pelajari buku catatan dan materi pembelajaran sesuai kompetensi yang
                      akan diujikan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Interactive Table Editor (Guru Only) */}
          {activeTab === 'edit' && !readOnly && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/60 p-3 rounded-xl border border-indigo-200 text-xs">
                <div className="flex items-center gap-2 text-indigo-900">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>
                    Anda dapat mengubah Capaian Pembelajaran, Materi Pokok, Indikator, Level Kognitif,
                    dan Bentuk Soal untuk setiap butir secara langsung pada tabel di bawah.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Baris
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoGenerate}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-300 font-semibold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset & Auto-Generate
                  </button>
                </div>
              </div>

              {/* Editable Matrix */}
              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-indigo-300 transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                          <span>Nomor Soal:</span>
                          <input
                            type="number"
                            min="1"
                            value={it.nomorSoal || idx + 1}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'nomorSoal', Number(e.target.value) || idx + 1)
                            }
                            className="w-14 px-2 py-0.5 rounded-md border border-slate-300 text-xs text-center font-bold focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <label className="text-slate-500 font-medium">Level Kognitif:</label>
                          <select
                            value={it.levelKognitif || 'L2'}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'levelKognitif', e.target.value as 'L1' | 'L2' | 'L3')
                            }
                            className="px-2 py-1 rounded-md border border-slate-300 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="L1">L1 - Pengetahuan / Pemahaman</option>
                            <option value="L2">L2 - Penerapan / Aplikasi</option>
                            <option value="L3">L3 - Penalaran / HOTS</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <label className="text-slate-500 font-medium">Konteks:</label>
                          <select
                            value={it.konteks || 'Personal'}
                            onChange={(e) => handleUpdateItem(idx, 'konteks', e.target.value)}
                            className="px-2 py-1 rounded-md border border-slate-300 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Personal">Personal</option>
                            <option value="Sosial Budaya">Sosial Budaya</option>
                            <option value="Saintifik">Saintifik</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <label className="text-slate-500 font-medium">Tipe Soal:</label>
                          <input
                            type="text"
                            value={it.tipeSoal || it.bentukSoal || 'Pilihan Ganda'}
                            onChange={(e) => handleUpdateItem(idx, 'tipeSoal', e.target.value)}
                            className="w-28 px-2 py-1 rounded-md border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500"
                            placeholder="Pilihan Ganda"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <label className="text-slate-500 font-medium">Skor:</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={it.bobot || 1}
                            onChange={(e) => handleUpdateItem(idx, 'bobot', Number(e.target.value) || 1)}
                            className="w-12 px-2 py-1 rounded-md border border-slate-300 text-xs text-center focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition ml-1"
                          title="Hapus baris ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-500 font-medium mb-1">
                          Elemen:
                        </label>
                        <input
                          type="text"
                          value={it.elemen || ''}
                          onChange={(e) => handleUpdateItem(idx, 'elemen', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
                          placeholder="e.g. Bilangan / Geometri / Pemahaman IPAS"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 font-medium mb-1">
                          Sub Elemen:
                        </label>
                        <input
                          type="text"
                          value={it.subElemen || it.materi || ''}
                          onChange={(e) => handleUpdateItem(idx, 'subElemen', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
                          placeholder="e.g. Pecahan & Desimal / Bangun Ruang"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-slate-500 font-medium mb-1">
                          Kompetensi:
                        </label>
                        <textarea
                          rows={2}
                          value={it.kompetensi || it.cp_kd || ''}
                          onChange={(e) => handleUpdateItem(idx, 'kompetensi', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 text-slate-800 resize-none"
                          placeholder="Deskripsi Kompetensi / Capaian Pembelajaran..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-slate-500 font-medium mb-1">
                          Indikator:
                        </label>
                        <textarea
                          rows={2}
                          value={it.indikator || ''}
                          onChange={(e) => handleUpdateItem(idx, 'indikator', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 text-slate-800 resize-none"
                          placeholder="Disajikan stimulus berupa ..., peserta didik dapat menentukan ..."
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-3 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Butir Kisi-Kisi Baru
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Statistics & Distribution View */}
          {activeTab === 'stats' && (
            <div className="space-y-5">
              {/* Cognitive Distribution Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-900">
                      Level 1 (Pengetahuan & Pemahaman)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 text-xs font-extrabold">
                      {stats.l1Pct}%
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-blue-950 mb-1">
                    {stats.l1} <span className="text-xs font-normal text-blue-700">Soal</span>
                  </div>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Kemampuan mengingat konsep dasar, terminologi, fakta, rumus, dan definisi materi.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-900">
                      Level 2 (Penerapan / Aplikasi)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-xs font-extrabold">
                      {stats.l2Pct}%
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-amber-950 mb-1">
                    {stats.l2} <span className="text-xs font-normal text-amber-700">Soal</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Kemampuan menerapkan konsep atau prosedur matematis/sains untuk menyelesaikan masalah rutin.
                  </p>
                </div>

                <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-pink-900">
                      Level 3 (Penalaran / HOTS)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-pink-200 text-pink-800 text-xs font-extrabold">
                      {stats.l3Pct}%
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-pink-950 mb-1">
                    {stats.l3} <span className="text-xs font-normal text-pink-700">Soal</span>
                  </div>
                  <p className="text-[11px] text-pink-700 leading-relaxed">
                    Kemampuan bernalar, menganalisis hubungan informasi, mengevaluasi bukti, dan menyimpulkan.
                  </p>
                </div>
              </div>

              {/* Progress Bar of cognitive distribution */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Distribusi Rasio Kognitif (Standar Asesmen: ~30% L1, ~50% L2, ~20% L3)</span>
                  <span>Total: {stats.total} Soal</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${stats.l1Pct}%` }}
                    className="bg-blue-500 text-[10px] text-white font-bold flex items-center justify-center transition-all"
                    title={`L1: ${stats.l1Pct}%`}
                  >
                    {stats.l1Pct > 8 && `L1 ${stats.l1Pct}%`}
                  </div>
                  <div
                    style={{ width: `${stats.l2Pct}%` }}
                    className="bg-amber-500 text-[10px] text-white font-bold flex items-center justify-center transition-all"
                    title={`L2: ${stats.l2Pct}%`}
                  >
                    {stats.l2Pct > 8 && `L2 ${stats.l2Pct}%`}
                  </div>
                  <div
                    style={{ width: `${stats.l3Pct}%` }}
                    className="bg-pink-500 text-[10px] text-white font-bold flex items-center justify-center transition-all"
                    title={`L3: ${stats.l3Pct}%`}
                  >
                    {stats.l3Pct > 8 && `L3 ${stats.l3Pct}%`}
                  </div>
                </div>
              </div>

              {/* Topic breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-xs text-slate-800 mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Distribusi Per Lingkup Materi
                  </h4>
                  <div className="space-y-2 text-xs">
                    {stats.materiList.map(([mat, count], i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                        <span className="text-slate-700 font-medium">{mat}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold">
                          {count} soal
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-xs text-slate-800 mb-3 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Distribusi Bentuk Soal
                  </h4>
                  <div className="space-y-2 text-xs">
                    {stats.bentukList.map(([btk, count], i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                        <span className="text-slate-700 font-medium">{btk}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          {count} butir
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            {schoolName} • Format Kurikulum Merdeka
          </span>

          <div className="flex items-center gap-2">
            {!readOnly && onSaveKisiKisi && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Menyimpan...' : 'Simpan Kisi-Kisi'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
