import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  Settings,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { api, DataSource } from '../services/api';
import { User as UserType, SchoolProfile } from '../types';

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
  // Step state: 'credentials' (step 1) or '2fa' (step 2 for Admin)
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [pendingAdminUser, setPendingAdminUser] = useState<UserType | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);

  // Step 1: Credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 2: 2FA PIN (6 Digits)
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load school profile on mount for MFA configuration
  useEffect(() => {
    let isMounted = true;
    api.getSchoolProfile().then((profile) => {
      if (isMounted && profile) {
        setSchoolProfile(profile);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Submit Step 1: Username & Password
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
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
        // Fetch fresh profile to ensure up-to-date MFA settings
        let profile = schoolProfile;
        try {
          const fresh = await api.getSchoolProfile();
          if (fresh) {
            profile = fresh;
            setSchoolProfile(fresh);
          }
        } catch {}

        // Check whether 2FA is active for admin
        const is2FAActive = profile?.enableMFAAdmin ?? true;

        if (res.user.role === 'admin' && is2FAActive) {
          // Transition to Step 2: 2FA PIN
          setPendingAdminUser(res.user);
          setStep('2fa');
          setPinDigits(['', '', '', '', '', '']);
          setPinError('');
          setTimeout(() => {
            inputRefs.current[0]?.focus();
          }, 150);
          return;
        }

        // Murid, Guru, or Admin with MFA explicitly disabled
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

  // Step 2: PIN Validation & Submission
  const validateAndSubmitPin = (enteredPin: string) => {
    if (!pendingAdminUser) return;

    if (enteredPin.length < 6) {
      setPinError('Masukkan lengkap 6 digit PIN Verifikasi Administrator.');
      return;
    }

    setIsVerifyingPin(true);
    setPinError('');

    setTimeout(() => {
      const configuredSecret = (schoolProfile?.adminOTPSecret || '240101').trim();
      // Allow the configured secret or the master fallback PIN '240101'
      const isMatch = enteredPin === configuredSecret || enteredPin === '240101';

      if (isMatch) {
        onLoginSuccess(pendingAdminUser);
      } else {
        setIsVerifyingPin(false);
        setPinError('Kode PIN Keamanan tidak sesuai. Silakan periksa kembali kode PIN Anda.');
        setPinDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }, 200);
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    validateAndSubmitPin(pinDigits.join('').trim());
  };

  const handleDigitChange = (index: number, val: string) => {
    setPinError('');
    const cleaned = val.replace(/\D/g, '');

    // Handle paste multiple numbers into one box
    if (cleaned.length > 1) {
      const updated = [...pinDigits];
      for (let i = 0; i < cleaned.length && index + i < 6; i++) {
        updated[index + i] = cleaned[i];
      }
      setPinDigits(updated);
      const nextIdx = Math.min(index + cleaned.length, 5);
      inputRefs.current[nextIdx]?.focus();

      const completeStr = updated.join('').trim();
      if (completeStr.length === 6) {
        setTimeout(() => validateAndSubmitPin(completeStr), 150);
      }
      return;
    }

    const updated = [...pinDigits];
    updated[index] = cleaned;
    setPinDigits(updated);

    if (cleaned) {
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // 6th digit entered, auto submit
        const fullPin = [...updated].join('').trim();
        if (fullPin.length === 6) {
          setTimeout(() => validateAndSubmitPin(fullPin), 150);
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!pinDigits[index] && index > 0) {
        const updated = [...pinDigits];
        updated[index - 1] = '';
        setPinDigits(updated);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setPinDigits(updated);
    setPinError('');

    const targetIdx = Math.min(pasted.length, 5);
    inputRefs.current[targetIdx]?.focus();

    if (pasted.length === 6) {
      setTimeout(() => validateAndSubmitPin(pasted), 150);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setPendingAdminUser(null);
    setPinDigits(['', '', '', '', '', '']);
    setPinError('');
    setErrorMessage('');
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
            {schoolProfile?.namaSekolah || 'SDN Harjosari Kidul 01'}
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

      {/* STEP 1: CREDENTIALS VIEW */}
      {step === 'credentials' && (
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50/90 border border-indigo-100/80 flex items-center justify-center text-indigo-600 mx-auto mb-4 shadow-xs">
              <GraduationCap className="w-9 h-9 text-indigo-600 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              E-Learning & CBT
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
              {schoolProfile?.namaSekolah || 'SD Negeri Harjosari Kidul 01'}
            </p>
          </div>

          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
                  placeholder="misal: admin / guru / arsyad"
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
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-md shadow-indigo-200 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <span>Memverifikasi Akun...</span>
              ) : (
                <>
                  <span>Masuk ke Akun</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>

            {/* Developer copyright */}
            <p className="text-center text-xs text-slate-400 font-medium pt-3 select-none tracking-wide">
              © 2026 Mohamad Wildan Pramadika, S.Pd.
            </p>
          </form>
        </div>
      )}

      {/* STEP 2: 2-STEP VERIFICATION (OTP / PIN ADMIN) */}
      {step === '2fa' && pendingAdminUser && (
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-3 shadow-xs">
              <KeyRound className="w-8 h-8 text-amber-600 stroke-[2.2]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold tracking-wide mb-2 uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Verifikasi 2 Langkah (2FA)</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Otentikasi PIN Admin
            </h2>

            <p className="text-xs text-slate-500 font-medium mt-1">
              Masukkan 6 digit kode PIN Keamanan untuk mengonfirmasi akses Administrator.
            </p>
          </div>

          {/* User badge preview */}
          <div className="mb-5 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {pendingAdminUser.nama ? pendingAdminUser.nama.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {pendingAdminUser.nama}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  @{pendingAdminUser.username}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
              Admin
            </span>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700">
                  Kode PIN Keamanan (6 Digit)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPin ? 'Sembunyikan' : 'Tampilkan Angka'}</span>
                </button>
              </div>

              {/* 6 Digit Input Boxes */}
              <div className="grid grid-cols-6 gap-2 sm:gap-2.5" onPaste={handlePaste}>
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={idx === 0 ? 6 : 1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-full h-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-black rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-slate-50/50 text-slate-800 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:outline-none transition shadow-2xs"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {pinError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-start gap-2 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{pinError}</span>
              </div>
            )}

            {/* Security notice (PIN hidden to prevent data leakage) */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Masukkan 6 digit kode PIN keamanan yang sah untuk mengonfirmasi akses Administrator.
              </span>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isVerifyingPin || pinDigits.join('').trim().length < 6}
              className="w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-md shadow-indigo-200 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isVerifyingPin ? (
                <span>Memverifikasi PIN...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Verifikasi & Masuk Dashboard</span>
                </>
              )}
            </button>

            {/* Back button */}
            <button
              type="button"
              onClick={handleBackToCredentials}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali / Masuk dengan Akun Lain</span>
            </button>

            {/* Developer copyright */}
            <p className="text-center text-xs text-slate-400 font-medium pt-2 select-none tracking-wide">
              © 2026 Mohamad Wildan Pramadika, S.Pd.
            </p>
          </form>
        </div>
      )}
    </div>
  );
};
