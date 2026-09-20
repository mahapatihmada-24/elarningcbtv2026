import { KisiKisiItem, Question, QuestionPG, QuestionPGKMCMA, QuestionPGKKategori } from '../types';

export interface GeneratorOptions {
  difficulty?: 'standar' | 'hots' | 'mudah';
  includeStimulusStory?: boolean;
  useAI?: boolean;
}

/**
 * Standard Kurikulum Merdeka / Asesmen Nasional Blueprints per Subject
 * Teachers can load these instantly if they don't already have a blueprint!
 */
export const STANDARD_KISI_KISI_TEMPLATES: Record<string, KisiKisiItem[]> = {
  Matematika: [
    {
      no: 1,
      nomorSoal: 1,
      elemen: 'Bilangan',
      subElemen: 'Pecahan & Desimal',
      kompetensi: 'Peserta didik dapat memahami, membandingkan, dan melakukan operasi hitung pecahan dan desimal dalam pemecahan masalah.',
      levelKognitif: 'L2',
      konteks: 'Personal',
      indikator: 'Disajikan permasalahan kontekstual belanja kebutuhan rumah tangga, peserta didik dapat menghitung hasil operasi penjumlahan dan pengurangan pecahan dengan benar.',
      tipeSoal: 'Pilihan Ganda',
      cp_kd: 'Peserta didik dapat memahami, membandingkan, dan melakukan operasi hitung pecahan dan desimal dalam pemecahan masalah.',
      materi: 'Pecahan & Desimal',
      bentukSoal: 'Pilihan Ganda',
      bobot: 1,
    },
    {
      no: 2,
      nomorSoal: 2,
      elemen: 'Geometri',
      subElemen: 'Geometri Bangun Datar',
      kompetensi: 'Peserta didik dapat mengidentifikasi unsur-unsur dan menghitung keliling serta luas bangun datar.',
      levelKognitif: 'L2',
      konteks: 'Sosial Budaya',
      indikator: 'Disajikan narasi denah taman bermain di lingkungan perumahan warga, peserta didik dapat menentukan keliling atau luas bangun datar tersebut.',
      tipeSoal: 'Pilihan Ganda',
      cp_kd: 'Peserta didik dapat mengidentifikasi unsur-unsur dan menghitung keliling serta luas bangun datar.',
      materi: 'Geometri Bangun Datar',
      bentukSoal: 'Pilihan Ganda',
      bobot: 1,
    },
    {
      no: 3,
      nomorSoal: 3,
      elemen: 'Geometri',
      subElemen: 'Geometri Bangun Ruang',
      kompetensi: 'Peserta didik dapat menganalisis dan membandingkan volume serta luas permukaan bangun ruang kubus dan balok.',
      levelKognitif: 'L3',
      konteks: 'Saintifik',
      indikator: 'Disajikan cerita bak penampungan air dan perhitungan debit pengisian, peserta didik dapat menganalisis volume atau kapasitas air dengan memilih beberapa pernyataan yang benar.',
      tipeSoal: 'PGK (Multi-Jawaban)',
      cp_kd: 'Peserta didik dapat menganalisis dan membandingkan volume serta luas permukaan bangun ruang kubus dan balok.',
      materi: 'Geometri Bangun Ruang',
      bentukSoal: 'PGK (Multi-Jawaban)',
      bobot: 2,
    },
    {
      no: 4,
      nomorSoal: 4,
      elemen: 'Analisis Data dan Peluang',
      subElemen: 'Statistika & Pengolahan Data',
      kompetensi: 'Peserta didik dapat mengumpulkan, menyajikan, dan menafsirkan data dalam bentuk tabel dan diagram.',
      levelKognitif: 'L3',
      konteks: 'Sosial Budaya',
      indikator: 'Disajikan data hasil panen atau kegiatan koperasi warga, peserta didik dapat mengevaluasi kebenaran beberapa pernyataan mengenai nilai modus, rata-rata, dan selisih data.',
      tipeSoal: 'PGK (Benar - Salah)',
      cp_kd: 'Peserta didik dapat mengumpulkan, menyajikan, dan menafsirkan data dalam bentuk tabel dan diagram.',
      materi: 'Statistika & Pengolahan Data',
      bentukSoal: 'PGK (Benar - Salah)',
      bobot: 2,
    },
    {
      no: 5,
      nomorSoal: 5,
      elemen: 'Bilangan',
      subElemen: 'KPK dan FPB',
      kompetensi: 'Peserta didik dapat menentukan faktor, kelipatan, KPK, dan FPB dalam menyelesaikan masalah kehidupan sehari-hari.',
      levelKognitif: 'L2',
      konteks: 'Personal',
      indikator: 'Disajikan permasalahan pembagian bingkisan ulang tahun atau jadwal berulang anak, peserta didik dapat menentukan waktu pertemuan kembali atau jumlah paket terbanyak.',
      tipeSoal: 'Pilihan Ganda',
      cp_kd: 'Peserta didik dapat menentukan faktor, kelipatan, KPK, dan FPB dalam menyelesaikan masalah kehidupan sehari-hari.',
      materi: 'KPK dan FPB',
      bentukSoal: 'Pilihan Ganda',
      bobot: 1,
    },
  ],
  'IPA (Ilmu Pengetahuan Alam)': [
    {
      no: 1,
      nomorSoal: 1,
      elemen: 'Pemahaman IPAS (Makhluk Hidup & Lingkungan)',
      subElemen: 'Ekosistem & Rantai Makanan',
      kompetensi: 'Peserta didik menganalisis hubungan antar makhluk hidup pada suatu ekosistem dalam bentuk rantai makanan dan jaring-jaring makanan.',
      levelKognitif: 'L3',
      konteks: 'Saintifik',
      indikator: 'Disajikan ilustrasi rantai makanan pada ekosistem sawah/hutan, peserta didik dapat memprediksi dampak perubahan populasi salah satu organisme terhadap organisme lain.',
      tipeSoal: 'Pilihan Ganda',
      cp_kd: 'Peserta didik menganalisis hubungan antar makhluk hidup pada suatu ekosistem dalam bentuk rantai makanan dan jaring-jaring makanan.',
      materi: 'Ekosistem & Rantai Makanan',
      bentukSoal: 'Pilihan Ganda',
      bobot: 1,
    },
    {
      no: 2,
      nomorSoal: 2,
      elemen: 'Pemahaman IPAS (Energi & Gaya)',
      subElemen: 'Gaya & Gerak Benda',
      kompetensi: 'Peserta didik mengidentifikasi macam-macam gaya (otot, pegas, gesek, magnet, gravitasi) dan pengaruhnya terhadap gerak serta bentuk benda.',
      levelKognitif: 'L2',
      konteks: 'Personal',
      indikator: 'Disajikan aktivitas berolahraga atau bersepeda siswa, peserta didik dapat menentukan jenis gaya yang bekerja dan pengaruhnya.',
      tipeSoal: 'Pilihan Ganda',
      cp_kd: 'Peserta didik mengidentifikasi macam-macam gaya dan pengaruhnya terhadap gerak serta bentuk benda.',
      materi: 'Gaya & Gerak Benda',
      bentukSoal: 'Pilihan Ganda',
      bobot: 1,
    },
    {
      no: 3,
      nomorSoal: 3,
      elemen: 'Pemahaman IPAS (Makhluk Hidup & Lingkungan)',
      subElemen: 'Sistem Organ Tubuh Manusia',
      kompetensi: 'Peserta didik menganalisis sistem organ pernapasan, pencernaan, dan peredaran darah pada manusia serta cara menjaga kesehatannya.',
      levelKognitif: 'L2',
      konteks: 'Personal',
      indikator: 'Disajikan deskripsi fungsi alat pencernaan atau pernapasan, peserta didik dapat memilih beberapa fungsi organ dan kebiasaan hidup sehat yang tepat.',
      tipeSoal: 'PGK (Multi-Jawaban)',
      cp_kd: 'Peserta didik menganalisis sistem organ pernapasan, pencernaan, dan peredaran darah pada manusia serta cara menjaga kesehatannya.',
      materi: 'Sistem Organ Tubuh Manusia',
      bentukSoal: 'PGK (Multi-Jawaban)',
      bobot: 2,
    },
    {
      no: 4,
      nomorSoal: 4,
      elemen: 'Pemahaman IPAS (Energi & Gaya)',
      subElemen: 'Suhu, Kalor & Wujud Zat',
      kompetensi: 'Peserta didik mendeskripsikan perubahan wujud zat dan perpindahan kalor (konduksi, konveksi, radiasi) dalam kehidupan nyata.',
      levelKognitif: 'L3',
      konteks: 'Saintifik',
      indikator: 'Disajikan beberapa peristiwa pemanasan air di laboratorium, peserta didik dapat menilai kebenaran jenis perpindahan kalor yang terjadi.',
      tipeSoal: 'PGK (Benar - Salah)',
      cp_kd: 'Peserta didik mendeskripsikan perubahan wujud zat dan perpindahan kalor dalam kehidupan nyata.',
      materi: 'Suhu, Kalor & Wujud Zat',
      bentukSoal: 'PGK (Benar - Salah)',
      bobot: 2,
    },
    {
      no: 5,
      nomorSoal: 5,
      elemen: 'Pemahaman IPAS (Bumi & Antariksa)',
      subElemen: 'Tata Surya & Fenomena Alam',
      kompetensi: 'Peserta didik memahami sistem tata surya, karakteristik planet, serta dampak peristiwa rotasi dan revolusi bumi.',
      levelKognitif: 'L1',
      konteks: 'Saintifik',
      indikator: 'Disajikan fenomena alam perbedaan waktu dan pergantian musim di belahan bumi, peserta didik dapat mengaitkannya dengan akibat rotasi atau revolusi bumi.',
      tipeSoal: 'Pilihan Ganda',
      cp_kd: 'Peserta didik memahami sistem tata surya, karakteristik planet, serta dampak peristiwa rotasi dan revolusi bumi.',
      materi: 'Tata Surya & Fenomena Alam',
      bentukSoal: 'Pilihan Ganda',
      bobot: 1,
    },
  ],
  'Bahasa Indonesia': [
    {
      no: 1,
      nomorSoal: 1,
      elemen: 'Membaca dan Memirsa',
      subElemen: 'Ide Pokok & Simpulan Teks',
      kompetensi: 'Peserta didik mampu menemukan ide pokok, kalimat utama, dan simpulan dari teks informatif.',
      levelKognitif: 'L2',
      konteks: 'Sosial Budaya',
      indikator: 'Disajikan satu paragraf bacaan tentang tradisi gotong royong warga desa, peserta didik dapat menentukan ide pokok paragraf dengan tepat.',
      tipeSoal: 'Pilihan Ganda',
      cp_kd: 'Peserta didik mampu menemukan ide pokok, kalimat utama, dan simpulan dari teks informatif.',
      materi: 'Ide Pokok & Simpulan Teks',
      bentukSoal: 'Pilihan Ganda',
      bobot: 1,
    },
    {
      no: 2,
      nomorSoal: 2,
      elemen: 'Membaca dan Memirsa',
      subElemen: 'Teks Informasi & Petunjuk',
      kompetensi: 'Peserta didik mampu mengidentifikasi informasi tersurat dan tersirat dalam teks eksplanasi atau petunjuk.',
      levelKognitif: 'L3',
      konteks: 'Saintifik',
      indikator: 'Disajikan teks petunjuk percobaan hemat energi listrik, peserta didik dapat memilih beberapa pernyataan yang sesuai dengan isi bacaan.',
      tipeSoal: 'PGK (Multi-Jawaban)',
      cp_kd: 'Peserta didik mampu mengidentifikasi informasi tersurat dan tersirat dalam teks eksplanasi atau petunjuk.',
      materi: 'Teks Informasi & Petunjuk',
      bentukSoal: 'PGK (Multi-Jawaban)',
      bobot: 2,
    },
    {
      no: 3,
      nomorSoal: 3,
      elemen: 'Menulis',
      subElemen: 'Tata Bahasa & Ejaan Baku',
      kompetensi: 'Peserta didik mampu menerapkan penggunaan huruf kapital, tanda baca, dan kata baku sesuai kaidah bahasa Indonesia.',
      levelKognitif: 'L2',
      konteks: 'Personal',
      indikator: 'Disajikan beberapa kalimat surat pribadi kepada sahabat, peserta didik dapat menilai kesesuaian penulisan tanda baca dan huruf kapital.',
      tipeSoal: 'PGK (Benar - Salah)',
      cp_kd: 'Peserta didik mampu menerapkan penggunaan huruf kapital, tanda baca, dan kata baku sesuai kaidah bahasa Indonesia.',
      materi: 'Tata Bahasa & Ejaan Baku',
      bentukSoal: 'PGK (Benar - Salah)',
      bobot: 2,
    },
    {
      no: 4,
      nomorSoal: 4,
      elemen: 'Membaca dan Memirsa',
      subElemen: 'Kosakata & Makna Kiasan',
      kompetensi: 'Peserta didik mampu memahami makna kata, sinonim, antonim, dan ungkapan kiasan dalam teks sastra.',
      levelKognitif: 'L1',
      konteks: 'Personal',
      indikator: 'Disajikan kalimat cerita pendek anak dengan kata khusus, peserta didik dapat menentukan makna kias atau sinonimnya.',
      tipeSoal: 'Pilihan Ganda',
      cp_kd: 'Peserta didik mampu memahami makna kata, sinonim, antonim, dan ungkapan kiasan dalam teks sastra.',
      materi: 'Kosakata & Makna Kiasan',
      bentukSoal: 'Pilihan Ganda',
      bobot: 1,
    },
    {
      no: 5,
      nomorSoal: 5,
      elemen: 'Membaca dan Memirsa',
      subElemen: 'Sastra Pantun & Puisi',
      kompetensi: 'Peserta didik mampu mengapresiasi dan menganalisis amanat dalam pantun atau puisi anak.',
      levelKognitif: 'L3',
      konteks: 'Sosial Budaya',
      indikator: 'Disajikan satu bait pantun nasihat kearifan lokal, peserta didik dapat menentukan pesan atau amanat yang terkandung di dalamnya.',
      tipeSoal: 'Pilihan Ganda',
      cp_kd: 'Peserta didik mampu mengapresiasi dan menganalisis amanat dalam pantun atau puisi anak.',
      materi: 'Sastra Pantun & Puisi',
      bentukSoal: 'Pilihan Ganda',
      bobot: 1,
    },
  ],
  'PPKn (Pendidikan Kewarganegaraan)': [
    {
      no: 1,
      nomorSoal: 1,
      elemen: 'Pancasila',
      subElemen: 'Pengamalan Nilai Pancasila',
      kompetensi: 'Peserta didik memahami simbol, nilai moral, dan pengamalan sila-sila Pancasila dalam kehidupan sehari-hari.',
      levelKognitif: 'L2',
      konteks: 'Sosial Budaya',
      indikator: 'Disajikan cerita tentang kegiatan musyawarah warga desa memilih ketua RT, peserta didik dapat menghubungkan tindakan tersebut dengan sila Pancasila yang sesuai.',
      tipeSoal: 'Pilihan Ganda',
      cp_kd: 'Peserta didik memahami simbol, nilai moral, dan pengamalan sila-sila Pancasila dalam kehidupan sehari-hari.',
      materi: 'Pengamalan Nilai Pancasila',
      bentukSoal: 'Pilihan Ganda',
      bobot: 1,
    },
    {
      no: 2,
      nomorSoal: 2,
      elemen: 'Undang-Undang Dasar Negara Republik Indonesia 1945',
      subElemen: 'Hak & Kewajiban Warga Negara',
      kompetensi: 'Peserta didik mampu membedakan pelaksanaan hak, kewajiban, dan tanggung jawab sebagai warga negara.',
      levelKognitif: 'L2',
      konteks: 'Personal',
      indikator: 'Disajikan beberapa contoh perilaku siswa di lingkungan sekolah, peserta didik dapat memilih tindakan yang mencerminkan kewajiban utama siswa.',
      tipeSoal: 'PGK (Multi-Jawaban)',
      cp_kd: 'Peserta didik mampu membedakan pelaksanaan hak, kewajiban, dan tanggung jawab sebagai warga negara.',
      materi: 'Hak & Kewajiban Warga Negara',
      bentukSoal: 'PGK (Multi-Jawaban)',
      bobot: 2,
    },
    {
      no: 3,
      nomorSoal: 3,
      elemen: 'Bhinneka Tunggal Ika',
      subElemen: 'Keberagaman Suku & Budaya',
      kompetensi: 'Peserta didik mampu menghargai dan menumbuhkan sikap toleransi terhadap keberagaman suku bangsa, budaya, dan agama di Indonesia.',
      levelKognitif: 'L3',
      konteks: 'Sosial Budaya',
      indikator: 'Disajikan pernyataan mengenai sikap dalam menghadapi perbedaan festival budaya daerah, peserta didik dapat menilai sikap toleran yang benar atau salah.',
      tipeSoal: 'PGK (Benar - Salah)',
      cp_kd: 'Peserta didik mampu menghargai dan menumbuhkan sikap toleransi terhadap keberagaman suku bangsa, budaya, dan agama di Indonesia.',
      materi: 'Keberagaman Suku & Budaya',
      bentukSoal: 'PGK (Benar - Salah)',
      bobot: 2,
    },
    {
      no: 4,
      nomorSoal: 4,
      elemen: 'Negara Kesatuan Republik Indonesia',
      subElemen: 'Norma & Tata Tertib',
      kompetensi: 'Peserta didik memahami aturan hukum dan norma-norma yang berlaku dalam kehidupan bermasyarakat.',
      levelKognitif: 'L3',
      konteks: 'Sosial Budaya',
      indikator: 'Disajikan ilustrasi ketertiban bermasyarakat dan hukum lalu lintas, peserta didik dapat menganalisis dampak positif kepatuhan terhadap norma.',
      tipeSoal: 'Pilihan Ganda',
      cp_kd: 'Peserta didik memahami aturan hukum dan norma-norma yang berlaku dalam kehidupan bermasyarakat.',
      materi: 'Norma & Tata Tertib',
      bentukSoal: 'Pilihan Ganda',
      bobot: 1,
    },
  ],
  'IPS (Ilmu Pengetahuan Sosial)': [
    {
      no: 1,
      nomorSoal: 1,
      elemen: 'Pemahaman IPAS (Sosial & Budaya)',
      subElemen: 'Kegiatan Ekonomi & SDA',
      kompetensi: 'Peserta didik mengidentifikasi kegiatan ekonomi (produksi, distribusi, konsumsi) dan pemanfaatan sumber daya alam di sekitarnya.',
      levelKognitif: 'L2',
      konteks: 'Sosial Budaya',
      indikator: 'Disajikan profesi perkebunan teh atau pasar tradisional, peserta didik dapat menentukan jenis kegiatan ekonomi yang dilakukan.',
      tipeSoal: 'Pilihan Ganda',
      cp_kd: 'Peserta didik mengidentifikasi kegiatan ekonomi dan pemanfaatan sumber daya alam di sekitarnya.',
      materi: 'Kegiatan Ekonomi & SDA',
      bentukSoal: 'Pilihan Ganda',
      bobot: 1,
    },
    {
      no: 2,
      nomorSoal: 2,
      elemen: 'Pemahaman IPAS (Sosial & Budaya)',
      subElemen: 'Geografi & Kenampakan Alam',
      kompetensi: 'Peserta didik memahami letak geografis Indonesia dan kenampakan alam daratan serta perairan Nusantara.',
      levelKognitif: 'L2',
      konteks: 'Saintifik',
      indikator: 'Disajikan karakteristik bentang alam wilayah pesisir dan dataran rendah, peserta didik dapat memilih potensi mata pencaharian yang sesuai.',
      tipeSoal: 'PGK (Multi-Jawaban)',
      cp_kd: 'Peserta didik memahami letak geografis Indonesia dan kenampakan alam daratan serta perairan Nusantara.',
      materi: 'Geografi & Kenampakan Alam',
      bentukSoal: 'PGK (Multi-Jawaban)',
      bobot: 2,
    },
    {
      no: 3,
      nomorSoal: 3,
      elemen: 'Pemahaman IPAS (Sosial & Budaya)',
      subElemen: 'Sejarah Kemerdekaan Indonesia',
      kompetensi: 'Peserta didik menghargai peran tokoh pejuang dalam peristiwa proklamasi kemerdekaan Republik Indonesia.',
      levelKognitif: 'L3',
      konteks: 'Sosial Budaya',
      indikator: 'Disajikan peristiwa bersejarah sekitar Proklamasi 17 Agustus 1945, peserta didik dapat mengevaluasi kebenaran fakta sejarah yang disajikan.',
      tipeSoal: 'PGK (Benar - Salah)',
      cp_kd: 'Peserta didik menghargai peran tokoh pejuang dalam peristiwa proklamasi kemerdekaan Republik Indonesia.',
      materi: 'Sejarah Kemerdekaan Indonesia',
      bentukSoal: 'PGK (Benar - Salah)',
      bobot: 2,
    },
    {
      no: 4,
      nomorSoal: 4,
      elemen: 'Pemahaman IPAS (Sosial & Budaya)',
      subElemen: 'Kerjasama Negara ASEAN',
      kompetensi: 'Peserta didik memahami posisi dan peran Indonesia dalam kerjasama regional ASEAN.',
      levelKognitif: 'L1',
      konteks: 'Sosial Budaya',
      indikator: 'Disajikan bentuk pertukaran budaya dan ekonomi regional ASEAN, peserta didik dapat menentukan peran positif Indonesia.',
      tipeSoal: 'Pilihan Ganda',
      cp_kd: 'Peserta didik memahami posisi dan peran Indonesia dalam kerjasama regional ASEAN.',
      materi: 'Kerjasama Negara ASEAN',
      bentukSoal: 'Pilihan Ganda',
      bobot: 1,
    },
  ],
};

