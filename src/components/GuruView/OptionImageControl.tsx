import React, { useState } from 'react';
import { Image as ImageIcon, Upload, Link2, Trash2, Eye, X, Check } from 'lucide-react';

interface OptionImageControlProps {
  label: string;
  imageUrl?: string;
  onImageChange: (url: string) => void;
  onViewImage: (url: string, title?: string) => void;
  handleUploadImage: (
    e: React.ChangeEvent<HTMLInputElement>,
    onDone: (base64: string) => void
  ) => void;
  compact?: boolean;
}

export const OptionImageControl: React.FC<OptionImageControlProps> = ({
  label,
  imageUrl,
  onImageChange,
  onViewImage,
  handleUploadImage,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (trimmed) {
      onImageChange(trimmed);
      setUrlInput('');
      setIsOpen(false);
      setShowUrlField(false);
    }
  };

  // State 1: Image is already present
  if (imageUrl) {
    return (
      <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 transition hover:border-slate-300">
        <div
          className="flex items-center gap-2 cursor-pointer min-w-0 group"
          onClick={() => onViewImage(imageUrl, `Gambar ${label}`)}
          title="Klik untuk memperbesar gambar"
        >
          <img
            src={imageUrl}
            alt={`Gambar ${label}`}
            className="w-12 h-12 rounded-lg object-contain bg-white border border-slate-200 shrink-0 group-hover:scale-105 transition shadow-2xs"
          />
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-indigo-600 shrink-0" />
              <span className="truncate">Gambar {label}</span>
            </span>
            <span className="text-[10px] text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5">
              <Eye className="w-2.5 h-2.5" /> Perbesar
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Ganti dari PC/Laptop */}
          <label
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 cursor-pointer transition shadow-2xs"
            title="Ganti Gambar dari PC/Laptop"
          >
            <Upload className="w-3.5 h-3.5" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleUploadImage(e, (dataUrl) => {
                  onImageChange(dataUrl);
                })
              }
              className="hidden"
            />
          </label>

          {/* Ganti via URL */}
          <button
            type="button"
            onClick={() => {
              setUrlInput(imageUrl.startsWith('data:') ? '' : imageUrl);
              setIsOpen(true);
              setShowUrlField(true);
            }}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition shadow-2xs"
            title="Ganti URL Gambar"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>

          {/* Hapus Gambar */}
          <button
            type="button"
            onClick={() => onImageChange('')}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
            title="Hapus Gambar Opsi"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // State 2: No image yet, but form is open
  if (isOpen) {
    return (
      <div className="mt-2 p-2.5 bg-indigo-50/60 border border-indigo-200/80 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pilih Gambar {label}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setShowUrlField(false);
            }}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-indigo-100/50 transition"
            title="Tutup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Upload Button */}
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-xs transition shrink-0">
            <Upload className="w-3 h-3" />
            <span>Upload dari PC/Laptop</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleUploadImage(e, (dataUrl) => {
                  onImageChange(dataUrl);
                  setIsOpen(false);
                })
              }
              className="hidden"
            />
          </label>

          {/* Toggle URL Input */}
          {!showUrlField && (
            <button
              type="button"
              onClick={() => setShowUrlField(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition shrink-0"
            >
              <Link2 className="w-3 h-3 text-slate-500" />
              <span>Tempel Link URL</span>
            </button>
          )}
        </div>

        {/* URL Input Form */}
        {showUrlField && (
          <div className="flex items-center gap-1 pt-1">
            <input
              type="url"
              placeholder="Tempel link URL gambar (https://...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyUrl();
                }
              }}
              className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              disabled={!urlInput.trim()}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition shrink-0"
            >
              <Check className="w-3 h-3" />
              <span>Pasang</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // State 3: Collapsed trigger button
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full text-[11px] font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/70 border border-dashed border-slate-300 hover:border-indigo-300 rounded-xl flex items-center justify-between transition ${
          compact ? 'px-2 py-1' : 'px-2.5 py-1.5'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span>+ Tambah Gambar Opsi</span>
        </span>
        <span className="text-[10px] text-slate-400 font-normal">PC/Laptop atau URL</span>
      </button>
    </div>
  );
};
