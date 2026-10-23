import React, { useState, useEffect } from 'react';
import {
  School,
  Save,
  Shield,
  KeyRound,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building,
  UserCheck,
  Calendar,
  Percent,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import { SchoolProfile } from '../../types';
import { api, DEFAULT_SCHOOL_PROFILE } from '../../services/api';

interface AdminSchoolSettingsProps {
  onShowModal: (modal: {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
    isConfirm?: boolean;
    onConfirm?: () => void;
  }) => void;
}

export const AdminSchoolSettings: React.FC<AdminSchoolSettingsProps> = ({ onShowModal }) => {
  const [profile, setSchoolProfile] = useState<SchoolProfile>(DEFAULT_SCHOOL_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const p = await api.getSchoolProfile();
        if (p) setSchoolProfile(p);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (field: keyof SchoolProfile, val: unknown) => {
    setSchoolProfile((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.namaSekolah.trim()) {
      onShowModal({
        isOpen: true,
        title: 'Nama Sekolah Kosong',
        message: 'Mohon isi nama resmi sekolah.',
        type: 'warning',
      });
      return;
    }

    setIsSaving(true);
    try {
      await api.saveSchoolProfile(profile);
      onShowModal({
        isOpen: true,
        title: 'Pengaturan Disimpan',
        message: 'Identitas sekolah dan pengaturan keamanan berhasil diperbarui!',
        type: 'success',
      });
    } catch {
      onShowModal({
        isOpen: true,
        title: 'Gagal Menyimpan',
        message: 'Terjadi kesalahan saat menyimpan pengaturan.',
        type: 'danger',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-medium">
        Memuat pengaturan sekolah...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800">
              Identitas Sekolah & Pengaturan Sistem
            </h3>
            <p className="text-xs text-slate-500">
              Data kop surat, laporan kelulusan, dan keamanan akun administrator
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BAGIAN 1: IDENTITAS RESMI SEKOLAH */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-indigo-600" />
            <h4 className="font-extrabold text-sm text-slate-800">Profil & Kop Dokumen Sekolah</h4>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Nama Resmi Sekolah <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={profile.namaSekolah}
              onChange={(e) => handleChange('namaSekolah', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-indigo-600"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">NPSN</label>
              <input
                type="text"
                value={profile.npsn}
                onChange={(e) => handleChange('npsn', e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-indigo-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Standar KKM Sekolah</label>
              <div className="relative">
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={profile.kkmDefault}
                  onChange={(e) => handleChange('kkmDefault', Number(e.target.value))}
                  className="w-full text-xs p-2.5 pr-8 rounded-xl border border-slate-300 bg-white font-bold focus:outline-indigo-600"
                />
                <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Lengkap Sekolah</label>
            <textarea
              value={profile.alamat}
              onChange={(e) => handleChange('alamat', e.target.value)}
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={profile.kepalaSekolah}
                onChange={(e) => handleChange('kepalaSekolah', e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-indigo-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={profile.nipKepalaSekolah}
                onChange={(e) => handleChange('nipKepalaSekolah', e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Tahun Ajaran</label>
              <input
                type="text"
                value={profile.tahunAjaran}
                onChange={(e) => handleChange('tahunAjaran', e.target.value)}
                placeholder="2025/2026"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-indigo-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Semester</label>
              <select
                value={profile.semester}
                onChange={(e) => handleChange('semester', e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-indigo-600"
              >
                <option value="Ganjil">Ganjil (Semester 1)</option>
                <option value="Genap">Genap (Semester 2)</option>
              </select>
            </div>
          </div>
        </div>

        {/* BAGIAN 2: KEAMANAN & SESI APLIKASI */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h4 className="font-extrabold text-sm text-slate-800">Keamanan, Sesi & Pengawasan Anti-Contek CBT</h4>
            </div>

            {/* Poin Penalti Pelanggaran CBT */}
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Poin Penalti Pelanggaran Anti-Contek CBT
                </span>
                <span className="text-xs font-black text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                  {profile.poinPenaltiPelanggaran ?? 5} Poin / Insiden
                </span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Jumlah pengurangan nilai otomatis untuk setiap insiden siswa berpindah tab atau keluar layar (maksimal 3x kesempatan sebelum ujian otomatis dikunci).
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={1}
                  value={profile.poinPenaltiPelanggaran ?? 5}
                  onChange={(e) => handleChange('poinPenaltiPelanggaran', Math.max(0, Number(e.target.value)))}
                  className="w-24 text-center text-sm font-black p-2 rounded-xl border border-rose-300 bg-white text-rose-700 focus:outline-rose-600 shadow-sm"
                />
                <span className="text-xs font-semibold text-rose-800">
                  Poin per pelanggaran (Default: 5 Poin)
                </span>
              </div>
            </div>

            {/* Session Timeout */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Batas Waktu Idle (Session Timeout)
                </span>
                <span className="text-xs font-black text-indigo-700">
                  {profile.sessionTimeoutMinutes || 30} Menit
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Jika pengguna tidak melakukan aktivitas mouse/layar selama waktu ini, sesi akan
                otomatis ditutup demi keamanan.
              </p>
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={profile.sessionTimeoutMinutes || 30}
                onChange={(e) => handleChange('sessionTimeoutMinutes', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>10 Menit</span>
                <span>30 Menit (Ideal)</span>
                <span>60 Menit</span>
              </div>
            </div>

            {/* MFA / OTP for Admin */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Verifikasi 2 Langkah (OTP / PIN Admin)</h5>
                    <p className="text-[11px] text-slate-500">
                      Wajibkan 6 digit kode PIN khusus saat akun Admin login
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.enableMFAAdmin || false}
                    onChange={(e) => handleChange('enableMFAAdmin', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {profile.enableMFAAdmin && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Kode PIN / OTP Master Admin (6 Angka):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={6}
                      value={profile.adminOTPSecret || '240101'}
                      onChange={(e) => handleChange('adminOTPSecret', e.target.value.replace(/\D/g, ''))}
                      placeholder="240101"
                      className="w-40 text-sm font-mono font-bold tracking-widest p-2.5 rounded-xl border border-indigo-300 bg-white focus:outline-indigo-600 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-sm"
                      title={showPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    PIN default: <strong className="font-mono text-indigo-700">240101</strong>. Setiap kali akun Admin login, sistem akan mewajibkan 6 digit PIN ini sebelum masuk ke Dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Perubahan identitas sekolah otomatis dicantumkan pada cetak lembar soal CBT, berita
              acara ujian, serta lembar rekapan nilai siswa.
            </span>
          </div>
        </div>
      </div>
    </form>
  );
};
