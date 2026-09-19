import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Loader2,
  Users,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import {
  downloadStudentTemplate,
  downloadStudentTemplateCSV,
  parseUserExcelFile,
  ParsedUserResult,
} from '../utils/excelUserImport';
import { ModalState } from './ConfirmModal';

interface UploadStudentExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onShowModal: (modal: Partial<ModalState>) => void;
}

export const UploadStudentExcelModal: React.FC<UploadStudentExcelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowModal,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedUserResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParsedResult(null);

    try {
      const result = await parseUserExcelFile(selectedFile);
      setParsedResult(result);
    } catch (err: any) {
      onShowModal({
        isOpen: true,
        title: 'Gagal Membaca File Excel',
        message: err.message || 'Format file tidak valid atau data kosong.',
        type: 'error',
        isConfirm: false,
        okText: 'Tutup',
      });
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSaveAll = async () => {
    if (!parsedResult || parsedResult.users.length === 0) return;

    setIsSaving(true);
    try {
      const res = await api.addUsersBatch(parsedResult.users);
      setIsSaving(false);

      if (res.success) {
        onClose();
        onSuccess();
        onShowModal({
          isOpen: true,
          title: 'Impor Pengguna Berhasil',
          message: `${res.message || `Berhasil mengimpor ${parsedResult.users.length} akun murid.`} Data telah tersinkronisasi ke sistem.`,
          type: 'success',
          isConfirm: false,
          okText: 'OK',
        });
      } else {
        onShowModal({
          isOpen: true,
          title: 'Gagal Menyimpan Data',
          message: res.message || 'Terjadi kesalahan saat menyimpan ke database.',
          type: 'error',
          isConfirm: false,
          okText: 'Tutup',
        });
      }
    } catch (err: any) {
      setIsSaving(false);
      onShowModal({
        isOpen: true,
        title: 'Kesalahan Sistem',
        message: err.message || 'Terjadi gangguan jaringan atau server.',
        type: 'error',
        isConfirm: false,
        okText: 'Tutup',
      });
    }
  };

  const resetForm = () => {
    setFile(null);
    setParsedResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                Upload & Impor Data Murid (Excel)
              </h3>
              <p className="text-xs text-slate-500">
                Impor massal akun siswa dengan file Excel (.xlsx / .xls) atau CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Download Template */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700" />
                Langkah 1: Gunakan Format Excel Resmi
              </h4>
              <p className="text-xs text-emerald-700 mt-1">
                Unduh template Excel yang sudah disesuaikan dengan kolom: <strong>Nama Lengkap, Username, Password, Kelas, Role</strong>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={downloadStudentTemplate}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Template (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={downloadStudentTemplateCSV}
                title="Unduh versi CSV"
                className="px-2.5 py-2 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-semibold transition"
              >
                CSV
              </button>
            </div>
          </div>

          {/* Step 2: Upload Area */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-indigo-600" />
              Langkah 2: Pilih atau Tarik File Excel Anda
            </h4>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                {isParsing ? (
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-slate-700">
                  {file ? file.name : 'Klik untuk memilih file atau seret file ke sini'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mendukung file Microsoft Excel (.xlsx, .xls) dan CSV (.csv)
                </p>
              </div>

              {file && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    File terpilih ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetForm();
                    }}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Ganti File
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Parsed Results & Preview Table */}
          {parsedResult && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="font-extrabold text-sm text-slate-800">
                    Pratinjau Data: {parsedResult.users.length} Akun Terdeteksi
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                    Siap Disimpan: {parsedResult.validCount}
                  </span>
                  {parsedResult.classesFound.length > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold">
                      Kelas: {parsedResult.classesFound.join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Warnings accordian if any */}
              {parsedResult.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <div
                    className="flex justify-between items-center cursor-pointer font-bold"
                    onClick={() => setShowWarnings(!showWarnings)}
                  >
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      {parsedResult.warnings.length} Catatan / Penyesuaian Otomatis
                    </span>
                    <span className="text-amber-700 underline text-[11px]">
                      {showWarnings ? 'Sembunyikan' : 'Lihat Detail'}
                    </span>
                  </div>
                  {showWarnings && (
                    <ul className="mt-2 list-disc list-inside space-y-1 text-amber-700 pl-1 border-t border-amber-200 pt-2 max-h-32 overflow-y-auto">
                      {parsedResult.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto shadow-inner">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-10 text-center">No</th>
                      <th className="p-2.5">Nama Lengkap</th>
                      <th className="p-2.5">Username</th>
                      <th className="p-2.5">Password</th>
                      <th className="p-2.5">Kelas</th>
                      <th className="p-2.5">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedResult.users.map((u, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-800">{u.nama}</td>
                        <td className="p-2.5 font-mono text-indigo-700">{u.username}</td>
                        <td className="p-2.5 font-mono text-slate-600">{u.password}</td>
                        <td className="p-2.5 font-semibold text-slate-700">{u.kelas}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition disabled:opacity-50"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            {parsedResult && parsedResult.users.length > 0 && (
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving || isParsing}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2 active:scale-95"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ({parsedResult.users.length} Murid)...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Semua Murid ({parsedResult.users.length} Akun)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