/**
 * Heuristically finds best default template for a given subject string
 */
export function getStandardKisiKisiTemplate(mapelName: string): KisiKisiItem[] {
  const clean = (mapelName || '').toLowerCase();
  if (clean.includes('matematika') || clean.includes('mtk')) {
    return STANDARD_KISI_KISI_TEMPLATES['Matematika'];
  }
  if (clean.includes('ipas') || clean.includes('ipa') || clean.includes('sains')) {
    return STANDARD_KISI_KISI_TEMPLATES['IPA (Ilmu Pengetahuan Alam)'];
  }
  if (clean.includes('indonesia') || clean.includes('bahasa')) {
    return STANDARD_KISI_KISI_TEMPLATES['Bahasa Indonesia'];
  }
  if (clean.includes('pancasila') || clean.includes('pkn') || clean.includes('ppkn')) {
    return STANDARD_KISI_KISI_TEMPLATES['PPKn (Pendidikan Kewarganegaraan)'];
  }
  if (clean.includes('ips') || clean.includes('sosial')) {
    return STANDARD_KISI_KISI_TEMPLATES['IPS (Ilmu Pengetahuan Sosial)'];
  }
  return STANDARD_KISI_KISI_TEMPLATES['Matematika'];
}

/**
 * Intelligent Local / Offline Question Generator Engine
 * Transforms any KisiKisiItem into a fully formed CBT question conforming to Kurikulum Merdeka.
 */
