import * as XLSX from 'xlsx';
import { User, Role } from '../types';

export interface ParsedUserResult {
  users: User[];
  validCount: number;
  invalidCount: number;
  warnings: string[];
  classesFound: string[];
}

/**
 * Downloads an official formatted Excel (.xlsx) template for importing student/user data.
 */
export function downloadStudentTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Template Data
  const headers = ['No', 'Nama Lengkap', 'Username', 'Password', 'Kelas', 'Role'];
  const sampleData = [
    [1, 'ADINDA HIKMATUR RIZKI', 'adinda01', '123456', '6A', 'murid'],
    [2, 'AFRA MADYA SYAFIRA', 'afra02', '123456', '6A', 'murid'],
    [3, 'ALIANDO RADITYA', 'aliando03', '123456', '6A', 'murid'],
    [4, 'ALPIN DWI SAPUTRA', 'alpin04', '123456', '6A', 'murid'],
    [5, 'SITI NURHALIZA', 'siti05', '123456', '6B', 'murid'],
  ];

  const wsData = [headers, ...sampleData];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 30 }, // Nama Lengkap
    { wch: 18 }, // Username
    { wch: 15 }, // Password
    { wch: 12 }, // Kelas
    { wch: 12 }, // Role
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'DATA_MURID');

  // Sheet 2: Petunjuk Pengisian
  const petunjukData = [
    ['PETUNJUK PENGISIAN TEMPLATE DATA PENGGUNA / MURID'],
    ['SD NEGERI HARJOSARI KIDUL 01 - E-LEARNING & CBT'],
    [],
    ['KOLOM', 'STATUS', 'KETERANGAN & CONTOH'],
    ['Nama Lengkap', 'Wajib', 'Nama lengkap siswa/guru/admin. Contoh: SITI AISYAH'],
    ['Username', 'Wajib / Fleksibel', 'ID login unik, huruf kecil tanpa spasi. Contoh: siti123 atau NIS (misal: 10452). Jika kosong, sistem otomatis membuatkan dari nama.'],
    ['Password', 'Opsional', 'Kata sandi login. Contoh: 123456. Jika dikosongkan, otomatis default ke "123456".'],
    ['Kelas', 'Diisi untuk Murid', 'Rombel atau kelas siswa. Contoh: 6, 6A, 6B, atau Sesi 1. (Untuk Guru/Admin diisi "-")'],
    ['Role', 'Opsional', 'Peran akun: "murid" (siswa), "guru" (pengajar), atau "admin". Default otomatis: "murid".'],
    [],
    ['TIPS PENTING:'],
    ['- Jangan mengubah atau menghapus baris judul (Header) pada baris pertama di lembar "DATA_MURID".'],
    ['- Anda dapat langsung menyalin (Copy-Paste) data dari buku induk, Dapodik, atau daftar absensi sekolah.'],
    ['- Format file yang didukung saat upload: Excel (.xlsx, .xls) maupun CSV (.csv).'],
  ];
  const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjukData);
  wsPetunjuk['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'PETUNJUK');

  // Trigger download in browser
  const filename = 'Template_Data_Murid_CBT.xlsx';
  try {
    XLSX.writeFile(wb, filename);
  } catch {
    // Fallback using Blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
 * Downloads a simple CSV template as an alternative.
 */
export function downloadStudentTemplateCSV(): void {
  const csvContent =
    'No,Nama Lengkap,Username,Password,Kelas,Role\n' +
    '1,ADINDA HIKMATUR RIZKI,adinda01,123456,6A,murid\n' +
    '2,AFRA MADYA SYAFIRA,afra02,123456,6A,murid\n' +
    '3,ALIANDO RADITYA,aliando03,123456,6A,murid\n' +
    '4,ALPIN DWI SAPUTRA,alpin04,123456,6A,murid\n' +
    '5,SITI NURHALIZA,siti05,123456,6B,murid\n';

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Data_Murid_CBT.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Normalizes header key for flexible fuzzy matching
 */
function cleanHeaderKey(key: string): string {
  return (key || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV file into a list of normalized User objects.
 */
export async function parseUserExcelFile(file: File): Promise<ParsedUserResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  // Prioritize sheet with name matching DATA_MURID or SISWA or MURID, else first sheet
  const sheetNames = workbook.SheetNames;
  let targetSheetName = sheetNames[0];
  const preferredSheet = sheetNames.find((s) => {
    const sLower = s.toLowerCase();
    return sLower.includes('murid') || sLower.includes('siswa') || sLower.includes('user') || sLower.includes('data');
  });
  if (preferredSheet) {
    targetSheetName = preferredSheet;
  }

  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) {
    throw new Error('Lembar kerja (worksheet) tidak ditemukan dalam file.');
  }

  // Convert to array of objects
  const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('File Excel kosong atau tidak memiliki data baris.');
  }

  const users: User[] = [];
  const warnings: string[] = [];
  const classesSet = new Set<string>();
  const seenUsernames = new Set<string>();

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // +1 for 0-index, +1 for header row

    // Find keys by fuzzy match
    let namaVal = '';
    let usernameVal = '';
    let passwordVal = '';
    let kelasVal = '';
    let roleVal = '';

    for (const rawKey of Object.keys(row)) {
      const k = cleanHeaderKey(rawKey);
      const val = String(row[rawKey] ?? '').trim();

      if (k === 'nama' || k === 'namalengkap' || k === 'namasiswa' || k === 'namamurid' || k === 'name' || k === 'fullname') {
        namaVal = val;
      } else if (k === 'username' || k === 'user' || k === 'nis' || k === 'nisn' || k === 'noinduk' || k === 'id') {
        usernameVal = val;
      } else if (k === 'password' || k === 'pass' || k === 'katasandi' || k === 'sandi' || k === 'pin') {
        passwordVal = val;
      } else if (k === 'kelas' || k === 'kelasses' || k === 'kelassesi' || k === 'rombel' || k === 'tingkat' || k === 'class') {
        kelasVal = val;
      } else if (k === 'role' || k === 'peran' || k === 'jabatan' || k === 'tipe') {
        roleVal = val;
      }
    }

    // Skip totally empty rows
    if (!namaVal && !usernameVal && !kelasVal) {
      return;
    }

    if (!namaVal) {
      warnings.push(`Baris ${rowNum}: Nama kosong, baris ini dilewati.`);
      return;
    }

    // Determine Role
    let finalRole: Role = 'murid';
    const rLower = roleVal.toLowerCase();
    if (rLower.includes('guru') || rLower.includes('pengajar') || rLower.includes('teacher')) {
      finalRole = 'guru';
    } else if (rLower.includes('admin')) {
      finalRole = 'admin';
    }

    // Generate or clean username
    let finalUsername = usernameVal.toLowerCase().replace(/\s+/g, '');
    if (!finalUsername) {
      // Auto-generate username from name
      const cleanName = namaVal.toLowerCase().replace(/[^a-z0-9]/g, '');
      const prefix = cleanName.slice(0, 8) || 'murid';
      let candidate = `${prefix}${String(index + 1).padStart(2, '0')}`;
      let counter = 1;
      while (seenUsernames.has(candidate)) {
        counter++;
        candidate = `${prefix}${String(counter).padStart(2, '0')}`;
      }
      finalUsername = candidate;
      warnings.push(`Baris ${rowNum} (${namaVal}): Username kosong, otomatis dibuatkan "${finalUsername}".`);
    }

    // Handle internal duplicates within the uploaded file
    if (seenUsernames.has(finalUsername)) {
      const suffix = Math.floor(10 + Math.random() * 90);
      const newUsername = `${finalUsername}${suffix}`;
      warnings.push(`Baris ${rowNum} (${namaVal}): Username "${finalUsername}" duplikat di file, diubah menjadi "${newUsername}".`);
      finalUsername = newUsername;
    }
    seenUsernames.add(finalUsername);

    // Default password
    let finalPassword = passwordVal;
    if (!finalPassword) {
      finalPassword = '123456';
    }

    // Kelas
    let finalKelas = kelasVal;
    if (finalRole === 'murid' && !finalKelas) {
      finalKelas = '6A';
    } else if (finalRole !== 'murid') {
      finalKelas = '-';
    }

    if (finalKelas && finalKelas !== '-') {
      classesSet.add(finalKelas);
    }

    users.push({
      nama: namaVal,
      username: finalUsername,
      password: finalPassword,
      role: finalRole,
      kelas: finalKelas,
    });
  });

  return {
    users,
    validCount: users.length,
    invalidCount: rawRows.length - users.length,
    warnings,
    classesFound: Array.from(classesSet),
  };
}
