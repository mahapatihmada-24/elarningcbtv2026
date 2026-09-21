import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCheck2,
  HardDrive,
  Download,
  ExternalLink,
  Eye,
  File,
  Paperclip,
  Image as ImageIcon,
  Table,
} from 'lucide-react';
import {
  parseGoogleDriveLink,
  detectFileCategory,
  downloadAttachment,
} from '../utils/fileAttachmentHelper';

interface AnnouncementAttachmentCardProps {
  fileData?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  linkUrl?: string;
  linkTitle?: string;
  onPreviewImage?: (url: string, title?: string) => void;
  className?: string;
}

export const AnnouncementAttachmentCard: React.FC<AnnouncementAttachmentCardProps> = ({
  fileData,
  fileName,
  fileType,
  fileSize,
  linkUrl,
  linkTitle,
  onPreviewImage,
  className = '',
}) => {
  if (!fileData && !linkUrl) return null;

  const category = fileType || detectFileCategory(fileName || linkUrl || '');
  const gDrive = linkUrl ? parseGoogleDriveLink(linkUrl) : { isGoogleDrive: false };

  // Theme styling based on category
  const getCategoryTheme = () => {
    if (gDrive.isGoogleDrive) {
      return {
        bg: 'bg-emerald-50/80',
        border: 'border-emerald-200',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: <HardDrive className="w-5 h-5 text-emerald-600" />,
        label: 'Google Drive',
        btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      };
    }
    switch (category) {
      case 'pdf':
        return {
          bg: 'bg-rose-50/80',
          border: 'border-rose-200',
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: <FileText className="w-5 h-5 text-rose-600" />,
          label: 'PDF Dokumen',
          btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
        };
      case 'excel':
        return {
          bg: 'bg-teal-50/80',
          border: 'border-teal-200',
          badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
          icon: <FileSpreadsheet className="w-5 h-5 text-teal-600" />,
          label: 'Excel Spreadsheet',
          btnBg: 'bg-teal-700 hover:bg-teal-800 text-white',
        };
      case 'word':
        return {
          bg: 'bg-blue-50/80',
          border: 'border-blue-200',
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: <FileText className="w-5 h-5 text-blue-600" />,
          label: 'Word Dokumen',
          btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      case 'powerpoint':
        return {
          bg: 'bg-amber-50/80',
          border: 'border-amber-200',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: <Table className="w-5 h-5 text-amber-600" />,
          label: 'PowerPoint',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      case 'image':
        return {
          bg: 'bg-purple-50/80',
          border: 'border-purple-200',
          badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: <ImageIcon className="w-5 h-5 text-purple-600" />,
          label: 'Gambar / Foto',
          btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
        };
      default:
        return {
          bg: 'bg-indigo-50/80',
          border: 'border-indigo-200',
          badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          icon: <Paperclip className="w-5 h-5 text-indigo-600" />,
          label: 'Berkas Lampiran',
          btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        };
    }
  };

  const theme = getCategoryTheme();
  const displayName = fileName || linkTitle || (gDrive.isGoogleDrive ? 'Dokumen Google Drive' : 'Lampiran Berkas');

  const handleDownload = () => {
    downloadAttachment({ fileData, fileName: displayName, linkUrl });
  };

  const handleOpenPreview = () => {
    if (fileData) {
      if (category === 'image' && onPreviewImage) {
        onPreviewImage(fileData, displayName);
        return;
      }
      // Open base64 data in new window or download
      const w = window.open();
      if (w) {
        w.document.write(
          `<iframe src="${fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      } else {
        handleDownload();
      }
      return;
    }

    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`rounded-xl border p-3 sm:p-3.5 transition shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${theme.bg} ${theme.border} ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-lg bg-white shadow-2xs border border-slate-200/80 flex items-center justify-center shrink-0">
          {theme.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <span
              className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border ${theme.badgeBg}`}
            >
              {theme.label}
            </span>
            {fileSize && (
              <span className="text-[10px] font-semibold text-slate-500">
                {fileSize}
              </span>
            )}
            {gDrive.isGoogleDrive && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                Tersinkron Cloud
              </span>
            )}
          </div>
          <p
            className="text-xs sm:text-sm font-bold text-slate-800 truncate"
            title={displayName}
          >
            {displayName}
          </p>
          {linkUrl && (
            <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
              {linkUrl}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
        {/* Preview / Open Button */}
        <button
          type="button"
          onClick={handleOpenPreview}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition cursor-pointer shadow-2xs"
          title="Buka dokumen di tab baru atau perbesar"
        >
          {category === 'image' ? (
            <Eye className="w-3.5 h-3.5 text-slate-600" />
          ) : (
            <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
          )}
          <span>{category === 'image' ? 'Lihat Gambar' : 'Buka / Pratinjau'}</span>
        </button>

        {/* Download Button */}
        <button
          type="button"
          onClick={handleDownload}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer ${theme.btnBg}`}
          title="Unduh file dokumen ke perangkat"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Unduh File</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Helper component that renders text and turns any detected URLs inside the text into
 * interactive, clickable links or mini-cards so links in `item.isi` are never dead!
 */
export const FormattedAnnouncementBody: React.FC<{
  content: string;
  onPreviewImage?: (url: string, title?: string) => void;
}> = ({ content, onPreviewImage }) => {
  if (!content) return null;

  // URL regex
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);

  return (
    <div className="space-y-2">
      <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
        {parts.map((part, i) => {
          if (part.match(urlRegex)) {
            const cleanUrl = part.trim();
            const gDrive = parseGoogleDriveLink(cleanUrl);
            const isDoc =
              cleanUrl.includes('.pdf') ||
              cleanUrl.includes('.docx') ||
              cleanUrl.includes('.xlsx') ||
              cleanUrl.includes('.xls') ||
              cleanUrl.includes('.doc') ||
              gDrive.isGoogleDrive;

            return (
              <span key={i} className="inline-flex items-center gap-1 mx-1 my-0.5">
                <a
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold transition ${
                    gDrive.isGoogleDrive
                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 underline'
                      : isDoc
                      ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 underline'
                      : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 underline'
                  }`}
                  title={`Buka tautan: ${cleanUrl}`}
                >
                  {gDrive.isGoogleDrive ? (
                    <HardDrive className="w-3 h-3 text-emerald-700" />
                  ) : (
                    <ExternalLink className="w-3 h-3" />
                  )}
                  <span className="max-w-[200px] sm:max-w-[320px] truncate">
                    {cleanUrl}
                  </span>
                </a>

                {/* Instant direct download button for drive or doc links */}
                {(gDrive.isGoogleDrive || isDoc) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadAttachment({ linkUrl: cleanUrl });
                    }}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-black text-white text-[10px] font-bold transition shadow-2xs"
                    title="Unduh langsung file dari link ini"
                  >
                    <Download className="w-3 h-3" />
                    <span>Unduh</span>
                  </button>
                )}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    </div>
  );
};
