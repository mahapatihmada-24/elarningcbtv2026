import React, { useRef } from 'react';
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
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  AlignCenter,
  Palette,
  Heading,
  KeyRound,
  Lightbulb,
  Check,
  Save,
  Loader2,
} from 'lucide-react';
import { Question, QuestionType, QuestionPG, QuestionPGKMCMA, QuestionPGKKategori, getQuestionImages } from '../../types';
import { MathRenderer } from '../MathRenderer';
import { OptionImageControl } from './OptionImageControl';
import { QuestionImageManager } from './QuestionImageManager';

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
  onSaveSingleQuestion?: (index: number, question: Question) => Promise<boolean | void> | void;
  isSavingQuestion?: boolean;
  savedQuestionIdx?: number | null;
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
  onSaveSingleQuestion,
  isSavingQuestion,
  savedQuestionIdx,
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pembahasanRef = useRef<HTMLTextAreaElement>(null);
  const qImages = getQuestionImages(q);

  const [internalSaving, setInternalSaving] = React.useState(false);
  const [internalSaved, setInternalSaved] = React.useState(false);

  const isSavingThisQ = Boolean(isSavingQuestion || internalSaving);
  const isThisQSaved = Boolean(savedQuestionIdx === activeIndex || internalSaved);

  const handleSaveQuestion = async () => {
    if (!onSaveSingleQuestion) return;
    setInternalSaving(true);
    try {
      await onSaveSingleQuestion(activeIndex, q);
      setInternalSaved(true);
      setTimeout(() => setInternalSaved(false), 3000);
    } catch (e) {
      console.warn('Gagal menyimpan soal:', e);
    } finally {
      setInternalSaving(false);
    }
  };

  const handleFieldChange = (field: string, val: unknown) => {
    onUpdateQuestion(activeIndex, {
      ...q,
      [field]: val,
    } as Question);
  };

  const insertTagAtCursor = (tag: string) => {
    const textarea = textareaRef.current;
    const currentText = q.soal || '';
    if (textarea) {
      const start = textarea.selectionStart ?? currentText.length;
      const end = textarea.selectionEnd ?? currentText.length;
      const before = currentText.substring(0, start);
      const after = currentText.substring(end);
      const needsPrefixBreak = before.length > 0 && !before.endsWith('\n');
      const needsSuffixBreak = after.length > 0 && !after.startsWith('\n');
      const formattedTag = (needsPrefixBreak ? '\n\n' : '') + tag + (needsSuffixBreak ? '\n\n' : '');
      const newText = before + formattedTag + after;
      handleFieldChange('soal', newText);
      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          const newPos = (before + formattedTag).length;
          textarea.setSelectionRange(newPos, newPos);
        }
      }, 50);
    } else {
      const newText = currentText.trim() ? `${currentText}\n\n${tag}\n\n` : tag;
      handleFieldChange('soal', newText);
    }
  };

  const wrapSelectionOrInsert = (
    prefix: string,
    suffix: string,
    defaultPlaceholder: string = '',
    isBlock: boolean = false
  ) => {
    const textarea = textareaRef.current;
    const currentText = q.soal || '';
    if (textarea) {
      const start = textarea.selectionStart ?? currentText.length;
      const end = textarea.selectionEnd ?? currentText.length;
      const selectedText = currentText.substring(start, end);
      const textToWrap = selectedText || defaultPlaceholder;
      const before = currentText.substring(0, start);
      const after = currentText.substring(end);

      let insertPrefix = prefix;
      let insertSuffix = suffix;
      if (isBlock) {
        if (before.length > 0 && !before.endsWith('\n')) insertPrefix = '\n\n' + insertPrefix;
        if (after.length > 0 && !after.startsWith('\n')) insertSuffix = insertSuffix + '\n\n';
      }

      const newText = before + insertPrefix + textToWrap + insertSuffix + after;
      handleFieldChange('soal', newText);
      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          const selStart = before.length + insertPrefix.length;
          const selEnd = selStart + textToWrap.length;
          textarea.setSelectionRange(selStart, selEnd);
        }
      }, 50);
    } else {
      const textToWrap = defaultPlaceholder;
      const newText = currentText
        ? `${currentText}\n\n${prefix}${textToWrap}${suffix}`
        : `${prefix}${textToWrap}${suffix}`;
      handleFieldChange('soal', newText);
    }
  };

  const wrapPembahasanOrInsert = (
    prefix: string,
    suffix: string,
    defaultPlaceholder: string = ''
  ) => {
    const textarea = pembahasanRef.current;
    const currentText = q.pembahasan || '';
    if (textarea) {
      const start = textarea.selectionStart ?? currentText.length;
      const end = textarea.selectionEnd ?? currentText.length;
      const selectedText = currentText.substring(start, end);
      const textToWrap = selectedText || defaultPlaceholder;
      const before = currentText.substring(0, start);
      const after = currentText.substring(end);

      const newText = before + prefix + textToWrap + suffix + after;
      handleFieldChange('pembahasan', newText);
      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          const selStart = before.length + prefix.length;
          const selEnd = selStart + textToWrap.length;
          textarea.setSelectionRange(selStart, selEnd);
        }
      }, 50);
    } else {
      const textToWrap = defaultPlaceholder;
      const newText = currentText
        ? `${currentText}\n${prefix}${textToWrap}${suffix}`
        : `${prefix}${textToWrap}${suffix}`;
      handleFieldChange('pembahasan', newText);
    }
  };

  const handleTypeChange = (newType: QuestionType) => {
    if (newType === 'pg') {
      const mcmaOpts = (q as QuestionPGKMCMA).options || [];
      const pgQ = q as QuestionPG;
      const existingOpts =
        q.type === 'pgk_mcma'
          ? mcmaOpts.map((o) => ({ text: o.text, img: o.img }))
          : [
              { text: pgQ.a, img: pgQ.a_img },
              { text: pgQ.b, img: pgQ.b_img },
              { text: pgQ.c, img: pgQ.c_img },
              { text: pgQ.d, img: pgQ.d_img },
            ];

      onUpdateQuestion(activeIndex, {
        type: 'pg',
        bobot: q.bobot || 1,
        soal: q.soal,
        gambar: q.gambar,
        gambar_list: q.gambar_list,
        a: existingOpts[0]?.text || '',
        a_img: existingOpts[0]?.img,
        b: existingOpts[1]?.text || '',
        b_img: existingOpts[1]?.img,
        c: existingOpts[2]?.text || '',
        c_img: existingOpts[2]?.img,
        d: existingOpts[3]?.text || '',
        d_img: existingOpts[3]?.img,
        ...(existingOpts[4] ? { e: existingOpts[4].text, e_img: existingOpts[4].img } : {}),
        kunci: (q as QuestionPG).kunci || 'A',
        pembahasan: q.pembahasan,
      });
    } else if (newType === 'pgk_mcma') {
      const pgQ = q as QuestionPG;
      const existingOpts =
        q.type === 'pg'
          ? [
              { text: pgQ.a || '', img: pgQ.a_img, isKey: pgQ.kunci === 'A' },
              { text: pgQ.b || '', img: pgQ.b_img, isKey: pgQ.kunci === 'B' },
              { text: pgQ.c || '', img: pgQ.c_img, isKey: pgQ.kunci === 'C' },
              { text: pgQ.d || '', img: pgQ.d_img, isKey: pgQ.kunci === 'D' },
              ...(pgQ.e !== undefined ? [{ text: pgQ.e || '', img: pgQ.e_img, isKey: pgQ.kunci === 'E' }] : []),
            ]
          : (q as QuestionPGKMCMA).options || [];

      onUpdateQuestion(activeIndex, {
        type: 'pgk_mcma',
        bobot: q.bobot || 1,
        soal: q.soal,
        gambar: q.gambar,
        gambar_list: q.gambar_list,
        options:
          existingOpts.length > 0
            ? existingOpts
            : [
                { text: '', isKey: true },
                { text: '', isKey: false },
                { text: '', isKey: false },
                { text: '', isKey: false },
              ],
        pembahasan: q.pembahasan,
      });
    } else {
      onUpdateQuestion(activeIndex, {
        type: 'pgk_kategori',
        bobot: q.bobot || 1,
        soal: q.soal,
        gambar: q.gambar,
        gambar_list: q.gambar_list,
        col1: 'Benar',
        col2: 'Salah',
        rows: [
          { text: 'Pernyataan 1', key: 'col1' },
          { text: 'Pernyataan 2', key: 'col2' },
        ],
        pembahasan: q.pembahasan,
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
      return Boolean(
        (item.a || item.a_img) && (item.b || item.b_img) && item.kunci
      );
    }
    if (item.type === 'pgk_mcma') {
      return (item.options || []).some(
        (o) => o.isKey && (o.text.trim() || o.img)
      );
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

            {/* Tombol Simpan Per Butir Soal Khusus di Top Card Bar */}
            {onSaveSingleQuestion && (
              <button
                type="button"
                onClick={handleSaveQuestion}
                disabled={isSavingThisQ}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                  isThisQSaved
                    ? 'bg-emerald-700 text-white ring-2 ring-emerald-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                } disabled:opacity-60`}
                title="Simpan Butir Soal Ini Sekarang (Asynchronous - Tetap di Halaman Ini)"
              >
                {isSavingThisQ ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : isThisQSaved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Tersimpan! ✓</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Soal Ini</span>
                  </>
                )}
              </button>
            )}

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
          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Teks Stimulus & Pertanyaan (Judul Tengah, Tebal, Miring, Warna Font, & Rumus)
            </label>
            <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-mono">
              {'LaTeX: $\\frac{a}{b}$ | Warna: [color=#0284c7]...[/color]'}
            </span>
          </div>

          {/* Comprehensive Rich Formatting Toolbar */}
          <div className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {/* Judul Stimulus */}
              <button
                type="button"
                onClick={() => wrapSelectionOrInsert('[center]**_', '_**[/center]', 'Judul Stimulasi', true)}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition active:scale-95 flex items-center gap-1.5"
                title="Sisipkan Judul Stimulasi di Tengah (Tebal & Miring)"
              >
                <Heading className="w-3.5 h-3.5" />
                <span>+ Judul Stimulus</span>
              </button>

              {/* Rata Tengah */}
              <button
                type="button"
                onClick={() => wrapSelectionOrInsert('[center]', '[/center]', 'Teks di Tengah', true)}
                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs shadow-2xs transition active:scale-95 flex items-center gap-1"
                title="Ratakan Teks ke Tengah [center]...[/center]"
              >
                <AlignCenter className="w-3.5 h-3.5" />
                <span className="font-semibold">Tengah</span>
              </button>

              <div className="h-4 w-px bg-slate-300 mx-0.5" />

              {/* Bold */}
              <button
                type="button"
                onClick={() => wrapSelectionOrInsert('**', '**', 'teks tebal')}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs shadow-2xs transition active:scale-95 font-black"
                title="Tebalkan Teks (Bold) **teks**"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              {/* Italic */}
              <button
                type="button"
                onClick={() => wrapSelectionOrInsert('*', '*', 'teks miring')}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs shadow-2xs transition active:scale-95 italic"
                title="Miringkan Teks (Italic) *teks*"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>

              {/* Underline */}
              <button
                type="button"
                onClick={() => wrapSelectionOrInsert('<u>', '</u>', 'teks garis bawah')}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs shadow-2xs transition active:scale-95 underline"
                title="Garis Bawah (Underline) <u>teks</u>"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-slate-300 mx-0.5" />

              {/* Font Colors */}
              <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-300 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-indigo-600" />
                  <span className="hidden sm:inline">Warna:</span>
                </span>
                {[
                  { name: 'Biru', hex: '#0284c7', bg: 'bg-[#0284c7]' },
                  { name: 'Merah', hex: '#dc2626', bg: 'bg-[#dc2626]' },
                  { name: 'Hijau', hex: '#16a34a', bg: 'bg-[#16a34a]' },
                  { name: 'Ungu', hex: '#9333ea', bg: 'bg-[#9333ea]' },
                  { name: 'Oranye', hex: '#ea580c', bg: 'bg-[#ea580c]' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => wrapSelectionOrInsert(`[color=${c.hex}]`, '[/color]', `teks ${c.name.toLowerCase()}`)}
                    className={`w-4 h-4 rounded-full ${c.bg} border-2 border-white shadow-xs hover:scale-125 active:scale-95 transition`}
                    title={`Ubah warna teks menjadi ${c.name} (${c.hex})`}
                  />
                ))}
                {/* Custom Color input */}
                <label className="relative flex items-center cursor-pointer ml-0.5" title="Pilih warna kustom lainnya">
                  <input
                    type="color"
                    defaultValue="#0284c7"
                    onChange={(e) => wrapSelectionOrInsert(`[color=${e.target.value}]`, '[/color]', 'teks berwarna')}
                    className="w-4 h-4 rounded-full border border-slate-300 cursor-pointer p-0 opacity-0 absolute inset-0"
                  />
                  <span className="w-4 h-4 rounded-full border border-dashed border-slate-400 bg-gradient-to-tr from-pink-400 via-amber-300 to-indigo-500 shadow-xs flex items-center justify-center text-[9px] font-bold text-white hover:scale-125 transition">
                    +
                  </span>
                </label>
              </div>

              <div className="h-4 w-px bg-slate-300 mx-0.5" />

              {/* Rumus Math */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => wrapSelectionOrInsert('$\\frac{', '}{b}$', 'a')}
                  className="px-1.5 py-0.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-[11px] font-mono font-bold text-slate-700 shadow-2xs"
                  title="Sisipkan Pecahan $\frac{a}{b}$"
                >
                  a/b
                </button>
                <button
                  type="button"
                  onClick={() => wrapSelectionOrInsert('$\\sqrt{', '}$', 'x')}
                  className="px-1.5 py-0.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-[11px] font-mono font-bold text-slate-700 shadow-2xs"
                  title="Sisipkan Akar $\sqrt{x}$"
                >
                  √x
                </button>
                <button
                  type="button"
                  onClick={() => wrapSelectionOrInsert('$x^{', '}$', '2')}
                  className="px-1.5 py-0.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-[11px] font-mono font-bold text-slate-700 shadow-2xs"
                  title="Sisipkan Pangkat $x^{2}$"
                >
                  x²
                </button>
              </div>
            </div>

            {/* Quick Insert Toolbar for Interspersed Images */}
            {qImages.length > 0 && (
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-indigo-950 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  Sisipkan Gambar ke Posisi Kursor:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {qImages.map((_, imgIdx) => (
                    <button
                      key={imgIdx}
                      type="button"
                      onClick={() => insertTagAtCursor(`[Gambar ${imgIdx + 1}]`)}
                      className="px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-600 hover:text-white border border-indigo-300 font-bold text-indigo-700 text-xs shadow-2xs transition active:scale-95 flex items-center gap-1"
                      title={`Sisipkan tag [Gambar ${imgIdx + 1}] ke posisi kursor teks soal`}
                    >
                      <span>+ [Gambar {imgIdx + 1}]</span>
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500 italic ml-auto hidden md:inline">
                  Alur: Cerita ➔ [Gambar 1] ➔ Cerita ➔ [Gambar 2] ➔ Pertanyaan
                </span>
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={q.soal}
            onChange={(e) => handleFieldChange('soal', e.target.value)}
            rows={5}
            placeholder={`Contoh penulisan stimulus:
[center]**_Laundry Koin_**[/center]

*Laundry* koin adalah tempat mencuci pakaian yang sangat mudah digunakan...

[Gambar 1]

Pada tanggal 10 Agustus 2024, Linda dan Vidya bertemu di tempat laundry tersebut...

[color=#0284c7]Pilih semua jawaban benar! Jawaban benar lebih dari satu.[/color]`}
            className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed font-normal"
            required
          />

          {/* Live Preview of Question & Interspersed Images */}
          {(q.soal || qImages.length > 0) && (
            <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-[11px] text-indigo-700 font-bold uppercase tracking-wide flex items-center gap-1">
                  <span>Pratinjau Soal & Posisi Gambar:</span>
                </span>
                <span className="text-[10px] text-slate-400">Tampilan persis dengan siswa & lembar cetak</span>
              </div>
              <div className="pt-1">
                <MathRenderer
                  content={q.soal || '(Belum ada teks soal)'}
                  images={qImages}
                  onViewImage={onViewImage}
                  className="text-slate-900 font-medium text-xs sm:text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Question Images (Support Multiple Images) */}
        <QuestionImageManager
          gambar={q.gambar}
          gambarList={q.gambar_list}
          onChange={(newImages) => {
            const updated = {
              ...q,
              gambar: newImages[0] || undefined,
              gambar_list: newImages,
            };
            onUpdateQuestion(activeIndex, updated);
          }}
          onViewImage={onViewImage}
          onInsertTag={(tag) => insertTagAtCursor(tag)}
        />

        {/* TYPE 1: PILIHAN GANDA (PG) */}
        {q.type === 'pg' && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            {/* Kolom / Bar Kunci Jawaban Eksplisit */}
            <div className="p-3.5 bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-indigo-50/90 border border-indigo-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                      Kunci Jawaban Soal:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-black shadow-2xs">
                      Pilihan {(q as QuestionPG).kunci || 'A'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Tetapkan kunci benar lewat tombol cepat di samping atau radio button pada setiap opsi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-indigo-200 shadow-2xs">
                {(
                  ['A', 'B', 'C', 'D', ...((q as QuestionPG).e !== undefined ? ['E'] : [])] as (
                    | 'A'
                    | 'B'
                    | 'C'
                    | 'D'
                    | 'E'
                  )[]
                ).map((letter) => {
                  const isSelected = (q as QuestionPG).kunci === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleFieldChange('kunci', letter)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-black text-xs transition flex items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400 ring-offset-1'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'
                      }`}
                      title={`Tetapkan Pilihan ${letter} sebagai Kunci Jawaban Benar`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800">
                Pilihan Jawaban (A, B, C, D{((q as QuestionPG).e !== undefined ? ', E' : '')}):
              </label>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500">Pilih radio button untuk kunci</span>
                {(q as QuestionPG).e === undefined ? (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('e', '')}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200 transition"
                  >
                    + Tambah Opsi E
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...(q as QuestionPG) };
                      delete updated.e;
                      delete updated.e_img;
                      if (updated.kunci === 'E') updated.kunci = 'A';
                      onUpdateQuestion(activeIndex, updated);
                    }}
                    className="text-[11px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md border border-red-200 transition"
                  >
                    - Hapus Opsi E
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                ['a', 'b', 'c', 'd', ...((q as QuestionPG).e !== undefined ? ['e'] : [])] as (
                  | 'a'
                  | 'b'
                  | 'c'
                  | 'd'
                  | 'e'
                )[]
              ).map((opt) => (
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
                    ((q as QuestionPG)[opt]!.includes('$') ||
                      (q as QuestionPG)[opt]!.includes('\\frac')) && (
                      <div className="mt-1.5 px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-xs flex items-center gap-2">
                        <span className="text-[10px] text-indigo-600 font-bold uppercase">Formula:</span>
                        <MathRenderer
                          content={(q as QuestionPG)[opt]!}
                          className="font-semibold text-indigo-950"
                        />
                      </div>
                    )}

                  {/* Kontrol Gambar Opsi (Upload PC/Laptop atau URL) */}
                  <OptionImageControl
                    label={`Pilihan ${opt.toUpperCase()}`}
                    imageUrl={(q as QuestionPG)[`${opt}_img` as keyof QuestionPG] as string | undefined}
                    onImageChange={(val) => handleFieldChange(`${opt}_img`, val)}
                    onViewImage={onViewImage}
                    handleUploadImage={handleUploadImage}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TYPE 2: PGK CENTANG BANYAK (MCMA) */}
        {q.type === 'pgk_mcma' && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            {/* Indikator Kunci Jawaban PGK */}
            <div className="p-3 bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-emerald-50/90 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-black text-emerald-950">
                    Kunci Jawaban Benar (Centang Satu atau Lebih):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {((q as QuestionPGKMCMA).options || [])
                      .filter((o) => o.isKey)
                      .map((o) => {
                        const idx = ((q as QuestionPGKMCMA).options || []).indexOf(o);
                        return (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                          >
                            <Check className="w-2.5 h-2.5" />
                            <span>Opsi {idx + 1}</span>
                          </span>
                        );
                      })}
                    {((q as QuestionPGKMCMA).options || []).every((o) => !o.isKey) && (
                      <span className="text-[10px] text-amber-600 font-bold">
                        (Belum ada kunci yang dicentang)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

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
                  className={`p-3 rounded-2xl border transition space-y-2 ${
                    opt.isKey ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
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
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="pl-6">
                    <OptionImageControl
                      label={`Opsi ${oIdx + 1}`}
                      imageUrl={opt.img}
                      onImageChange={(val) => {
                        const opts = [...(q as QuestionPGKMCMA).options];
                        opts[oIdx] = { ...opts[oIdx], img: val || undefined };
                        handleFieldChange('options', opts);
                      }}
                      onViewImage={onViewImage}
                      handleUploadImage={handleUploadImage}
                      compact
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TYPE 3: PGK KATEGORI / TABEL PERNYATAAN */}
        {q.type === 'pgk_kategori' && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            {/* Indikator Kunci Jawaban PGK Kategori */}
            <div className="p-3 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 border border-blue-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-black text-blue-950">
                    Kunci Jawaban Pernyataan:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {((q as QuestionPGKKategori).rows || []).map((row, rIdx) => {
                      const isCol1 = row.key === 'col1';
                      return (
                        <span
                          key={rIdx}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-2xs ${
                            isCol1 ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white'
                          }`}
                        >
                          P{rIdx + 1}: {isCol1 ? (q as QuestionPGKKategori).col1 || 'Benar' : (q as QuestionPGKKategori).col2 || 'Salah'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

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
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50 space-y-2"
                >
                  <div className="flex items-center gap-3">
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
                    <div className="flex items-center gap-2 shrink-0">
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

                  <div className="pl-8">
                    <OptionImageControl
                      label={`Pernyataan ${rIdx + 1}`}
                      imageUrl={row.img}
                      onImageChange={(val) => {
                        const rows = [...(q as QuestionPGKKategori).rows];
                        rows[rIdx] = { ...rows[rIdx], img: val || undefined };
                        handleFieldChange('rows', rows);
                      }}
                      onViewImage={onViewImage}
                      handleUploadImage={handleUploadImage}
                      compact
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: PEMBAHASAN SOAL */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span>Pembahasan Soal</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    q.pembahasan && q.pembahasan.trim()
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {q.pembahasan && q.pembahasan.trim() ? '✓ Terisi' : 'Opsional'}
                  </span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Langkah penyelesaian materi untuk review hasil ujian siswa dan opsi cetak/unduh PDF & Word
                </p>
              </div>
            </div>

            {/* Quick Format & Math Toolbar for Pembahasan */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => wrapPembahasanOrInsert('**', '**', 'teks tebal')}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-2xs"
                title="Tebal (Bold)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => wrapPembahasanOrInsert('*', '*', 'teks miring')}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-2xs"
                title="Miring (Italic)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <div className="h-4 w-px bg-slate-300 mx-0.5" />
              <button
                type="button"
                onClick={() => wrapPembahasanOrInsert('$\\frac{', '}{b}$', 'a')}
                className="px-1.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700 shadow-2xs"
                title="Sisipkan Pecahan $\frac{a}{b}$"
              >
                a/b
              </button>
              <button
                type="button"
                onClick={() => wrapPembahasanOrInsert('$\\sqrt{', '}$', 'x')}
                className="px-1.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700 shadow-2xs"
                title="Sisipkan Akar $\sqrt{x}$"
              >
                √x
              </button>
              <button
                type="button"
                onClick={() => wrapPembahasanOrInsert('$x^{', '}$', '2')}
                className="px-1.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700 shadow-2xs"
                title="Sisipkan Pangkat $x^{2}$"
              >
                x²
              </button>
            </div>
          </div>

          <textarea
            ref={pembahasanRef}
            value={q.pembahasan || ''}
            onChange={(e) => handleFieldChange('pembahasan', e.target.value)}
            rows={4}
            placeholder={`Tuliskan pembahasan soal secara rinci...
Contoh:
Langkah pengerjaan:
1. Hitung nilai pecahan: $\\frac{3 \\times 2}{8 \\times 2} = \\frac{6}{16}$
2. Kesimpulan: Opsi jawaban yang tepat adalah B.`}
            className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed font-normal"
          />

          {/* Live Preview of Pembahasan */}
          {q.pembahasan && q.pembahasan.trim() && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-amber-200/70 pb-1.5">
                <span className="text-[11px] text-amber-900 font-bold uppercase tracking-wide flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pratinjau Pembahasan Soal:</span>
                </span>
                <span className="text-[10px] text-amber-700">Tampilan pada review siswa & cetak Word/PDF</span>
              </div>
              <div className="pt-1">
                <MathRenderer
                  content={q.pembahasan}
                  className="text-slate-800 font-medium text-xs sm:text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM PAGINATION CONTROLS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={() => onSelectIndex(activeIndex - 1)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Soal Sebelumnya</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {onSaveSingleQuestion && (
              <button
                type="button"
                onClick={handleSaveQuestion}
                disabled={isSavingThisQ}
                className={`px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                  isThisQSaved
                    ? 'bg-emerald-700 text-white ring-2 ring-emerald-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                } disabled:opacity-60`}
                title="Simpan Butir Soal Ini secara Asynchronous Tanpa Menutup Form"
              >
                {isSavingThisQ ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan Soal...</span>
                  </>
                ) : isThisQSaved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Soal #{activeIndex + 1} Tersimpan! ✓</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Butir Soal #{activeIndex + 1}</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => onAddQuestion('pg')}
              className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Soal</span>
            </button>
          </div>

          <button
            type="button"
            disabled={activeIndex === questions.length - 1}
            onClick={() => onSelectIndex(activeIndex + 1)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer"
          >
            <span>Soal Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
