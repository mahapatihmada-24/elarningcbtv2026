import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Layers,
  HelpCircle,
  Copy,
} from 'lucide-react';
import { Question } from '../../types';
import {
  parseQuickTextQuestions,
  parseCsvQuestions,
} from '../../utils/questionParser';
import {
  downloadSampleQuestionCsv,
  downloadSampleQuestionJson,
} from '../../utils/documentExport';

interface BulkQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyQuestions: (newQuestions: Question[], mode: 'replace' | 'append') => void;
}

const SAMPLE_PASTE_TEXT = `1. Ibu kota negara Indonesia yang baru sesuai undang-undang adalah...
A. Bandung
B. Nusantara
C. Jakarta
D. Surabaya
Kunci: B
Bobot: 1
Pembahasan: Nusantara (IKN) merupakan ibu kota negara Republik Indonesia yang ditetapkan berdasarkan undang-undang.

2. Organ pernapasan utama pada manusia yang berfungsi menukar oksigen dan karbon dioksida adalah...
A. Paru-paru
B. Jantung
C. Hati
D. Ginjal
Kunci: A
Bobot: 1
Pembahasan: Paru-paru merupakan organ respirasi utama yang memiliki alveolus sebagai tempat pertukaran gas O2 dan CO2.

3. [PGK] Manakah di antara pilihan berikut yang termasuk hewan pemakan tumbuhan (herbivora)?
A. Sapi
B. Harimau
C. Kelinci
D. Kambing
Kunci: A, C, D
Bobot: 2
Pembahasan: Sapi, kelinci, dan kambing memakan rumput/dedaunan sehingga tergolong herbivora. Harimau adalah karnivora pemakan daging.

4. [TABEL] Tentukan apakah pernyataan berikut mengenai perubahan wujud zat Benar atau Salah:
- Membeku adalah perubahan dari cair menjadi padat [Benar]
- Menguap adalah perubahan dari gas menjadi cair [Salah]
- Menyublim adalah perubahan dari padat menjadi gas [Benar]
Bobot: 2
Pembahasan: Menguap adalah perubahan dari cair menjadi gas, sedangkan perubahan dari gas ke cair disebut mengembun.`;

