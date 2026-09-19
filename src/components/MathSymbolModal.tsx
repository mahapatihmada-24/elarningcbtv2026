import React, { useState } from 'react';
import {
  X,
  Search,
  Copy,
  Check,
  PlusCircle,
  BookOpen,
  Sparkles,
  Calculator,
  Compass,
  Layers,
  GraduationCap,
  Info,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

export interface MathSymbolItem {
  id: string;
  symbol: string;
  insertValue: string;
  isLatex?: boolean;
  name: string;
  category: 'operasi' | 'perbandingan' | 'aljabar' | 'geometri' | 'himpunan' | 'kalkulus';
  categoryLabel: string;
  explanation: string;
  example: string;
  readAs?: string;
}

export const MATH_SYMBOLS_DATA: MathSymbolItem[] = [
  // 1. Simbol Operasi Dasar
  {
    id: 'tambah',
    symbol: '+',
    insertValue: '+',
    name: 'Penjumlahan (Plus)',
    category: 'operasi',
    categoryLabel: 'Operasi Dasar',
    explanation: 'Menjumlahkan dua angka atau lebih menjadi nilai total.',
    example: '2 + 3 = 5',
    readAs: 'tambah / plus',
  },
  {
    id: 'kurang',
    symbol: '-',
    insertValue: '-',
    name: 'Pengurangan (Minus)',
    category: 'operasi',
    categoryLabel: 'Operasi Dasar',
    explanation: 'Mengurangi suatu angka dengan angka lain.',
    example: '5 - 2 = 3',
    readAs: 'kurang / minus',
  },
  {
    id: 'kali',
    symbol: '×',
    insertValue: '×',
    name: 'Perkalian (Kali)',
    category: 'operasi',
    categoryLabel: 'Operasi Dasar',
    explanation: 'Mengalikan angka secara berulang sesuai faktor pengali.',
    example: '4 × 3 = 12',
    readAs: 'kali',
  },
  {
    id: 'bagi',
    symbol: '÷',
    insertValue: '÷',
    name: 'Pembagian (Bagi)',
    category: 'operasi',
    categoryLabel: 'Operasi Dasar',
    explanation: 'Membagi angka ke dalam bagian-bagian yang sama banyak.',
    example: '10 ÷ 2 = 5',
    readAs: 'dibagi',
  },
  {
    id: 'plusminus',
    symbol: '±',
    insertValue: '±',
    name: 'Plus-Minus',
    category: 'operasi',
    categoryLabel: 'Operasi Dasar',
    explanation: 'Menunjukkan dua kemungkinan nilai sekaligus (positif atau negatif) atau batas toleransi.',
    example: 'x = ± 3 (artinya x = 3 atau x = -3)',
    readAs: 'kurang lebih / plus minus',
  },
  {
    id: 'kali_asterisk',
    symbol: '*',
    insertValue: '*',
    name: 'Perkalian Komputer (Asterisk)',
    category: 'operasi',
    categoryLabel: 'Operasi Dasar',
    explanation: 'Simbol alternatif perkalian standar yang sering digunakan pada sistem komputer.',
    example: '6 * 7 = 42',
    readAs: 'kali',
  },
  {
    id: 'garis_miring',
    symbol: '/',
    insertValue: '/',
    name: 'Garis Miring (Slash)',
    category: 'operasi',
    categoryLabel: 'Operasi Dasar',
    explanation: 'Alternatif pembagian atau penulisan rasio perbandingan.',
    example: '12 / 4 = 3',
    readAs: 'per / bagi',
  },

  // 2. Simbol Perbandingan
  {
    id: 'samadengan',
    symbol: '=',
    insertValue: '=',
    name: 'Sama Dengan',
    category: 'perbandingan',
    categoryLabel: 'Perbandingan',
    explanation: 'Menunjukkan nilai atau ekspresi yang sama persis di kedua sisi.',
    example: '2 + 3 = 5',
    readAs: 'sama dengan',
  },
  {
    id: 'tidaksamadengan',
    symbol: '≠',
    insertValue: '≠',
    name: 'Tidak Sama Dengan',
    category: 'perbandingan',
    categoryLabel: 'Perbandingan',
    explanation: 'Menunjukkan bahwa kedua nilai di sisi kiri dan kanan tidak bernilai sama.',
    example: '5 ≠ 3',
    readAs: 'tidak sama dengan',
  },
  {
    id: 'lebihbesar',
    symbol: '>',
    insertValue: '>',
    name: 'Lebih Besar Dari',
    category: 'perbandingan',
    categoryLabel: 'Perbandingan',
    explanation: 'Angka di sebelah kiri memiliki nilai lebih besar daripada angka di kanan.',
    example: '5 > 3',
    readAs: 'lebih besar dari',
  },
  {
    id: 'lebihkecil',
    symbol: '<',
    insertValue: '<',
    name: 'Lebih Kecil Dari',
    category: 'perbandingan',
    categoryLabel: 'Perbandingan',
    explanation: 'Angka di sebelah kiri memiliki nilai lebih kecil daripada angka di kanan.',
    example: '3 < 5',
    readAs: 'lebih kecil dari',
  },
  {
    id: 'lebihbesarsamadengan',
    symbol: '≥',
    insertValue: '≥',
    name: 'Lebih Dari atau Sama Dengan',
    category: 'perbandingan',
    categoryLabel: 'Perbandingan',
    explanation: 'Nilai di sebelah kiri bernilai lebih besar atau minimal sama dengan pembandingnya.',
    example: 'x ≥ 75 (nilai kelulusan minimal 75)',
    readAs: 'lebih dari atau sama dengan',
  },
  {
    id: 'lebihkecilsamadengan',
    symbol: '≤',
    insertValue: '≤',
    name: 'Kurang Dari atau Sama Dengan',
    category: 'perbandingan',
    categoryLabel: 'Perbandingan',
    explanation: 'Nilai di sebelah kiri bernilai lebih kecil atau maksimal sama dengan pembandingnya.',
    example: 'skor ≤ 100',
    readAs: 'kurang dari atau sama dengan',
  },
  {
    id: 'mendekati',
    symbol: '≈',
    insertValue: '≈',
    name: 'Kira-kira / Mendekati',
    category: 'perbandingan',
    categoryLabel: 'Perbandingan',
    explanation: 'Menunjukkan nilai pembulatan atau perkiraan yang hampir sama.',
    example: 'π ≈ 3.14 atau \\(\\sqrt{2} \\approx 1.41\\)',
    readAs: 'mendekati / kira-kira',
  },
  {
    id: 'identik',
    symbol: '≡',
    insertValue: '≡',
    name: 'Identik / Ekuivalen',
    category: 'perbandingan',
    categoryLabel: 'Perbandingan',
    explanation: 'Menunjukkan kesamaan identitas aljabar atau kongruensi modulo.',
    example: 'A ≡ B',
    readAs: 'ekuivalen dengan',
  },
  {
    id: 'sebanding',
    symbol: '~',
    insertValue: '~',
    name: 'Sebanding / Serupa',
    category: 'perbandingan',
    categoryLabel: 'Perbandingan',
    explanation: 'Menunjukkan bangun datar yang sebangun atau nilai yang proporsional.',
    example: '△ABC ~ △PQR',
    readAs: 'sebangun / sebanding',
  },

  // 3. Simbol Aljabar dan Lainnya
  {
    id: 'akar_kuadrat',
    symbol: '√',
    insertValue: '√',
    name: 'Akar Kuadrat (Simbol)',
    category: 'aljabar',
    categoryLabel: 'Aljabar & Bilangan',
    explanation: 'Mencari akar pangkat dua dari suatu angka.',
    example: '√16 = 4 (karena 4 × 4 = 16)',
    readAs: 'akar kuadrat dari',
  },
  {
    id: 'akar_latex',
    symbol: '\\(\\sqrt{x}\\)',
    insertValue: '\\(\\sqrt{x}\\)',
    isLatex: true,
    name: 'Akar Kuadrat (Format Rumus)',
    category: 'aljabar',
    categoryLabel: 'Aljabar & Bilangan',
    explanation: 'Penulisan akar kuadrat bergaris atas yang rapi menggunakan format rumus matematika.',
    example: '\\(\\sqrt{25} = 5\\)',
    readAs: 'akar kuadrat dari x',
  },
  {
    id: 'akar_pangkat_n',
    symbol: '\\(\\sqrt[n]{x}\\)',
    insertValue: '\\(\\sqrt[3]{x}\\)',
    isLatex: true,
    name: 'Akar Pangkat n',
    category: 'aljabar',
    categoryLabel: 'Aljabar & Bilangan',
    explanation: 'Mencari akar pangkat n (misal akar pangkat tiga atau kubik).',
    example: '\\(\\sqrt[3]{27} = 3\\)',
    readAs: 'akar pangkat n dari x',
  },
  {
    id: 'pecahan_rumus',
    symbol: '\\(\\frac{a}{b}\\)',
    insertValue: '\\(\\frac{a}{b}\\)',
    isLatex: true,
    name: 'Pecahan Biasa (Rumus)',
    category: 'aljabar',
    categoryLabel: 'Aljabar & Bilangan',
    explanation: 'Menyajikan bilangan pecahan dengan pembilang di atas dan penyebut di bawah.',
    example: '\\(\\frac{22}{7}\\) atau \\(\\frac{1}{2} + \\frac{1}{4} = \\frac{3}{4}\\)',
    readAs: 'a per b',
  },
  {
    id: 'pi',
    symbol: 'π',
    insertValue: 'π',
    name: 'Pi (Konstanta Lingkaran)',
    category: 'aljabar',
    categoryLabel: 'Aljabar & Bilangan',
    explanation: 'Konstanta rasio keliling lingkaran terhadap diameternya bernilai sekitar 3.14 atau \\(\\frac{22}{7}\\).',
    example: 'Keliling = 2 × π × r (π ≈ 3.14 atau \\(\\frac{22}{7}\\))',
    readAs: 'pi',
  },
  {
    id: 'takhingga',
    symbol: '∞',
    insertValue: '∞',
    name: 'Tak Terhingga (Infinity)',
    category: 'aljabar',
    categoryLabel: 'Aljabar & Bilangan',
    explanation: 'Menunjukkan jumlah atau besaran yang melampaui segala batas bilangan riil.',
    example: 'lim (1/x) saat x menuju 0 = ∞',
    readAs: 'tak terhingga / tak hingga',
  },
  {
    id: 'persen',
    symbol: '%',
    insertValue: '%',
    name: 'Persen (Per Seratus)',
    category: 'aljabar',
    categoryLabel: 'Aljabar & Bilangan',
    explanation: 'Pecahan dengan penyebut seratus (per seratus).',
    example: '50% = \\(\\frac{50}{100} = 0.5\\)',
    readAs: 'persen',
  },
  {
    id: 'permil',
    symbol: '‰',
    insertValue: '‰',
    name: 'Permil (Per Seribu)',
    category: 'aljabar',
    categoryLabel: 'Aljabar & Bilangan',
    explanation: 'Pecahan dengan penyebut seribu (per seribu).',
    example: '25‰ = \\(\\frac{25}{1000}\\)',
    readAs: 'permil',
  },
  {
    id: 'pangkat_dua',
    symbol: '²',
    insertValue: '²',
    name: 'Pangkat Dua (Kuadrat)',
    category: 'aljabar',
    categoryLabel: 'Aljabar & Bilangan',
    explanation: 'Mengalikan bilangan dengan dirinya sendiri satu kali.',
    example: 'Luas persegi = s² = 5² = 25 cm²',
    readAs: 'kuadrat / pangkat dua',
  },
  {
    id: 'pangkat_tiga',
    symbol: '³',
    insertValue: '³',
    name: 'Pangkat Tiga (Kubik)',
    category: 'aljabar',
    categoryLabel: 'Aljabar & Bilangan',
    explanation: 'Mengalikan bilangan dengan dirinya sendiri tiga kali.',
    example: 'Volume kubus = s³ = 4³ = 64 cm³',
    readAs: 'kubik / pangkat tiga',
  },
  {
    id: 'pangkat_n_latex',
    symbol: '\\(x^n\\)',
    insertValue: '\\(x^n\\)',
    isLatex: true,
    name: 'Pangkat Bebas (Eksponen)',
    category: 'aljabar',
    categoryLabel: 'Aljabar & Bilangan',
    explanation: 'Eksponensial angka x berpangkat n.',
    example: '\\(2^5 = 32\\)',
    readAs: 'x pangkat n',
  },
  {
    id: 'nilai_mutlak',
    symbol: '|x|',
    insertValue: '|x|',
    name: 'Nilai Mutlak',
    category: 'aljabar',
    categoryLabel: 'Aljabar & Bilangan',
    explanation: 'Jarak suatu bilangan dari nol pada garis bilangan (selalu non-negatif).',
    example: '|-5| = 5 dan |5| = 5',
    readAs: 'nilai mutlak x',
  },

  // 4. Simbol Geometri & Sudut
  {
    id: 'derajat',
    symbol: '°',
    insertValue: '°',
    name: 'Derajat (Sudut / Suhu)',
    category: 'geometri',
    categoryLabel: 'Geometri & Sudut',
    explanation: 'Satuan ukuran sudut rotasi putaran atau skala temperatur.',
    example: 'Sudut siku-siku = 90°, satu putaran penuh = 360°',
    readAs: 'derajat',
  },
  {
    id: 'simbol_sudut',
    symbol: '∠',
    insertValue: '∠',
    name: 'Sudut',
    category: 'geometri',
    categoryLabel: 'Geometri & Sudut',
    explanation: 'Notasi untuk menyebutkan suatu bidang sudut yang dibentuk dua garis.',
    example: '∠ABC = 45°',
    readAs: 'sudut',
  },
  {
    id: 'simbol_segitiga',
    symbol: '△',
    insertValue: '△',
    name: 'Segitiga',
    category: 'geometri',
    categoryLabel: 'Geometri & Sudut',
    explanation: 'Notasi bidang datar segitiga yang menghubungkan tiga titik sudut.',
    example: '△ABC sama sisi',
    readAs: 'segitiga',
  },
  {
    id: 'tegak_lurus',
    symbol: '⊥',
    insertValue: '⊥',
    name: 'Tegak Lurus (Perpendicular)',
    category: 'geometri',
    categoryLabel: 'Geometri & Sudut',
    explanation: 'Dua garis lurus yang berpotongan membentuk sudut siku-siku (90°).',
    example: 'Garis AB ⊥ Garis CD',
    readAs: 'tegak lurus dengan',
  },
  {
    id: 'sejajar',
    symbol: '∥',
    insertValue: '∥',
    name: 'Sejajar (Parallel)',
    category: 'geometri',
    categoryLabel: 'Geometri & Sudut',
    explanation: 'Dua garis lurus pada bidang yang sama yang tidak akan pernah berpotongan.',
    example: 'Garis k ∥ Garis m',
    readAs: 'sejajar dengan',
  },
  {
    id: 'diameter',
    symbol: '⌀',
    insertValue: '⌀',
    name: 'Diameter Lingkaran',
    category: 'geometri',
    categoryLabel: 'Geometri & Sudut',
    explanation: 'Panjang garis lurus yang menghubungkan dua titik pada keliling melalui titik pusat.',
    example: '⌀ = 2 × r = 14 cm',
    readAs: 'diameter',
  },

  // 5. Simbol Teori Himpunan & Logika (Tingkat Lanjut)
  {
    id: 'elemen_himpunan',
    symbol: '∈',
    insertValue: '∈',
    name: 'Elemen / Anggota Himpunan',
    category: 'himpunan',
    categoryLabel: 'Teori Himpunan',
    explanation: 'Menyatakan bahwa suatu objek merupakan anggota dari suatu himpunan.',
    example: '2 ∈ {2, 4, 6, 8}',
    readAs: 'anggota dari / elemen dari',
  },
  {
    id: 'bukan_elemen',
    symbol: '∉',
    insertValue: '∉',
    name: 'Bukan Anggota Himpunan',
    category: 'himpunan',
    categoryLabel: 'Teori Himpunan',
    explanation: 'Menyatakan bahwa suatu objek bukan merupakan anggota himpunan.',
    example: '3 ∉ {2, 4, 6, 8}',
    readAs: 'bukan anggota dari',
  },
  {
    id: 'subset',
    symbol: '⊂',
    insertValue: '⊂',
    name: 'Himpunan Bagian (Subset)',
    category: 'himpunan',
    categoryLabel: 'Teori Himpunan',
    explanation: 'Setiap anggota dari himpunan pertama termuat di himpunan kedua.',
    example: '{2, 4} ⊂ {1, 2, 3, 4, 5}',
    readAs: 'himpunan bagian dari',
  },
  {
    id: 'gabungan',
    symbol: '∪',
    insertValue: '∪',
    name: 'Gabungan (Union)',
    category: 'himpunan',
    categoryLabel: 'Teori Himpunan',
    explanation: 'Menggabungkan semua anggota dari himpunan A dan himpunan B.',
    example: '{1, 2} ∪ {2, 3} = {1, 2, 3}',
    readAs: 'gabungan / union',
  },
  {
    id: 'irisan',
    symbol: '∩',
    insertValue: '∩',
    name: 'Irisan (Intersection)',
    category: 'himpunan',
    categoryLabel: 'Teori Himpunan',
    explanation: 'Anggota yang sama-sama dimiliki oleh kedua himpunan.',
    example: '{1, 2, 3} ∩ {2, 3, 4} = {2, 3}',
    readAs: 'irisan / interseksi',
  },
  {
    id: 'himpunan_kosong',
    symbol: '∅',
    insertValue: '∅',
    name: 'Himpunan Kosong',
    category: 'himpunan',
    categoryLabel: 'Teori Himpunan',
    explanation: 'Himpunan yang tidak mempunyai satupun anggota.',
    example: 'A = ∅ atau A = {}',
    readAs: 'himpunan kosong',
  },
  {
    id: 'untuk_semua',
    symbol: '∀',
    insertValue: '∀',
    name: 'Untuk Semua (Universal Quantifier)',
    category: 'himpunan',
    categoryLabel: 'Teori Himpunan',
    explanation: 'Menunjukkan pernyataan berlaku benar untuk seluruh anggota dalam semesta.',
    example: '∀x > 0, x² > 0',
    readAs: 'untuk setiap / untuk semua',
  },
  {
    id: 'terdapat',
    symbol: '∃',
    insertValue: '∃',
    name: 'Terdapat / Ada (Existential Quantifier)',
    category: 'himpunan',
    categoryLabel: 'Teori Himpunan',
    explanation: 'Sedikitnya terdapat satu anggota yang memenuhi syarat.',
    example: '∃x bilangan genap prima (yaitu 2)',
    readAs: 'ada / terdapat',
  },
  {
    id: 'kesimpulan',
    symbol: '∴',
    insertValue: '∴',
    name: 'Oleh Karena Itu (Therefore)',
    category: 'himpunan',
    categoryLabel: 'Teori Himpunan',
    explanation: 'Menyimpulkan hasil akhir penalaran atau pembuktian logika matematika.',
    example: 'a = b dan b = c ∴ a = c',
    readAs: 'oleh karena itu / jadi',
  },

  // 6. Kalkulus, Statistika & Simbol Yunani
  {
    id: 'sigma_sum',
    symbol: 'Σ',
    insertValue: 'Σ',
    name: 'Sigma (Notasi Penjumlahan Deret)',
    category: 'kalkulus',
    categoryLabel: 'Kalkulus & Statistika',
    explanation: 'Menjumlahkan seluruh suku bilangan secara beruntun dari indeks awal hingga akhir.',
    example: '\\(\\sum_{i=1}^{n} x_i\\) (penjumlahan data sampel)',
    readAs: 'sigma / jumlah dari',
  },
  {
    id: 'integral',
    symbol: '∫',
    insertValue: '∫',
    name: 'Integral',
    category: 'kalkulus',
    categoryLabel: 'Kalkulus & Statistika',
    explanation: 'Operasi kalkulus untuk menghitung luas daerah di bawah kurva, volume, atau antiturunan.',
    example: '\\(\\int x\\, dx = \\frac{1}{2}x^2 + C\\)',
    readAs: 'integral',
  },
  {
    id: 'limit',
    symbol: 'lim',
    insertValue: '\\(\\lim_{x \\to a} f(x)\\)',
    isLatex: true,
    name: 'Limit Fungsi',
    category: 'kalkulus',
    categoryLabel: 'Kalkulus & Statistika',
    explanation: 'Nilai pendekatan suatu fungsi matematika saat variabel mendekati titik tertentu.',
    example: '\\(\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1\\)',
    readAs: 'limit',
  },
  {
    id: 'delta',
    symbol: 'Δ',
    insertValue: 'Δ',
    name: 'Delta (Perubahan Nilai)',
    category: 'kalkulus',
    categoryLabel: 'Kalkulus & Statistika',
    explanation: 'Menunjukkan selisih atau perubahan antara nilai akhir dan nilai awal.',
    example: 'Gradien m = Δy / Δx = \\(\\frac{y_2 - y_1}{x_2 - x_1}\\)',
    readAs: 'delta / perubahan',
  },
  {
    id: 'alfa',
    symbol: 'α',
    insertValue: 'α',
    name: 'Alfa (Alpha)',
    category: 'kalkulus',
    categoryLabel: 'Kalkulus & Statistika',
    explanation: 'Huruf Yunani pertama, sering digunakan untuk variabel sudut atau tingkat signifikansi uji.',
    example: 'sin α = 0.5',
    readAs: 'alfa',
  },
  {
    id: 'beta',
    symbol: 'β',
    insertValue: 'β',
    name: 'Beta (Beta)',
    category: 'kalkulus',
    categoryLabel: 'Kalkulus & Statistika',
    explanation: 'Huruf Yunani kedua, sering dipasangkan dengan alfa untuk sudut kedua.',
    example: 'cos β = 0.8',
    readAs: 'beta',
  },
  {
    id: 'theta',
    symbol: 'θ',
    insertValue: 'θ',
    name: 'Theta (Sudut Trigonometri)',
    category: 'kalkulus',
    categoryLabel: 'Kalkulus & Statistika',
    explanation: 'Simbol standar paling umum untuk merepresentasikan besaran sudut.',
    example: 'sin² θ + cos² θ = 1',
    readAs: 'teta / theta',
  },
  {
    id: 'mu_rata_rata',
    symbol: 'μ',
    insertValue: 'μ',
    name: 'Mu (Rata-rata Populasi)',
    category: 'kalkulus',
    categoryLabel: 'Kalkulus & Statistika',
    explanation: 'Nilai mean (rata-rata) pada suatu populasi data statistik.',
    example: 'μ = 75.5',
    readAs: 'mu',
  },
  {
    id: 'sigma_kecil',
    symbol: 'σ',
    insertValue: 'σ',
    name: 'Sigma Kecil (Standar Deviasi)',
    category: 'kalkulus',
    categoryLabel: 'Kalkulus & Statistika',
    explanation: 'Ukuran persebaran atau simpangan baku data populasi.',
    example: 'Variansi = σ²',
    readAs: 'sigma',
  },
  {
    id: 'x_bar',
    symbol: 'x̄',
    insertValue: 'x̄',
    name: 'X-Bar (Rata-rata Sampel)',
    category: 'kalkulus',
    categoryLabel: 'Kalkulus & Statistika',
    explanation: 'Nilai rata-rata hitung (mean) dari data sampel yang diobservasi.',
    example: 'x̄ = \\(\\frac{\\sum x}{n}\\)',
    readAs: 'x bar',
  },
];

interface MathSymbolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert?: (symbolSnippet: string) => void;
  initialTab?: 'palet' | 'rangkuman';
}

