import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  Megaphone,
  Calendar,
  AlertCircle,
  BookOpen,
  Info,
  Pin,
  ExternalLink,
} from 'lucide-react';
import { Announcement, User } from '../types';
import { api } from '../services/api';

const READ_ANNOUNCEMENTS_KEY = 'cbt_read_announcements';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onOpenFullBoard?: () => void;
}

export function getUnreadAnnouncementsCount(
  announcements: Announcement[],
  currentUser: User
): number {
  try {
    const readIds: string[] = JSON.parse(
      localStorage.getItem(READ_ANNOUNCEMENTS_KEY) || '[]'
    );
    const visible = announcements.filter((item) => {
      if (currentUser.role === 'admin') return true;
      if (currentUser.role === 'guru') return item.target === 'semua' || item.target === 'guru';
      if (currentUser.role === 'murid') return item.target === 'semua' || item.target === 'murid';
      return true;
    });
    return visible.filter((item) => !readIds.includes(item.id)).length;
  } catch {
    return 0;
  }
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenFullBoard,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAnnouncements();
      setAnnouncements(data || []);
      const saved: string[] = JSON.parse(
        localStorage.getItem(READ_ANNOUNCEMENTS_KEY) || '[]'
      );
      setReadIds(saved);
    } catch (e) {
      console.warn('Error fetching notifications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const visibleAnnouncements = announcements.filter((item) => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'guru') return item.target === 'semua' || item.target === 'guru';
    if (currentUser.role === 'murid') return item.target === 'semua' || item.target === 'murid';
    return true;
  });

  // Sort pinned first, then by date descending
  const sorted = [...visibleAnnouncements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.tanggal || '').localeCompare(a.tanggal || '');
  });

  const markAllAsRead = () => {
    const allIds = visibleAnnouncements.map((a) => a.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    localStorage.setItem(READ_ANNOUNCEMENTS_KEY, JSON.stringify(updated));
  };

  const markSingleAsRead = (id: string) => {
    if (readIds.includes(id)) return;
    const updated = [...readIds, id];
    setReadIds(updated);
    localStorage.setItem(READ_ANNOUNCEMENTS_KEY, JSON.stringify(updated));
  };

  const unreadCount = visibleAnnouncements.filter((a) => !readIds.includes(a.id)).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Notifikasi & Pengumuman Sekolah
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                SD Negeri Harjosari Kidul 01 • Pengumuman resmi sekolah
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition"
                title="Tandai semua sudah dibaca"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tandai Dibaca</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              Memuat pengumuman sekolah...
            </div>
          ) : sorted.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Megaphone className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">Belum ada pengumuman terbaru</p>
              <p className="text-[11px]">Semua notifikasi dan informasi sekolah akan muncul di sini.</p>
            </div>
          ) : (
            sorted.map((item) => {
              const isUnread = !readIds.includes(item.id);
              const isImportant = item.kategori === 'penting';

              return (
                <div
                  key={item.id}
                  onClick={() => markSingleAsRead(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isUnread
                      ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-100'
                      : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                      {item.pinned && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-200 text-amber-900">
                          <Pin className="w-2.5 h-2.5" /> PIN
                        </span>
                      )}
                      {item.kategori === 'penting' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          <AlertCircle className="w-3 h-3 text-rose-600" /> Penting
                        </span>
                      ) : item.kategori === 'ujian' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                          <BookOpen className="w-3 h-3 text-indigo-600" /> Ujian CBT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          <Info className="w-3 h-3 text-slate-500" /> Informasi
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.tanggal}
                    </span>
                  </div>

                  <h4
                    className={`text-xs sm:text-sm font-bold mb-1 ${
                      isUnread ? 'text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {item.judul}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {item.isi}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400 font-semibold">
                    Dipublikasikan oleh: {item.penulis || 'Administrator'}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {onOpenFullBoard && (
          <div className="p-3 bg-white border-t border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-500 text-[11px]">
              Total {visibleAnnouncements.length} pengumuman sekolah
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullBoard();
              }}
              className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              <span>Buka Papan Pengumuman Lengkap</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
