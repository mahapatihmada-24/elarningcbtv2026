import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ShieldAlert,
  Eye,
} from 'lucide-react';
import { Nilai, SchoolProfile, User } from '../../types';
import { api, DEFAULT_SCHOOL_PROFILE } from '../../services/api';
import { ModalState } from '../ConfirmModal';
import { exportNilaiToExcel } from '../../utils/excelExamHelper';
import { RekapNilaiPrintModal } from '../RekapNilaiPrintModal';

interface GuruNilaiProps {
  onShowModal: (modal: Partial<ModalState>) => void;
  currentUser?: User | null;
}

export const GuruNilai: React.FC<GuruNilaiProps> = ({ onShowModal, currentUser }) => {
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('ALL');
  const [filterBankSoal, setFilterBankSoal] = useState('ALL');

  // Manual Correction State
  const [editingNilai, setEditingNilai] = useState<Nilai | null>(null);
  const [editScoreInput, setEditScoreInput] = useState<number>(0);
  const [editCatatanInput, setEditCatatanInput] = useState<string>('');
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);

  // Penalty Settings State
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [penaltyInput, setPenaltyInput] = useState<number>(5);
  const [isSavingPenalty, setIsSavingPenalty] = useState(false);

  // WhatsApp modal state
  const [waModalData, setWaModalData] = useState<{
    nilai: Nilai;
    phone: string;
    message: string;
  } | null>(null);

  // Print PDF Preview Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Detail Nilai Modal State
  const [detailNilai, setDetailNilai] = useState<Nilai | null>(null);

  const fetchNilaiAndProfile = useCallback(async (silent?: boolean | unknown) => {
    if (silent !== true) setIsLoading(true);
    try {
      // Sinkronkan antrean darurat yang belum terunggah jika ada
      api.syncPendingSubmissions().catch(() => {});

      const [nData, sProfile, uData] = await Promise.all([
        api.getNilaiList(),
        api.getSchoolProfile(),
        api.getUsers().catch(() => []),
      ]);
      setNilaiList(nData || []);
      setSchoolProfile(sProfile || null);
      setUsers(uData || []);
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

  // Save manual penalty configuration
  const handleSavePenalty = async () => {
    setIsSavingPenalty(true);
    try {
      const updatedProfile: SchoolProfile = {
        ...(schoolProfile || DEFAULT_SCHOOL_PROFILE),
        poinPenaltiPelanggaran: Number(penaltyInput),
      };

      const res = await api.saveSchoolProfile(updatedProfile);
      if (res.success) {
        setSchoolProfile(updatedProfile);
        setIsPenaltyModalOpen(false);
        onShowModal({
          isOpen: true,
          title: 'Pengaturan Penalti Berhasil',
          message: `Poin penalti pelanggaran anti-contek berhasil diatur menjadi ${penaltyInput} poin per pelanggaran.`,
          type: 'success',
        });
      } else {
        onShowModal({
          isOpen: true,
          title: 'Gagal Menyimpan',
          message: res.message || 'Gagal menyimpan pengaturan poin penalti.',
          type: 'danger',
        });
      }
    } catch (err: any) {
      onShowModal({
        isOpen: true,
        title: 'Error Sistem',
        message: err?.message || 'Terjadi kesalahan saat menyimpan profil sekolah.',
        type: 'danger',
      });
    } finally {
      setIsSavingPenalty(false);
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
        message: 'Tidak ada data nilai yang sesuai dengan filter untuk diekspor ke Excel.',
        type: 'warning',
      });
      return;
    }
    try {
      const filterTitle = filterBankSoal !== 'ALL' ? filterBankSoal : 'Semua_Ujian';
      exportNilaiToExcel(filterTitle, filteredNilai, schoolProfile || undefined);
      onShowModal({
        isOpen: true,
        title: 'Ekspor Excel Berhasil',
        message: `Berhasil mengekspor rekap hasil ${filteredNilai.length} siswa untuk "${filterTitle}" ke file Excel (.xlsx).`,
        type: 'success',
      });
    } catch (err: any) {
      onShowModal({
        isOpen: true,
        title: 'Gagal Ekspor Excel',
        message: err?.message || 'Terjadi kesalahan saat mengunduh file Excel.',
        type: 'danger',
      });
    }
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

  const resolvedGuru = useMemo(() => {
    // 1. Jika pengguna saat ini adalah guru yang sedang login
    if (currentUser && currentUser.role === 'guru') {
      return {
        nama: currentUser.nama,
        nip: currentUser.nip,
      };
    }

    // 2. Jika difilter per kelas, cari guru kelas tersebut
    if (filterKelas && filterKelas !== 'ALL' && users.length > 0) {
      const teacherForClass = users.find(
        (u) =>
          u.role === 'guru' &&
          u.kelas &&
          u.kelas.trim().toLowerCase() === filterKelas.trim().toLowerCase()
      );
      if (teacherForClass) {
        return {
          nama: teacherForClass.nama,
          nip: teacherForClass.nip,
        };
      }
    }

    // 3. Cari guru pengampu dari daftar akun guru
    const anyTeacher = users.find((u) => u.role === 'guru');
    if (anyTeacher) {
      return {
        nama: anyTeacher.nama,
        nip: anyTeacher.nip,
      };
    }

    // 4. Fallback jika admin yang login atau default
    if (currentUser && currentUser.role === 'admin') {
      return {
        nama: currentUser.nama || 'Wildan Pramadika, S.Pd.',
        nip: currentUser.nip,
      };
    }

    return {
      nama: 'Wildan Pramadika, S.Pd.',
      nip: '199208152019031008',
    };
  }, [currentUser, filterKelas, users]);

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
            onClick={() => {
              setPenaltyInput(schoolProfile?.poinPenaltiPelanggaran ?? 5);
              setIsPenaltyModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition cursor-pointer"
            title="Atur Poin Penalti Pelanggaran Anti-Contek CBT"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Penalti: {schoolProfile?.poinPenaltiPelanggaran ?? 5} Poin/Pelanggaran</span>
          </button>
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

      {/* Table Rekap Header Bar */}
      <div className="flex items-center justify-between gap-2 px-1 text-xs text-slate-500">
        <div>
          Menampilkan <strong className="text-slate-800">{filteredNilai.length}</strong> catatan hasil ujian
        </div>
      </div>

      {/* Table Rekap Container */}
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 select-none">
            <tr>
              <th className="px-2.5 py-2.5 text-left font-bold text-slate-700 whitespace-nowrap">Waktu</th>
              <th className="px-2.5 py-2.5 text-left font-bold text-slate-700">Nama Murid</th>
              <th className="px-1.5 py-2.5 text-center font-bold text-slate-700 w-12 whitespace-nowrap">Kelas</th>
              <th className="px-2.5 py-2.5 text-left font-bold text-slate-700">Judul Ujian CBT</th>
              <th className="px-1.5 py-2.5 text-center font-bold text-slate-700 w-16 whitespace-nowrap">Nilai</th>
              <th className="px-2 py-2.5 text-center font-bold text-slate-700 whitespace-nowrap">Anti-Contek</th>
              <th className="px-2 py-2.5 text-center font-bold text-slate-700 whitespace-nowrap">Catatan / Koreksi</th>
              <th className="px-2 py-2.5 text-center font-bold text-slate-700 w-28 whitespace-nowrap">Aksi Guru</th>
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
                const penaltyPerViolation = schoolProfile?.poinPenaltiPelanggaran ?? 5;
                const violations = Number(n.Pelanggaran || 0);
                const penaltyAmount = violations * penaltyPerViolation;
                const hasCheated = violations > 0;

                return (
                  <tr key={n.ID} className="hover:bg-slate-50/80 transition group">
                    <td className="px-2.5 py-2 text-[11px] text-slate-600">
                      <div className="flex flex-col leading-tight space-y-0.5">
                        <span className="font-semibold text-slate-700" title={`Waktu selesai: ${n.Waktu_Submit || '-'}`}>
                          {n.Waktu_Submit || '-'}
                        </span>
                        {n.Waktu_Mulai && (
                          <span className="text-[10px] text-slate-400" title={`Waktu mulai: ${n.Waktu_Mulai}`}>
                            Mulai: {n.Waktu_Mulai}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2.5 py-2 font-bold text-slate-800 break-words max-w-[130px] leading-tight">
                      {n.Nama_Murid}
                    </td>
                    <td className="px-1.5 py-2 text-slate-600 text-center font-semibold whitespace-nowrap">
                      {n.Kelas}
                    </td>
                    <td className="px-2.5 py-2 text-slate-700">
                      <div className="font-semibold text-slate-800 leading-snug line-clamp-2 max-w-[160px]" title={n.Judul_Ujian}>
                        {n.Judul_Ujian}
                      </div>
                    </td>
                    <td className="px-1.5 py-2 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-black text-xs ${
                          isPassed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {Number(n.Nilai || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center whitespace-nowrap">
                      {violations >= 3 ? (
                        <div className="flex flex-col items-center gap-0.5" title={`3x Maksimal (Auto-Close) - Penalti: -${penaltyAmount} Poin`}>
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold border border-rose-200">
                            <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                            3x (Tutup)
                          </span>
                          <span className="text-[10px] text-rose-600 font-bold">-{penaltyAmount} Poin</span>
                        </div>
                      ) : hasCheated ? (
                        <div className="flex flex-col items-center gap-0.5" title={`${violations}x Pindah Tab - Penalti: -${penaltyAmount} Poin`}>
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            {violations}x Tab
                          </span>
                          <span className="text-[10px] text-amber-700 font-semibold">-{penaltyAmount} Poin</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100" title="Disiplin (0x pindah tab)">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          Tertib (0x)
                        </span>
                      )}
                    </td>

                    {/* Kolom Catatan / Koreksi */}
                    <td className="px-2 py-2 text-center">
                      {n.Catatan_Guru ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenCorrection(n)}
                            className="text-[11px] text-indigo-800 bg-indigo-50/90 hover:bg-indigo-100 border border-indigo-200 rounded-md px-2 py-0.5 font-medium italic transition text-left max-w-[120px] line-clamp-1 block cursor-pointer"
                            title={`"${n.Catatan_Guru}" (Klik untuk mengubah)`}
                          >
                            "{n.Catatan_Guru}"
                          </button>
                          {n.Koreksi_Manual && (
                            <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              Manual
                            </span>
                          )}
                        </div>
                      ) : n.Koreksi_Manual ? (
                        <button
                          type="button"
                          onClick={() => handleOpenCorrection(n)}
                          className="text-[10px] text-amber-700 font-semibold bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 cursor-pointer inline-flex items-center gap-1"
                          title="Nilai dikoreksi manual (Klik untuk tambah catatan)"
                        >
                          <span>Koreksi</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCorrection(n)}
                          className="text-[10px] text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-1.5 py-0.5 rounded border border-dashed border-slate-200 hover:border-indigo-300 transition flex items-center gap-0.5 mx-auto cursor-pointer"
                          title="Beri catatan guru"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>+ Catatan</span>
                        </button>
                      )}
                    </td>

                    {/* Kolom Aksi Guru */}
                    <td className="px-2 py-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* Detail Tambahan Button */}
                        <button
                          type="button"
                          onClick={() => setDetailNilai(n)}
                          className="p-1 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition active:scale-95 cursor-pointer"
                          title="Lihat Detail Tambahan Hasil Ujian"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Koreksi Nilai Manual Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenCorrection(n)}
                          className="p-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition active:scale-95 cursor-pointer"
                          title="Koreksi Nilai Manual &amp; Catatan Guru"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp Parent Notification Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenWAModal(n)}
                          className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition active:scale-95 cursor-pointer"
                          title="Kirim Laporan Nilai ke WhatsApp Orang Tua"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Ujian Ulang Button */}
                        <button
                          type="button"
                          onClick={() => handleResetNilai(n)}
                          className="p-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition active:scale-95 cursor-pointer"
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

      {/* MODAL DETAIL TAMBAHAN HASIL UJIAN */}
      {detailNilai && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-base">Detail Tambahan Hasil Ujian</h4>
                  <p className="text-[11px] text-slate-500">Rincian nilai, integritas pengerjaan, dan catatan guru</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailNilai(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Identitas Siswa */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Nama Murid:</span>
                <span className="font-bold text-slate-800 text-sm">{detailNilai.Nama_Murid}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Kelas:</span>
                <span className="font-semibold text-slate-700">Kelas {detailNilai.Kelas}</span>
              </div>
              <div className="flex justify-between items-start py-1 border-b border-slate-200/60 gap-3">
                <span className="text-slate-500 font-medium whitespace-nowrap">Judul Ujian:</span>
                <span className="font-semibold text-indigo-700 text-right">{detailNilai.Judul_Ujian}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Waktu Mulai:</span>
                <span className="font-medium text-slate-700">{detailNilai.Waktu_Mulai || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Waktu Selesai:</span>
                <span className="font-medium text-slate-700">{detailNilai.Waktu_Submit || '-'}</span>
              </div>
            </div>

            {/* Nilai & Status Kelulusan */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3.5 rounded-2xl border ${Number(detailNilai.Nilai || 0) >= kkm ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                <span className="text-[11px] font-semibold text-slate-500 block">Nilai Akhir Siswa</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-2xl font-black ${Number(detailNilai.Nilai || 0) >= kkm ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {Number(detailNilai.Nilai || 0).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
                <span className={`inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${Number(detailNilai.Nilai || 0) >= kkm ? 'bg-emerald-200/80 text-emerald-800' : 'bg-rose-200/80 text-rose-800'}`}>
                  {Number(detailNilai.Nilai || 0) >= kkm ? `TUNTAS (≥ KKM ${kkm})` : `REMEDIAL (< KKM ${kkm})`}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Status Pengoreksian</span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">
                  {detailNilai.Koreksi_Manual ? 'Koreksi Manual Guru' : 'Otomatis Sistem CBT'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {detailNilai.Koreksi_Manual ? 'Nilai disesuaikan langsung oleh pengampu' : 'Dihitung dari butir soal pilihan ganda'}
                </span>
              </div>
            </div>

            {/* Log Deteksi Anti-Contek */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Log Deteksi Anti-Contek CBT
                </span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  Number(detailNilai.Pelanggaran || 0) === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {Number(detailNilai.Pelanggaran || 0)}x Insiden
                </span>
              </div>

              <div className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                {Number(detailNilai.Pelanggaran || 0) >= 3 ? (
                  <p className="text-rose-700 font-semibold">
                    🚨 <strong>Sanksi Maksimal (Auto-Close):</strong> Siswa berpindah aplikasi atau tab sebanyak 3 kali sehingga ujian otomatis dihentikan paksa oleh sistem.
                  </p>
                ) : Number(detailNilai.Pelanggaran || 0) > 0 ? (
                  <p className="text-amber-800 font-medium">
                    ⚠️ <strong>Peringatan Pindah Tab:</strong> Siswa tercatat berpindah tab/jendela {detailNilai.Pelanggaran} kali dengan pengurangan skor {Number(detailNilai.Pelanggaran || 0) * (schoolProfile?.poinPenaltiPelanggaran ?? 5)} poin penalti.
                  </p>
                ) : (
                  <p className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <strong>Disiplin Penuh (100% Integritas):</strong> Siswa fokus mengerjakan di lembar ujian tanpa berpindah layar.
                  </p>
                )}
              </div>
            </div>

            {/* Catatan Guru */}
            <div className="p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/50 space-y-1.5">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                Catatan / Evaluasi Guru
              </span>
              <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-xl border border-indigo-100">
                {detailNilai.Catatan_Guru ? `"${detailNilai.Catatan_Guru}"` : 'Belum ada catatan tertulis dari guru.'}
              </p>
            </div>

            {/* Action Buttons inside Detail Modal */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailNilai(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = detailNilai;
                    setDetailNilai(null);
                    handleOpenCorrection(target);
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Koreksi Nilai &amp; Catatan</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = detailNilai;
                    setDetailNilai(null);
                    handleOpenWAModal(target);
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim WA</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = detailNilai;
                    setDetailNilai(null);
                    handleResetNilai(target);
                  }}
                  className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ujian Ulang</span>
                </button>
              </div>
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

      {/* MODAL PENGATURAN POIN PENALTI PELANGGARAN */}
      {isPenaltyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h4 className="font-black text-slate-800 text-base">Atur Penalti Anti-Contek</h4>
              </div>
              <button
                onClick={() => setIsPenaltyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tentukan jumlah poin yang otomatis dipotong dari nilai akhir siswa untuk setiap 1 kali insiden perpindahan tab atau keluar layar pada ujian CBT.
            </p>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
              <label className="block text-xs font-bold text-rose-900">
                Poin Pengurangan per Pelanggaran
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={1}
                  value={penaltyInput}
                  onChange={(e) => setPenaltyInput(Math.max(0, Number(e.target.value)))}
                  className="w-28 text-center text-xl font-black p-2.5 rounded-xl border border-rose-300 bg-white text-rose-700 focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-xs font-bold text-rose-800">
                  Poin / Pelanggaran
                </span>
              </div>
              <p className="text-[11px] text-rose-700 italic">
                * Contoh: Jika diset {penaltyInput || 0} poin, maka 1x pelanggaran = -{penaltyInput || 0} poin, dan 3x pelanggaran (maksimal) = -{(penaltyInput || 0) * 3} poin.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPenaltyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingPenalty}
                onClick={handleSavePenalty}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition disabled:opacity-50"
              >
                {isSavingPenalty ? 'Menyimpan...' : 'Simpan Pengaturan'}
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
        namaGuru={resolvedGuru.nama}
        nipGuru={resolvedGuru.nip}
      />
    </div>
  );
};
