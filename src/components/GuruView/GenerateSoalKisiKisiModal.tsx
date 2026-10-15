import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  CheckSquare,
  Square,
  Layers,
  ArrowRight,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Zap,
} from 'lucide-react';
import { KisiKisiItem, Question, QuestionPG, QuestionPGKMCMA, QuestionPGKKategori } from '../../types';
import {
  generateQuestionsFromKisiKisi,
  generateQuestionsWithGemini,
  generateQuestionLocally,
  getStandardKisiKisiTemplate,
  GeneratorOptions,
} from '../../utils/kisiKisiQuestionGenerator';
import { MathRenderer } from '../MathRenderer';

interface GenerateSoalKisiKisiModalProps {
  isOpen: boolean;
  onClose: () => void;
  kisiKisiList: KisiKisiItem[];
  mapel: string;
  kelas: string;
  onApplyQuestions: (
    newQuestions: Question[],
    targetKisiKisi: KisiKisiItem[],
    mode: 'replace' | 'append'
  ) => void;
  onUpdateKisiKisi?: (items: KisiKisiItem[]) => void;
}

export const GenerateSoalKisiKisiModal: React.FC<GenerateSoalKisiKisiModalProps> = ({
  isOpen,
  onClose,
  kisiKisiList: initialList,
  mapel,
  kelas,
  onApplyQuestions,
  onUpdateKisiKisi,
}) => {
  const [items, setItems] = useState<KisiKisiItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [method, setMethod] = useState<'ai' | 'smart_template'>('ai');
  const [difficulty, setDifficulty] = useState<'standar' | 'hots' | 'mudah'>('standar');
  const [applyMode, setApplyMode] = useState<'replace' | 'append'>('replace');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [generatedItemsRef, setGeneratedItemsRef] = useState<KisiKisiItem[]>([]);
  const [activeStep, setActiveStep] = useState<'select' | 'preview'>('select');
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Initialize items when modal opens
  useEffect(() => {
    if (isOpen) {
      let current = initialList && initialList.length > 0 ? [...initialList] : [];
      if (current.length === 0) {
        // Offer standard template for this subject if empty
        current = getStandardKisiKisiTemplate(mapel);
      }
      setItems(current);
      setSelectedIndices(current.map((_, i) => i));
      setGeneratedQuestions([]);
      setActiveStep('select');
      setStatusMessage(null);
    }
  }, [isOpen, initialList, mapel]);

  if (!isOpen) return null;

  // Toggle selection
  const handleToggleSelect = (idx: number) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== idx));
    } else {
      setSelectedIndices([...selectedIndices, idx].sort((a, b) => a - b));
    }
  };

  const handleSelectAll = () => {
    if (selectedIndices.length === items.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(items.map((_, i) => i));
    }
  };

  const handleLoadStandardTemplate = () => {
    const standard = getStandardKisiKisiTemplate(mapel);
    setItems(standard);
    setSelectedIndices(standard.map((_, i) => i));
    if (onUpdateKisiKisi) {
      onUpdateKisiKisi(standard);
    }
    setStatusMessage({
      text: `Berhasil memuat ${standard.length} matriks kisi-kisi standar Kurikulum Merdeka untuk ${mapel}.`,
      type: 'info',
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Run generation
  const handleStartGenerate = async () => {
    if (selectedIndices.length === 0) {
      alert('Silakan pilih minimal 1 butir kisi-kisi untuk dibuatkan soalnya.');
      return;
    }

    const itemsToGenerate = selectedIndices.map((i) => items[i]);
    setIsGenerating(true);
    setGenerationProgress('Mempersiapkan stimulus dan parameter kisi-kisi...');
    setStatusMessage(null);

    try {
      const options: GeneratorOptions = {
        difficulty,
        includeStimulusStory: true,
      };

      if (method === 'ai') {
        setGenerationProgress('Menghubungi AI Gemini (gemini-3.8-flash) untuk merancang soal HOTS...');
        const result = await generateQuestionsWithGemini(itemsToGenerate, mapel, kelas, options);
        setGeneratedQuestions(result.questions);
        setGeneratedItemsRef(itemsToGenerate);
        setActiveStep('preview');
        setStatusMessage({
          text: result.message || 'Pembuatan soal berhasil!',
          type: result.source === 'gemini' ? 'success' : 'info',
        });
      } else {
        setGenerationProgress('Menyusun butir soal menggunakan Generator Cerdas Kurikulum...');
        // Small delay for smooth feel
        await new Promise((r) => setTimeout(r, 400));
        const questions = generateQuestionsFromKisiKisi(itemsToGenerate, mapel, kelas, options);
        setGeneratedQuestions(questions);
        setGeneratedItemsRef(itemsToGenerate);
        setActiveStep('preview');
        setStatusMessage({
          text: `Berhasil menyusun ${questions.length} butir soal berdasarkan pola Kurikulum Nasional.`,
          type: 'success',
        });
      }
    } catch (err: any) {
      // Fallback
      const fallback = generateQuestionsFromKisiKisi(itemsToGenerate, mapel, kelas, { difficulty });
      setGeneratedQuestions(fallback);
      setGeneratedItemsRef(itemsToGenerate);
      setActiveStep('preview');
      setStatusMessage({
        text: 'Soal berhasil disusun menggunakan generator cerdas kurikulum alternatif.',
        type: 'info',
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  // Regenerate single question
  const handleRegenerateSingle = async (index: number) => {
    const refItem = generatedItemsRef[index] || items[index] || items[0];
    const updated = [...generatedQuestions];

    // Try AI if available or smart template with random variation
    try {
      const newQ = generateQuestionLocally(refItem, mapel, kelas, { difficulty });
      updated[index] = newQ;
      setGeneratedQuestions(updated);
      setStatusMessage({
        text: `Butir soal #${index + 1} berhasil diperbarui dengan variasi baru.`,
        type: 'info',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {}
  };

  // Remove single generated question
  const handleRemoveGenerated = (index: number) => {
    const updatedQ = generatedQuestions.filter((_, i) => i !== index);
    const updatedItems = generatedItemsRef.filter((_, i) => i !== index);
    setGeneratedQuestions(updatedQ);
    setGeneratedItemsRef(updatedItems);
  };

  // Apply to exam
  const handleApplyToExam = () => {
    if (generatedQuestions.length === 0) return;
    onApplyQuestions(generatedQuestions, generatedItemsRef, applyMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-purple-50 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
                  Buat Soal Berdasarkan Kisi-Kisi
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200">
                  {mapel} • Kelas {kelas}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Otomatisasi pembuatan butir soal CBT standar Kurikulum Merdeka & HOTS dari matriks capaian indikator.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Breadcrumb & Notification Banner */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveStep('select')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeStep === 'select'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>1. Pilih Kisi-Kisi & Opsi</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-bold ml-1">
                {selectedIndices.length}/{items.length}
              </span>
            </button>

            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

            <button
              type="button"
              disabled={generatedQuestions.length === 0}
              onClick={() => setActiveStep('preview')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition disabled:opacity-40 ${
                activeStep === 'preview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>2. Pratinjau & Terapkan Soal</span>
              {generatedQuestions.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold ml-1">
                  {generatedQuestions.length} Butir
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadStandardTemplate}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold border border-teal-200 flex items-center gap-1.5 transition shadow-xs"
              title="Muat kisi-kisi standar kurikulum nasional untuk mata pelajaran ini"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              <span>Template Standar Kurikulum</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`px-5 py-2 text-xs font-semibold flex items-center gap-2 shrink-0 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-b border-rose-200'
                : 'bg-blue-50 text-blue-800 border-b border-blue-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {activeStep === 'select' ? (
            <div className="space-y-5">
              {/* Configuration Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                {/* Metodologi Generator */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Metode Pembuatan</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMethod('ai')}
                      className={`p-2 rounded-xl text-left border transition text-xs ${
                        method === 'ai'
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs font-bold'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>AI Gemini</span>
                      </div>
                      <p className={`text-[10px] mt-0.5 ${method === 'ai' ? 'text-indigo-100' : 'text-slate-400'}`}>
                        HOTS & Kontekstual
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod('smart_template')}
                      className={`p-2 rounded-xl text-left border transition text-xs ${
                        method === 'smart_template'
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs font-bold'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <Cpu className="w-3 h-3 text-teal-400" />
                        <span>Cerdas Pola</span>
                      </div>
                      <p
                        className={`text-[10px] mt-0.5 ${
                          method === 'smart_template' ? 'text-indigo-100' : 'text-slate-400'
                        }`}
                      >
                        Instan & Offline
                      </p>
                    </button>
                  </div>
                </div>

                {/* Tingkat Kesulitan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tingkat Kedalaman Soal
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e: any) => setDifficulty(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="standar">Standar Asesmen Kurikulum Merdeka</option>
                    <option value="hots">Berorientasi HOTS & Analisis Kritis</option>
                    <option value="mudah">Ramah Pemula / Latihan Formatif</option>
                  </select>
                </div>

                {/* Target Penggabungan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Target Penambahan ke Ujian
                  </label>
                  <select
                    value={applyMode}
                    onChange={(e: any) => setApplyMode(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="replace">Gantikan Seluruh Soal yang Ada</option>
                    <option value="append">Tambahkan di Akhir Daftar Soal</option>
                  </select>
                </div>
              </div>

              {/* Tabel Kisi-Kisi Interaktif */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 text-xs font-bold text-indigo-700 hover:text-indigo-900"
                    >
                      {selectedIndices.length === items.length ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span>
                        Pilih Semua ({selectedIndices.length}/{items.length} Indikator)
                      </span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Centang butir kisi-kisi yang hendak digenerate menjadi soal CBT
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[46vh]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                        <th className="py-2.5 px-3 w-10 text-center">Pilih</th>
                        <th className="py-2.5 px-2.5 w-10 text-center">No</th>
                        <th className="py-2.5 px-3 w-28">Elemen</th>
                        <th className="py-2.5 px-3 w-32">Sub Elemen</th>
                        <th className="py-2.5 px-3 w-48">Kompetensi</th>
                        <th className="py-2.5 px-2.5 w-24 text-center">Level Kognitif</th>
                        <th className="py-2.5 px-2.5 w-24 text-center">Konteks</th>
                        <th className="py-2.5 px-3">Indikator</th>
                        <th className="py-2.5 px-3 w-28 text-center">Tipe Soal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => {
                        const isSelected = selectedIndices.includes(idx);
                        return (
                          <tr
                            key={idx}
                            onClick={() => handleToggleSelect(idx)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(idx)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-bold text-slate-600">
                              {it.nomorSoal || idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {it.elemen || it.materi || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              {it.subElemen || it.materi || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 leading-relaxed text-[11px]">
                              {it.kompetensi || it.cp_kd || '-'}
                            </td>
                            <td className="py-2.5 px-2.5 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  it.levelKognitif === 'L3'
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                    : it.levelKognitif === 'L1'
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {it.levelKognitif || 'L2'}
                              </span>
                            </td>
                            <td className="py-2.5 px-2.5 text-center">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {it.konteks || 'Personal'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <p className="text-slate-800 font-medium leading-relaxed">{it.indikator || '-'}</p>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="text-[11px] font-medium text-slate-600">
                                {it.tipeSoal || it.bentukSoal || 'Pilihan Ganda'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: PREVIEW GENERATED QUESTIONS */
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Berhasil merancang {generatedQuestions.length} butir soal berdasarkan matriks kisi-kisi!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleStartGenerate}
                  disabled={isGenerating}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-700 font-bold hover:bg-emerald-100 transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerasi Seluruhnya</span>
                </button>
              </div>

              {/* List of Question Cards */}
              <div className="space-y-4">
                {generatedQuestions.map((q, qIdx) => {
                  const refItem = generatedItemsRef[qIdx];
                  const isEditing = editingQuestionIdx === qIdx;

                  return (
                    <div
                      key={qIdx}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition space-y-3"
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                            #{qIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-indigo-700 uppercase">
                            {q.type.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            Bobot: {q.bobot || 1}
                          </span>
                          {refItem && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                              {refItem.materi} • {refItem.levelKognitif}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRegenerateSingle(qIdx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Regenerasi butir ini dengan variasi soal lain"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingQuestionIdx(isEditing ? null : qIdx)}
                            className={`p-1.5 rounded-lg transition ${
                              isEditing
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                            }`}
                            title="Edit teks stimulus / soal ini"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveGenerated(qIdx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus butir ini dari hasil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question Text / Stimulus */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={q.soal}
                            onChange={(e) => {
                              const copy = [...generatedQuestions];
                              copy[qIdx] = { ...copy[qIdx], soal: e.target.value };
                              setGeneratedQuestions(copy);
                            }}
                            rows={3}
                            className="w-full text-xs p-2.5 rounded-xl border border-indigo-300 focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingQuestionIdx(null)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                          >
                            Selesai Mengedit Teks
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-line bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                          <MathRenderer content={q.soal} />
                        </div>
                      )}

                      {/* Options rendering according to type */}
                      {q.type === 'pg' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                          {(['a', 'b', 'c', 'd'] as const).map((optKey) => {
                            const isKey = q.kunci === optKey.toUpperCase();
                            const val = (q as QuestionPG)[optKey];
                            return (
                              <div
                                key={optKey}
                                className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                                  isKey
                                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-md font-bold text-[11px] flex items-center justify-center shrink-0 ${
                                    isKey ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {optKey.toUpperCase()}
                                </span>
                                <div className="flex-1">
                                  <MathRenderer content={val || ''} />
                                </div>
                                {isKey && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 shrink-0">
                                    Kunci
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'pgk_mcma' && (
                        <div className="space-y-1.5 pt-1 text-xs">
                          <span className="text-[11px] font-bold text-slate-500">Pilihan Jawaban (Multi-Centang):</span>
                          {(q as QuestionPGKMCMA).options?.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-xl border flex items-start gap-2 ${
                                opt.isKey
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center ${
                                  opt.isKey ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                                }`}
                              >
                                {opt.isKey && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </div>
                              <span className="flex-1">
                                <MathRenderer content={opt.text} />
                              </span>
                              {opt.isKey && (
                                <span className="text-[10px] font-bold text-emerald-700">Kunci Benar</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'pgk_kategori' && (
                        <div className="overflow-x-auto pt-1">
                          <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                            <thead className="bg-slate-100 font-bold text-slate-700 text-[11px]">
                              <tr>
                                <th className="p-2">Pernyataan</th>
                                <th className="p-2 w-24 text-center">{(q as QuestionPGKKategori).col1 || 'Benar'}</th>
                                <th className="p-2 w-24 text-center">{(q as QuestionPGKKategori).col2 || 'Salah'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {(q as QuestionPGKKategori).rows?.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  <td className="p-2 text-slate-800">
                                    <MathRenderer content={row.text} />
                                  </td>
                                  <td className="p-2 text-center">
                                    {row.key === 'col1' && (
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                        ✓ Kunci
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2 text-center">
                                    {row.key === 'col2' && (
                                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                                        ✓ Kunci
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {activeStep === 'select' ? (
              <span>
                {selectedIndices.length} dari {items.length} butir kisi-kisi terpilih
              </span>
            ) : (
              <span>
                Total {generatedQuestions.length} butir siap diterapkan ke paket ujian CBT
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeStep === 'select' ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isGenerating || selectedIndices.length === 0}
                  onClick={handleStartGenerate}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-200 flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{generationProgress || 'Sedang Membuat Soal...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Buat Soal dari {selectedIndices.length} Kisi-Kisi Terpilih</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveStep('select')}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                >
                  Kembali ke Kisi-Kisi
                </button>
                <button
                  type="button"
                  onClick={handleApplyToExam}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 flex items-center gap-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terapkan ke Paket Soal CBT ({generatedQuestions.length} Soal)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
