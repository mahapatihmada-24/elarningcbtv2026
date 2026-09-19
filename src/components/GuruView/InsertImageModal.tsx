import React, { useState } from 'react';
import { X, Image as ImageIcon, Upload, Link, Check, Eye } from 'lucide-react';

interface InsertImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (snippet: string) => void;
}

export const InsertImageModal: React.FC<InsertImageModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [sourceType, setSourceType] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [alignment, setAlignment] = useState<'center' | 'left' | 'right'>('center');
  const [formatType, setFormatType] = useState<'html' | 'markdown'>('html');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          setImageUrl(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (!imageUrl.trim()) return;

    const safeCaption = caption.trim() || 'Ilustrasi Materi';
    let snippet = '';

    if (formatType === 'markdown') {
      snippet = `\n\n![${safeCaption}](${imageUrl})\n\n`;
    } else {
      if (alignment === 'center') {
        snippet = `\n<div class="my-4 text-center">
  <img src="${imageUrl}" alt="${safeCaption}" class="max-h-80 mx-auto rounded-xl shadow-sm border border-slate-200" />
  <p class="text-xs text-slate-500 mt-1 italic font-medium">${safeCaption}</p>
</div>\n`;
      } else if (alignment === 'left') {
        snippet = `\n<div class="my-3 sm:float-left sm:mr-4 sm:mb-3 text-center sm:max-w-xs">
  <img src="${imageUrl}" alt="${safeCaption}" class="max-h-60 rounded-xl shadow-sm border border-slate-200" />
  <p class="text-[11px] text-slate-500 mt-1 italic">${safeCaption}</p>
</div>\n`;
      } else {
        snippet = `\n<div class="my-3 sm:float-right sm:ml-4 sm:mb-3 text-center sm:max-w-xs">
  <img src="${imageUrl}" alt="${safeCaption}" class="max-h-60 rounded-xl shadow-sm border border-slate-200" />
  <p class="text-[11px] text-slate-500 mt-1 italic">${safeCaption}</p>
</div>\n`;
      }
    }

    onInsert(snippet);
    // Reset
    setImageUrl('');
    setCaption('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-300" />
            <h3 className="font-bold text-sm sm:text-base">
              Sisipkan Gambar di Tengah Narasi
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Source Type Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSourceType('upload')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                sourceType === 'upload'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload dari Galeri / Kamera</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceType('url')}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                sourceType === 'url'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>Tautkan URL Gambar</span>
            </button>
          </div>

          {sourceType === 'upload' ? (
            <div>
              <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer transition">
                <Upload className="w-6 h-6 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-700">
                  {imageUrl ? 'Ganti File Gambar' : 'Pilih Foto dari Komputer atau HP'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Format JPG, PNG, WEBP (Otomatis Dioptimalkan)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Web URL Gambar
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://contoh.com/gambar-siklus-air.jpg"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Caption / Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan / Kepsen Gambar (Opsional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="misal: Gambar 1. Proses Evaporasi dan Kondensasi"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Alignment & Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Posisi Tata Letak
              </label>
              <select
                value={alignment}
                onChange={(e) => setAlignment(e.target.value as 'center' | 'left' | 'right')}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
              >
                <option value="center">Tengah (Center - Direkomendasikan)</option>
                <option value="left">Rata Kiri (Float Left)</option>
                <option value="right">Rata Kanan (Float Right)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Format Sisip
              </label>
              <select
                value={formatType}
                onChange={(e) => setFormatType(e.target.value as 'html' | 'markdown')}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
              >
                <option value="html">HTML Rapi Microsoft Word</option>
                <option value="markdown">Markdown ![alt](url)</option>
              </select>
            </div>
          </div>

          {/* Preview Image */}
          {imageUrl && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[11px] font-bold text-slate-500 block mb-2 flex items-center justify-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Pratinjau Gambar
              </span>
              <img
                src={imageUrl}
                alt="Preview"
                className="max-h-48 mx-auto rounded-lg shadow-sm border border-slate-200 object-contain"
              />
              {caption && (
                <p className="text-xs text-slate-600 italic mt-1 font-medium">{caption}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!imageUrl.trim()}
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Sisipkan ke Teks</span>
          </button>
        </div>
      </div>
    </div>
  );
};
