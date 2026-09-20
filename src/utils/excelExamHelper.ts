import * as XLSX from 'xlsx';
import { Question, QuestionPG, Nilai, SchoolProfile } from '../types';

/**
 * Downloads official Question Bank Excel (.xlsx) template for teachers.
 */
export function downloadExamExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Template Soal
  const headers = [
    'No',
    'Jenis Soal',
    'Teks Soal',
    'Pilihan A',
    'Pilihan B',
    'Pilihan C',
    'Pilihan D',
    'Kunci Jawaban',
    'Bobot Nilai',
  ];

  const sampleData = [
    [
      1,
      'PG',
      'Ibu kota Provinsi Jawa Tengah adalah ...',
      'Surakarta',
      'Semarang',
      'Tegal',
      'Pekalongan',
      'B',
      1,
    ],
    [
      2,
      'PG',
      'Hasil dari 25 x 4 + 50 adalah ...',
      '100',
      '125',
      '150',
      '175',
      'C',
      1,
    ],
    [
      3,
      'PG',
      'Sila pertama dalam Pancasila dilambangkan dengan simbol ...',
      'Bintang',
      'Rantai',
      'Pohon Beringin',
      'Kepala Banteng',
      'A',
      1,
    ],
    [
      4,
      'PG',
      'Rumus luas persegi panjang dengan panjang p dan lebar l adalah ...',
      'p + l',
      '2 x (p + l)',
      'p x l',
      'p : l',
      'C',
      1,
    ],
  ];

  const wsSoal = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  wsSoal['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Jenis
    { wch: 45 }, // Soal
    { wch: 22 }, // A
    { wch: 22 }, // B
    { wch: 22 }, // C
    { wch: 22 }, // D
    { wch: 15 }, // Kunci
    { wch: 12 }, // Bobot
  ];

  XLSX.utils.book_append_sheet(wb, wsSoal, 'TEMPLATE_SOAL');

  // Sheet 2: Petunjuk
  const petunjuk = [
    ['PANDUAN PENGISIAN TEMPLATE SOAL CBT EXCEL'],
    ['SD NEGERI HARJOSARI KIDUL 01'],
    [],
    ['KOLOM', 'STATUS', 'KETENTUAN'],
    ['No', 'Wajib', 'Nomor urut soal (1, 2, 3, ...)'],
    ['Jenis Soal', 'Wajib', 'Isi dengan "PG" untuk Pilihan Ganda'],
    ['Teks Soal', 'Wajib', 'Pertanyaan soal. Mendukung teks biasa maupun format matematika KaTeX, misal: $x^2 + 4x = 0$'],
    ['Pilihan A - D', 'Wajib', 'Teks untuk masing-masing opsi jawaban'],
    ['Kunci Jawaban', 'Wajib', 'Huruf besar: A, B, C, atau D'],
    ['Bobot Nilai', 'Opsional', 'Angka bulat (default: 1 jika kosong)'],
    [],
    ['CATATAN TAMBAHAN:'],
    ['- Pastikan baris judul pada baris ke-1 tidak diubah namanya.'],
    ['- Anda dapat menyimpan format sebagai .xlsx atau .csv.'],
  ];

  const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjuk);
  wsPetunjuk['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'PETUNJUK');

  const filename = 'Template_Bank_Soal_CBT.xlsx';
  try {
    XLSX.writeFile(wb, filename);
  } catch {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * Exports existing questions of an exam to a neat Excel file.
 */
export function exportQuestionsToExcel(judulUjian: string, questions: Question[]): void {
  const wb = XLSX.utils.book_new();

  const headers = [
    'No',
    'Jenis Soal',
    'Teks Soal',
    'Pilihan A',
    'Pilihan B',
    'Pilihan C',
    'Pilihan D',
    'Kunci Jawaban',
    'Bobot',
  ];

  const rows = questions.map((q, idx) => {
    if (q.type === 'pg') {
      return [
        idx + 1,
        'PG',
        q.soal,
        q.a,
        q.b,
        q.c,
        q.d,
        q.kunci,
        q.bobot || 1,
      ];
    } else if (q.type === 'pgk_mcma') {
      const opts = (q.options || []).map((o) => `${o.text}${o.isKey ? ' [BENAR]' : ''}`).join('; ');
      return [
        idx + 1,
        'PGK_MCMA',
        q.soal,
        opts,
        '-',
        '-',
        '-',
        'Banyak Opsi',
        q.bobot || 1,
      ];
    } else {
      const rowsTxt = (q.rows || []).map((r) => `${r.text} => ${r.key === 'col1' ? q.col1 : q.col2}`).join('; ');
      return [
        idx + 1,
        'PGK_KATEGORI',
        q.soal,
        rowsTxt,
        '-',
        '-',
        '-',
        'Tabel Kategori',
        q.bobot || 1,
      ];
    }
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 45 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 15 },
    { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'DAFTAR_SOAL');

  const safeTitle = (judulUjian || 'Soal_CBT').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Soal_${safeTitle}_${Date.now()}.xlsx`;

  try {
    XLSX.writeFile(wb, filename);
  } catch {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * Parses questions from an uploaded Excel (.xlsx, .xls) or CSV file.
 */
export async function parseQuestionsFromExcel(file: File): Promise<Question[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];

  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (!rawRows || rawRows.length < 2) {
    throw new Error('File tidak memiliki baris data soal.');
  }

  // Detect header row index
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
    const row = rawRows[i];
    const rowStr = row.map((c) => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('soal') || rowStr.includes('pilihan') || rowStr.includes('kunci')) {
      headerRowIndex = i;
      break;
    }
  }

  const header = rawRows[headerRowIndex].map((h) => String(h).trim().toLowerCase());

  const soalIdx = header.findIndex((h) => h.includes('teks soal') || h.includes('soal') || h.includes('pertanyaan'));
  const aIdx = header.findIndex((h) => h.includes('pilihan a') || h === 'a' || h.includes('opsi a'));
  const bIdx = header.findIndex((h) => h.includes('pilihan b') || h === 'b' || h.includes('opsi b'));
  const cIdx = header.findIndex((h) => h.includes('pilihan c') || h === 'c' || h.includes('opsi c'));
  const dIdx = header.findIndex((h) => h.includes('pilihan d') || h === 'd' || h.includes('opsi d'));
  const kunciIdx = header.findIndex((h) => h.includes('kunci') || h.includes('jawaban') || h === 'key');
  const bobotIdx = header.findIndex((h) => h.includes('bobot') || h.includes('poin'));

  const parsedQuestions: Question[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const soalText = soalIdx >= 0 ? String(row[soalIdx] || '').trim() : String(row[2] || row[1] || '').trim();
    if (!soalText) continue;

    const optA = aIdx >= 0 ? String(row[aIdx] || '').trim() : String(row[3] || '').trim();
    const optB = bIdx >= 0 ? String(row[bIdx] || '').trim() : String(row[4] || '').trim();
    const optC = cIdx >= 0 ? String(row[cIdx] || '').trim() : String(row[5] || '').trim();
    const optD = dIdx >= 0 ? String(row[dIdx] || '').trim() : String(row[6] || '').trim();

    let rawKunci = (kunciIdx >= 0 ? String(row[kunciIdx] || '') : String(row[7] || '')).trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(rawKunci)) {
      rawKunci = 'A';
    }

    const rawBobot = bobotIdx >= 0 ? Number(row[bobotIdx]) : Number(row[8]);
    const bobot = !isNaN(rawBobot) && rawBobot > 0 ? rawBobot : 1;

    const q: QuestionPG = {
      type: 'pg',
      bobot,
      soal: soalText,
      a: optA || '-',
      b: optB || '-',
      c: optC || '-',
      d: optD || '-',
      kunci: rawKunci as 'A' | 'B' | 'C' | 'D',
    };

    parsedQuestions.push(q);
  }

  return parsedQuestions;
}

/**
 * Exports Rekap Nilai to a clean formatted Excel spreadsheet.
 */
export function exportNilaiToExcel(
  judulUjian: string,
  nilaiList: Nilai[],
  school?: Partial<SchoolProfile>
): void {
  const wb = XLSX.utils.book_new();

  const schoolName = school?.namaSekolah || 'SD NEGERI HARJOSARI KIDUL 01';
  const kkm = school?.kkmDefault || 75;

  // Title rows
  const topRows = [
    [schoolName.toUpperCase()],
    ['LAPORAN HASIL UJIAN BERBASIS KOMPUTER (CBT)'],
    [`Judul Ujian: ${judulUjian}`],
    [`Standar KKM: ${kkm} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`],
    [],
  ];

  const headers = [
    'No',
    'Waktu Selesai',
    'Nama Lengkap Siswa',
    'Kelas',
    'Judul Ujian',
    'Nilai Akhir',
    'Status Kelulusan',
    'Pelanggaran (Pindah Tab)',
    'Catatan / Koreksi Guru',
  ];

  const dataRows = nilaiList.map((n, idx) => {
    const numNilai = Number(n.Nilai || 0);
    const status = numNilai >= kkm ? 'TUNTAS' : 'REMEDIAL';
    return [
      idx + 1,
      n.Waktu_Submit || '-',
      n.Nama_Murid || '-',
      n.Kelas || '-',
      n.Judul_Ujian || judulUjian,
      numNilai,
      status,
      n.Pelanggaran || 0,
      n.Catatan_Guru || (n.Koreksi_Manual ? 'Koreksi Manual' : '-'),
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([...topRows, headers, ...dataRows]);

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 18 }, // Waktu
    { wch: 30 }, // Nama
    { wch: 10 }, // Kelas
    { wch: 25 }, // Judul
    { wch: 12 }, // Nilai
    { wch: 16 }, // Status
    { wch: 24 }, // Pelanggaran
    { wch: 30 }, // Catatan
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'REKAP_NILAI');

  const safeTitle = (judulUjian || 'Rekap_Nilai').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Rekap_Nilai_${safeTitle}_${Date.now()}.xlsx`;

  try {
    XLSX.writeFile(wb, filename);
  } catch {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
