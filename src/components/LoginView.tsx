import React, { useState } from 'react';
import { GraduationCap, Lock, User, Eye, EyeOff, Sparkles, Settings, ArrowRight } from 'lucide-react';
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

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-4 sm:p-6 text-slate-800">
      {/* Top status bar */}
      <div className="max-w-md w-full mx-auto flex justify-between items-center py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-yellow-300">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-white font-bold text-xs sm:text-sm tracking-wide">
            SDN Harjosari Kidul 01
          </span>
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium border border-white/20 transition"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              dataSource === 'GAS' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span>{dataSource === 'GAS' ? 'Cloud GAS' : 'Mode Lokal'}</span>
          <Settings className="w-3 h-3 text-indigo-200" />
        </button>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 my-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-3 shadow-inner">
            <GraduationCap className="w-9 h-9 text-indigo-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            E-Learning & CBT
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            SD Negeri Harjosari Kidul 01
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Username Pengguna
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: guru / arsyad / admin"
                required
                autoComplete="username"
                className="w-full pl-10 pr-3 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
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
            className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-indigo-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Memproses Masuk...</span>
            ) : (
              <>
                <span>Masuk ke Akun</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Accounts */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <span className="block text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider mb-2.5">
            Pilihan Cepat Akun Demo (Klik untuk Isi Otomatis)
          </span>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('arsyad', '12345')}
              className="py-2 px-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition text-center"
            >
              Murid
              <span className="block text-[10px] font-normal text-emerald-600">arsyad</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('guru', 'guru123')}
              className="py-2 px-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-bold border border-indigo-200 transition text-center"
            >
              Guru
              <span className="block text-[10px] font-normal text-indigo-600">guru</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="py-2 px-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold border border-purple-200 transition text-center"
            >
              Admin
              <span className="block text-[10px] font-normal text-purple-600">admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <footer className="text-center py-4 text-xs text-indigo-200 font-medium tracking-wide">
        © 2026 Mohamad Wildan Pramadika, S.Pd. • SD Negeri Harjosari Kidul 01
      </footer>
    </div>
  );
};
