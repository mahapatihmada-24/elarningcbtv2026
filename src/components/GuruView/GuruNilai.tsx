import React, { useState, useEffect } from 'react';
import {
  Award,
  RefreshCw,
  Search,
  RotateCcw,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { Nilai } from '../../types';
import { api } from '../../services/api';
import { ModalState } from '../ConfirmModal';

interface GuruNilaiProps {
  onShowModal: (modal: Partial<ModalState>) => void;
}

export const GuruNilai: React.FC<GuruNilaiProps> = ({ onShowModal }) => {
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('ALL');

  const fetchNilai = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNilaiList();
      setNilaiList(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNilai();
  }, []);

  const handleResetNilai = (n: Nilai) => {
    onShowModal({
      isOpen: true,
      title: 'Beri Kesempatan Ujian Ulang',
      message: `Apakah Anda ingin mereset hasil ujian "${n.Judul_Ujian}" milik murid "${n.Nama_Murid}"? Murid akan dapat mengerjakan kembali ujian ini.`,
      type: 'question',
      isConfirm: true,
      okText: 'Izinkan Ulang',
      onConfirm: async () => {
        const res = await api.resetNilaiMurid(n.ID);
        if (res.success) {
          onShowModal({
            isOpen: true,
            title: 'Berhasil',
            message: res.message || 'Kesempatan ujian ulang telah diberikan.',
            type: 'success',
            isConfirm: false,
          });
          fetchNilai();
        }
      },
    });
  };

  const handleExportCSV = () => {
    if (nilaiList.length === 0) return;
    const headers = ['Waktu Submit', 'Nama Murid', 'Kelas', 'Judul Ujian', 'Nilai Akhir', 'Pelanggaran Pindah Tab'];
    const rows = nilaiList.map((n) => [
      `"${n.Waktu_Submit}"`,
      `"${n.Nama_Murid}"`,
      `"${n.Kelas}"`,
      `"${n.Judul_Ujian}"`,
      `"${Number(n.Nilai).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`,
      n.Pelanggaran || 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_nilai_cbt_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredNilai = nilaiList.filter((n) => {
    const sLower = (search || '').toLowerCase();
    const matchesSearch =
      (n.Nama_Murid || '').toLowerCase().includes(sLower) ||
      (n.Judul_Ujian || '').toLowerCase().includes(sLower) ||
      (n.Kelas || '').toLowerCase().includes(sLower);

    const matchesKelas = filterKelas === 'ALL' || n.Kelas === filterKelas;
    return matchesSearch && matchesKelas;
  });

  const stats = {
    total: nilaiList.length,
    rataRata:
      nilaiList.length > 0
        ? (nilaiList.reduce((acc, curr) => acc + Number(curr.Nilai || 0), 0) / nilaiList.length).toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : '0,00',
    tuntas: nilaiList.filter((n) => Number(n.Nilai || 0) >= 75).length,
    pelanggaranTotal: nilaiList.reduce((acc, curr) => acc + (curr.Pelanggaran || 0), 0),
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>Rekap Nilai Siswa & Catatan Anti-Contek</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            SD Negeri Harjosari Kidul 01 • Terpantau langsung secara real-time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={fetchNilai}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Lembar Ujian</span>
          <span className="text-xl font-extrabold text-slate-800">{stats.total} Siswa</span>
        </div>
        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200">
          <span className="text-[11px] font-semibold text-indigo-600 block">Rata-rata Nilai</span>
          <span className="text-xl font-extrabold text-indigo-900">{stats.rataRata}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <span className="text-[11px] font-semibold text-emerald-600 block">Tuntas (KKTP ≥ 75)</span>
          <span className="text-xl font-extrabold text-emerald-800">{stats.tuntas} Siswa</span>
        </div>
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
          <span className="text-[11px] font-semibold text-rose-600 block">Insiden Pindah Tab</span>
          <span className="text-xl font-extrabold text-rose-800">{stats.pelanggaranTotal}x Kejadian</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari murid, ujian, kelas..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <select
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="text-xs p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
        >
          <option value="ALL">Semua Kelas</option>
          <option value="6A">Kelas 6A</option>
          <option value="6B">Kelas 6B</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-xs sm:text-sm text-left">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3">Waktu Submit</th>
              <th className="p-3">Nama Murid</th>
              <th className="p-3">Kelas</th>
              <th className="p-3">Judul Ujian CBT</th>
              <th className="p-3 text-center">Nilai Akhir</th>
              <th className="p-3 text-center">Deteksi Anti-Contek</th>
              <th className="p-3 text-center">Aksi Guru</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Memuat data rekap nilai...
                </td>
              </tr>
            ) : filteredNilai.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Belum ada catatan hasil ujian.
                </td>
              </tr>
            ) : (
              filteredNilai.map((n) => {
                const isPassed = n.Nilai >= 75;
                const hasCheated = (n.Pelanggaran || 0) > 0;

                return (
                  <tr key={n.ID} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 text-xs text-slate-500 whitespace-nowrap">
                      {n.Waktu_Submit}
                    </td>
                    <td className="p-3 font-bold text-slate-800 whitespace-nowrap">
                      {n.Nama_Murid}
                    </td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">{n.Kelas}</td>
                    <td className="p-3 font-medium text-slate-700 max-w-xs truncate">
                      {n.Judul_Ujian}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full font-black text-xs ${
                          isPassed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {Number(n.Nilai).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {hasCheated ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          {n.Pelanggaran}x Pindah Tab (-{n.Pelanggaran * 5} Poin)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Disiplin (0x)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleResetNilai(n)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold transition active:scale-95"
                        title="Hapus nilai dan izinkan murid ujian lagi"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Ujian Ulang</span>
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
  );
};