export function generateQuestionLocally(
  item: KisiKisiItem,
  subject = 'Matematika',
  grade = '6',
  options?: GeneratorOptions
): Question {
  const materi = (item.materi || subject || 'Materi Umum').trim();
  const indikator = (item.indikator || '').trim();
  const cp = (item.cp_kd || '').trim();
  const level = item.levelKognitif || 'L2';
  const cleanMapel = (subject || '').toLowerCase();
  const cleanMateri = materi.toLowerCase();
  const cleanBentuk = (item.bentukSoal || '').toLowerCase();

  const isPGKMcma = cleanBentuk.includes('mcma') || cleanBentuk.includes('centang') || cleanBentuk.includes('multi');
  const isPGKKategori = cleanBentuk.includes('kategori') || cleanBentuk.includes('tabel') || cleanBentuk.includes('benar');

  const bobot = item.bobot || (isPGKMcma || isPGKKategori ? 2 : 1);

  // -------------------------------------------------------------
  // 1. MATEMATIKA GENERATOR
  // -------------------------------------------------------------
  if (cleanMapel.includes('matematika') || cleanMapel.includes('mtk')) {
    if (cleanMateri.includes('pecahan') || cleanMateri.includes('desimal')) {
      if (isPGKKategori) {
        return {
          type: 'pgk_kategori',
          bobot,
          soal: `Perhatikan beberapa pernyataan operasi hitung pecahan berikut. Tentukan apakah masing-masing pernyataan bernilai Benar atau Salah!\n\nStimulus: Ibu membeli $\\frac{3}{4}$ kg tepung terigu, kemudian menggunakan $\\frac{1}{2}$ kg untuk membuat bolu kukus.`,
          col1: 'Benar',
          col2: 'Salah',
          rows: [
            { text: 'Sisa tepung terigu milik Ibu adalah $\\frac{1}{4}$ kg.', key: 'col1' },
            { text: 'Pecahan $\\frac{3}{4}$ senilai dengan desimal 0,75.', key: 'col1' },
            { text: 'Hasil dari $\\frac{3}{4} + \\frac{1}{2}$ sama dengan $\\frac{4}{6}$ kg.', key: 'col2' },
          ],
        };
      }
      if (isPGKMcma) {
        return {
          type: 'pgk_mcma',
          bobot,
          soal: `Pak Rahmat memiliki sebidang tanah. Seluas $\\frac{2}{5}$ bagian ditanami jagung, $\\frac{1}{4}$ bagian ditanami kedelai, dan sisanya dibuat kolam ikan.\n\nManakah pernyataan-pernyataan berikut yang bernilai benar? (Pilihlah lebih dari satu jawaban!)`,
          options: [
            { text: 'Total luas tanah untuk jagung dan kedelai adalah $\\frac{13}{20}$ bagian.', isKey: true },
            { text: 'Luas tanah untuk kolam ikan adalah $\\frac{7}{20}$ bagian.', isKey: true },
            { text: 'Luas tanah kolam ikan lebih besar daripada luas tanah yang ditanami jagung.', isKey: false },
            { text: 'Bagian tanah terluas digunakan untuk tanaman jagung.', isKey: true },
          ],
        };
      }
      return {
        type: 'pg',
        bobot,
        soal: `Rani memiliki pita merah sepanjang $\\frac{5}{6}$ meter dan pita kuning sepanjang $\\frac{2}{3}$ meter. Jika Rani menyambungkan kedua pita tersebut, maka panjang seluruh pita Rani adalah...\n\n(Tuliskan dalam bentuk pecahan paling sederhana)`,
        a: '$1\\frac{1}{2}$ meter',
        b: '$1\\frac{1}{3}$ meter',
        c: '$\\frac{7}{9}$ meter',
        d: '$\\frac{7}{6}$ meter',
        kunci: 'A',
      };
    }

    if (cleanMateri.includes('bangun datar') || cleanMateri.includes('luas') || cleanMateri.includes('keliling')) {
      if (isPGKKategori) {
        return {
          type: 'pgk_kategori',
          bobot,
          soal: `Sebuah taman kota berbentuk persegi panjang berukuran panjang 25 meter dan lebar 14 meter. Di sekeliling taman akan ditanami pohon palem dengan jarak antarpohon 2 meter.\n\nTentukan Benar atau Salah untuk pernyataan berikut!`,
          col1: 'Benar',
          col2: 'Salah',
          rows: [
            { text: 'Keliling taman kota tersebut adalah 78 meter.', key: 'col1' },
            { text: 'Luas taman kota tersebut adalah $350\\text{ m}^2$.', key: 'col1' },
            { text: 'Banyak pohon palem yang dibutuhkan adalah 50 pohon.', key: 'col2' },
          ],
        };
      }
      if (isPGKMcma) {
        return {
          type: 'pgk_mcma',
          bobot,
          soal: `Sebuah lapangan olahraga berbentuk lingkaran memiliki panjang diameter 28 meter (gunakan $\\pi = \\frac{22}{7}$).\n\nManakah pernyataan yang BENAR mengenai lapangan tersebut? (Pilih dua atau lebih jawaban!)`,
          options: [
            { text: 'Jari-jari lapangan tersebut adalah 14 meter.', isKey: true },
            { text: 'Keliling lapangan tersebut adalah 88 meter.', isKey: true },
            { text: 'Luas permukaan lapangan tersebut adalah $616\\text{ m}^2$.', isKey: true },
            { text: 'Luas lapangan tersebut adalah $1.232\\text{ m}^2$.', isKey: false },
          ],
        };
      }
      return {
        type: 'pg',
        bobot,
        soal: `Pak Budi membuat kolam ikan berbentuk lingkaran dengan jari-jari 14 cm. Keliling kolam ikan yang dibuat Pak Budi adalah... (Gunakan $\\pi = \\frac{22}{7}$)`,
        a: '44 cm',
        b: '88 cm',
        c: '154 cm',
        d: '616 cm',
        kunci: 'B',
      };
    }

    if (cleanMateri.includes('bangun ruang') || cleanMateri.includes('volume')) {
      if (isPGKKategori) {
        return {
          type: 'pgk_kategori',
          bobot,
          soal: `Sebuah bak mandi berbentuk balok dengan ukuran panjang 120 cm, lebar 80 cm, dan tinggi 100 cm. Bak tersebut terisi air setengah bagian.\n\nTentukan kebenaran pernyataan berikut:`,
          col1: 'Benar',
          col2: 'Salah',
          rows: [
            { text: 'Volume total bak mandi jika penuh adalah 960 liter.', key: 'col1' },
            { text: 'Banyak air di dalam bak mandi saat ini adalah 480 liter.', key: 'col1' },
            { text: 'Untuk mengisi bak mandi hingga penuh diperlukan tambahan 600 liter lagi.', key: 'col2' },
          ],
        };
      }
      if (isPGKMcma) {
        return {
          type: 'pgk_mcma',
          bobot,
          soal: `Sebuah wadah berbentuk kubus memiliki panjang rusuk 15 cm.\n\nManakah pernyataan berikut yang bernilai benar? (Pilih semua yang tepat!)`,
          options: [
            { text: 'Volume kubus tersebut adalah $3.375\\text{ cm}^3$.', isKey: true },
            { text: 'Luas permukaan wadah tersebut adalah $1.350\\text{ cm}^2$.', isKey: true },
            { text: 'Kubus memiliki 12 rusuk yang sama panjang.', isKey: true },
            { text: 'Volume kubus sama dengan $225\\text{ cm}^3$.', isKey: false },
          ],
        };
      }
      return {
        type: 'pg',
        bobot,
        soal: `Sebuah akuarium berbentuk balok mempunyai ukuran panjang 60 cm, lebar 40 cm, dan tinggi 50 cm. Volume akuarium tersebut adalah...`,
        a: '120.000 cm³ (120 liter)',
        b: '150.000 cm³ (150 liter)',
        c: '100.000 cm³ (100 liter)',
        d: '240.000 cm³ (240 liter)',
        kunci: 'A',
      };
    }

    if (cleanMateri.includes('data') || cleanMateri.includes('statistika') || cleanMateri.includes('rata')) {
      if (isPGKKategori) {
        return {
          type: 'pgk_kategori',
          bobot,
          soal: `Berikut adalah data nilai ulangan matematika 6 orang siswa: 75, 80, 85, 90, 80, 70.\n\nTentukan Benar atau Salah untuk hasil analisis data tersebut!`,
          col1: 'Benar',
          col2: 'Salah',
          rows: [
            { text: 'Nilai rata-rata (mean) ulangan adalah 80.', key: 'col1' },
            { text: 'Modus data tersebut adalah 80 karena paling sering muncul.', key: 'col1' },
            { text: 'Nilai terendah pada data tersebut adalah 75.', key: 'col2' },
          ],
        };
      }
      return {
        type: 'pg',
        bobot,
        soal: `Tabel berikut menunjukkan hasil panen padi seorang petani selama 4 bulan berturut-turut: Januari (12 ton), Februari (15 ton), Maret (18 ton), April (15 ton).\n\nRata-rata hasil panen padi per bulan adalah...`,
        a: '14 ton',
        b: '15 ton',
        c: '16 ton',
        d: '17 ton',
        kunci: 'B',
      };
    }

    // Default Matematika
    return {
      type: 'pg',
      bobot,
      soal: `Berdasarkan indikator pembelajaran [${materi}]: Pak Ahmad mempunyai 48 buku tulis dan 36 pensil yang akan dibagikan kepada anak-anak yatim dengan jumlah yang sama banyak. Jumlah anak terbanyak yang dapat menerima perlengkapan tersebut adalah...`,
      a: '6 anak',
      b: '12 anak',
      c: '18 anak',
      d: '24 anak',
      kunci: 'B',
    };
  }

  // -------------------------------------------------------------
  // 2. IPA / IPAS GENERATOR
  // -------------------------------------------------------------
  if (cleanMapel.includes('ipa') || cleanMapel.includes('ipas') || cleanMapel.includes('sains')) {
    if (cleanMateri.includes('ekosistem') || cleanMateri.includes('rantai')) {
      if (isPGKKategori) {
        return {
          type: 'pgk_kategori',
          bobot,
          soal: `Perhatikan rantai makanan pada ekosistem sawah berikut:\nPadi ➔ Belalang ➔ Katak ➔ Ular ➔ Elang\n\nJika para petani membasmi populasi katak secara berlebihan dengan pestisida, tentukan apakah peristiwa berikut Benar atau Salah:`,
          col1: 'Benar',
          col2: 'Salah',
          rows: [
            { text: 'Populasi belalang akan meningkat drastis karena predatornya berkurang.', key: 'col1' },
            { text: 'Populasi padi di sawah akan tumbuh semakin subur.', key: 'col2' },
            { text: 'Populasi ular sawah akan terancam berkurang karena sumber makanannya menurun.', key: 'col1' },
          ],
        };
      }
      if (isPGKMcma) {
        return {
          type: 'pgk_mcma',
          bobot,
          soal: `Dalam suatu ekosistem kebun terdapat tanaman tomat, ulat pemakan daun, burung kutilang, dan elang.\n\nManakah pernyataan yang tepat mengenai peran masing-masing organisme? (Pilihlah semua yang benar!)`,
          options: [
            { text: 'Tanaman tomat berperan sebagai produsen karena mampu melakukan fotosintesis.', isKey: true },
            { text: 'Ulat berperan sebagai konsumen tingkat I (herbivora).', isKey: true },
            { text: 'Burung kutilang berperan sebagai konsumen puncak.', isKey: false },
            { text: 'Bakteri dan jamur tanah berperan sebagai dekomposer (pengurai).', isKey: true },
          ],
        };
      }
      return {
        type: 'pg',
        bobot,
        soal: `Perhatikan rantai makanan berikut: Fitoplankton ➔ Zooplankton ➔ Ikan kecil ➔ Ikan besar ➔ Pengurai.\n\nOrganisme yang menduduki peran sebagai konsumen tingkat II pada rantai makanan tersebut adalah...`,
        a: 'Fitoplankton',
        b: 'Zooplankton',
        c: 'Ikan kecil',
        d: 'Ikan besar',
        kunci: 'C',
      };
    }

    if (cleanMateri.includes('gaya') || cleanMateri.includes('gerak') || cleanMateri.includes('energi')) {
      if (isPGKKategori) {
        return {
          type: 'pgk_kategori',
          bobot,
          soal: `Tentukan Benar atau Salah pernyataan mengenai macam-macam gaya berikut dalam kehidupan sehari-hari!`,
          col1: 'Benar',
          col2: 'Salah',
          rows: [
            { text: 'Gaya gesek pada ban sepeda yang beralur membantu mencegah pengendara tergelincir.', key: 'col1' },
            { text: 'Buah kelapa yang jatuh ke tanah dipengaruhi oleh gaya magnet bumi.', key: 'col2' },
            { text: 'Menendang bola hingga melesat menunjukkan gaya dapat mengubah gerak benda.', key: 'col1' },
          ],
        };
      }
      return {
        type: 'pg',
        bobot,
        soal: `Ketika seorang pemanah menarik tali busur kemudian melepaskannya hingga anak panah melesat jauh ke depan, jenis gaya yang dimanfaatkan pada tali busur tersebut adalah...`,
        a: 'Gaya gravitasi',
        b: 'Gaya pegas',
        c: 'Gaya gesek',
        d: 'Gaya magnet',
        kunci: 'B',
      };
    }

    if (cleanMateri.includes('organ') || cleanMateri.includes('pencernaan') || cleanMateri.includes('pernapasan')) {
      if (isPGKMcma) {
        return {
          type: 'pgk_mcma',
          bobot,
          soal: `Sistem organ pencernaan manusia mengolah makanan agar nutrisinya dapat diserap tubuh.\n\nManakah pernyataan berikut yang sesuai dengan fungsi organ pencernaan? (Pilih dua atau lebih!)`,
          options: [
            { text: 'Di dalam lambung terjadi pencernaan mekanik dan kimiawi dengan bantuan enzim pepsin.', isKey: true },
            { text: 'Usus halus merupakan tempat utama penyerapan sari-sari makanan ke dalam darah.', isKey: true },
            { text: 'Usus besar berfungsi menghasilkan empedu untuk mencerna lemak.', isKey: false },
            { text: 'Air dan garam mineral sisa pencernaan diserap kembali di dalam usus besar.', isKey: true },
          ],
        };
      }
      return {
        type: 'pg',
        bobot,
        soal: `Pertukaran gas oksigen ($O_2$) dan karbon dioksida ($CO_2$) pada sistem pernapasan manusia terjadi di dalam bagian paru-paru yang disebut...`,
        a: 'Bronkus',
        b: 'Trakea',
        c: 'Alveolus',
        d: 'Laring',
        kunci: 'C',
      };
    }

    return {
      type: 'pg',
      bobot,
      soal: `Berdasarkan indikator [${indikator || materi}]: Peristiwa perubahan wujud benda dari gas menjadi cair seperti terbentuknya titik-titik embun di dedaunan pada pagi hari disebut...`,
      a: 'Menguap',
      b: 'Mengembun',
      c: 'Membeku',
      d: 'Menyublim',
      kunci: 'B',
    };
  }

  // -------------------------------------------------------------
  // 3. BAHASA INDONESIA GENERATOR
  // -------------------------------------------------------------
  if (cleanMapel.includes('indonesia') || cleanMapel.includes('bahasa')) {
    if (cleanMateri.includes('ide pokok') || cleanMateri.includes('paragraf') || cleanMateri.includes('simpulan')) {
      const stimulusText = `Bacalah paragraf berikut dengan saksama!\n"Hutan mangrove di pesisir pantai memiliki peranan ekologis yang sangat penting. Selain mencegah abrasi pantai akibat hantaman ombak laut, hutan mangrove juga menjadi habitat tempat berkembang biaknya aneka jenis ikan dan kepiting bakau. Oleh karena itu, kelestarian ekosistem mangrove harus terus dijaga bersama oleh masyarakat."`;

      if (isPGKKategori) {
        return {
          type: 'pgk_kategori',
          bobot,
          soal: `${stimulusText}\n\nBerdasarkan teks di atas, tentukan Benar atau Salah pernyataan berikut!`,
          col1: 'Benar',
          col2: 'Salah',
          rows: [
            { text: 'Hutan mangrove berfungsi melindungi garis pantai dari abrasi gelombang laut.', key: 'col1' },
            { text: 'Paragraf tersebut membahas jenis-jenis perahu nelayan di pesisir pantai.', key: 'col2' },
            { text: 'Kepiting bakau dan ikan memanfaatkan mangrove sebagai habitat alami.', key: 'col1' },
          ],
        };
      }
      return {
        type: 'pg',
        bobot,
        soal: `${stimulusText}\n\nIde pokok paragraf bacaan di atas adalah...`,
        a: 'Penyebab terjadinya abrasi pantai oleh ombak',
        b: 'Pentingnya peranan ekologis hutan mangrove di pesisir pantai',
        c: 'Cara membudidayakan kepiting bakau di laut',
        d: 'Kebiasaan masyarakat membersihkan pantai',
        kunci: 'B',
      };
    }

    if (cleanMateri.includes('ejaan') || cleanMateri.includes('kapital') || cleanMateri.includes('tanda baca')) {
      return {
        type: 'pg',
        bobot,
        soal: `Perhatikan kalimat berikut:\n"ayah membeli apel jeruk dan mangga di pasar klewer solo pada hari minggu."\n\nPenulisan huruf kapital dan tanda baca yang paling tepat sesuai kaidah bahasa Indonesia adalah...`,
        a: 'Ayah membeli apel, jeruk, dan mangga di Pasar Klewer, Solo pada hari Minggu.',
        b: 'Ayah membeli apel jeruk dan mangga di pasar Klewer Solo pada hari minggu.',
        c: 'Ayah membeli apel, jeruk dan mangga di pasar klewer Solo pada hari Minggu.',
        d: 'Ayah membeli Apel, Jeruk, dan Mangga di Pasar klewer, solo pada Hari Minggu.',
        kunci: 'A',
      };
    }

    return {
      type: 'pg',
      bobot,
      soal: `Perhatikan bait pantun berikut:\n\nPohon jati tumbuh berjajar,\nTempat berteduh si anak rusa.\nBarang siapa rajin belajar,\nPasti tercapai cita-citanya.\n\nAmanat yang terkandung dalam pantun tersebut adalah...`,
      a: 'Kita harus menanam pohon jati untuk tempat berteduh',
      b: 'Rusa adalah binatang yang suka berteduh di bawah pohon',
      c: 'Kegigihan dan kerajinan dalam belajar akan mewujudkan cita-cita',
      d: 'Cita-cita dapat terwujud tanpa harus belajar keras',
      kunci: 'C',
    };
  }

  // -------------------------------------------------------------
  // 4. PPKN / PENDIDIKAN PANCASILA GENERATOR
  // -------------------------------------------------------------
  if (cleanMapel.includes('pancasila') || cleanMapel.includes('pkn') || cleanMapel.includes('ppkn')) {
    if (isPGKKategori) {
      return {
        type: 'pgk_kategori',
        bobot,
        soal: `Sebagai warga negara yang baik di lingkungan sekolah, tentukan Benar atau Salah tindakan-tindakan berikut dalam mencerminkan pengamalan nilai Pancasila:`,
        col1: 'Benar',
        col2: 'Salah',
        rows: [
          { text: 'Menghormati teman yang sedang menjalankan ibadah sesuai agamanya mencerminkan Sila Pertama.', key: 'col1' },
          { text: 'Memaksakan pendapat pribadi saat musyawarah pemilihan ketua kelas merupakan wujud Sila Keempat.', key: 'col2' },
          { text: 'Gemar menolong teman yang terjatuh tanpa membeda-bedakan suku mencerminkan Sila Kedua.', key: 'col1' },
        ],
      };
    }
    if (isPGKMcma) {
      return {
        type: 'pgk_mcma',
        bobot,
        soal: `Musyawarah mufakat adalah ciri luhur demokrasi Pancasila.\n\nManakah sikap-sikap terpuji yang wajib ditunjukkan saat mengikuti musyawarah kelas? (Pilih dua atau lebih!)`,
        options: [
          { text: 'Mendengarkan pendapat orang lain dengan sopan dan penuh perhatian.', isKey: true },
          { text: 'Menerima hasil keputusan musyawarah dengan ikhlas dan lapang dada.', isKey: true },
          { text: 'Meninggalkan ruangan musyawarah jika usulannya tidak disetujui.', isKey: false },
          { text: 'Menyampaikan pendapat dengan bahasa yang santun dan tidak memotong pembicaraan.', isKey: true },
        ],
      };
    }
    return {
      type: 'pg',
      bobot,
      soal: `Pak RT mengundang seluruh warga untuk bergotong royong membersihkan saluran air dan pos ronda menjelang musim hujan. Seluruh warga hadir bekerja sama dengan rukun tanpa memandang perbedaan latar belakang suku maupun agama.\n\nPerilaku warga tersebut merupakan wujud nyata pengamalan Pancasila, khususnya sila...`,
      a: 'Pertama (Ketuhanan Yang Maha Esa)',
      b: 'Kedua (Kemanusiaan yang adil dan beradab)',
      c: 'Ketiga (Persatuan Indonesia)',
      d: 'Kelima (Keadilan sosial bagi seluruh rakyat Indonesia)',
      kunci: 'C',
    };
  }

  // -------------------------------------------------------------
  // 5. IPS GENERATOR
  // -------------------------------------------------------------
  if (cleanMapel.includes('ips') || cleanMapel.includes('sosial')) {
    if (isPGKKategori) {
      return {
        type: 'pgk_kategori',
        bobot,
        soal: `Tentukan apakah pernyataan mengenai kegiatan ekonomi dan potensi geografis Indonesia berikut Benar atau Salah:`,
        col1: 'Benar',
        col2: 'Salah',
        rows: [
          { text: 'Kegiatan mengolah teh dan sayuran di dataran tinggi merupakan contoh kegiatan produksi.', key: 'col1' },
          { text: 'Menjual hasil tangkapan ikan nelayan ke pasar tradisional merupakan kegiatan konsumsi.', key: 'col2' },
          { text: 'Letak Indonesia di antara Samudra Hindia dan Pasifik menjadikannya jalur perdagangan internasional yang strategis.', key: 'col1' },
        ],
      };
    }
    return {
      type: 'pg',
      bobot,
      soal: `Naskah Proklamasi Kemerdekaan Indonesia diketik oleh seorang tokoh pemuda pejuang setelah disepakati bersama di rumah Laksamana Maeda. Tokoh yang mengetik teks proklamasi tersebut adalah...`,
      a: 'Sukarni',
      b: 'Sayuti Melik',
      c: 'Chaerul Saleh',
      d: 'B.M. Diah',
      kunci: 'B',
    };
  }

  // -------------------------------------------------------------
  // 6. DEFAULT GENERAL SUBJECT GENERATOR
  // -------------------------------------------------------------
  if (isPGKKategori) {
    return {
      type: 'pgk_kategori',
      bobot,
      soal: `Berdasarkan materi [${materi}] dan capaian [${cp || 'Kurikulum Merdeka'}]:\nEvaluasi kebenaran dari pernyataan-pernyataan berikut:`,
      col1: 'Benar',
      col2: 'Salah',
      rows: [
        { text: `Pernyataan 1: Konsep ${materi} diterapkan secara konsisten dalam pemecahan masalah sehari-hari.`, key: 'col1' },
        { text: `Pernyataan 2: ${indikator || 'Indikator pembelajaran'} tidak memiliki kaitan dengan materi yang dipelajari.`, key: 'col2' },
        { text: `Pernyataan 3: Pemahaman mendalam tentang ${materi} menunjang tercapainya tujuan evaluasi asesmen.`, key: 'col1' },
      ],
    };
  }

  if (isPGKMcma) {
    return {
      type: 'pgk_mcma',
      bobot,
      soal: `Berdasarkan indikator pembelajaran: "${indikator || materi}".\n\nManakah pernyataan-pernyataan berikut yang bernilai tepat? (Pilihlah lebih dari satu jawaban!)`,
      options: [
        { text: `Konsep utama dalam ${materi} mencakup pemahaman prinsip dasar dan penerapannya.`, isKey: true },
        { text: `Analisis indikator menunjukkan relevansi langsung dengan tujuan kurikulum fase ini.`, isKey: true },
        { text: `Pernyataan ini sengaja dibuat tidak sesuai dengan prinsip dasar ${materi}.`, isKey: false },
        { text: `Penyelesaian masalah membutuhkan langkah verifikasi data yang cermat dan sistematis.`, isKey: true },
      ],
    };
  }

  return {
    type: 'pg',
    bobot,
    soal: `Perhatikan indikator soal: [${indikator || materi}].\n\nBerdasarkan lingkup materi ${materi} untuk kelas ${grade}, kesimpulan yang paling tepat dalam menjawab persoalan tersebut adalah...`,
    a: `Penerapan konsep ${materi} secara tepat dan terstruktur`,
    b: `Pengabaian langkah analisis pada permasalahan yang dihadapi`,
    c: `Penyelesaian tanpa memperhatikan data atau stimulus pendukung`,
    d: `Pilihan yang bertentangan dengan kaidah materi ${materi}`,
    kunci: 'A',
  };
}

