import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Users, Search, RefreshCw, ShieldAlert, GraduationCap, Briefcase } from 'lucide-react';
import { User, Role } from '../types';
import { api } from '../services/api';
import { ModalState } from './ConfirmModal';

interface AdminViewProps {
  onShowModal: (modal: Partial<ModalState>) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onShowModal }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Add form state
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('murid');
  const [kelas, setKelas] = useState('6A');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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
      kelas: role === 'murid' ? kelas.trim() : '-',
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
      setKelas('6A');
      fetchUsers();
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
          fetchUsers();
        } else {
          onShowModal({
            isOpen: true,
            title: 'Gagal',
            message: res.message || 'Gagal menghapus user.',
            type: 'error',
            isConfirm: false,
            okText: 'Tutup',
          });
        }
      },
    });
  };

  const sLower = (search || '').toLowerCase();
  const filteredUsers = users.filter(
    (u) =>
      (u.nama || '').toLowerCase().includes(sLower) ||
      (u.username || '').toLowerCase().includes(sLower) ||
      (u.role || '').toLowerCase().includes(sLower) ||
      (u.kelas || '').toLowerCase().includes(sLower)
  );

  const stats = {
    total: users.length,
    murid: users.filter((u) => u.role === 'murid').length,
    guru: users.filter((u) => u.role === 'guru').length,
    admin: users.filter((u) => u.role === 'admin').length,
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Panel Manajemen Pengguna
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola akun Murid, Guru, dan Administrator SDN Harjosari Kidul 01
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 font-bold text-slate-700">
            Total: {stats.total}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold">
            Murid: {stats.murid}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold">
            Guru: {stats.guru}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-bold">
            Admin: {stats.admin}
          </span>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  required
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Peran (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="murid">Murid (Siswa)</option>
                  <option value="guru">Guru (Pengajar)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kelas / Sesi</label>
                <input
                  type="text"
                  value={role === 'murid' ? kelas : '-'}
                  disabled={role !== 'murid'}
                  onChange={(e) => setKelas(e.target.value)}
                  placeholder="6A / Sesi 1"
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Akun Pengguna'}
            </button>
          </form>
        </div>

        {/* Tabel Daftar Pengguna */}
        <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h3 className="font-bold text-base text-slate-800">Daftar Akun Terdaftar</h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
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
                onClick={fetchUsers}
                disabled={isLoading}
                title="Muat Ulang"
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-3">Nama Pengguna</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Kelas / Sesi</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      Memuat data pengguna...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
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
                        <td className="p-3 font-semibold text-slate-800">{u.nama}</td>
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
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
    </div>
  );
};