export const MathSymbolModal: React.FC<MathSymbolModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialTab = 'palet',
}) => {
  const [activeTab, setActiveTab] = useState<'palet' | 'rangkuman'>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'semua', label: 'Semua Simbol', icon: Sparkles },
    { id: 'operasi', label: 'Operasi Dasar', icon: Calculator },
    { id: 'perbandingan', label: 'Perbandingan', icon: Compass },
    { id: 'aljabar', label: 'Aljabar & Bilangan', icon: Layers },
    { id: 'geometri', label: 'Geometri & Sudut', icon: Compass },
    { id: 'himpunan', label: 'Teori Himpunan', icon: Layers },
    { id: 'kalkulus', label: 'Kalkulus & Statistika', icon: GraduationCap },
  ];

  const filteredSymbols = MATH_SYMBOLS_DATA.filter((item) => {
    const matchCat = selectedCategory === 'semua' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchCat;

    const matchQuery =
      item.name.toLowerCase().includes(query) ||
      item.symbol.toLowerCase().includes(query) ||
      item.explanation.toLowerCase().includes(query) ||
      item.example.toLowerCase().includes(query) ||
      (item.readAs && item.readAs.toLowerCase().includes(query));

    return matchCat && matchQuery;
  });

  const handleCopy = (item: MathSymbolItem) => {
    navigator.clipboard.writeText(item.insertValue);
    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleInsert = (item: MathSymbolItem) => {
    if (onInsert) {
      onInsert(item.insertValue);
    } else {
      handleCopy(item);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 sm:py-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Calculator className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Kamus & Simbol Matematika</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-indigo-950 font-black text-[10px] tracking-wider uppercase">
                  Lengkap
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                Panduan resmi penulisan lambang, arti simbol, rumus matematika, dan contoh penerapannya
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 pt-2 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('palet')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'palet'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Palet Simbol & Sisipkan</span>
            <span className="ml-1 px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-extrabold">
              {MATH_SYMBOLS_DATA.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rangkuman')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'rangkuman'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Rangkuman Penjelasan Lengkap</span>
          </button>
        </div>

        {/* TAB 1: PALET SIMBOL */}
        {activeTab === 'palet' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter & Search Bar */}
            <div className="p-3 sm:p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari simbol matematika (contoh: akar, pi, persen, bagi, himpunan)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {onInsert && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl shrink-0 font-medium">
                  <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Klik tombol <strong>Sisipkan</strong> untuk langsung menambahkan ke teks materi</span>
                </div>
              )}
            </div>

            {/* Category Pills Bar */}
            <div className="px-3 sm:px-4 py-2 border-b border-slate-100 bg-slate-50 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-thin">
              {categories.map((c) => {
                const isSelected = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <c.icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Symbols Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
              {filteredSymbols.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-700 text-sm">Simbol tidak ditemukan</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Coba kata kunci lain atau pilih kategori "Semua Simbol".
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredSymbols.map((item) => {
                    const isCopied = copiedId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-slate-200 p-3.5 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
                      >
                        <div>
                          {/* Symbol glyph header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-serif text-xl sm:text-2xl font-bold text-indigo-900 group-hover:bg-indigo-600 group-hover:text-white transition-colors select-none">
                                {item.isLatex ? (
                                  <MathRenderer content={item.symbol} />
                                ) : (
                                  item.symbol
                                )}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-snug">
                                  {item.name}
                                </h4>
                                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded-md inline-block mt-0.5">
                                  {item.categoryLabel}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Explanation */}
                          <p className="text-xs text-slate-600 leading-relaxed mb-2 font-normal">
                            {item.explanation}
                          </p>

                          {/* Example */}
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-mono text-slate-700 mb-3">
                            <span className="text-[10px] font-bold text-slate-400 block font-sans uppercase tracking-wider mb-0.5">
                              Contoh:
                            </span>
                            <div className="font-sans text-xs text-slate-800">
                              <MathRenderer content={item.example} />
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          {onInsert && (
                            <button
                              onClick={() => handleInsert(item)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
                              title="Sisipkan langsung ke editor materi"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Sisipkan</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleCopy(item)}
                            className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border font-bold text-xs transition active:scale-95 ${
                              isCopied
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                            } ${!onInsert ? 'flex-1' : ''}`}
                            title="Salin simbol ke clipboard"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>Salin</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: RANGKUMAN PENJELASAN LENGKAP */}
        {activeTab === 'rangkuman' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
            {/* Header intro */}
            <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-sm mb-1">
                <BookOpen className="w-4 h-4" />
                <span>Rangkuman Materi: Lambang dan Simbol Matematika</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Matematika memiliki bahasa universal melalui berbagai lambang dan simbol. Simbol-simbol ini digunakan
                untuk menyederhanakan perhitungan, mendeskripsikan hubungan angka, aljabar, geometri, hingga analisis
                tingkat lanjut seperti kalkulus dan teori himpunan.
              </p>
            </div>

            {/* 1. Simbol Operasi Dasar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
                  1
                </span>
                <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
                  Simbol Operasi Dasar (Aritmetika)
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Operasi dasar adalah fondasi dari seluruh perhitungan matematika yang digunakan sehari-hari:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5 border border-slate-200 w-20 text-center">Simbol</th>
                      <th className="p-2.5 border border-slate-200 w-36">Nama Operasi</th>
                      <th className="p-2.5 border border-slate-200">Penjelasan</th>
                      <th className="p-2.5 border border-slate-200 w-44">Contoh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base font-mono text-indigo-700">
                        +
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Penjumlahan (Plus)</td>
                      <td className="p-2.5 border border-slate-200">Menjumlahkan dua angka atau lebih menjadi satu nilai total.</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">2 + 3 = 5</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base font-mono text-indigo-700">
                        -
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Pengurangan (Minus)</td>
                      <td className="p-2.5 border border-slate-200">Mengurangi suatu angka dengan angka lain.</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">5 - 2 = 3</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base font-mono text-indigo-700">
                        × atau *
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Perkalian (Kali)</td>
                      <td className="p-2.5 border border-slate-200">Mengalikan angka secara berulang sesuai nilai pengali.</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">4 × 3 = 12</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base font-mono text-indigo-700">
                        ÷ atau /
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Pembagian (Bagi)</td>
                      <td className="p-2.5 border border-slate-200">Membagi suatu angka ke dalam bagian-bagian yang sama banyak.</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">10 ÷ 2 = 5</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base font-mono text-indigo-700">
                        ±
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Plus-Minus</td>
                      <td className="p-2.5 border border-slate-200">Menunjukkan dua kemungkinan nilai sekaligus (positif atau negatif).</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">x = ±4 (x = 4 atau -4)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Simbol Perbandingan */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center">
                  2
                </span>
                <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
                  Simbol Perbandingan & Hubungan
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Digunakan untuk membandingkan besaran nilai antara dua sisi ekspresi matematika:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5 border border-slate-200 w-20 text-center">Simbol</th>
                      <th className="p-2.5 border border-slate-200 w-44">Nama Hubungan</th>
                      <th className="p-2.5 border border-slate-200">Penjelasan</th>
                      <th className="p-2.5 border border-slate-200 w-48">Contoh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base font-mono text-indigo-700">
                        =
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Sama Dengan</td>
                      <td className="p-2.5 border border-slate-200">Menunjukkan nilai yang sama persis di kedua sisi.</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">7 + 3 = 10</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base font-mono text-indigo-700">
                        ≠
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Tidak Sama Dengan</td>
                      <td className="p-2.5 border border-slate-200">Menunjukkan nilai di kedua sisi tidak sama.</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">5 ≠ 3</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base font-mono text-indigo-700">
                        &gt;
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Lebih Besar Dari</td>
                      <td className="p-2.5 border border-slate-200">Angka di sebelah kiri bernilai lebih besar daripada kanan.</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">5 &gt; 3</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base font-mono text-indigo-700">
                        &lt;
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Lebih Kecil Dari</td>
                      <td className="p-2.5 border border-slate-200">Angka di sebelah kiri bernilai lebih kecil daripada kanan.</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">3 &lt; 5</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base font-mono text-indigo-700">
                        ≥
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Lebih Dari atau Sama Dengan</td>
                      <td className="p-2.5 border border-slate-200">Nilai lebih besar atau sekurang-kurangnya sama dengan pembanding.</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">Nilai ≥ 75</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base font-mono text-indigo-700">
                        ≤
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Kurang Dari atau Sama Dengan</td>
                      <td className="p-2.5 border border-slate-200">Nilai lebih kecil atau setinggi-tingginya sama dengan pembanding.</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">Usia ≤ 12 tahun</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base font-mono text-indigo-700">
                        ≈
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Kira-kira / Mendekati</td>
                      <td className="p-2.5 border border-slate-200">Menunjukkan nilai taksiran atau hasil pembulatan.</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">π ≈ 3.14</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Simbol Aljabar dan Lainnya */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-black text-sm flex items-center justify-center">
                  3
                </span>
                <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
                  Simbol Aljabar, Bilangan, dan Konstanta
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5 border border-slate-200 w-24 text-center">Simbol</th>
                      <th className="p-2.5 border border-slate-200 w-44">Nama Simbol</th>
                      <th className="p-2.5 border border-slate-200">Penjelasan & Makna</th>
                      <th className="p-2.5 border border-slate-200 w-52">Contoh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base text-indigo-700">
                        √ / \(\sqrt{}\)
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Akar Kuadrat</td>
                      <td className="p-2.5 border border-slate-200">Mencari akar pangkat dua dari suatu bilangan positif.</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">\(\sqrt{16} = 4\)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base font-serif text-indigo-700">
                        π
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Pi (Konstanta Lingkaran)</td>
                      <td className="p-2.5 border border-slate-200">Rasio keliling lingkaran terhadap diameternya, bernilai sekitar 3.14 atau \(\frac{22}{7}\).</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">K = 2 × π × r</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base font-mono text-indigo-700">
                        ∞
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Tak Terhingga (Infinity)</td>
                      <td className="p-2.5 border border-slate-200">Menunjukkan jumlah atau besaran yang tidak memiliki batas akhir.</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">Bilangan cacah = 0, 1, 2, ... → ∞</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base font-mono text-indigo-700">
                        %
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Persen</td>
                      <td className="p-2.5 border border-slate-200">Per seratus; pecahan dengan penyebut 100.</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">50% = \(\frac{50}{100} = 0.5\)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 border border-slate-200 text-center font-bold text-base text-indigo-700">
                        \(\frac{a}{b}\)
                      </td>
                      <td className="p-2.5 border border-slate-200 font-bold">Pecahan Biasa</td>
                      <td className="p-2.5 border border-slate-200">Pembagian nilai pembilang (a) dengan penyebut (b).</td>
                      <td className="p-2.5 border border-slate-200 font-mono bg-slate-50">\(\frac{1}{2} + \frac{1}{2} = 1\)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Teori Himpunan & Kalkulus Tingkat Lanjut */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center">
                  4
                </span>
                <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
                  Simbol Tingkat Lanjut: Teori Himpunan & Kalkulus
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Berikut simbol penting untuk tingkat lanjut seperti himpunan, analisis matematika, dan statistika:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-indigo-700 text-sm">∈ (Elemen Himpunan)</span>
                  <p className="text-slate-600 mt-1">
                    Menyatakan suatu objek adalah anggota himpunan. Contoh: <code>2 ∈ {'{2, 4, 6}'}</code>.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-indigo-700 text-sm">∪ (Gabungan / Union)</span>
                  <p className="text-slate-600 mt-1">
                    Menggabungkan seluruh elemen dari dua himpunan. Contoh: <code>{'{1, 2}'} ∪ {'{3}'} = {'{1, 2, 3}'}</code>.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-indigo-700 text-sm">∩ (Irisan / Intersection)</span>
                  <p className="text-slate-600 mt-1">
                    Elemen yang sama-sama ada di kedua himpunan. Contoh: <code>{'{1, 2}'} ∩ {'{2, 3}'} = {'{2}'}</code>.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-indigo-700 text-sm">Σ (Sigma / Summation)</span>
                  <p className="text-slate-600 mt-1">
                    Menjumlahkan deret bilangan secara berurutan. Sering dipakai untuk menghitung rata-rata nilai siswa.
                  </p>
                </div>
              </div>
            </div>

            {/* Cara Penulisan di E-Learning CBT */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 text-xs text-indigo-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-indigo-950 text-sm">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Tips Format Penulisan Rumus di E-Learning Harjosari</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1 leading-relaxed">
                <li>
                  <strong>Simbol Langsung:</strong> Anda dapat langsung menyalin simbol Unicode seperti{' '}
                  <code>×</code>, <code>÷</code>, <code>≠</code>, <code>≤</code>, <code>≥</code>, <code>≈</code>,{' '}
                  <code>√</code>, <code>π</code>, <code>°</code> ke dalam judul materi maupun soal ujian.
                </li>
                <li>
                  <strong>Format Rumus Matematika (KaTeX / LaTeX):</strong> Gunakan tanda kurung matematika{' '}
                  <code>\(\sqrt{x}\)</code> atau <code>\(\frac{a}{b}\)</code> atau <code>$rumus$</code> untuk tampilan
                  rumus pecahan bertingkat yang rapi.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 sm:px-6 sm:py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Standar Kurikulum Matematika Nasional • SD Negeri Harjosari Kidul 01
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition active:scale-95 ml-auto"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
