import React, { useState } from 'react';
import { GraduationCap, Lock, User, Eye, EyeOff, Settings, ArrowRight } from 'lucide-react';
import { api, DataSource } from '../services/api';
import { User as UserType } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
  dataSource: DataSource;
  onOpenSettings: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  dataSource,
  onOpenSettings,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Username dan Password wajib diisi.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await api.loginUser(username.trim(), password.trim());
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Username atau Password salah!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage('Terjadi kendala koneksi: ' + msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 p-4 sm:p-6 text-slate-800">
      {/* Top status bar */}
      <div className="max-w-md w-full mx-auto flex justify-between items-center py-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-slate-700 font-bold text-xs sm:text-sm tracking-wide">
            SDN Harjosari Kidul 01
          </span>
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold border border-slate-200 shadow-2xs transition"
          title="Pengaturan Koneksi Database Cloud (Firebase / GAS)"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              dataSource === 'FIREBASE'
                ? 'bg-emerald-500'
                : dataSource === 'GAS'
                ? 'bg-sky-500'
                : 'bg-amber-500'
            }`}
          />
          <span>
            {dataSource === 'FIREBASE'
              ? 'Firebase Cloud'
              : dataSource === 'GAS'
              ? 'Cloud GAS'
              : 'Mode Lokal'}
          </span>
          <Settings className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Main card matching the provided reference */}
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-100 my-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50/90 border border-indigo-100/80 flex items-center justify-center text-indigo-600 mx-auto mb-4 shadow-xs">
            <GraduationCap className="w-9 h-9 text-indigo-600 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            E-Learning & CBT
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
            SD Negeri Harjosari Kidul 01
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              Username Pengguna
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 sm:top-4" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: guru / arsyad / admin"
                required
                autoComplete="username"
                className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition font-medium text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 sm:top-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition font-medium text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 sm:top-4 text-slate-400 hover:text-slate-600 p-0.5"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 animate-in fade-in">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-md shadow-indigo-200 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <span>Memproses Masuk...</span>
            ) : (
              <>
                <span>Masuk ke Akun</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>

          {/* Developer copyright directly below the button */}
          <p className="text-center text-xs text-slate-400 font-medium pt-3 select-none tracking-wide">
            © 2026 Mohamad Wildan Pramadika, S.Pd.
          </p>
        </form>
      </div>
    </div>
  );
};
