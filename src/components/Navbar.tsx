import React from 'react';
import { GraduationCap, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { DataSource } from '../services/api';

interface NavbarProps {
  user: User;
  dataSource: DataSource;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  dataSource,
  onOpenSettings,
  onLogout,
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
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Data source badge / GAS Settings button - dikhususkan hanya tampil untuk akun dengan peran Admin dan Guru */}
          {(user.role === 'admin' || user.role === 'guru') && (
            <button
              onClick={onOpenSettings}
              title="Klik untuk Pengaturan Koneksi Database Cloud / Firebase"
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-indigo-800/60 hover:bg-indigo-800 border border-indigo-500/30 text-[11px] transition"
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
                  ? 'Firebase Cloud'
                  : dataSource === 'GAS'
                  ? 'Cloud GAS'
                  : 'Penyimpanan Lokal'}
              </span>
              <Settings className="w-3.5 h-3.5 text-indigo-200" />
            </button>
          )}

          {/* User badge - always visible so user name is clearly seen */}
          <div className="flex flex-col items-end text-right min-w-0 max-w-[110px] xs:max-w-[150px] sm:max-w-[200px]">
            <div className="flex items-center gap-1 min-w-0">
              <UserIcon className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm text-white truncate" title={user.nama}>
                {user.nama}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span className="px-1.5 py-0.2 rounded bg-indigo-900 text-yellow-300 font-bold uppercase tracking-wider">
                {user.role === 'murid' ? 'Siswa' : user.role}
              </span>
              {user.kelas && user.kelas !== '-' && (
                <span className="px-1.5 py-0.2 rounded bg-indigo-800 text-indigo-200 font-semibold">
                  {user.kelas}
                </span>
              )}
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
