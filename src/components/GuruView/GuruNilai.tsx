import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  RefreshCw,
  Search,
  RotateCcw,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Filter,
  Edit3,
  Send,
  Printer,
  X,
  MessageSquare,
  Check,
} from 'lucide-react';
import { Nilai, SchoolProfile } from '../../types';
import { api } from '../../services/api';
import { ModalState } from '../ConfirmModal';
import { exportNilaiToExcel } from '../../utils/excelExamHelper';
import { RekapNilaiPrintModal } from '../RekapNilaiPrintModal';

interface GuruNilaiProps {
  onShowModal: (modal: Partial<ModalState>) => void;
}

export const GuruNilai: React.FC<GuruNilaiProps> = ({ onShowModal }) => {
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('ALL');
  const [filterBankSoal, setFilterBankSoal] = useState('ALL');

  // Manual Correction State
  const [editingNilai, setEditingNilai] = useState<Nilai | null>(null);
  const [editScoreInput, setEditScoreInput] = useState<number>(0);
  const [editCatatanInput, setEditCatatanInput] = useState<string>('');
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);

  // WhatsApp modal state
  const [waModalData, setWaModalData] = useState<{
    nilai: Nilai;
    phone: string;
    message: string;
  } | null>(null);

  // Print PDF Preview Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const fetchNilaiAndProfile = useCallback(async (silent?: boolean | unknown) => {
    if (silent !== true) setIsLoading(true);
    try {
      // Sinkronkan antrean darurat yang belum terunggah jika ada
      api.syncPendingSubmissions().catch(() => {});

      const [nData, sProfile] = await Promise.all([
        api.getNilaiList(),
        api.getSchoolProfile(),
      ]);
      setNilaiList(nData || []);
      setSchoolProfile(sProfile || null);
    } finally {
      if (silent !== true) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNilaiAndProfile(false);

    // 1. Sinkronisasi real-time instan langsung dari Firestore (onSnapshot)
    const unsubscribeFirestore = api.subscribeNilaiList((liveList) => {
      if (Array.isArray(liveList)) {
        setNilaiList(liveList);
      }
    });

    // 2. Sinkronisasi event internal saat submit / update lokal
    const handleSync = () => {
      fetchNilaiAndProfile(true);
    };

    window.addEventListener('cbt-nilai-updated', handleSync);
    window.addEventListener('focus', handleSync);

    const interval = setInterval(() => {
      fetchNilaiAndProfile(true);
    }, 4000);

    return () => {
      unsubscribeFirestore();
      window.removeEventListener('cbt-nilai-updated', handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(interval);
    };
  }, [fetchNilaiAndProfile]);

  const handleResetNilai = (n: Nilai) => {
    onShowModal({
      isOpen: true,
      title: 'Beri Kesempatan Ujian Ulang',
      message: `Apakah Anda ingin mereset hasil ujian "${n.Judul_Ujian}" milik murid "${n.Nama_Murid}"? Murid akan dapat mengerjakan kembali ujian ini.`,
      type: 'question',
      isConfirm: true,
      okText: 'Izinkan Ulang',
      onConfirm: async () => {
        const res = await api.resetNilaiMurid(n.ID, n.ID_Ujian, n.Nama_Murid, n.Judul_Ujian, n.Nilai);
        if (res.success) {
          onShowModal({
            isOpen: true,
            title: 'Berhasil',
            message: res.message || 'Izin pengerjaan ulang telah diberikan kepada murid.',
            type: 'success',
            isConfirm: false,
          });
          fetchNilaiAndProfile();
        }
      },
    });
  };

  // Manual Score Correction
  const handleOpenCorrection = (n: Nilai) => {
    setEditingNilai(n);
    setEditScoreInput(Number(n.Nilai || 0));
    setEditCatatanInput(n.Catatan_Guru || '');
  };

  const handleSaveCorrection = async () => {
    if (!editingNilai) return;
    setIsSavingCorrection(true);
    try {
      const res = await api.updateNilai({
        ...editingNilai,
        Nilai: Number(editScoreInput),
        Catatan_Guru: editCatatanInput.trim() || undefined,
        Koreksi_Manual: true,
      });

      if (res.success) {
        onShowModal({
          isOpen: true,
          title: 'Koreksi Nilai Berhasil',
          message: `Nilai murid ${editingNilai.Nama_Murid} berhasil diperbarui menjadi ${editScoreInput}.`,
          type: 'success',
        });
        setEditingNilai(null);
        fetchNilaiAndProfile();
      } else {
        onShowModal({
          isOpen: true,
          title: 'Gagal Koreksi Nilai',
          message: res.message || 'Terjadi kesalahan sistem.',
          type: 'danger',
        });
      }
    } finally {
      setIsSavingCorrection(false);
    }
  };

  // WhatsApp Notification
  const handleOpenWAModal = (n: Nilai) => {
    const schoolName = schoolProfile?.namaSekolah || 'SDN Harjosari Kidul 01';
    const defaultMsg = `Yth. Bapak/Ibu Orang Tua/Wali dari ${n.Nama_Murid},\n\nKami menginformasikan bahwa ananda telah menyelesaikan asesmen CBT:\n📚 Ujian: ${n.Judul_Ujian}\n🎯 Nilai Akhir: ${Number(n.Nilai || 0).toFixed(2)}\n📅 Waktu: ${n.Waktu_Submit}\n${
      n.Catatan_Guru ? `📝 Catatan Guru: ${n.Catatan_Guru}\n` : ''
    }\nTerima kasih atas perhatian dan bimbingannya.\n- ${schoolName}`;

    setWaModalData({
      nilai: n,
      phone: '',
      message: defaultMsg,
    });
  };

  const handleSendWA = () => {
    if (!waModalData) return;
    const cleanPhone = waModalData.phone.replace(/[^0-9]/g, '');
    let targetNumber = cleanPhone;
    if (targetNumber.startsWith('0')) {
      targetNumber = '62' + targetNumber.slice(1);
    }

    const encodedText = encodeURIComponent(waModalData.message);
    const waUrl = targetNumber
      ? `https://wa.me/${targetNumber}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(waUrl, '_blank');
    setWaModalData(null);
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredNilai.length === 0) {
      onShowModal({
        isOpen: true,
        title: 'Data Kosong',
        message: 'Tidak ada data nilai yang sesuai dengan filter untuk diekspor.',
        type: 'warning',
      });
      return;
    }
    const filterTitle = filterBankSoal !== 'ALL' ? filterBankSoal : 'Semua_Ujian';
    exportNilaiToExcel(filterTitle, filteredNilai, schoolProfile || undefined);
  };

  // Print PDF Laporan Rekap Nilai & Anti-Contek
  const handlePrintPDF = () => {
    if (filteredNilai.length === 0) {
      onShowModal({
        isOpen: true,
        title: 'Data Masih Kosong',
        message: 'Tidak ada data rekap nilai yang sesuai dengan filter pencarian untuk dicetak.',
        type: 'warning',
      });
      return;
    }
    setIsPrintModalOpen(true);
  };

  // Extract unique bank soal & classes for filter options
  const uniqueBankSoal = Array.from(new Set(nilaiList.map((n) => n.Judul_Ujian).filter(Boolean)));
  const uniqueKelas = Array.from(new Set(nilaiList.map((n) => n.Kelas).filter(Boolean)));

  const filteredNilai = nilaiList.filter((n) => {
    const sLower = (search || '').toLowerCase();
    const matchesSearch =
      (n.Nama_Murid || '').toLowerCase().includes(sLower) ||
      (n.Judul_Ujian || '').toLowerCase().includes(sLower) ||
      (n.Kelas || '').toLowerCase().includes(sLower);

    const matchesKelas = filterKelas === 'ALL' || n.Kelas === filterKelas;
    const matchesBankSoal = filterBankSoal === 'ALL' || n.Judul_Ujian === filterBankSoal;
    return matchesSearch && matchesKelas && matchesBankSoal;
  });

  const kkm = schoolProfile?.kkmDefault || 75;

  const stats = {
    total: filteredNilai.length,
    rataRata:
      filteredNilai.length > 0
        ? (
            filteredNilai.reduce((acc, curr) => acc + Number(curr.Nilai || 0), 0) /
            filteredNilai.length
          ).toFixed(2)
        : '0.00',
    tuntas: filteredNilai.filter((n) => Number(n.Nilai || 0) >= kkm).length,
    pelanggaranTotal: filteredNilai.reduce((acc, curr) => acc + (curr.Pelanggaran || 0), 0),
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
            {schoolProfile?.namaSekolah || 'SD Negeri Harjosari Kidul 01'} • Terpantau langsung
            secara real-time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
            title="Ekspor Data Nilai ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
            title="Cetak Laporan / Simpan PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / PDF</span>
          </button>
          <button
            onClick={() => fetchNilaiAndProfile(false)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`}
            />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Hasil Ujian</span>
          <span className="text-xl font-extrabold text-slate-800">{stats.total} Peserta</span>
        </div>
        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200">
          <span className="text-[11px] font-semibold text-indigo-600 block">Rata-rata Nilai</span>
          <span className="text-xl font-extrabold text-indigo-900">{stats.rataRata}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <span className="text-[11px] font-semibold text-emerald-600 block">
            Tuntas (KKM ≥ {kkm})
          </span>
          <span className="text-xl font-extrabold text-emerald-800">{stats.tuntas} Siswa</span>
        </div>
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
          <span className="text-[11px] font-semibold text-rose-600 block">Insiden Pindah Tab</span>
          <span className="text-xl font-extrabold text-rose-800">
            {stats.pelanggaranTotal}x Kejadian
          </span>
        </div>
      </div>

      {/* FILTERS: Bank Soal & Kelas (Requirement 4) */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="relative flex-1 md:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama murid, kelas, ujian..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Bank Soal:</span>
          </div>
          <select
            value={filterBankSoal}
            onChange={(e) => setFilterBankSoal(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold text-indigo-700 max-w-xs"
          >
            <option value="ALL">Semua Bank Soal</option>
            {uniqueBankSoal.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
          >
            <option value="ALL">Semua Kelas</option>
            {uniqueKelas.map((k) => (
              <option key={k} value={k}>
                Kelas {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Rekap */}
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
              <th className="p-3 text-center">Catatan / Koreksi</th>
              <th className="p-3 text-center">Aksi Guru</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Memuat data rekap nilai...
                </td>
              </tr>
            ) : filteredNilai.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Belum ada catatan hasil ujian yang sesuai dengan filter.
                </td>
              </tr>
            ) : (
              filteredNilai.map((n) => {
                const isPassed = Number(n.Nilai || 0) >= kkm;
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
                        {Number(n.Nilai || 0).toFixed(2)}
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
                      {n.Catatan_Guru ? (
                        <span className="text-xs text-indigo-700 font-semibold italic truncate max-w-xs block">
                          "{n.Catatan_Guru}"
                        </span>
                      ) : n.Koreksi_Manual ? (
                        <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Dikoreksi Manual
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Koreksi Nilai Manual Button */}
                        <button
                          onClick={() => handleOpenCorrection(n)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
                          title="Koreksi Nilai Manual & Catatan Guru"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp Parent Notification Button */}
                        <button
                          onClick={() => handleOpenWAModal(n)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                          title="Kirim Laporan Nilai ke WhatsApp Orang Tua"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Ujian Ulang Button */}
                        <button
                          onClick={() => handleResetNilai(n)}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                          title="Hapus nilai dan izinkan murid ujian lagi"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
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

      {/* MODAL KOREKSI NILAI MANUAL */}
      {editingNilai && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h4 className="font-black text-slate-800 text-base">Koreksi Nilai Manual</h4>
              </div>
              <button
                onClick={() => setEditingNilai(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div>
                <span className="text-slate-500">Nama Siswa:</span>{' '}
                <span className="font-bold text-slate-800">{editingNilai.Nama_Murid}</span>
              </div>
              <div>
                <span className="text-slate-500">Kelas:</span>{' '}
                <span className="font-semibold text-slate-700">{editingNilai.Kelas}</span>
              </div>
              <div>
                <span className="text-slate-500">Judul Ujian:</span>{' '}
                <span className="font-semibold text-indigo-700">{editingNilai.Judul_Ujian}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nilai Baru (Skala 0 - 100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={editScoreInput}
                onChange={(e) => setEditScoreInput(Number(e.target.value))}
                className="w-full text-base font-black p-3 rounded-2xl border border-slate-300 bg-white text-indigo-700 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan / Umpan Balik Guru (Opsional)
              </label>
              <textarea
                rows={3}
                value={editCatatanInput}
                onChange={(e) => setEditCatatanInput(e.target.value)}
                placeholder="Contoh: Diberikan tambahan nilai setelah penilaian esai..."
                className="w-full text-xs p-3 rounded-2xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingNilai(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingCorrection}
                onClick={handleSaveCorrection}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md transition disabled:opacity-50"
              >
                {isSavingCorrection ? 'Menyimpan...' : 'Simpan Koreksi Nilai'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL WHATSAPP NOTIFIKASI KE ORANG TUA */}
      {waModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h4 className="font-black text-slate-800 text-base">Kirim Laporan Nilai via WhatsApp</h4>
              </div>
              <button
                onClick={() => setWaModalData(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp Orang Tua (Opsional)
              </label>
              <input
                type="text"
                value={waModalData.phone}
                onChange={(e) =>
                  setWaModalData({ ...waModalData, phone: e.target.value })
                }
                placeholder="Contoh: 08123456789 (Jika kosong, akan membuka kontak WA)"
                className="w-full text-xs p-3 rounded-2xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Isi Pesan Laporan
              </label>
              <textarea
                rows={6}
                value={waModalData.message}
                onChange={(e) =>
                  setWaModalData({ ...waModalData, message: e.target.value })
                }
                className="w-full text-xs p-3 rounded-2xl border border-slate-300 bg-slate-50 font-sans focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWaModalData(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendWA}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Buka WhatsApp & Kirim</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Rekap Nilai & Log Anti-Contek Resmi A4 Landscape */}
      <RekapNilaiPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        judulUjian={filterBankSoal !== 'ALL' ? filterBankSoal : 'Semua Bank Soal (Gabungan)'}
        kelas={filterKelas !== 'ALL' ? filterKelas : 'ALL'}
        nilaiList={filteredNilai}
        schoolProfile={schoolProfile}
        kkm={kkm}
      />
    </div>
  );
};
