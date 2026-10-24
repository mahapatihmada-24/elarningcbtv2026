import { User, Materi, Ujian, Nilai } from '../types';

export const INITIAL_USERS: User[] = [
  {
    nama: 'Administrator',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    kelas: '-',
  },
  {
    nama: 'Wildan Pramadika, S.Pd.',
    username: 'guru',
    password: 'guru123',
    role: 'guru',
    kelas: '6A',
    nip: '199208152019031008',
  },
  {
    nama: 'Arsyad',
    username: 'arsyad',
    password: '12345',
    role: 'murid',
    kelas: '6A',
  },
  {
    nama: 'Nabila Putri',
    username: 'nabila',
    password: '12345',
    role: 'murid',
    kelas: '6A',
  },
];

export const INITIAL_MATERI: Materi[] = [
  {
    ID: 'MAT-1710001001',
    Judul: 'Operasi Hitung Pecahan dan Desimal',
    Mapel: 'Matematika',
    Kelas: '6A',
    Konten_Link: `Dalam pembelajaran kali ini, kita akan memahami cara menjumlahkan dan mengalikan bilangan pecahan biasa dan desimal.

Rumus Penjumlahan Pecahan:
$\\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}$

Contoh Soal:
Hitunglah hasil dari:
$\\frac{1}{2} + \\frac{1}{4} = \\frac{2}{4} + \\frac{1}{4} = \\frac{3}{4} = 0,75$

Perhatikan video penjelasan selengkapnya melalui tautan YouTube resmi di bawah ini:
https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
    Gambar_URL: '',
    Sumber: 'Buku Siswa Matematika Kelas VI Kemendikbudristek 2024',
    Nama_Guru: 'Wildan Pramadika, S.Pd.',
  },
  {
    ID: 'MAT-1710001002',
    Judul: 'Siklus Air dan Kelestarian Lingkungan',
    Mapel: 'IPAS',
    Kelas: '6A',
    Konten_Link: `Siklus air (hidrologi) adalah perputaran air secara terus-menerus dari bumi ke atmosfer dan kembali ke bumi.

Tahapan Siklus Air:
1. Evaporasi: Penguapan air dari danau, sungai, atau laut karena panas matahari.
2. Kondensasi: Uap air berubah menjadi titik-titik air pembentuk awan.
3. Presipitasi: Titik-titik air jatuh ke bumi sebagai hujan.
4. Infiltrasi: Air meresap ke dalam pori-pori tanah.

Mari kita jaga kelestarian hutan dan daerah resapan air agar sumber air bersih di Harjosari Kidul tetap melimpah!`,
    Gambar_URL: '',
    Sumber: 'Buku IPAS Kelas 6 Bab 2 Kurikulum Merdeka',
    Nama_Guru: 'Wildan Pramadika, S.Pd.',
  },
];

export const INITIAL_UJIAN: Ujian[] = [
  {
    ID: 'EXAM-1710002001',
    Judul_Ujian: 'Asesmen Sumatif Bab 1: Matematika & Sains',
    Jenis_Ujian: 'Aspek Sumatif',
    Mapel: 'Matematika',
    Kelas: '6A',
    Durasi_Menit: 30,
    Status: 'Aktif',
    Soal_JSON: JSON.stringify({
      config: {
        sesi: 'Semua',
        max_attempts: 2,
        acak_soal: true,
        acak_opsi: true,
        jenis: 'Aspek Sumatif',
      },
      questions: [
        {
          type: 'pg',
          bobot: 1,
          soal: 'Hasil penjumlahan dari $\\frac{1}{2} + \\frac{1}{4}$ dalam bentuk pecahan yang paling sederhana adalah...',
          a: '$\\frac{2}{6}$',
          b: '$\\frac{3}{4}$',
          c: '$\\frac{1}{8}$',
          d: '$\\frac{5}{4}$',
          kunci: 'B',
          pembahasan: 'Samakan penyebut menjadi 4: $\\frac{1}{2} = \\frac{2}{4}$. Maka $\\frac{2}{4} + \\frac{1}{4} = \\frac{3}{4}$. Jawaban yang benar adalah B.',
        },
        {
          type: 'pgk_mcma',
          bobot: 1,
          soal: 'Pilihlah tahapan yang merupakan bagian dari siklus hidrologi (air) di alam! (Boleh memilih lebih dari satu)',
          options: [
            { text: 'Evaporasi (penguapan air karena terik matahari)', isKey: true },
            { text: 'Kondensasi (pembentukan awan dari uap air)', isKey: true },
            { text: 'Fotosintesis klorofil tanaman', isKey: false },
            { text: 'Presipitasi (turunnya hujan ke permukaan bumi)', isKey: true },
          ],
          pembahasan: 'Tahapan siklus air meliputi Evaporasi (penguapan), Kondensasi (pembentukan awan), dan Presipitasi (turunnya hujan). Fotosintesis adalah pembuatan makanan pada tumbuhan berklorofil.',
        },
        {
          type: 'pgk_kategori',
          bobot: 1,
          soal: 'Tentukan apakah pernyataan mengenai sifat bangun datar dan pecahan berikut Benar atau Salah!',
          col1: 'Benar',
          col2: 'Salah',
          rows: [
            { text: 'Nilai pecahan $\\frac{2}{4}$ senilai dengan $\\frac{1}{2}$', key: 'col1' },
            { text: 'Segitiga sama sisi memiliki 4 sisi yang sama panjang', key: 'col2' },
            { text: 'Bilangan desimal 0,5 jika diubah ke persen menjadi 50%', key: 'col1' },
          ],
          pembahasan: '1. Pecahan 2/4 jika disederhanakan dengan membagi pembilang dan penyebut dengan 2 bernilai 1/2 (Benar).\n2. Segitiga memiliki 3 sisi, bukan 4 sisi (Salah).\n3. Desimal 0,5 = 5/10 = 50/100 = 50% (Benar).',
        },
      ],
    }),
  },
];

export const INITIAL_NILAI: Nilai[] = [
  {
    ID: 'NILAI-1710003001',
    ID_Ujian: 'EXAM-1710002001',
    Judul_Ujian: 'Asesmen Sumatif Bab 1: Matematika & Sains',
    Nama_Murid: 'Nabila Putri',
    Kelas: '6A',
    Nilai: 100,
    Pelanggaran: 0,
    Waktu_Submit: '2026-09-18 09:15',
    Jawaban_JSON: JSON.stringify({
      0: 'B',
      1: [true, true, false, true],
      2: { 0: 'col1', 1: 'col2', 2: 'col1' },
    }),
  },
];
