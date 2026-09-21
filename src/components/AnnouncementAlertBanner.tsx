import React, { useState } from 'react';
import { Megaphone, Pin, ArrowRight, X, Bell, Calendar, UserCheck } from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementAlertBannerProps {
  announcements: Announcement[];
  onViewAll: () => void;
  onOpenNotificationModal?: () => void;
}

export const AnnouncementAlertBanner: React.FC<AnnouncementAlertBannerProps> = ({
  announcements,
  onViewAll,
  onOpenNotificationModal,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || !announcements || announcements.length === 0) {
    return null;
  }

  // Find the most relevant announcement (pinned first, then latest date)
  const topAnnouncement = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.tanggal || '').localeCompare(a.tanggal || '');
  })[0];

  if (!topAnnouncement) return null;

  const isUrgent =
    topAnnouncement.kategori === 'penting' ||
    topAnnouncement.kategori === 'ujian' ||
    topAnnouncement.pinned;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-4.5 shadow-sm transition-all duration-200 relative overflow-hidden ${
        isUrgent
          ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/50 border-amber-300'
          : 'bg-gradient-to-r from-indigo-50/90 via-blue-50/60 to-indigo-50/40 border-indigo-200'
      }`}
    >
      {/* Accent strip */}
      <div
        className={`absolute top-0 left-0 bottom-0 w-1.5 ${
          isUrgent ? 'bg-amber-500' : 'bg-indigo-600'
        }`}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pl-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Icon Badge */}
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
              isUrgent
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-indigo-600 text-white'
            }`}
          >
            <Megaphone className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isUrgent
                    ? 'bg-amber-200 text-amber-900 border border-amber-300'
                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                }`}
              >
                {topAnnouncement.pinned ? '📌 PENGUMUMAN PENTING' : '📢 PENGUMUMAN SEKOLAH'}
              </span>

              {topAnnouncement.kategori && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-slate-700 border border-slate-200">
                  {topAnnouncement.kategori.toUpperCase()}
                </span>
              )}

              <span className="text-[11px] text-slate-500 flex items-center gap-1 ml-auto sm:ml-0">
                <Calendar className="w-3 h-3 text-slate-400" />
                {topAnnouncement.tanggal}
              </span>
            </div>

            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug truncate">
              {topAnnouncement.judul}
            </h4>

            <p className="text-xs text-slate-700 mt-1 line-clamp-2 sm:line-clamp-1 leading-relaxed font-medium">
              {topAnnouncement.isi}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pl-12 sm:pl-0">
          <button
            type="button"
            onClick={onViewAll}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer ${
              isUrgent
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <span>Buka Pengumuman</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {announcements.length > 1 && onOpenNotificationModal && (
            <button
              type="button"
              onClick={onOpenNotificationModal}
              title={`Ada ${announcements.length} pengumuman sekolah aktif`}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200 text-xs font-semibold transition"
            >
              <Bell className="w-3.5 h-3.5 text-indigo-600" />
              <span>+{announcements.length - 1} lainnya</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            title="Sembunyikan banner ini sementara"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-black/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
