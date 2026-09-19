import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  Plus,
  Trash2,
  Edit,
  Sliders,
  CheckCircle2,
  XCircle,
  Upload,
  Layers,
  Clock,
  HelpCircle,
  Eye,
  CheckSquare,
  Columns,
  Download,
  Printer,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';
import { Ujian, Question, QuestionType, ExamPayload } from '../../types';
import { api } from '../../services/api';
import { ModalState } from '../ConfirmModal';
import { MathRenderer } from '../MathRenderer';
import { BulkQuestionModal } from './BulkQuestionModal';
import {
  downloadExamWord,
  printExamDocument,
  downloadSampleQuestionCsv,
  downloadSampleQuestionJson,
} from '../../utils/documentExport';

interface GuruCBTProps {
  onShowModal: (modal: Partial<ModalState>) => void;
  onViewImage: (url: string, title?: string) => void;
}

export const GuruCBT: React.FC<GuruCBTProps> = ({ onShowModal, onViewImage }) => {
  const [ujianList, setUjianList] = useState<Ujian[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [id, setId] = useState('');
  const [judul, setJudul] = useState('');
  const [mapel, setMapel] = useState('Matematika');
  const [kelas, setKelas] = useState('6A');
  const [durasi, setDurasi] = useState(60);
  const [sesi, setSesi] = useState('Semua');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [acakSoal, setAcakSoal] = useState(true);
  const [acakOpsi, setAcakOpsi] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const handleApplyBulkQuestions = (newQuestions: Question[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setQuestions(newQuestions);
    } else {
      setQuestions((prev) => [...prev, ...newQuestions]);
    }
    onShowModal({
      isOpen: true,
      title: 'Import Soal Berhasil',
      message: `${newQuestions.length} butir soal berhasil ${
        mode === 'replace' ? 'menggantikan soal sebelumnya' : 'ditambahkan ke daftar soal'
      }.`,
      type: 'success',
      isConfirm: false,
    });
  };

  const fetchUjian = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUjianList('ALL', 'guru');
      setUjianList(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUjian();
  }, []);

  const resetForm = () => {
    setId('');
    setJudul('');
    setMapel('Matematika');
    setKelas('6A');
    setDurasi(60);
    setSesi('Semua');
    setMaxAttempts(1);
    setAcakSoal(true);
    setAcakOpsi(true);
    setQuestions([
      {
        type: 'pg',
        bobot: 1,
        soal: '',
        a: '',
        b: '',
        c: '',
        d: '',
        kunci: 'A',
      },
    ]);
  };

  useEffect(() => {
    if (questions.length === 0) {
      resetForm();
    }
  }, []);

  const handleEditUjian = (u: Ujian) => {
    setId(u.ID);
    setJudul(u.Judul_Ujian);
    setMapel(u.Mapel);
    setKelas(u.Kelas);
    setDurasi(u.Durasi_Menit);

    try {
      const raw = JSON.parse(u.Soal_JSON || '{}');
      if (raw.questions) {
        setQuestions(raw.questions);
        if (raw.config) {
          setSesi(raw.config.sesi || 'Semua');
          setMaxAttempts(raw.config.max_attempts !== undefined ? raw.config.max_attempts : 1);
          setAcakSoal(raw.config.acak_soal !== undefined ? raw.config.acak_soal : true);
          setAcakOpsi(raw.config.acak_opsi !== undefined ? raw.config.acak_opsi : true);
        }
      } else if (Array.isArray(raw)) {
        setQuestions(raw);
      }
    } catch {
      setQuestions([]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async (u: Ujian) => {
    const newStatus = u.Status === 'Aktif' ? 'Non-Aktif' : 'Aktif';
    const res = await api.toggleStatusUjian(u.ID, newStatus);
    if (res.success) {
      fetchUjian();
    }
  };

  const handleDeleteUjian = (u: Ujian) => {
    onShowModal({
      isOpen: true,
      title: 'Hapus Ujian CBT',
      message: `Apakah Anda yakin ingin menghapus ujian "${u.Judul_Ujian}" secara permanen?`,
      type: 'danger',
      isConfirm: true,
      okText: 'Hapus Permanen',
      onConfirm: async () => {
        const res = await api.deleteUjian(u.ID);
        if (res.success) {
          onShowModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Ujian CBT telah dihapus.',
            type: 'success',
            isConfirm: false,
          });
          fetchUjian();
        }
      },
    });
  };

  // Question manipulation
  const addQuestion = (type: QuestionType = 'pg') => {
    if (type === 'pg') {
      setQuestions((prev) => [
        ...prev,
        {
          type: 'pg',
          bobot: 1,
          soal: '',
          a: '',
          b: '',
          c: '',
          d: '',
          kunci: 'A',
        },
      ]);
    } else if (type === 'pgk_mcma') {
      setQuestions((prev) => [
        ...prev,
        {
          type: 'pgk_mcma',
          bobot: 1,
          soal: '',
          options: [
            { text: '', isKey: true },
            { text: '', isKey: false },
          ],
        },
      ]);
    } else if (type === 'pgk_kategori') {
      setQuestions((prev) => [
        ...prev,
        {
          type: 'pgk_kategori',
          bobot: 1,
          soal: '',
          col1: 'Benar',
          col2: 'Salah',
          rows: [
            { text: '', key: 'col1' },
            { text: '', key: 'col2' },
          ],
        },
      ]);
    }
  };

  const removeQuestion = (qIndex: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  const updateQuestionField = (qIndex: number, field: string, value: unknown) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], [field]: value } as Question;
      return copy;
    });
  };

  const changeQuestionType = (qIndex: number, newType: QuestionType) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const oldSoal = copy[qIndex].soal;
      const oldBobot = copy[qIndex].bobot;
      const oldGambar = copy[qIndex].gambar;

      if (newType === 'pg') {
        copy[qIndex] = {
          type: 'pg',
          bobot: oldBobot,
          soal: oldSoal,
          gambar: oldGambar,
          a: '',
          b: '',
          c: '',
          d: '',
          kunci: 'A',
        };
      } else if (newType === 'pgk_mcma') {
        copy[qIndex] = {
          type: 'pgk_mcma',
          bobot: oldBobot,
          soal: oldSoal,
          gambar: oldGambar,
          options: [
            { text: '', isKey: true },
            { text: '', isKey: false },
          ],
        };
      } else if (newType === 'pgk_kategori') {
        copy[qIndex] = {
          type: 'pgk_kategori',
          bobot: oldBobot,
          soal: oldSoal,
          gambar: oldGambar,
          col1: 'Benar',
          col2: 'Salah',
          rows: [
            { text: '', key: 'col1' },
            { text: '', key: 'col2' },
          ],
        };
      }
      return copy;
    });
  };

  // Upload image helper
  const handleUploadImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    onDone: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 600;
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
          onDone(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUjian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || questions.length === 0) {
      onShowModal({
        isOpen: true,
        title: 'Form Belum Lengkap',
        message: 'Judul ujian dan minimal 1 butir soal harus diisi.',
        type: 'warning',
        isConfirm: false,
      });
      return;
    }

    const payload: ExamPayload = {
      config: {
        sesi: sesi.trim() || 'Semua',
        max_attempts: Number(maxAttempts),
        acak_soal: acakSoal,
        acak_opsi: acakOpsi,
      },
      questions,
    };

    setIsSaving(true);
    const res = await api.saveUjian({
      ID: id || undefined,
      Judul_Ujian: judul.trim(),
      Mapel: mapel.trim(),
      Kelas: kelas.trim(),
      Durasi_Menit: Number(durasi),
      soal: payload,
      Status: 'Aktif',
    });
    setIsSaving(false);

    if (res.success) {
      onShowModal({
        isOpen: true,
        title: 'Berhasil Diterbitkan',
        message: res.message || 'Ujian CBT telah berhasil disimpan dan disinkronkan.',
        type: 'success',
        isConfirm: false,
      });
      resetForm();
      fetchUjian();
    } else {
      onShowModal({
        isOpen: true,
        title: 'Gagal',
        message: res.message || 'Terjadi kesalahan.',
        type: 'error',
        isConfirm: false,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form Ujian & Bank Soal */}
      <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-bold text-base text-indigo-700 flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-indigo-600" />
            <span>{id ? 'Edit Ujian CBT' : 'Pembuat Ujian & Bank Soal CBT'}</span>
          </h3>
          {id && (
            <button
              onClick={resetForm}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSaveUjian} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Asesmen / Ujian
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="misal: Asesmen Formatif Bab 2: Bilangan Pecahan"
              required
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
              <input
                type="text"
                value={mapel}
                onChange={(e) => setMapel(e.target.value)}
                placeholder="Matematika"
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
                placeholder="6A"
                required
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (Menit)</label>
              <input
                type="number"
                value={durasi}
                min={5}
                max={240}
                onChange={(e) => setDurasi(Number(e.target.value))}
                placeholder="60"
                required
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>
          </div>

          {/* Pengaturan Khusus Ujian */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-indigo-900">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Pengaturan Khusus & Proteksi Anti-Contek</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Sesi Peserta Ujian
                </label>
                <input
                  type="text"
                  value={sesi}
                  onChange={(e) => setSesi(e.target.value)}
                  placeholder="Semua / Sesi 1 / Sesi 2"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Batas Percobaan Pengerjaan
                </label>
                <select
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-semibold"
                >
                  <option value={1}>Maksimal 1 Kali Pengerjaan</option>
                  <option value={2}>Maksimal 2 Kali (Dapat Ulang 1x)</option>
                  <option value={3}>Maksimal 3 Kali</option>
                  <option value={0}>Bebas Tanpa Batas</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              <label className="inline-flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acakSoal}
                  onChange={(e) => setAcakSoal(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="ml-2">Acak Urutan Soal Siswa</span>
              </label>

              <label className="inline-flex items-center text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acakOpsi}
                  onChange={(e) => setAcakOpsi(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="ml-2">Acak Pilihan Jawaban (A, B, C, D)</span>
              </label>
            </div>
          </div>

          {/* Header Bank Soal */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-800">Daftar Butir Soal</h4>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                  {questions.length} Soal
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                  title="Upload banyak soal sekaligus dari teks Word atau file Excel/CSV"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Soal Massal</span>
                </button>
                <button
                  type="button"
                  onClick={downloadSampleQuestionCsv}
                  className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1"
                  title="Unduh Template Excel/CSV untuk mengisi soal"
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">Format CSV</span>
                </button>
                <div className="h-4 border-r border-slate-300 mx-1 hidden sm:block" />
                <button
                  type="button"
                  onClick={() => addQuestion('pg')}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> + PG
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('pgk_mcma')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> + PGK Centang
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('pgk_kategori')}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1"
                >
                  <Columns className="w-3.5 h-3.5" /> + PGK Tabel
                </button>
              </div>
            </div>

            {/* List of Question editors */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative"
                >
                  {/* Top Bar of question */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        {qIdx + 1}
                      </span>
                      <select
                        value={q.type}
                        onChange={(e) =>
                          changeQuestionType(qIdx, e.target.value as QuestionType)
                        }
                        className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white font-bold text-indigo-700"
                      >
                        <option value="pg">Pilihan Ganda (Single Answer)</option>
                        <option value="pgk_mcma">PGK Centang (Banyak Jawaban Benar)</option>
                        <option value="pgk_kategori">PGK Kategori / Tabel Pernyataan</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                        Bobot:
                        <input
                          type="number"
                          value={q.bobot || 1}
                          min={1}
                          onChange={(e) =>
                            updateQuestionField(qIdx, 'bobot', Number(e.target.value))
                          }
                          className="w-12 text-center p-1 rounded border border-slate-300 bg-white text-xs font-bold"
                        />
                      </label>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIdx)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          title="Hapus Soal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Teks Pertanyaan (Mendukung Formula Math LaTeX $...$)
                      </label>
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-mono">
                        {'Pecahan: $\\frac{pembilang}{penyebut}$'}
                      </span>
                    </div>
                    <textarea
                      value={q.soal}
                      onChange={(e) => updateQuestionField(qIdx, 'soal', e.target.value)}
                      rows={3}
                      placeholder="Tuliskan soal di sini. Contoh pecahan: Nilai dari $\frac{2}{4}$ adalah..."
                      required
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    {q.soal && (q.soal.includes('$') || q.soal.includes('\\frac')) && (
                      <div className="mt-1.5 p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs">
                        <span className="text-[10px] text-indigo-600 font-semibold uppercase block mb-1">Pratinjau Rumus Matematika:</span>
                        <MathRenderer content={q.soal} className="text-slate-800" />
                      </div>
                    )}
                  </div>

                  {/* Question Image */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Gambar Soal (Opsional)
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" /> Unggah Foto
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleUploadImage(e, (dataUrl) =>
                              updateQuestionField(qIdx, 'gambar', dataUrl)
                            )
                          }
                          className="hidden"
                        />
                      </label>
                      <input
                        type="url"
                        value={q.gambar?.startsWith('data:') ? '' : q.gambar || ''}
                        onChange={(e) => updateQuestionField(qIdx, 'gambar', e.target.value)}
                        placeholder="Atau link URL Gambar (https://...)"
                        className="flex-1 text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    {q.gambar && (
                      <div className="relative mt-2 p-1 bg-white border border-slate-200 rounded-lg max-w-xs">
                        <img
                          src={q.gambar}
                          alt="Ilustrasi Soal"
                          className="max-h-28 rounded object-contain mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuestionField(qIdx, 'gambar', '')}
                          className="absolute top-1 right-1 p-0.5 bg-rose-600 text-white rounded text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Type 1: PG */}
                  {q.type === 'pg' && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Opsi Pilihan Jawaban & Kunci:
                        </label>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                          <span className="font-semibold text-amber-800">💡 Tips Pecahan:</span>
                          <span>Tulis <code className="font-mono font-bold text-indigo-700">{'$\\frac{2}{4}$'}</code> atau <code className="font-mono text-slate-700">2/4</code></span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(['a', 'b', 'c', 'd'] as const).map((opt) => (
                          <div
                            key={opt}
                            className={`p-2.5 rounded-xl border transition ${
                              q.kunci === opt.toUpperCase()
                                ? 'bg-indigo-50/70 border-indigo-300'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-indigo-700 uppercase">
                                Opsi {opt}
                              </span>
                              <label className="text-[11px] text-slate-500 flex items-center gap-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`key_${qIdx}`}
                                  checked={q.kunci === opt.toUpperCase()}
                                  onChange={() =>
                                    updateQuestionField(qIdx, 'kunci', opt.toUpperCase())
                                  }
                                  className="w-3.5 h-3.5 text-indigo-600"
                                />
                                <span
                                  className={
                                    q.kunci === opt.toUpperCase()
                                      ? 'font-bold text-indigo-700'
                                      : ''
                                  }
                                >
                                  Kunci Benar
                                </span>
                              </label>
                            </div>
                            <input
                              type="text"
                              value={q[opt] || ''}
                              onChange={(e) => updateQuestionField(qIdx, opt, e.target.value)}
                              placeholder={`Teks opsi ${opt.toUpperCase()}... (misal: $\\frac{2}{4}$ atau 2/4)`}
                              className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                            />
                            {q[opt] && (q[opt].includes('$') || q[opt].includes('\\frac')) && (
                              <div className="mt-1 px-2 py-1 bg-indigo-50 border border-indigo-100 rounded text-xs flex items-center gap-2">
                                <span className="text-[10px] text-indigo-600 font-semibold uppercase">Tampilan:</span>
                                <MathRenderer content={q[opt]} className="inline-block font-semibold text-indigo-950" />
                              </div>
                            )}
                            {/* Option image */}
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <label className="text-[10px] text-slate-500 font-semibold cursor-pointer hover:text-indigo-600 flex items-center gap-1">
                                <Upload className="w-3 h-3" /> Foto Opsi
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleUploadImage(e, (dataUrl) =>
                                      updateQuestionField(qIdx, `${opt}_img`, dataUrl)
                                    )
                                  }
                                  className="hidden"
                                />
                              </label>
                              {q[`${opt}_img` as keyof typeof q] && (
                                <button
                                  type="button"
                                  onClick={() => updateQuestionField(qIdx, `${opt}_img`, '')}
                                  className="text-[10px] text-rose-500 hover:underline"
                                >
                                  Hapus Foto
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Type 2: PGK MCMA */}
                  {q.type === 'pgk_mcma' && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">
                          Opsi Centang (Centang kotak jika merupakan kunci benar):
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = [...(q.options || []), { text: '', isKey: false }];
                            updateQuestionField(qIdx, 'options', newOpts);
                          }}
                          className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-semibold"
                        >
                          + Tambah Opsi
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(q.options || []).map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={opt.isKey}
                                onChange={(e) => {
                                  const copy = [...q.options];
                                  copy[oIdx].isKey = e.target.checked;
                                  updateQuestionField(qIdx, 'options', copy);
                                }}
                                title="Tandai sebagai jawaban benar"
                                className="w-4 h-4 text-emerald-600 rounded"
                              />
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const copy = [...q.options];
                                  copy[oIdx].text = e.target.value;
                                  updateQuestionField(qIdx, 'options', copy);
                                }}
                                placeholder={`Teks pernyataan opsi #${oIdx + 1}`}
                                className="flex-1 text-xs p-1.5 rounded-lg border border-slate-300"
                              />
                              {q.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const copy = q.options.filter((_, idx) => idx !== oIdx);
                                    updateQuestionField(qIdx, 'options', copy);
                                  }}
                                  className="p-1 text-rose-500 hover:text-rose-700"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Type 3: PGK Kategori / Tabel */}
                  {q.type === 'pgk_kategori' && (
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
                        <div>
                          <label className="block text-[11px] font-bold text-blue-900 mb-0.5">
                            Nama Kolom Pilihan 1
                          </label>
                          <input
                            type="text"
                            value={q.col1}
                            onChange={(e) => updateQuestionField(qIdx, 'col1', e.target.value)}
                            placeholder="misal: Benar"
                            className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-blue-900 mb-0.5">
                            Nama Kolom Pilihan 2
                          </label>
                          <input
                            type="text"
                            value={q.col2}
                            onChange={(e) => updateQuestionField(qIdx, 'col2', e.target.value)}
                            placeholder="misal: Salah"
                            className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white font-semibold"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">
                          Baris Pernyataan Soal:
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newRows = [...(q.rows || []), { text: '', key: 'col1' as const }];
                            updateQuestionField(qIdx, 'rows', newRows);
                          }}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-semibold"
                        >
                          + Tambah Baris
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(q.rows || []).map((row, rIdx) => (
                          <div
                            key={rIdx}
                            className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200"
                          >
                            <span className="text-xs font-bold text-slate-400">#{rIdx + 1}</span>
                            <input
                              type="text"
                              value={row.text}
                              onChange={(e) => {
                                const copy = [...q.rows];
                                copy[rIdx].text = e.target.value;
                                updateQuestionField(qIdx, 'rows', copy);
                              }}
                              placeholder="Teks pernyataan..."
                              className="flex-1 text-xs p-1.5 rounded-lg border border-slate-300"
                            />
                            <select
                              value={row.key}
                              onChange={(e) => {
                                const copy = [...q.rows];
                                copy[rIdx].key = e.target.value as 'col1' | 'col2';
                                updateQuestionField(qIdx, 'rows', copy);
                              }}
                              className="text-xs p-1.5 rounded-lg border border-slate-300 font-semibold text-blue-800 bg-blue-50"
                            >
                              <option value="col1">Kunci: {q.col1 || 'Kolom 1'}</option>
                              <option value="col2">Kunci: {q.col2 || 'Kolom 2'}</option>
                            </select>
                            {q.rows.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = q.rows.filter((_, idx) => idx !== rIdx);
                                  updateQuestionField(qIdx, 'rows', copy);
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FileQuestion className="w-4 h-4" />
              {isSaving ? 'Menyimpan Ujian...' : id ? 'Simpan Perubahan Ujian' : 'Terbitkan Ujian CBT'}
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

      {/* Daftar Ujian CBT Aktif */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-800">Daftar Ujian Terbit</h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              {ujianList.length}
            </span>
          </div>
          <button
            onClick={fetchUjian}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
          >
            Muat Ulang
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            Memuat daftar ujian CBT...
          </div>
        ) : ujianList.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            Belum ada ujian CBT diterbitkan.
          </div>
        ) : (
          <div className="space-y-3 max-h-[82vh] overflow-y-auto pr-1">
            {ujianList.map((u) => {
              let questionCount = 0;
              let sesiText = 'Semua Sesi';
              let maxAttemptsText = '1 Kali';

              try {
                const raw = JSON.parse(u.Soal_JSON || '{}');
                if (raw.questions) {
                  questionCount = raw.questions.length;
                  if (raw.config?.sesi) sesiText = raw.config.sesi;
                  if (raw.config?.max_attempts !== undefined) {
                    maxAttemptsText =
                      raw.config.max_attempts === 0 ? 'Bebas' : `${raw.config.max_attempts}x`;
                  }
                } else if (Array.isArray(raw)) {
                  questionCount = raw.length;
                }
              } catch {}

              const isAktif = u.Status === 'Aktif';

              return (
                <div
                  key={u.ID}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 transition space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                          {u.Mapel}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                          Kelas: {u.Kelas}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[10px]">
                          Sesi: {sesiText}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-800 leading-snug">
                        {u.Judul_Ujian}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {u.Durasi_Menit} Menit
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          {questionCount} Soal
                        </span>
                        <span>Maks: {maxAttemptsText}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => downloadExamWord(u, { includeAnswers: false })}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                        title="Unduh Lembar Naskah Soal Siswa (.doc)"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => printExamDocument(u, { includeAnswers: false })}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                        title="Cetak Naskah Soal / Simpan PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditUjian(u)}
                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        title="Edit Ujian"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUjian(u)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                        title="Hapus Ujian"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1 pt-1 text-[11px] text-slate-500">
                    <button
                      type="button"
                      onClick={() => downloadExamWord(u, { includeAnswers: true })}
                      className="text-emerald-700 hover:text-emerald-800 font-bold underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Unduh + Kunci Jawaban Guru
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`px-3 py-1 rounded-full font-bold transition flex items-center gap-1 ${
                        isAktif
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {isAktif ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>Status: {u.Status || 'Aktif'}</span>
                    </button>
                    <span className="text-[11px] text-slate-400">
                      ID: {u.ID.slice(-8)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bulk Question Import Modal */}
      <BulkQuestionModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onApplyQuestions={handleApplyBulkQuestions}
      />
    </div>
  );
};