export const BulkQuestionModal: React.FC<BulkQuestionModalProps> = ({
  isOpen,
  onClose,
  onApplyQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [copiedSample, setCopiedSample] = useState(false);

  if (!isOpen) return null;

  // Handle live parse of pasted text
  const handleTextChange = (text: string) => {
    setPasteText(text);
    const parsed = parseQuickTextQuestions(text);
    setParsedQuestions(parsed);
  };

  // Load sample text
  const handleLoadSampleText = () => {
    handleTextChange(SAMPLE_PASTE_TEXT);
  };

  // Copy sample text to clipboard
  const handleCopySample = () => {
    navigator.clipboard.writeText(SAMPLE_PASTE_TEXT);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.json')) {
        try {
          const json = JSON.parse(content);
          if (Array.isArray(json)) {
            setParsedQuestions(json);
          } else if (json.questions && Array.isArray(json.questions)) {
            setParsedQuestions(json.questions);
          }
        } catch {
          alert('Format file JSON tidak valid.');
        }
      } else if (file.name.endsWith('.csv')) {
        const parsed = parseCsvQuestions(content);
        setParsedQuestions(parsed);
      } else {
        // Plain text file
        const parsed = parseQuickTextQuestions(content);
        setParsedQuestions(parsed);
      }
    };

    reader.readAsText(file);
  };

  const handleApply = (mode: 'replace' | 'append') => {
    if (parsedQuestions.length === 0) return;
    onApplyQuestions(parsedQuestions, mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-900 text-white px-5 py-4 flex items-center justify-between shrink-0 shadow">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 border border-indigo-500/40 flex items-center justify-center text-white shadow">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Upload & Generator Soal Massal CBT
              </h3>
              <p className="text-xs text-indigo-200">
                Buat banyak soal sekaligus tanpa harus mengetik satu persatu pada aplikasi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition flex items-center gap-2 border-t border-x ${
              activeTab === 'paste'
                ? 'bg-white text-indigo-700 border-slate-200 border-b-transparent shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tempel Teks dari Word / Docs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition flex items-center gap-2 border-t border-x ${
              activeTab === 'file'
                ? 'bg-white text-indigo-700 border-slate-200 border-b-transparent shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload File (Excel/CSV / JSON)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'paste' ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Tempelkan Soal dari Word, Google Docs, atau Notepad:</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSampleText}
                    className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 transition"
                  >
                    Muat Contoh Soal
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySample}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedSample ? 'Tersalin!' : 'Salin Format'}</span>
                  </button>
                </div>
              </div>

              <textarea
                value={pasteText}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={9}
                placeholder="1. Pertanyaan pilihan ganda...&#10;A. Pilihan 1&#10;B. Pilihan 2&#10;C. Pilihan 3&#10;D. Pilihan 4&#10;Kunci: B&#10;Bobot: 1&#10;&#10;2. Pertanyaan kedua..."
                className="w-full text-xs sm:text-sm font-mono p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 leading-relaxed"
              />

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                <strong>Format Praktis:</strong> Tulis nomor soal (1, 2, ...), pilihan (A, B, C, D), kunci (misal: <code>Kunci: B</code> atau <code>Kunci: A, C</code> untuk PGK), dan bobot (<code>Bobot: 1</code>). Dukungan untuk PG biasa, PGK Centang, dan PGK Tabel Kategori.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    Pilih File Template Soal (.csv, .json, .txt)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {fileName ? `File terpilih: ${fileName}` : 'Klik untuk memilih file dari komputer atau perangkat Anda'}
                  </p>
                </div>
                <label className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow transition active:scale-95">
                  <span>Pilih File Dari Perangkat</span>
                  <input
                    type="file"
                    accept=".csv, .json, .txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Download Template Buttons */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h5 className="font-bold text-xs text-slate-700">Unduh Format & Template Soal Resmi:</h5>
                <p className="text-xs text-slate-500">
                  Gunakan template siap pakai ini untuk mengisi daftar soal di Microsoft Excel atau Google Sheets:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={downloadSampleQuestionCsv}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Template Excel / CSV (.csv)</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadSampleQuestionJson}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shadow transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Template JSON (.json)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Real-time Parsed Preview Box */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-700">
                  Pratinjau Hasil Pembacaan Soal:
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                    parsedQuestions.length > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {parsedQuestions.length > 0 ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>{parsedQuestions.length} Butir Soal Terdeteksi</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      <span>0 Butir Soal (Tempel teks atau upload file)</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {parsedQuestions.length > 0 ? (
              <div className="max-h-56 overflow-y-auto p-3 space-y-2.5 bg-white">
                {parsedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold text-[10px] uppercase">
                          {q.type === 'pg'
                            ? 'Pilihan Ganda'
                            : q.type === 'pgk_mcma'
                            ? 'PGK Centang'
                            : 'PGK Tabel Kategori'}
                        </span>
                        <span className="text-slate-400">• Bobot: {q.bobot}</span>
                      </div>

                      {q.type === 'pg' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          Kunci: {q.kunci}
                        </span>
                      )}
                    </div>

                    <p className="font-semibold text-slate-800 line-clamp-2">{q.soal}</p>

                    {q.type === 'pg' && (
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 pt-1">
                        <div>A. {q.a || '-'}</div>
                        <div>B. {q.b || '-'}</div>
                        <div>C. {q.c || '-'}</div>
                        <div>D. {q.d || '-'}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-white">
                Belum ada butir soal yang terbaca. Gunakan tombol &quot;Muat Contoh Soal&quot; atau tempel teks dari dokumen Anda.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={parsedQuestions.length === 0}
              onClick={() => handleApply('append')}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shadow transition disabled:opacity-50"
            >
              + Tambahkan ke Soal Saat Ini
            </button>

            <button
              type="button"
              disabled={parsedQuestions.length === 0}
              onClick={() => handleApply('replace')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition disabled:opacity-50"
            >
              Ganti Semua ({parsedQuestions.length} Soal)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
