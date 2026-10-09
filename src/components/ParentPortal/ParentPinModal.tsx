import React, { useState, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  X,
  Sparkles,
  RefreshCw,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';
import { User } from '../../types';
import { api } from '../../services/api';

interface ParentPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: User;
  onSuccess: () => void;
}

type Mode = 'enter' | 'create_first' | 'reset';

export const ParentPinModal: React.FC<ParentPinModalProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess,
}) => {
  const [mode, setMode] = useState<Mode>('enter');
  const [existingPin, setExistingPin] = useState<string | null>(null);
  const [isLoadingCheck, setIsLoadingCheck] = useState<boolean>(true);

  // Enter mode state
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Create / Reset mode state
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [studentPasswordVerify, setStudentPasswordVerify] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Check if PIN already exists for this student
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setSuccessMsg('');
    setPinInput('');
    setNewPin('');
    setConfirmPin('');
    setStudentPasswordVerify('');
    setIsLoadingCheck(true);

    api.getParentPin(student.username)
      .then((pin) => {
        setExistingPin(pin);
        if (pin && pin.trim().length >= 4) {
          setMode('enter');
        } else {
          setMode('create_first');
        }
      })
      .catch(() => {
        setMode('create_first');
      })
      .finally(() => {
        setIsLoadingCheck(false);
      });
  }, [isOpen, student.username]);

  if (!isOpen) return null;

  // Handle Enter PIN Verification
  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const trimmed = pinInput.trim();
    if (trimmed.length < 4 || trimmed.length > 6) {
      setErrorMsg('PIN harus terdiri dari 4 sampai 6 digit angka.');
      return;
    }

    if (!existingPin || trimmed !== existingPin.trim()) {
      setErrorMsg('PIN Orang Tua yang Anda masukkan tidak sesuai.');
      return;
    }

    // Success!
    onSuccess();
  };

  // Handle Keypad button press
  const handleKeypadPress = (val: string) => {
    if (pinInput.length < 6) {
      setPinInput((prev) => prev + val);
      setErrorMsg('');
    }
  };

  const handleKeypadBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleKeypadClear = () => {
    setPinInput('');
    setErrorMsg('');
  };

  // Handle Save New PIN (First Time Setup or Reset)
  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'reset') {
      // Verify student's password
      const enteredPass = studentPasswordVerify.trim();
      const actualPass = (student.password || '123456').trim();
      if (!enteredPass || enteredPass !== actualPass) {
        setErrorMsg('Kata sandi akun siswa tidak sesuai. Hubungi guru jika lupa kata sandi.');
        return;
      }
    }

    const cleanNew = newPin.trim();
    const cleanConfirm = confirmPin.trim();

    if (!/^\d{4,6}$/.test(cleanNew)) {
      setErrorMsg('PIN baru harus berupa 4 sampai 6 digit angka numerik.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setErrorMsg('Konfirmasi PIN tidak cocok dengan PIN baru.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.saveParentPin(student.username, cleanNew);
      if (res.success) {
        setExistingPin(cleanNew);
        setSuccessMsg('PIN Orang Tua berhasil disimpan!');
        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        setErrorMsg(res.message || 'Gagal menyimpan PIN.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan koneksi saat menyimpan PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 relative overflow-hidden space-y-5">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="flex items-center gap-3 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                PORTAL ORANG TUA
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              {mode === 'enter' && 'Verifikasi PIN Orang Tua'}
              {mode === 'create_first' && 'Aktivasi PIN Orang Tua'}
              {mode === 'reset' && 'Perbarui PIN Orang Tua'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ananda: <strong className="text-slate-700">{student.nama}</strong> ({student.kelas})
            </p>
          </div>
        </div>

        {isLoadingCheck ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="text-xs">Memeriksa status keamanan akun...</p>
          </div>
        ) : (
          <>
            {/* SUCCESS BANNER */}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ERROR BANNER */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-xs font-semibold animate-in shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ========================================================== */}
            {/* MODE 1: ENTER PIN                                          */}
            {/* ========================================================== */}
            {mode === 'enter' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Masukkan <strong>4–6 digit PIN rahasia</strong> yang telah dibuat sebelumnya untuk membuka data hasil evaluasi belajar dan pendampingan ananda.
                </p>

                <form onSubmit={handleVerifyPin} className="space-y-4">
                  {/* Masked / Unmasked Input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-5 h-5 text-emerald-600" />
                    </div>
                    <input
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      value={pinInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setPinInput(val);
                        setErrorMsg('');
                      }}
                      placeholder="Ketik 4-6 Digit PIN"
                      className="w-full pl-11 pr-11 py-3 text-center font-mono text-xl tracking-[0.35em] font-black rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                      title={showPin ? 'Sembunyikan' : 'Tampilkan PIN'}
                    >
                      {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Visual Pin Indicator Dots */}
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          pinInput.length > i
                            ? 'bg-emerald-600 scale-110'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Mini On-Screen Numeric Keypad for Convenience on Mobile / Tablet */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadPress(digit)}
                        className="py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 font-black text-base text-slate-800 transition border border-slate-200 shadow-2xs"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleKeypadClear}
                      className="py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-xs font-bold text-slate-500 transition border border-slate-200"
                    >
                      Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('0')}
                      className="py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 font-black text-base text-slate-800 transition border border-slate-200 shadow-2xs"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      className="py-2.5 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-xs font-bold text-slate-500 transition border border-slate-200"
                    >
                      ←
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={pinInput.length < 4}
                      className="flex-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-md active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Buka Portal Orang Tua</span>
                    </button>
                  </div>

                  {/* Reset PIN link */}
                  <div className="text-center pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('reset');
                        setErrorMsg('');
                        setNewPin('');
                        setConfirmPin('');
                        setStudentPasswordVerify('');
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2"
                    >
                      Lupa atau Ingin Mengubah PIN Orang Tua?
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ========================================================== */}
            {/* MODE 2: CREATE FIRST PIN                                   */}
            {/* ========================================================== */}
            {mode === 'create_first' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Selamat datang di <strong>Portal Pendampingan Belajar Orang Tua</strong>! Akun ananda belum memiliki PIN pengaman. Silakan buat <strong>4–6 digit angka</strong> yang mudah diingat oleh Ayah/Ibu.
                  </p>
                </div>

                <form onSubmit={handleSaveNewPin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Buat PIN Baru (4–6 Digit Angka)
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      required
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Contoh: 123456"
                      className="w-full p-2.5 text-center font-mono text-lg tracking-widest font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ketik Ulang PIN (Konfirmasi)
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Masukkan kembali PIN"
                      className="w-full p-2.5 text-center font-mono text-lg tracking-widest font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    *PIN ini akan digunakan setiap kali Ayah/Ibu membuka rapor dan rekap nilai CBT di perangkat ini.
                  </p>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || newPin.length < 4 || newPin !== confirmPin}
                      className="flex-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-md active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan PIN...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Aktifkan PIN & Masuk</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ========================================================== */}
            {/* MODE 3: RESET / UPDATE PIN                                 */}
            {/* ========================================================== */}
            {mode === 'reset' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Untuk alasan verifikasi keamanan, masukkan kata sandi akun login ananda, lalu buat PIN Orang Tua yang baru.
                </p>

                <form onSubmit={handleSaveNewPin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kata Sandi Akun Siswa ({student.username})
                    </label>
                    <input
                      type="password"
                      required
                      value={studentPasswordVerify}
                      onChange={(e) => setStudentPasswordVerify(e.target.value)}
                      placeholder="Masukkan kata sandi akun siswa"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PIN Baru Orang Tua (4–6 Digit)
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Ketik 4-6 digit angka baru"
                      className="w-full p-2.5 text-center font-mono text-base tracking-widest font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ketik Ulang PIN Baru
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Konfirmasi PIN baru"
                      className="w-full p-2.5 text-center font-mono text-base tracking-widest font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode(existingPin ? 'enter' : 'create_first');
                        setErrorMsg('');
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || newPin.length < 4 || newPin !== confirmPin}
                      className="flex-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-md active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Simpan PIN Baru</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