/**
 * Generates an array of Questions locally from an array of Kisi-Kisi items
 */
export function generateQuestionsFromKisiKisi(
  items: KisiKisiItem[],
  subject = 'Matematika',
  grade = '6',
  options?: GeneratorOptions
): Question[] {
  if (!items || items.length === 0) return [];
  return items.map((it) => generateQuestionLocally(it, subject, grade, options));
}

/**
 * Server-side AI Gemini Generator bridge
 * Calls `/api/generate-soal-kisi-kisi` with fallback to local generator
 */
export async function generateQuestionsWithGemini(
  items: KisiKisiItem[],
  subject: string,
  grade: string,
  options?: GeneratorOptions
): Promise<{ questions: Question[]; source: 'gemini' | 'local'; message?: string }> {
  try {
    const res = await fetch('/api/generate-soal-kisi-kisi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items,
        subject,
        grade,
        options,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        return {
          questions: data.questions,
          source: 'gemini',
          message: 'Berhasil membuat butir soal kontekstual dengan AI Gemini (gemini-3.8-flash)!',
        };
      }
    }
  } catch {
    // network or endpoint error, fallback to local
  }

  // Graceful local fallback
  const localQuestions = generateQuestionsFromKisiKisi(items, subject, grade, options);
  return {
    questions: localQuestions,
    source: 'local',
    message: 'Soal berhasil disusun menggunakan Generator Cerdas Pola Kurikulum Nasional.',
  };
}
