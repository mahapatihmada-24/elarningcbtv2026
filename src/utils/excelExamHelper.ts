import * as XLSX from 'xlsx';
import { Question, QuestionPG, QuestionPGKMCMA, QuestionPGKKategori, McmaOption, Nilai, SchoolProfile } from '../types';

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
    'Pilihan E',
    'Link/URL Gambar',
    'Gambar Opsi A',
    'Gambar Opsi B',
    'Gambar Opsi C',
    'Gambar Opsi D',
    'Gambar Opsi E',
  ];

  const sampleData = [
    [
      1,
      'PG',
      'Bu Aminah, seorang pedagang kain di Pasar Adiwerna, memotong selembar kain batik menjadi 8 bagian sama besar untuk dijadikan taplak meja. Bagian kain yang sudah terjual adalah 3 bagian. Pecahan yang senilai dengan bagian kain yang sudah terjual Bu Aminah adalah ....',
      '2/4',
      '6/16',
      '4/6',
      '5/6',
      'B',
      1,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      2,
      'PGK',
      'Empat toko kelontong di Kecamatan Adiwerna mencatat sisa persediaan gula pasir dari stok awal masing-masing dalam bentuk pecahan sebagai berikut: Toko Makmur = 3/5 karung, Toko Barokah = 7/10 karung, Toko Sejahtera = 1/2 karung, Toko Rezeki = 13/20 karung. Berdasarkan data tersebut, pernyataan manakah yang benar? (Jawaban bisa lebih dari satu)',
      'Sisa persediaan gula paling sedikit dimiliki oleh Toko Sejahtera',
      'Toko Barokah memiliki sisa persediaan gula paling banyak',
      'Sisa gula Toko Rezeki lebih banyak daripada Toko Makmur',
      'Urutan dari yang paling sedikit ke paling banyak adalah Sejahtera, Rezeki, Makmur, Barokah',
      'A,B,C',
      1,
      'Sisa gula Toko Makmur sama banyak dengan Toko Rezeki',
      '',
      '',
      '',
      '',
      '',
      '',
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
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      4,
      'PG',
      'Rumus luas persegi panjang dengan panjang p dan lebar l adalah ... (LaTeX: $L = p \\times l$)',
      'p + l',
      '2 x (p + l)',
      'p x l',
      'p : l',
      'C',
      1,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ],
  ];

  const wsSoal = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  wsSoal['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Jenis
    { wch: 55 }, // Soal
    { wch: 30 }, // A
    { wch: 30 }, // B
    { wch: 30 }, // C
    { wch: 30 }, // D
    { wch: 16 }, // Kunci
    { wch: 12 }, // Bobot
    { wch: 30 }, // E
    { wch: 25 }, // Gambar
    { wch: 25 }, // Gambar A
    { wch: 25 }, // Gambar B
    { wch: 25 }, // Gambar C
    { wch: 25 }, // Gambar D
    { wch: 25 }, // Gambar E
  ];

  XLSX.utils.book_append_sheet(wb, wsSoal, 'TEMPLATE_SOAL');

  // Sheet 2: Petunjuk
  const petunjuk = [
    ['PANDUAN PENGISIAN TEMPLATE SOAL CBT EXCEL'],
    ['SD NEGERI HARJOSARI KIDUL 01'],
    [],
    ['KOLOM', 'STATUS', 'KETENTUAN'],
    ['No', 'Wajib', 'Nomor urut butir soal (1, 2, 3, ...)'],
    ['Jenis Soal', 'Wajib', 'Isi "PG" untuk Pilihan Ganda biasa (1 kunci), atau "PGK" untuk Pilihan Ganda Kompleks (jawaban benar lebih dari satu)'],
    ['Teks Soal', 'Wajib', 'Teks narasi dan kalimat pertanyaan soal lengkap. Mendukung rumus matematika LaTeX KaTeX, misal: $\\frac{a}{b}$ atau $x^2 + 4x = 0$'],
    ['Pilihan A - D', 'Wajib', 'Teks untuk opsi pilihan jawaban A sampai D (bisa kosong jika opsi berupa gambar)'],
    ['Kunci Jawaban', 'Wajib', 'Untuk PG: isi satu huruf (misal: "B"). Untuk PGK: isi beberapa huruf dipisah koma (misal: "A,B,C" atau "A,C")'],
    ['Bobot Nilai', 'Opsional', 'Angka bulat bobot nilai soal (default: 1 jika kosong)'],
    ['Pilihan E', 'Opsional', 'Opsi pilihan E (opsional jika memiliki 5 opsi pilihan)'],
    ['Link/URL Gambar', 'Opsional', 'Tautan gambar ilustrasi soal utama (URL https://... atau format base64)'],
    ['Gambar Opsi A - E', 'Opsional', 'Tautan URL gambar untuk opsi jawaban A s/d E (opsional, untuk soal dengan opsi bergambar)'],
    [],
    ['CATATAN TAMBAHAN:'],
    ['- Pastikan baris judul pada baris ke-1 tidak diubah namanya.'],
    ['- Kolom "Teks Soal" harus berisi narasi/pertanyaan soal, bukan jenis soal.'],
    ['- Opsi jawaban dapat menggunakan teks saja, gambar saja, maupun kombinasi teks dan gambar.'],
    ['- Anda dapat menyimpan format sebagai .xlsx, .xls, atau .csv.'],
  ];

  const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjuk);
  wsPetunjuk['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 75 }];
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
    'Bobot Nilai',
    'Pilihan E',
    'Link/URL Gambar',
    'Gambar Opsi A',
    'Gambar Opsi B',
    'Gambar Opsi C',
    'Gambar Opsi D',
    'Gambar Opsi E',
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
        q.e || '',
        q.gambar || '',
        q.a_img || '',
        q.b_img || '',
        q.c_img || '',
        q.d_img || '',
        q.e_img || '',
      ];
    } else if (q.type === 'pgk_mcma') {
      const opts = q.options || [];
      const keys = opts
        .map((o, oIdx) => (o.isKey ? String.fromCharCode(65 + oIdx) : null))
        .filter(Boolean)
        .join(',');

      return [
        idx + 1,
        'PGK',
        q.soal,
        opts[0]?.text || '',
        opts[1]?.text || '',
        opts[2]?.text || '',
        opts[3]?.text || '',
        keys || 'A',
        q.bobot || 1,
        opts[4]?.text || '',
        q.gambar || '',
        opts[0]?.img || '',
        opts[1]?.img || '',
        opts[2]?.img || '',
        opts[3]?.img || '',
        opts[4]?.img || '',
      ];
    } else {
      const rowsTxt = (q.rows || [])
        .map((r) => `${r.text} => ${r.key === 'col1' ? q.col1 : q.col2}`)
        .join('; ');
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
        '',
        q.gambar || '',
        q.rows?.[0]?.img || '',
        q.rows?.[1]?.img || '',
        q.rows?.[2]?.img || '',
        q.rows?.[3]?.img || '',
        '',
      ];
    }
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Jenis
    { wch: 55 }, // Soal
    { wch: 30 }, // A
    { wch: 30 }, // B
    { wch: 30 }, // C
    { wch: 30 }, // D
    { wch: 16 }, // Kunci
    { wch: 12 }, // Bobot
    { wch: 30 }, // E
    { wch: 25 }, // Gambar
    { wch: 25 }, // Gambar A
    { wch: 25 }, // Gambar B
    { wch: 25 }, // Gambar C
    { wch: 25 }, // Gambar D
    { wch: 25 }, // Gambar E
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'TEMPLATE_SOAL');

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
 * Accurately detects and distinguishes 'Jenis Soal' from 'Teks Soal',
 * supports single answer (PG) and complex multiple answers (PGK),KaTeX formulas,
 * options A-E, and image links.
 */
