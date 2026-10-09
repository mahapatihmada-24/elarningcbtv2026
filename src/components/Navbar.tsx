import React from 'react';
import { GraduationCap, LogOut, Settings, User as UserIcon, Bell, HeartHandshake } from 'lucide-react';
import { User } from '../types';
import { DataSource } from '../services/api';

interface NavbarProps {
  user: User;
  dataSource: DataSource;
  onOpenSettings: () => void;
  onLogout: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenParentPortal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  dataSource,
  onOpenSettings,
  onLogout,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenParentPortal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-indigo-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex justify-between items-center gap-3">
        {/* Left branding */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-800/80 border border-indigo-400/30 flex items-center justify-center shadow-inner shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight leading-tight">
                E-Learning & CBT
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900 font-mono text-indigo-200 uppercase hidden sm:inline-block">
                v2026
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-indigo-200 font-medium leading-none">
              SD Negeri Harjosari Kidul 01
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center flex-wrap sm:flex-nowrap justify-end gap-2 sm:gap-3">
          {/* Action Tools Group (Settings, Bell, Parent Portal) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Data source badge / GAS Settings button - dikhususkan hanya tampil untuk akun dengan peran Admin dan Guru */}
            {(user.role === 'admin' || user.role === 'guru') && (
              <button
                onClick={onOpenSettings}
                title="Klik untuk Pengaturan Koneksi Database Cloud / Firebase"
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-indigo-800/70 hover:bg-indigo-800 border border-indigo-500/30 text-[11px] transition shadow-xs"
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    dataSource === 'FIREBASE'
                      ? 'bg-emerald-400 animate-pulse'
                      : dataSource === 'GAS'
                      ? 'bg-sky-400 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="hidden md:inline text-indigo-100 font-medium">
                  {dataSource === 'FIREBASE'
                    ? 'Firebase'
                    : dataSource === 'GAS'
                    ? 'Cloud GAS'
                    : 'Lokal'}
                </span>
                <Settings className="w-3.5 h-3.5 text-indigo-200" />
              </button>
            )}

            {/* School Notification & Announcement Bell */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                title="Papan Pengumuman & Notifikasi Sekolah"
                className="relative p-1.5 sm:p-2 rounded-lg bg-indigo-800/70 hover:bg-indigo-800 border border-indigo-500/30 text-indigo-100 transition active:scale-95 cursor-pointer shadow-xs shrink-0"
              >
                <Bell className="w-4 h-4 text-indigo-200 hover:text-white" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-indigo-700 animate-pulse">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Parent Portal Access Button (Specifically for student account) */}
            {(user.role === 'murid' || user.role === 'admin') && onOpenParentPortal && (
              <button
                type="button"
                onClick={onOpenParentPortal}
                title="Portal Orang Tua: Masukkan PIN untuk memantau rekap nilai, grafik & pembahasan belajar ananda"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-[11px] sm:text-xs shadow-md transition active:scale-95 border border-emerald-300/40 cursor-pointer shrink-0"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-100 shrink-0" />
                <span className="hidden sm:inline">Akses Orang Tua</span>
                <span className="sm:hidden">Ortu</span>
              </button>
            )}
          </div>

          {/* Divider between tools and profile */}
          <div className="h-6 w-px bg-indigo-500/40 hidden sm:block shrink-0 mx-0.5 sm:mx-1" />

          {/* User profile badge - generously spaced, preventing crowding with bell/tools */}
          <div className="flex items-center gap-2 sm:gap-2.5 pl-0.5 sm:pl-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-800/90 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-xs hidden xs:flex">
              <UserIcon className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <div className="flex items-center gap-1 min-w-0">
                <UserIcon className="w-3.5 h-3.5 text-indigo-300 shrink-0 xs:hidden" />
                <span
                  className="font-bold text-xs sm:text-sm text-white truncate max-w-[125px] xs:max-w-[170px] sm:max-w-[230px] md:max-w-[310px] leading-tight"
                  title={user.nama}
                >
                  {user.nama}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider leading-none shadow-xs ${
                    user.role === 'murid'
                      ? 'bg-amber-400 text-indigo-950'
                      : user.role === 'guru'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-indigo-900 text-yellow-300'
                  }`}
                >
                  {user.role === 'murid' ? 'Siswa' : user.role === 'guru' ? 'Guru' : 'Admin'}
                </span>
                {user.kelas && user.kelas !== '-' && (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-900/90 text-indigo-100 font-bold text-[10px] leading-none border border-indigo-400/30">
                    {user.kelas}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition shadow-sm shrink-0 ml-1 sm:ml-1.5"
            title="Keluar dari Akun"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
