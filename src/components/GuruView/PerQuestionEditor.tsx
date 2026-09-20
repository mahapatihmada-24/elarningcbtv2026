import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Upload,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Columns,
  HelpCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Question, QuestionType, QuestionPG, QuestionPGKMCMA, QuestionPGKKategori } from '../../types';
import { MathRenderer } from '../MathRenderer';

interface PerQuestionEditorProps {
  examCode: string;
  examUnit: string;
  questions: Question[];
  currentIdx: number;
  onSelectIndex: (index: number) => void;
  onUpdateQuestion: (index: number, updated: Question) => void;
  onAddQuestion: (type: QuestionType) => void;
  onRemoveQuestion: (index: number) => void;
  onDuplicateQuestion: (index: number) => void;
  onSwitchToAllView: () => void;
  onViewImage: (url: string, title?: string) => void;
  onOpenGenerateKisiKisi?: () => void;
}

export const PerQuestionEditor: React.FC<PerQuestionEditorProps> = ({
  examCode,
  examUnit,
  questions,
  currentIdx,
  onSelectIndex,
  onUpdateQuestion,
  onAddQuestion,
  onRemoveQuestion,
  onDuplicateQuestion,
  onSwitchToAllView,
  onViewImage,
  onOpenGenerateKisiKisi,
}) => {
  if (questions.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
        <p className="text-sm font-semibold text-slate-600">Belum ada butir soal dalam paket ini.</p>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => onAddQuestion('pg')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition"
          >
            + Tambah Soal Manual
          </button>
          {onOpenGenerateKisiKisi && (
            <button
              type="button"
              onClick={onOpenGenerateKisiKisi}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>✨ Buat Soal dari Kisi-Kisi</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const activeIndex = Math.max(0, Math.min(currentIdx, questions.length - 1));
  const q = questions[activeIndex];

  const handleFieldChange = (field: string, val: unknown) => {
    onUpdateQuestion(activeIndex, {
      ...q,
      [field]: val,
    } as Question);
  };

  const handleTypeChange = (newType: QuestionType) => {
    if (newType === 'pg') {
      onUpdateQuestion(activeIndex, {
        type: 'pg',
        bobot: q.bobot || 1,
        soal: q.soal,
        gambar: q.gambar,
        a: (q as QuestionPG).a || '',
        b: (q as QuestionPG).b || '',
        c: (q as QuestionPG).c || '',
        d: (q as QuestionPG).d || '',
        kunci: (q as QuestionPG).kunci || 'A',
      });
    } else if (newType === 'pgk_mcma') {
      onUpdateQuestion(activeIndex, {
        type: 'pgk_mcma',
        bobot: q.bobot || 1,
        soal: q.soal,
        gambar: q.gambar,
        options: [
          { text: (q as QuestionPG).a || '', isKey: true },
          { text: (q as QuestionPG).b || '', isKey: false },
          { text: (q as QuestionPG).c || '', isKey: false },
          { text: (q as QuestionPG).d || '', isKey: false },
        ],
      });
    } else {
      onUpdateQuestion(activeIndex, {
        type: 'pgk_kategori',
        bobot: q.bobot || 1,
        soal: q.soal,
        gambar: q.gambar,
        col1: 'Benar',
        col2: 'Salah',
        rows: [
          { text: 'Pernyataan 1', key: 'col1' },
          { text: 'Pernyataan 2', key: 'col2' },
        ],
      });
    }
  };

  const handleUploadImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    onDone: (base64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const maxDim = 800;
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

  const isQuestionComplete = (item: Question) => {
    if (!item.soal.trim()) return false;
    if (item.type === 'pg') {
      return Boolean(item.a && item.b && item.kunci);
    }
    if (item.type === 'pgk_mcma') {
      return (item.options || []).some((o) => o.isKey && o.text.trim());
    }
    if (item.type === 'pgk_kategori') {
      return (item.rows || []).length > 0;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      {/* BREADCRUMB: Bank Soal > Kode > Unit > Soal */}
      <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-extrabold text-indigo-950">Bank Soal</span>
          <span className="text-slate-400">/</span>
          <span className="font-bold text-indigo-700 font-mono bg-white px-2 py-0.5 rounded-md border border-indigo-200">
            Kode: {examCode || 'DRAFT'}
          </span>
          <span className="text-slate-400">/</span>
          <span className="font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200">
            Unit: {examUnit || 'Umum'}
          </span>
          <span className="text-slate-400">/</span>
          <span className="font-black text-emerald-700 bg-white px-2.5 py-0.5 rounded-md border border-emerald-300">
            Soal No. {activeIndex + 1} dari {questions.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onSwitchToAllView}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline self-start sm:self-auto"
        >
          Tampilkan Semua Soal (Daftar Panjang)
        </button>
      </div>

      {/* QUESTION NUMBER NAVIGATION GRID */}
      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
          <span>Pilih Nomor Soal:</span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Lengkap
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Belum Lengkap
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
          {questions.map((item, idx) => {
            const isCurrent = idx === activeIndex;
            const complete = isQuestionComplete(item);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectIndex(idx)}
                className={`relative w-9 h-9 rounded-xl font-bold text-xs transition active:scale-95 flex items-center justify-center ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                    : complete
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                }`}
              >
                {idx + 1}
                <span
                  className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                    complete ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE QUESTION EDIT CARD */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              {activeIndex + 1}
            </span>
            <select
              value={q.type}
              onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
              className="text-xs p-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-indigo-700 focus:outline-indigo-600"
            >
              <option value="pg">Pilihan Ganda (Single Answer)</option>
              <option value="pgk_mcma">PGK Centang (Banyak Jawaban Benar)</option>
              <option value="pgk_kategori">PGK Kategori / Tabel Pernyataan</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <span>Bobot Nilai:</span>
              <input
                type="number"
                value={q.bobot || 1}
                min={1}
                onChange={(e) => handleFieldChange('bobot', Number(e.target.value))}
                className="w-14 text-center p-1.5 rounded-lg border border-slate-300 font-bold text-xs"
              />
            </label>

            <button
              type="button"
              onClick={() => onDuplicateQuestion(activeIndex)}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              title="Duplikat Butir Soal Ini"
            >
              <Copy className="w-4 h-4" />
            </button>

            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveQuestion(activeIndex)}
                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                title="Hapus Butir Soal Ini"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Question Text & Formula */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Teks Pertanyaan (Mendukung Formula Math LaTeX $...$)
            </label>
            <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-mono">
              {'Pecahan: $\\frac{a}{b}$ | Akar: $\\sqrt{x}$'}
            </span>
          </div>
          <textarea
            value={q.soal}
            onChange={(e) => handleFieldChange('soal', e.target.value)}
            rows={3}
            placeholder="Tuliskan soal di sini. Contoh: Nilai dari $\frac{1}{2} + \frac{2}{4}$ adalah..."
            className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            required
          />
          {q.soal && (q.soal.includes('$') || q.soal.includes('\\frac')) && (
            <div className="mt-2 p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs">
              <span className="text-[10px] text-indigo-600 font-bold uppercase block mb-1">
                Pratinjau Rumus Matematika:
              </span>
              <MathRenderer content={q.soal} className="text-slate-900 font-medium" />
            </div>
          )}
        </div>

        {/* Question Image */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Gambar Ilustrasi Soal (Opsional)
          </label>
          <div className="flex items-center gap-2">
            <label className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs">
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Unggah Gambar</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleUploadImage(e, (dataUrl) => handleFieldChange('gambar', dataUrl))
                }
                className="hidden"
              />
            </label>
            <input
              type="url"
              value={q.gambar?.startsWith('data:') ? '' : q.gambar || ''}
              onChange={(e) => handleFieldChange('gambar', e.target.value)}
              placeholder="Atau tempelkan link URL Gambar (https://...)"
              className="flex-1 text-xs p-2 rounded-xl border border-slate-300 bg-white focus:outline-indigo-600"
            />
          </div>
          {q.gambar && (
            <div className="relative mt-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl max-w-xs group">
              <img
                src={q.gambar}
                alt="Ilustrasi Soal"
                className="max-h-32 rounded-lg object-contain mx-auto cursor-pointer"
                onClick={() => onViewImage(q.gambar!, `Soal No. ${activeIndex + 1}`)}
              />
              <button
                type="button"
                onClick={() => handleFieldChange('gambar', '')}
                className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-lg text-xs hover:bg-rose-700 shadow-md"
                title="Hapus Gambar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* TYPE 1: PILIHAN GANDA (PG) */}
        {q.type === 'pg' && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800">
                Pilihan Jawaban & Kunci Benar:
              </label>
              <span className="text-[11px] text-slate-500">Pilih radio button untuk kunci</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['a', 'b', 'c', 'd'] as const).map((opt) => (
                <div
                  key={opt}
                  className={`p-3 rounded-2xl border transition ${
                    (q as QuestionPG).kunci === opt.toUpperCase()
                      ? 'bg-indigo-50/80 border-indigo-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-black text-xs text-indigo-700 uppercase">
                      Pilihan {opt}
                    </span>
                    <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`key_per_page_${activeIndex}`}
                        checked={(q as QuestionPG).kunci === opt.toUpperCase()}
                        onChange={() => handleFieldChange('kunci', opt.toUpperCase())}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span
                        className={
                          (q as QuestionPG).kunci === opt.toUpperCase()
                            ? 'text-indigo-700 font-black'
                            : ''
                        }
                      >
                        Kunci Benar
                      </span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={(q as QuestionPG)[opt] || ''}
                    onChange={(e) => handleFieldChange(opt, e.target.value)}
                    placeholder={`Teks pilihan ${opt.toUpperCase()}...`}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                  />
                  {(q as QuestionPG)[opt] &&
                    ((q as QuestionPG)[opt].includes('$') ||
                      (q as QuestionPG)[opt].includes('\\frac')) && (
                      <div className="mt-1.5 px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-xs flex items-center gap-2">
                        <span className="text-[10px] text-indigo-600 font-bold uppercase">Formula:</span>
                        <MathRenderer
                          content={(q as QuestionPG)[opt]}
                          className="font-semibold text-indigo-950"
                        />
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TYPE 2: PGK CENTANG BANYAK (MCMA) */}
        {q.type === 'pgk_mcma' && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800">
                Opsi Pilihan (Centang Semua yang Benar):
              </label>
              <button
                type="button"
                onClick={() => {
                  const opts = [...((q as QuestionPGKMCMA).options || [])];
                  opts.push({ text: '', isKey: false });
                  handleFieldChange('options', opts);
                }}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl hover:bg-emerald-100"
              >
                + Tambah Opsi
              </button>
            </div>

            <div className="space-y-2">
              {((q as QuestionPGKMCMA).options || []).map((opt, oIdx) => (
                <div
                  key={oIdx}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition ${
                    opt.isKey ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white border-slate-200'
                  }`}
                >
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 shrink-0">
                    <input
                      type="checkbox"
                      checked={opt.isKey}
                      onChange={(e) => {
                        const opts = [...(q as QuestionPGKMCMA).options];
                        opts[oIdx] = { ...opts[oIdx], isKey: e.target.checked };
                        handleFieldChange('options', opts);
                      }}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className={opt.isKey ? 'text-emerald-800 font-black' : ''}>Kunci Benar</span>
                  </label>

                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => {
                      const opts = [...(q as QuestionPGKMCMA).options];
                      opts[oIdx] = { ...opts[oIdx], text: e.target.value };
                      handleFieldChange('options', opts);
                    }}
                    placeholder={`Teks pilihan ${oIdx + 1}...`}
                    className="flex-1 text-xs p-2 rounded-xl border border-slate-300 bg-white"
                  />

                  {(q as QuestionPGKMCMA).options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const opts = (q as QuestionPGKMCMA).options.filter((_, i) => i !== oIdx);
                        handleFieldChange('options', opts);
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TYPE 3: PGK KATEGORI / TABEL PERNYATAAN */}
        {q.type === 'pgk_kategori' && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Kolom 1 (Kiri)
                </label>
                <input
                  type="text"
                  value={(q as QuestionPGKKategori).col1 || 'Benar'}
                  onChange={(e) => handleFieldChange('col1', e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold text-indigo-700"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Kolom 2 (Kanan)
                </label>
                <input
                  type="text"
                  value={(q as QuestionPGKKategori).col2 || 'Salah'}
                  onChange={(e) => handleFieldChange('col2', e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold text-rose-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Daftar Pernyataan & Kunci:</span>
                <button
                  type="button"
                  onClick={() => {
                    const rows = [...((q as QuestionPGKKategori).rows || [])];
                    rows.push({ text: '', key: 'col1' });
                    handleFieldChange('rows', rows);
                  }}
                  className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl hover:bg-blue-100"
                >
                  + Tambah Baris Pernyataan
                </button>
              </div>

              {((q as QuestionPGKKategori).rows || []).map((row, rIdx) => (
                <div
                  key={rIdx}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-3"
                >
                  <span className="text-xs font-bold text-slate-500 w-5">{rIdx + 1}.</span>
                  <input
                    type="text"
                    value={row.text}
                    onChange={(e) => {
                      const rows = [...(q as QuestionPGKKategori).rows];
                      rows[rIdx] = { ...rows[rIdx], text: e.target.value };
                      handleFieldChange('rows', rows);
                    }}
                    placeholder={`Pernyataan ${rIdx + 1}...`}
                    className="flex-1 text-xs p-2 rounded-xl border border-slate-300 bg-white"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name={`row_key_${activeIndex}_${rIdx}`}
                        checked={row.key === 'col1'}
                        onChange={() => {
                          const rows = [...(q as QuestionPGKKategori).rows];
                          rows[rIdx] = { ...rows[rIdx], key: 'col1' };
                          handleFieldChange('rows', rows);
                        }}
                        className="w-3.5 h-3.5 text-indigo-600"
                      />
                      <span>{(q as QuestionPGKKategori).col1 || 'Benar'}</span>
                    </label>
                    <label className="text-xs font-bold flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name={`row_key_${activeIndex}_${rIdx}`}
                        checked={row.key === 'col2'}
                        onChange={() => {
                          const rows = [...(q as QuestionPGKKategori).rows];
                          rows[rIdx] = { ...rows[rIdx], key: 'col2' };
                          handleFieldChange('rows', rows);
                        }}
                        className="w-3.5 h-3.5 text-rose-600"
                      />
                      <span>{(q as QuestionPGKKategori).col2 || 'Salah'}</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM PAGINATION CONTROLS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={() => onSelectIndex(activeIndex - 1)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Soal Sebelumnya</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAddQuestion('pg')}
              className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Soal</span>
            </button>
          </div>

          <button
            type="button"
            disabled={activeIndex === questions.length - 1}
            onClick={() => onSelectIndex(activeIndex + 1)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            <span>Soal Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