export async function parseQuestionsFromExcel(file: File): Promise<Question[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  // 1. Select the most relevant worksheet (prioritize sheet with 'soal' or 'template_soal')
  let targetSheetName = wb.SheetNames[0];
  const soalSheet = wb.SheetNames.find((name) => {
    const lower = name.toLowerCase().trim();
    return (
      lower.includes('template_soal') ||
      lower.includes('daftar_soal') ||
      lower === 'soal' ||
      lower.includes('bank_soal') ||
      lower.includes('soal')
    );
  });

  if (soalSheet) {
    targetSheetName = soalSheet;
  } else if (wb.SheetNames.length > 1) {
    // If first sheet happens to be 'petunjuk' or 'panduan', pick the other sheet
    const nonPetunjuk = wb.SheetNames.find((name) => {
      const lower = name.toLowerCase().trim();
      return !lower.includes('petunjuk') && !lower.includes('panduan') && !lower.includes('help');
    });
    if (nonPetunjuk) targetSheetName = nonPetunjuk;
  }

  const ws = wb.Sheets[targetSheetName];
  if (!ws) {
    throw new Error('Lembar kerja (sheet) soal tidak ditemukan dalam file Excel.');
  }

  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (!rawRows || rawRows.length < 2) {
    throw new Error('File tidak memiliki baris data soal.');
  }

  // 2. Detect header row index within the first 10 rows
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i];
    if (!Array.isArray(row)) continue;
    const rowStr = row.map((c) => String(c ?? '').toLowerCase().trim()).join(' ');
    // Row contains keywords like 'soal'/'pertanyaan' and ('pilihan' or 'kunci' or 'opsi' or 'jawaban' or 'jenis')
    if (
      (rowStr.includes('soal') || rowStr.includes('pertanyaan')) &&
      (rowStr.includes('pilihan') ||
        rowStr.includes('kunci') ||
        rowStr.includes('opsi') ||
        rowStr.includes('jawaban') ||
        rowStr.includes('jenis'))
    ) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex < 0) {
    headerRowIndex = 0;
  }

  const header = (rawRows[headerRowIndex] || []).map((h) =>
    String(h ?? '').trim().toLowerCase()
  );

  // 3. Identify column indices
  // Column: 'Jenis Soal' / 'Tipe Soal'
  const jenisIdx = header.findIndex(
    (h) =>
      h.includes('jenis soal') ||
      h.includes('tipe soal') ||
      h.includes('bentuk soal') ||
      h === 'jenis' ||
      h === 'tipe' ||
      h === 'type'
  );

  // Column: 'Teks Soal' / Question Text (MUST NOT MATCH 'Jenis Soal'!)
  // Priority 1: Exact matches or contains 'teks soal', 'isi soal', 'pertanyaan'
  let soalIdx = header.findIndex(
    (h, idx) =>
      idx !== jenisIdx &&
      (h === 'teks soal' ||
        h === 'soal' ||
        h === 'pertanyaan' ||
        h === 'teks pertanyaan' ||
        h === 'isi soal' ||
        h.includes('teks soal') ||
        h.includes('isi soal') ||
        h.includes('pertanyaan'))
  );

  // Priority 2: Contains 'soal' but NOT 'jenis', 'tipe', or 'bentuk'
  if (soalIdx < 0) {
    soalIdx = header.findIndex(
      (h, idx) =>
        idx !== jenisIdx &&
        !h.includes('jenis') &&
        !h.includes('tipe') &&
        !h.includes('bentuk') &&
        h.includes('soal')
    );
  }

  // Priority 3: Contains 'teks' but NOT 'jenis'
  if (soalIdx < 0) {
    soalIdx = header.findIndex(
      (h, idx) => idx !== jenisIdx && !h.includes('jenis') && h.includes('teks')
    );
  }

  // Positional fallback:
  // In template with Jenis Soal: Col 0: No, Col 1: Jenis Soal, Col 2: Teks Soal
  // In old template without Jenis Soal: Col 0: No, Col 1: Teks Soal
  if (soalIdx < 0) {
    if (jenisIdx === 1 && header.length > 2) {
      soalIdx = 2;
    } else if (jenisIdx === 0 && header.length > 1) {
      soalIdx = 1;
    } else if (header.length > 1) {
      soalIdx = 1;
    } else {
      soalIdx = 0;
    }
  }

  // Columns: Pilihan A, B, C, D, E
  const aIdx = header.findIndex(
    (h) =>
      h.includes('pilihan a') ||
      h === 'a' ||
      h.includes('opsi a') ||
      h === 'pil a' ||
      h.includes('jawaban a')
  );
  const bIdx = header.findIndex(
    (h) =>
      h.includes('pilihan b') ||
      h === 'b' ||
      h.includes('opsi b') ||
      h === 'pil b' ||
      h.includes('jawaban b')
  );
  const cIdx = header.findIndex(
    (h) =>
      h.includes('pilihan c') ||
      h === 'c' ||
      h.includes('opsi c') ||
      h === 'pil c' ||
      h.includes('jawaban c')
  );
  const dIdx = header.findIndex(
    (h) =>
      h.includes('pilihan d') ||
      h === 'd' ||
      h.includes('opsi d') ||
      h === 'pil d' ||
      h.includes('jawaban d')
  );
  const eIdx = header.findIndex(
    (h) =>
      h.includes('pilihan e') ||
      h === 'e' ||
      h.includes('opsi e') ||
      h === 'pil e' ||
      h.includes('jawaban e')
  );

  // Column: Kunci Jawaban
  const kunciIdx = header.findIndex(
    (h) => h.includes('kunci') || h.includes('jawaban') || h === 'key'
  );

  // Column: Bobot Nilai
  const bobotIdx = header.findIndex(
    (h) => h.includes('bobot') || h.includes('poin') || h.includes('skor') || h === 'bobot'
  );

  // Column: Gambar / URL Gambar Soal Utama
  const gambarIdx = header.findIndex(
    (h) =>
      (h.includes('gambar') ||
        h.includes('foto') ||
        h.includes('image') ||
        h.includes('img') ||
        h.includes('ilustrasi')) &&
      !h.includes('opsi') &&
      !h.includes('pilihan') &&
      !h.includes(' a') &&
      !h.includes(' b') &&
      !h.includes(' c') &&
      !h.includes(' d') &&
      !h.includes(' e')
  );

  // Columns: Gambar Opsi A-E
  const gambarAIdx = header.findIndex(
    (h) =>
      h.includes('gambar opsi a') ||
      h.includes('gambar pilihan a') ||
      h.includes('gambar a') ||
      h.includes('img a') ||
      h.includes('foto a') ||
      h.includes('url gambar a') ||
      h.includes('link gambar a')
  );
  const gambarBIdx = header.findIndex(
    (h) =>
      h.includes('gambar opsi b') ||
      h.includes('gambar pilihan b') ||
      h.includes('gambar b') ||
      h.includes('img b') ||
      h.includes('foto b') ||
      h.includes('url gambar b') ||
      h.includes('link gambar b')
  );
  const gambarCIdx = header.findIndex(
    (h) =>
      h.includes('gambar opsi c') ||
      h.includes('gambar pilihan c') ||
      h.includes('gambar c') ||
      h.includes('img c') ||
      h.includes('foto c') ||
      h.includes('url gambar c') ||
      h.includes('link gambar c')
  );
  const gambarDIdx = header.findIndex(
    (h) =>
      h.includes('gambar opsi d') ||
      h.includes('gambar pilihan d') ||
      h.includes('gambar d') ||
      h.includes('img d') ||
      h.includes('foto d') ||
      h.includes('url gambar d') ||
      h.includes('link gambar d')
  );
  const gambarEIdx = header.findIndex(
    (h) =>
      h.includes('gambar opsi e') ||
      h.includes('gambar pilihan e') ||
      h.includes('gambar e') ||
      h.includes('img e') ||
      h.includes('foto e') ||
      h.includes('url gambar e') ||
      h.includes('link gambar e')
  );

  const parsedQuestions: Question[] = [];

  // 4. Iterate data rows
  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    // Skip row if completely empty
    const hasContent = row.some((c) => String(c ?? '').trim() !== '');
    if (!hasContent) continue;

    // Resolve Question Text
    let soalText = soalIdx >= 0 ? String(row[soalIdx] ?? '').trim() : '';

    // Defensive check: if soalText is accidentally just 'PG', 'PGK', etc., and next column has actual text
    const isTagOnly =
      soalText.toUpperCase() === 'PG' ||
      soalText.toUpperCase() === 'PGK' ||
      soalText.toUpperCase() === 'PGK_MCMA' ||
      soalText.toUpperCase() === 'PILIHAN GANDA' ||
      soalText.toUpperCase() === 'PILIHAN GANDA KOMPLEKS';

    if (isTagOnly && row[soalIdx + 1] && String(row[soalIdx + 1]).trim().length > 3) {
      soalText = String(row[soalIdx + 1]).trim();
    }

    if (!soalText) continue;

    // Resolve Options
    const optA = aIdx >= 0 ? String(row[aIdx] ?? '').trim() : String(row[soalIdx + 1] ?? '').trim();
    const optB = bIdx >= 0 ? String(row[bIdx] ?? '').trim() : String(row[soalIdx + 2] ?? '').trim();
    const optC = cIdx >= 0 ? String(row[cIdx] ?? '').trim() : String(row[soalIdx + 3] ?? '').trim();
    const optD = dIdx >= 0 ? String(row[dIdx] ?? '').trim() : String(row[soalIdx + 4] ?? '').trim();
    const optE = eIdx >= 0 ? String(row[eIdx] ?? '').trim() : '';

    // Resolve Option Images
    const optAImg = gambarAIdx >= 0 ? String(row[gambarAIdx] ?? '').trim() : undefined;
    const optBImg = gambarBIdx >= 0 ? String(row[gambarBIdx] ?? '').trim() : undefined;
    const optCImg = gambarCIdx >= 0 ? String(row[gambarCIdx] ?? '').trim() : undefined;
    const optDImg = gambarDIdx >= 0 ? String(row[gambarDIdx] ?? '').trim() : undefined;
    const optEImg = gambarEIdx >= 0 ? String(row[gambarEIdx] ?? '').trim() : undefined;

    // Resolve Kunci
    const rawKunci = (
      kunciIdx >= 0
        ? String(row[kunciIdx] ?? '')
        : String(row[soalIdx + 5] ?? '')
    ).trim();

    // Resolve Bobot
    const rawBobot = bobotIdx >= 0 ? Number(row[bobotIdx]) : Number(row[soalIdx + 6]);
    const bobot = !isNaN(rawBobot) && rawBobot > 0 ? rawBobot : 1;

    // Resolve Gambar
    const gambarUrl = gambarIdx >= 0 ? String(row[gambarIdx] ?? '').trim() : undefined;

    // Resolve Question Type
    const rawJenis = jenisIdx >= 0 ? String(row[jenisIdx] ?? '').trim().toUpperCase() : '';

    const isMultipleKeys =
      rawKunci.includes(',') ||
      rawKunci.includes(';') ||
      rawKunci.includes(' ') ||
      (rawKunci.length > 1 &&
        !['BENAR', 'SALAH', 'TRUE', 'FALSE'].includes(rawKunci.toUpperCase()) &&
        /^[A-E,\s;]+$/i.test(rawKunci));

    const isPgk =
      rawJenis.includes('PGK') ||
      rawJenis.includes('KOMPLEKS') ||
      rawJenis.includes('MCMA') ||
      rawJenis.includes('CENTANG') ||
      isMultipleKeys;

    const isKategori =
      rawJenis.includes('KATEGORI') ||
      rawJenis.includes('BENAR_SALAH') ||
      rawJenis.includes('BENAR SALAH') ||
      rawJenis.includes('TABEL');

    if (isPgk) {
      // Pilihan Ganda Kompleks (PGK Multi Centang)
      const keys = new Set(rawKunci.toUpperCase().match(/[A-E]/g) || []);

      const options: McmaOption[] = [];
      if (optA || optAImg) options.push({ text: optA, img: optAImg || undefined, isKey: keys.has('A') });
      if (optB || optBImg) options.push({ text: optB, img: optBImg || undefined, isKey: keys.has('B') });
      if (optC || optCImg) options.push({ text: optC, img: optCImg || undefined, isKey: keys.has('C') });
      if (optD || optDImg) options.push({ text: optD, img: optDImg || undefined, isKey: keys.has('D') });
      if (optE || optEImg) options.push({ text: optE, img: optEImg || undefined, isKey: keys.has('E') });

      // Fallback if no options were resolved
      if (options.length === 0) {
        options.push(
          { text: optA || 'Pernyataan 1', img: optAImg || undefined, isKey: true },
          { text: optB || 'Pernyataan 2', img: optBImg || undefined, isKey: false }
        );
      }

      // Ensure at least one option is marked as correct key
      if (!options.some((o) => o.isKey)) {
        options[0].isKey = true;
      }

      const q: QuestionPGKMCMA = {
        type: 'pgk_mcma',
        bobot,
        soal: soalText,
        gambar: gambarUrl || undefined,
        options,
      };
      parsedQuestions.push(q);
    } else if (isKategori) {
      // Pilihan Ganda Kompleks Kategori (Tabel Benar/Salah)
      const q: QuestionPGKKategori = {
        type: 'pgk_kategori',
        bobot,
        soal: soalText,
        gambar: gambarUrl || undefined,
        col1: 'Benar',
        col2: 'Salah',
        rows: [
          { text: optA || 'Pernyataan 1', img: optAImg || undefined, key: 'col1' },
          { text: optB || 'Pernyataan 2', img: optBImg || undefined, key: 'col2' },
          ...(optC || optCImg ? [{ text: optC, img: optCImg || undefined, key: 'col1' as const }] : []),
          ...(optD || optDImg ? [{ text: optD, img: optDImg || undefined, key: 'col2' as const }] : []),
        ],
      };
      parsedQuestions.push(q);
    } else {
      // Pilihan Ganda Standar (PG)
      const cleanKunci = (rawKunci.toUpperCase().match(/[A-E]/)?.[0] || 'A') as
        | 'A'
        | 'B'
        | 'C'
        | 'D'
        | 'E';

      const q: QuestionPG = {
        type: 'pg',
        bobot,
        soal: soalText,
        gambar: gambarUrl || undefined,
        a: optA || (optAImg ? '' : '-'),
        a_img: optAImg || undefined,
        b: optB || (optBImg ? '' : '-'),
        b_img: optBImg || undefined,
        c: optC || (optCImg ? '' : '-'),
        c_img: optCImg || undefined,
        d: optD || (optDImg ? '' : '-'),
        d_img: optDImg || undefined,
        ...(optE || optEImg ? { e: optE || '', e_img: optEImg || undefined } : {}),
        kunci: cleanKunci,
      };
      parsedQuestions.push(q);
    }
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
