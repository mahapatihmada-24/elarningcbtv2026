import React, { useState, useRef } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Link,
  Image as ImageIcon,
  Copy,
  Check,
} from 'lucide-react';
import { getQuestionImages } from '../../types';

interface QuestionImageManagerProps {
  gambar?: string;
  gambarList?: string[];
  onChange: (images: string[]) => void;
  onViewImage: (url: string, title?: string) => void;
  onInsertTag?: (tag: string) => void;
}

export const QuestionImageManager: React.FC<QuestionImageManagerProps> = ({
  gambar,
  gambarList,
  onChange,
  onViewImage,
  onInsertTag,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived current image list
  const currentImages = getQuestionImages({ gambar, gambar_list: gambarList });

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          const maxDim = 1000;
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
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newImgs: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const compressed = await compressImage(file);
        if (compressed) {
          newImgs.push(compressed);
        }
      }
    }

    if (newImgs.length > 0) {
      onChange([...currentImages, ...newImgs]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsProcessing(false);
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    onChange([...currentImages, trimmed]);
    setUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    const updated = currentImages.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Hapus seluruh gambar pada soal ini?')) {
      onChange([]);
    }
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentImages.length) return;

    const copy = [...currentImages];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onChange(copy);
  };

  const handleInsertTag = (index: number) => {
    const tag = `[Gambar ${index + 1}]`;
    if (onInsertTag) {
      onInsertTag(tag);
    }
    setCopiedIdx(index);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  return (
    <div className="space-y-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200">
      {/* Header & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Gambar Soal (Bisa Upload Lebih dari 1 Gambar)</span>
          </label>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
            {currentImages.length} Gambar
          </span>
        </div>

        {currentImages.length > 1 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition"
          >
            Hapus Semua ({currentImages.length})
          </button>
        )}
      </div>

      {/* Upload Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Multi-file Upload Button */}
        <label className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition shrink-0">
          <Upload className="w-3.5 h-3.5" />
          <span>{isProcessing ? 'Memproses...' : '+ Unggah Gambar (Multi-Pilih)'}</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            disabled={isProcessing}
            onChange={handleFilesSelected}
            className="hidden"
          />
        </label>

        {/* URL Input Form */}
        <form onSubmit={handleAddUrl} className="flex items-center gap-1.5 flex-1">
          <div className="relative flex-1">
            <Link className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Atau tempel link URL gambar (https://...)"
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-indigo-600 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={!urlInput.trim()}
            className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 font-bold text-xs flex items-center gap-1 transition shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">Tambah URL</span>
          </button>
        </form>
      </div>

      <p className="text-[11px] text-slate-500">
        💡 <strong className="text-slate-700">Tips:</strong> Anda bisa memilih banyak file sekaligus saat klik tombol unggah. Klik tombol <em>&quot;Sisipkan Kode [Gambar X]&quot;</em> jika ingin merujuk letak gambar tertentu di dalam teks soal.
      </p>

      {/* Gallery of Uploaded Images */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {currentImages.map((imgUrl, idx) => (
            <div
              key={idx}
              className="relative bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition space-y-2 flex flex-col justify-between"
            >
              {/* Badge & Order Action */}
              <div className="flex items-center justify-between gap-1 text-[11px]">
                <span className="font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  Gambar {idx + 1}
                </span>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'left')}
                    className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-100"
                    title="Geser ke kiri / urutan sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === currentImages.length - 1}
                    onClick={() => handleMove(idx, 'right')}
                    className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-100"
                    title="Geser ke kanan / urutan selanjutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 ml-1"
                    title="Hapus gambar ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Image Preview */}
              <div
                className="relative bg-slate-50 border border-slate-100 rounded-lg overflow-hidden h-28 flex items-center justify-center cursor-pointer group"
                onClick={() => onViewImage(imgUrl, `Gambar ${idx + 1}`)}
                title="Klik untuk memperbesar gambar"
              >
                <img
                  src={imgUrl}
                  alt={`Gambar ${idx + 1}`}
                  className="max-h-full max-w-full object-contain p-1 group-hover:scale-105 transition duration-200"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 text-white text-xs font-semibold backdrop-blur-2xs">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Perbesar</span>
                </div>
              </div>

              {/* Insert Tag Shortcut Button */}
              {onInsertTag && (
                <button
                  type="button"
                  onClick={() => handleInsertTag(idx)}
                  className={`w-full py-1 px-2 rounded-lg text-[11px] font-bold border transition flex items-center justify-center gap-1 ${
                    copiedIdx === idx
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700'
                  }`}
                  title="Sisipkan tag gambar ini ke dalam teks soal"
                >
                  {copiedIdx === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Tersisip ke Soal!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Sisipkan [Gambar {idx + 1}] ke Soal</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
