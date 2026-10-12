import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Trash2,
  Users,
  Search,
  RefreshCw,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  FileSpreadsheet,
  Download,
  Upload,
  Edit2,
  KeyRound,
  Check,
  X,
  HeartHandshake,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { User, Role } from '../types';
import { api } from '../services/api';
import { ModalState } from './ConfirmModal';
import { UploadStudentExcelModal } from './UploadStudentExcelModal';
import { downloadStudentTemplate } from '../utils/excelUserImport';
import { saveWorkbookFile } from '../utils/excelExamHelper';

interface AdminViewProps {
  onShowModal: (modal: Partial<ModalState>) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onShowModal }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [classList, setClassList] = useState<string[]>(['6A', '6B', '5A', '5B', 'Semua']);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'murid' | 'guru' | 'admin'>('all');
  const [isUploadExcelOpen, setIsUploadExcelOpen] = useState(false);

  // Add form state
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('murid');
  const [kelas, setKelas] = useState('6A');
  const [nip, setNip] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<Role>('murid');
  const [editKelas, setEditKelas] = useState('6A');
  const [editNip, setEditNip] = useState('');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Reset password modal state
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('123456');
  const [isResettingPass, setIsResettingPass] = useState(false);

  // Parent PIN management modal state (Admin side)
  const [parentPinModalUser, setParentPinModalUser] = useState<User | null>(null);
  const [parentPinInput, setParentPinInput] = useState<string>('');
  const [currentParentPin, setCurrentParentPin] = useState<string | null>(null);
  const [showParentPinPlain, setShowParentPinPlain] = useState<boolean>(false);
  const [isSavingParentPin, setIsSavingParentPin] = useState<boolean>(false);

  const fetchUsersAndClasses = async () => {
    setIsLoading(true);
    try {
      const [uData, cData] = await Promise.all([api.getUsers(), api.getMasterKelas()]);
      setUsers(uData || []);
      if (Array.isArray(cData) && cData.length > 0) {
        setClassList(cData);
        setKelas(cData[0] || '6A');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndClasses();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !username.trim() || !password.trim()) {
      onShowModal({
        isOpen: true,
        title: 'Form Belum Lengkap',
        message: 'Mohon isi semua kolom pengguna termasuk password.',
        type: 'warning',
        isConfirm: false,
        okText: 'Mengerti',
      });
      return;
    }

    setIsSubmitting(true);
    const res = await api.addUser({
      nama: nama.trim(),
      username: username.trim(),
      password: password.trim(),
      role,
      kelas: role === 'murid' ? kelas.trim() : (role === 'guru' ? (kelas.trim() || '-') : '-'),
      nip: role === 'guru' ? (nip.trim() || undefined) : undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      onShowModal({
        isOpen: true,
        title: 'Berhasil',
        message: res.message || 'Pengguna baru berhasil ditambahkan.',
        type: 'success',
        isConfirm: false,
        okText: 'OK',
      });
      setNama('');
      setUsername('');
      setPassword('');
      setNip('');
      fetchUsersAndClasses();
    } else {
      onShowModal({
        isOpen: true,
        title: 'Gagal Menambah Pengguna',
        message: res.message || 'Terjadi kesalahan.',
        type: 'error',
        isConfirm: false,
        okText: 'Tutup',
      });
    }
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setEditNama(u.nama || '');
    setEditPassword(u.password || '123456');
    setEditRole(u.role || 'murid');
    setEditKelas(u.kelas || (classList[0] || '6A'));
    setEditNip(u.nip || '');
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editNama.trim()) {
      onShowModal({
        isOpen: true,
        title: 'Nama Kosong',
        message: 'Nama pengguna tidak boleh kosong.',
        type: 'warning',
      });
      return;
    }

    setIsUpdatingUser(true);
    try {
      const updated: User = {
        ...editingUser,
        nama: editNama.trim(),
        role: editRole,
        kelas: editRole === 'murid' ? editKelas : (editRole === 'guru' ? (editKelas || '-') : '-'),
        nip: editRole === 'guru' ? (editNip.trim() || undefined) : undefined,
        password: editPassword.trim() || editingUser.password || '123456',
      };

      const res = await api.updateUser(updated);
      if (res.success) {
        setEditingUser(null);
        onShowModal({
          isOpen: true,
          title: 'Berhasil Diperbarui',
          message: `Data pengguna "${updated.nama}" berhasil disimpan!`,
          type: 'success',
        });
        fetchUsersAndClasses();
      } else {
        onShowModal({
          isOpen: true,
          title: 'Gagal Update',
          message: res.message || 'Gagal menyimpan pembaruan.',
          type: 'danger',
        });
      }
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleOpenResetPassword = (u: User) => {
    setResetTargetUser(u);
    setNewPasswordVal('123456');
  };

  const handleConfirmResetPassword = async () => {
    if (!resetTargetUser) return;
    if (!newPasswordVal.trim()) {
      onShowModal({
        isOpen: true,
        title: 'Password Kosong',
        message: 'Mohon masukkan password baru.',
        type: 'warning',
      });
      return;
    }

    setIsResettingPass(true);
    try {
      const res = await api.resetUserPassword(resetTargetUser.username, newPasswordVal.trim());
      if (res.success) {
        setResetTargetUser(null);
        onShowModal({
          isOpen: true,
          title: 'Password Berhasil Direset',
          message: `Password untuk akun "${resetTargetUser.nama}" (${resetTargetUser.username}) telah berhasil diubah menjadi: "${newPasswordVal}". User sekarang dapat login dengan kata sandi baru.`,
          type: 'success',
        });
        fetchUsersAndClasses();
      } else {
        onShowModal({
          isOpen: true,
          title: 'Gagal Reset Password',
          message: res.message || 'Terjadi kesalahan.',
          type: 'danger',
        });
      }
    } finally {
      setIsResettingPass(false);
    }
  };

  const handleDeleteUser = (u: User) => {
    onShowModal({
      isOpen: true,
      title: 'Hapus Pengguna',
      message: `Apakah Anda yakin ingin menghapus akun "${u.nama}" (${u.username})? Tindakan ini tidak dapat dibatalkan.`,
      type: 'danger',
      isConfirm: true,
      okText: 'Hapus Pengguna',
      cancelText: 'Batal',
      onConfirm: async () => {
        const res = await api.deleteUser(u.username);
        if (res.success) {
          onShowModal({
            isOpen: true,
            title: 'Berhasil Dihapus',
            message: res.message || 'Pengguna berhasil dihapus.',
            type: 'success',
            isConfirm: false,
            okText: 'OK',
          });
          fetchUsersAndClasses();
        } else {
          onShowModal({
            isOpen: true,
            title: 'Gagal',
            message: res.message || 'Gagal menghapus user.',
            type: 'danger',
            isConfirm: false,
            okText: 'Tutup',
          });
        }
      },
    });
  };

  // Export all users to Excel
  const handleExportUsersExcel = () => {
    const wb = XLSX.utils.book_new();
    const headers = ['No', 'Nama Lengkap', 'NIP', 'Username', 'Password', 'Role', 'Kelas'];
    const rows = users.map((u, idx) => [
      idx + 1,
      u.nama,
      u.nip || '-',
      u.username,
      u.password || '******',
      u.role,
      u.kelas || '-',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'AKUN_PENGGUNA');

    const filename = `Data_Akun_Pengguna_${Date.now()}.xlsx`;
    saveWorkbookFile(wb, filename);
  };

  const handleOpenManageParentPin = async (u: User) => {
    setParentPinModalUser(u);
    setParentPinInput('');
    setShowParentPinPlain(false);
    const pin = await api.getParentPin(u.username);
    setCurrentParentPin(pin);
    if (pin) {
      setParentPinInput(pin);
    }
  };

  const handleSaveParentPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentPinModalUser) return;
    const cleanPin = parentPinInput.trim();
    if (!/^\d{4,6}$/.test(cleanPin)) {
      onShowModal({
        isOpen: true,
        title: 'Format PIN Tidak Sesuai',
        message: 'PIN Orang Tua harus berupa 4 sampai 6 digit angka numerik.',
        type: 'warning',
        isConfirm: false,
        okText: 'Perbaiki',
      });
      return;
    }

    setIsSavingParentPin(true);
    try {
      const res = await api.saveParentPin(parentPinModalUser.username, cleanPin);
      if (res.success) {
        setParentPinModalUser(null);
        await fetchUsersAndClasses();
        onShowModal({
          isOpen: true,
          title: 'PIN Berhasil Ditetapkan',
          message: `PIN Orang Tua untuk siswa ${parentPinModalUser.nama} berhasil disimpan: ${cleanPin}`,
          type: 'success',
          isConfirm: false,
          okText: 'Selesai',
        });
      } else {
        onShowModal({
          isOpen: true,
          title: 'Gagal Menyimpan PIN',
          message: res.message || 'Terjadi kesalahan saat menyimpan PIN.',
          type: 'error',
        });
      }
    } catch {
      onShowModal({
        isOpen: true,
        title: 'Gagal',
        message: 'Terjadi kesalahan koneksi saat menyimpan PIN.',
        type: 'error',
      });
    } finally {
      setIsSavingParentPin(false);
    }
  };

  const handleResetParentPin = (u: User) => {
    onShowModal({
      isOpen: true,
      title: 'Reset PIN Orang Tua',
      message: `Apakah Anda ingin mereset PIN Orang Tua untuk siswa ${u.nama} (${u.username}) ke PIN default '1234'?`,
      type: 'question',
      isConfirm: true,
      okText: 'Ya, Reset ke 1234',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          const res = await api.saveParentPin(u.username, '1234');
          if (res.success) {
            setParentPinModalUser(null);
            await fetchUsersAndClasses();
            onShowModal({
              isOpen: true,
              title: 'PIN Berhasil Direset',
              message: `PIN Orang Tua untuk siswa ${u.nama} telah direset ke default: 1234.`,
              type: 'success',
            });
          }
        } catch {
          onShowModal({
            isOpen: true,
            title: 'Gagal Reset',
            message: 'Terjadi kesalahan saat mereset PIN.',
            type: 'error',
          });
        }
      },
    });
  };

  const sLower = (search || '').toLowerCase();
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.nama || '').toLowerCase().includes(sLower) ||
      (u.username || '').toLowerCase().includes(sLower) ||
      (u.role || '').toLowerCase().includes(sLower) ||
      (u.kelas || '').toLowerCase().includes(sLower);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    murid: users.filter((u) => u.role === 'murid').length,
    guru: users.filter((u) => u.role === 'guru').length,
    admin: users.filter((u) => u.role === 'admin').length,
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Panel Manajemen Pengguna
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola akun Murid, Guru, Administrator, dan Manajemen PIN Orang Tua SDN Harjosari Kidul 01
          </p>
        </div>

        {/* Action Buttons for Excel */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={handleExportUsersExcel}
            type="button"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            title="Unduh semua data akun ke file Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor Excel</span>
          </button>
          <button
            onClick={downloadStudentTemplate}
            type="button"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
            title="Unduh file template Excel untuk diisi data siswa"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Format Template</span>
          </button>
          <button
            onClick={() => setIsUploadExcelOpen(true)}
            type="button"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
            title="Unggah data murid massal dari file Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Excel Murid</span>
          </button>
        </div>
      </div>

      {/* Kartu Ringkasan Pengguna (Spacious, Symmetric, Responsive 4-Card Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Akun */}
        <div
          onClick={() => setRoleFilter('all')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs flex items-center justify-between ${
            roleFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-indigo-500/30'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
          title="Klik untuk melihat semua pengguna"
        >
          <div className="space-y-0.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${
              roleFilter === 'all' ? 'text-slate-300' : 'text-slate-500'
            }`}>
              Total Pengguna
            </span>
            <span className="text-2xl sm:text-3xl font-black">{stats.total}</span>
            <span className={`text-[10px] block ${roleFilter === 'all' ? 'text-indigo-300' : 'text-slate-400'}`}>
              Semua Akun Terdaftar
            </span>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            roleFilter === 'all' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Murid */}
        <div
          onClick={() => setRoleFilter('murid')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs flex items-center justify-between ${
            roleFilter === 'murid'
              ? 'bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-500/30'
              : 'bg-white hover:bg-emerald-50/50 text-slate-800 border-slate-200'
          }`}
          title="Klik untuk filter khusus Murid (Siswa)"
        >
          <div className="space-y-0.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${
              roleFilter === 'murid' ? 'text-emerald-100' : 'text-emerald-700'
            }`}>
              Murid (Siswa)
            </span>
            <span className={`text-2xl sm:text-3xl font-black ${
              roleFilter === 'murid' ? 'text-white' : 'text-emerald-800'
            }`}>
              {stats.murid}
            </span>
            <span className={`text-[10px] block ${roleFilter === 'murid' ? 'text-emerald-200' : 'text-emerald-600'}`}>
              Tersedia Portal Ortu
            </span>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            roleFilter === 'murid' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
          }`}>
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        {/* Guru */}
        <div
          onClick={() => setRoleFilter('guru')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs flex items-center justify-between ${
            roleFilter === 'guru'
              ? 'bg-blue-700 text-white border-blue-700 ring-2 ring-blue-500/30'
              : 'bg-white hover:bg-blue-50/50 text-slate-800 border-slate-200'
          }`}
          title="Klik untuk filter khusus Guru"
        >
          <div className="space-y-0.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${
              roleFilter === 'guru' ? 'text-blue-100' : 'text-blue-700'
            }`}>
              Guru (Pengajar)
            </span>
            <span className={`text-2xl sm:text-3xl font-black ${
              roleFilter === 'guru' ? 'text-white' : 'text-blue-800'
            }`}>
              {stats.guru}
            </span>
            <span className={`text-[10px] block ${roleFilter === 'guru' ? 'text-blue-200' : 'text-blue-600'}`}>
              Pengelola Soal & Nilai
            </span>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            roleFilter === 'guru' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
          }`}>
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* Administrator */}
        <div
          onClick={() => setRoleFilter('admin')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs flex items-center justify-between ${
            roleFilter === 'admin'
              ? 'bg-purple-700 text-white border-purple-700 ring-2 ring-purple-500/30'
              : 'bg-white hover:bg-purple-50/50 text-slate-800 border-slate-200'
          }`}
          title="Klik untuk filter Administrator"
        >
          <div className="space-y-0.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${
              roleFilter === 'admin' ? 'text-purple-100' : 'text-purple-700'
            }`}>
              Administrator
            </span>
            <span className={`text-2xl sm:text-3xl font-black ${
              roleFilter === 'admin' ? 'text-white' : 'text-purple-800'
            }`}>
              {stats.admin}
            </span>
            <span className={`text-[10px] block ${roleFilter === 'admin' ? 'text-purple-200' : 'text-purple-600'}`}>
              Super Admin Sistem
            </span>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            roleFilter === 'admin' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
          }`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Tambah Pengguna */}
        <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <div className="flex items-center gap-2 font-bold text-base text-indigo-800 mb-4 pb-3 border-b border-slate-100">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <span>Tambah Pengguna Baru</span>
          </div>

          <form onSubmit={handleAddUser} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="misal: Siti Aisyah"
                required
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername((e.target.value || '').toLowerCase().replace(/\s+/g, ''))}
                  placeholder="siti123"
                  required
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="123456"
                  required
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role / Peran</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
                >
                  <option value="murid">Murid (Siswa)</option>
                  <option value="guru">Guru (Pengajar)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {role === 'murid' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas / Rombel</label>
                  <select
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
                  >
                    {classList.map((c) => (
                      <option key={c} value={c}>
                        Kelas {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {role === 'guru' && (
              <div className="space-y-3 p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  <span>Data Guru & Penandatangan Laporan</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP (Nomor Induk Pegawai)
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="misal: 198503202010011012"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Kosongkan jika Guru Honorer / belum memiliki NIP.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Guru Kelas / Penugasan Rombel
                  </label>
                  <select
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
                  >
                    <option value="-">Bukan Guru Kelas (Guru Mapel / Umum)</option>
                    <option value="Semua">Semua Kelas</option>
                    {classList
                      .filter((c) => c !== 'Semua')
                      .map((c) => (
                        <option key={c} value={c}>
                          Guru Kelas {c}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna'}
            </button>
          </form>

          {/* Tips Import Excel */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Input Banyak Siswa Sekaligus?</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Gunakan fitur <strong>Upload Excel</strong> untuk memasukkan ratusan murid
                otomatis tanpa input satu persatu.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsUploadExcelOpen(true)}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File Excel</span>
                </button>
                <button
                  type="button"
                  onClick={downloadStudentTemplate}
                  title="Unduh format template Excel"
                  className="p-2 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Daftar Pengguna */}
        <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-800">Daftar Akun Terdaftar</h3>
              <p className="text-xs text-slate-500">
                Menampilkan data {filteredUsers.length} pengguna terdaftar
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, kelas, peran..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsUploadExcelOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition"
                title="Unggah file Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Impor Excel</span>
              </button>
              <button
                onClick={fetchUsersAndClasses}
                disabled={isLoading}
                title="Muat Ulang"
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Symmetrical Role Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4 p-1.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                roleFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <span>Semua Akun</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                roleFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
              }`}>
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setRoleFilter('murid')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                roleFilter === 'murid'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Murid</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                roleFilter === 'murid' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {stats.murid}
              </span>
            </button>

            <button
              onClick={() => setRoleFilter('guru')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                roleFilter === 'guru'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Guru</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                roleFilter === 'guru' ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {stats.guru}
              </span>
            </button>

            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                roleFilter === 'admin'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-purple-50 text-purple-800 border border-purple-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                roleFilter === 'admin' ? 'bg-white/25 text-white' : 'bg-purple-100 text-purple-800'
              }`}>
                {stats.admin}
              </span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-3">Nama Pengguna</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Kelas / Sesi</th>
                  <th className="p-3 text-center">PIN Orang Tua</th>
                  <th className="p-3 text-center">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      Memuat data pengguna...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      Tidak ada pengguna ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const roleBadge =
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : u.role === 'guru'
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-emerald-100 text-emerald-700 border-emerald-200';

                    const roleIcon =
                      u.role === 'admin' ? (
                        <ShieldAlert className="w-3 h-3 inline mr-1" />
                      ) : u.role === 'guru' ? (
                        <Briefcase className="w-3 h-3 inline mr-1" />
                      ) : (
                        <GraduationCap className="w-3 h-3 inline mr-1" />
                      );

                    return (
                      <tr key={u.username} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-semibold text-slate-800">
                          <div>{u.nama}</div>
                          {u.role === 'guru' && u.nip && (
                            <div className="text-[10.5px] font-mono text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 rounded w-fit mt-1 font-normal">
                              NIP. {u.nip}
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-600">{u.username}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase border inline-flex items-center ${roleBadge}`}
                          >
                            {roleIcon}
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-600">{u.kelas || '-'}</td>

                        {/* Indikator Status PIN Orang Tua pada Tabel Murid */}
                        <td className="p-3 text-center">
                          {u.role === 'murid' ? (
                            (() => {
                              const hasPin = Boolean(
                                u.parentPin ||
                                localStorage.getItem(`parent_pin_${(u.username || '').toLowerCase()}`)
                              );
                              return hasPin ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenManageParentPin(u)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                                  title="PIN Orang Tua aktif. Klik untuk kelola / ubah / reset PIN"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>PIN Terpasang</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenManageParentPin(u)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 transition cursor-pointer"
                                  title="Belum ada PIN Orang Tua. Klik untuk menetapkan PIN awal"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Belum Set PIN</span>
                                </button>
                              );
                            })()
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
                              title="Edit Data Pengguna"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenResetPassword(u)}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition"
                              title="Reset Password Akun"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            {u.role === 'murid' && (
                              <button
                                onClick={() => handleOpenManageParentPin(u)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition"
                                title="Kelola / Tetapkan / Reset PIN Orang Tua"
                              >
                                <HeartHandshake className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-800">Edit Data Pengguna</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Username (ID Akun)</label>
                <input
                  type="text"
                  value={editingUser.username}
                  disabled
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-indigo-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Peran (Role)</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as Role)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-indigo-600"
                  >
                    <option value="murid">Murid</option>
                    <option value="guru">Guru</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {editRole === 'murid' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Kelas</label>
                    <select
                      value={editKelas}
                      onChange={(e) => setEditKelas(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-indigo-600"
                    >
                      {classList.map((c) => (
                        <option key={c} value={c}>
                          Kelas {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {editRole === 'guru' && (
                <div className="space-y-3 p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    <span>Data Guru & Penandatangan Laporan</span>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      NIP (Nomor Induk Pegawai)
                    </label>
                    <input
                      type="text"
                      value={editNip}
                      onChange={(e) => setEditNip(e.target.value)}
                      placeholder="misal: 198503202010011012"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono focus:outline-indigo-600"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Kosongkan jika Guru Honorer / tidak ada NIP.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Guru Kelas / Penugasan Rombel
                    </label>
                    <select
                      value={editKelas}
                      onChange={(e) => setEditKelas(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-indigo-600"
                    >
                      <option value="-">Bukan Guru Kelas (Guru Mapel / Umum)</option>
                      <option value="Semua">Semua Kelas</option>
                      {classList
                        .filter((c) => c !== 'Semua')
                        .map((c) => (
                          <option key={c} value={c}>
                            Guru Kelas {c}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono focus:outline-indigo-600"
                  placeholder="Biarkan atau isi password baru"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingUser}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {isUpdatingUser ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESET PASSWORD */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800">Reset Password User</h3>
                <p className="text-xs text-slate-500">
                  {resetTargetUser.nama} ({resetTargetUser.username})
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Password Baru:
              </label>
              <input
                type="text"
                value={newPasswordVal}
                onChange={(e) => setNewPasswordVal(e.target.value)}
                placeholder="123456"
                className="w-full text-sm font-mono p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-600"
                autoFocus
              />
              <p className="text-[11px] text-slate-400">
                Password default umum adalah <strong>123456</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetTargetUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                disabled={isResettingPass}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                {isResettingPass ? 'Mereset...' : 'Simpan Password Baru'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MANAJEMEN PIN ORANG TUA (SISI ADMIN) */}
      {parentPinModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-emerald-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                    Manajemen PIN Orang Tua
                  </h3>
                  <p className="text-xs text-slate-500">
                    Siswa: <strong className="text-slate-800">{parentPinModalUser.nama}</strong> ({parentPinModalUser.kelas})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setParentPinModalUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current PIN Status Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Status PIN Saat Ini:</span>
                {currentParentPin ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>PIN Terpasang</span>
                  </span>
                ) : (
                  <span className="font-bold text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded-full">
                    Belum Diatur
                  </span>
                )}
              </div>

              {currentParentPin && (
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-slate-700">
                  <span className="font-medium">Kode PIN Tersimpan:</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-sm bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    <span>{showParentPinPlain ? currentParentPin : '••••••'}</span>
                    <button
                      type="button"
                      onClick={() => setShowParentPinPlain(!showParentPinPlain)}
                      className="text-slate-400 hover:text-slate-700 transition"
                      title={showParentPinPlain ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                    >
                      {showParentPinPlain ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Form Set / Edit PIN Manual */}
            <form onSubmit={handleSaveParentPin} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tetapkan PIN 4–6 Digit Baru
                </label>
                <div className="relative">
                  <input
                    type={showParentPinPlain ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={parentPinInput}
                    onChange={(e) => setParentPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Ketik 4-6 digit angka (misal: 1234)"
                    className="w-full text-center font-mono text-base font-bold tracking-widest p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowParentPinPlain(!showParentPinPlain)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showParentPinPlain ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Template Shortcuts */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 font-semibold py-1">Opsi Cepat:</span>
                <button
                  type="button"
                  onClick={() => {
                    setParentPinInput('1234');
                    setShowParentPinPlain(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition active:scale-95 cursor-pointer"
                >
                  Set 1234
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setParentPinInput('123456');
                    setShowParentPinPlain(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition active:scale-95 cursor-pointer"
                >
                  Set 123456
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const rand = Math.floor(100000 + Math.random() * 900000).toString();
                    setParentPinInput(rand);
                    setShowParentPinPlain(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Acak 6 Digit</span>
                </button>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isSavingParentPin || parentPinInput.length < 4}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSavingParentPin ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan & Tetapkan PIN</span>
                </button>

                {/* Reset PIN Button */}
                <button
                  type="button"
                  onClick={() => handleResetParentPin(parentPinModalUser)}
                  className="w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition border border-amber-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reset PIN Orang Tua ke Default (1234)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UploadStudentExcelModal
        isOpen={isUploadExcelOpen}
        onClose={() => setIsUploadExcelOpen(false)}
        onSuccess={() => fetchUsersAndClasses()}
        onShowModal={onShowModal}
      />
    </div>
  );
};
