import * as XLSX from 'xlsx';
import { Ujian, Question, KisiKisiItem, ExamPayload, SchoolProfile } from '../types';

export const DEFAULT_SCHOOL_NAME = 'SD NEGERI HARJOSARI KIDUL 01';
export const DEFAULT_SCHOOL_SUBTITLE = 'DINAS PENDIDIKAN DAN KEBUDAYAAN KABUPATEN TEGAL';
export const DEFAULT_SCHOOL_ADDRESS = 'Jl. Raya Harjosari Kidul No. 01, Kec. Adiwerna, Kab. Tegal, Jawa Tengah 52194';

/**
 * Normalizes any KisiKisi item into the required 8-column Kurikulum Merdeka structure:
 * Elemen, Sub Elemen, Kompetensi, Level Kognitif, Konteks, Indikator, Tipe Soal, Nomor Soal
 */
export function normalizeKisiKisiItem(
  raw: Partial<KisiKisiItem> & Record<string, any>,
  index: number,
  defaultMapel = 'Matematika',
  defaultKelas = '6'
): KisiKisiItem {
  const cleanMapel = (defaultMapel || '').toLowerCase();
  const subElemen =
    (raw.subElemen || raw.materi || '').trim() || `${defaultMapel || 'Materi'} Topik ${index + 1}`;
  const lowerSub = subElemen.toLowerCase();

  // 1. Deduce Elemen if not present
  let elemen = (raw.elemen || '').trim();
  if (!elemen) {
    if (cleanMapel.includes('matematika') || cleanMapel.includes('mtk')) {
      if (
        lowerSub.includes('pecahan') ||
        lowerSub.includes('bilangan') ||
        lowerSub.includes('desimal') ||
        lowerSub.includes('persen') ||
        lowerSub.includes('hitung') ||
        lowerSub.includes('kpk') ||
        lowerSub.includes('fpb') ||
        lowerSub.includes('rasio')
      ) {
        elemen = 'Bilangan';
      } else if (
        lowerSub.includes('bangun datar') ||
        lowerSub.includes('bangun ruang') ||
        lowerSub.includes('geometri') ||
        lowerSub.includes('sudut') ||
        lowerSub.includes('koordinat') ||
        lowerSub.includes('kubus') ||
        lowerSub.includes('balok') ||
        lowerSub.includes('lingkaran')
      ) {
        elemen = 'Geometri';
      } else if (
        lowerSub.includes('luas') ||
        lowerSub.includes('keliling') ||
        lowerSub.includes('volume') ||
        lowerSub.includes('panjang') ||
        lowerSub.includes('kecepatan') ||
        lowerSub.includes('skala') ||
        lowerSub.includes('waktu') ||
        lowerSub.includes('debit') ||
        lowerSub.includes('berat')
      ) {
        elemen = 'Pengukuran';
      } else if (
        lowerSub.includes('data') ||
        lowerSub.includes('diagram') ||
        lowerSub.includes('tabel') ||
        lowerSub.includes('rata-rata') ||
        lowerSub.includes('modus') ||
        lowerSub.includes('median') ||
        lowerSub.includes('statistika') ||
        lowerSub.includes('peluang')
      ) {
        elemen = 'Analisis Data dan Peluang';
      } else {
        elemen = 'Bilangan';
      }
    } else if (cleanMapel.includes('ipas') || cleanMapel.includes('ipa') || cleanMapel.includes('sains')) {
      if (
        lowerSub.includes('ekosistem') ||
        lowerSub.includes('rantai makanan') ||
        lowerSub.includes('tumbuhan') ||
        lowerSub.includes('hewan') ||
        lowerSub.includes('organ') ||
        lowerSub.includes('makhluk') ||
        lowerSub.includes('fotosintesis')
      ) {
        elemen = 'Pemahaman IPAS (Makhluk Hidup & Lingkungan)';
      } else if (
        lowerSub.includes('gaya') ||
        lowerSub.includes('gerak') ||
        lowerSub.includes('magnet') ||
        lowerSub.includes('listrik') ||
        lowerSub.includes('energi') ||
        lowerSub.includes('kalor') ||
        lowerSub.includes('cahaya') ||
        lowerSub.includes('bunyi')
      ) {
        elemen = 'Pemahaman IPAS (Energi & Gaya)';
      } else if (
        lowerSub.includes('tata surya') ||
        lowerSub.includes('bumi') ||
        lowerSub.includes('planet') ||
        lowerSub.includes('rotasi') ||
        lowerSub.includes('cuaca') ||
        lowerSub.includes('batuan')
      ) {
        elemen = 'Pemahaman IPAS (Bumi & Antariksa)';
      } else if (
        lowerSub.includes('sosial') ||
        lowerSub.includes('sejarah') ||
        lowerSub.includes('peta') ||
        lowerSub.includes('keragaman') ||
        lowerSub.includes('ekonomi') ||
        lowerSub.includes('budaya')
      ) {
        elemen = 'Pemahaman IPAS (Sosial & Budaya)';
      } else {
        elemen = 'Pemahaman IPAS';
      }
    } else if (cleanMapel.includes('bahasa indonesia') || cleanMapel.includes('indo')) {
      if (
        lowerSub.includes('ejaan') ||
        lowerSub.includes('kalimat') ||
        lowerSub.includes('tata bahasa') ||
        lowerSub.includes('kapital') ||
        lowerSub.includes('menulis') ||
        lowerSub.includes('tanda baca')
      ) {
        elemen = 'Menulis';
      } else if (
        lowerSub.includes('simak') ||
        lowerSub.includes('dialog') ||
        lowerSub.includes('mendengar') ||
        lowerSub.includes('rekaman')
      ) {
        elemen = 'Menyimak';
      } else if (
        lowerSub.includes('bicara') ||
        lowerSub.includes('presentasi') ||
        lowerSub.includes('pidato')
      ) {
        elemen = 'Berbicara dan Mempresentasikan';
      } else {
        elemen = 'Membaca dan Memirsa';
      }
    } else if (
      cleanMapel.includes('pancasila') ||
      cleanMapel.includes('pkn') ||
      cleanMapel.includes('ppkn')
    ) {
      if (
        lowerSub.includes('hak') ||
        lowerSub.includes('kewajiban') ||
        lowerSub.includes('norma') ||
        lowerSub.includes('aturan') ||
        lowerSub.includes('uud') ||
        lowerSub.includes('tertib')
      ) {
        elemen = 'Undang-Undang Dasar Negara Republik Indonesia 1945';
      } else if (
        lowerSub.includes('suku') ||
        lowerSub.includes('budaya') ||
        lowerSub.includes('keragaman') ||
        lowerSub.includes('agama') ||
        lowerSub.includes('bhinneka') ||
        lowerSub.includes('toleransi')
      ) {
        elemen = 'Bhinneka Tunggal Ika';
      } else if (
        lowerSub.includes('nkri') ||
        lowerSub.includes('tanah air') ||
        lowerSub.includes('persatuan') ||
        lowerSub.includes('wilayah') ||
        lowerSub.includes('cinta tanah air')
      ) {
        elemen = 'Negara Kesatuan Republik Indonesia';
      } else {
        elemen = 'Pancasila';
      }
    } else {
      elemen = defaultMapel || 'Materi Pembelajaran';
    }
  }

  // 2. Competence (Kompetensi)
  const kompetensi =
    (raw.kompetensi || raw.cp_kd || '').trim() ||
    `Peserta didik mampu memahami, menganalisis, dan menyelesaikan masalah terkait materi ${subElemen}.`;

  // 3. Cognitive Level (Level Kognitif)
  const levelKognitif: 'L1' | 'L2' | 'L3' = (['L1', 'L2', 'L3'].includes(raw.levelKognitif as string)
    ? raw.levelKognitif
    : 'L2') as 'L1' | 'L2' | 'L3';

  // 4. Context (Konteks)
  let konteks = (raw.konteks || '').trim();
  if (!konteks) {
    const combinedText = `${subElemen} ${kompetensi} ${raw.indikator || ''}`.toLowerCase();
    if (
      combinedText.includes('ekosistem') ||
      combinedText.includes('tumbuhan') ||
      combinedText.includes('hewan') ||
      combinedText.includes('planet') ||
      combinedText.includes('tata surya') ||
      combinedText.includes('laboratorium') ||
      combinedText.includes('sains') ||
      combinedText.includes('eksperimen') ||
      combinedText.includes('gaya') ||
      combinedText.includes('energi') ||
      combinedText.includes('lingkungan hidup') ||
      combinedText.includes('organ') ||
      combinedText.includes('alam') ||
      combinedText.includes('matahari')
    ) {
      konteks = 'Saintifik';
    } else if (
      combinedText.includes('masyarakat') ||
      combinedText.includes('desa') ||
      combinedText.includes('budaya') ||
      combinedText.includes('tradisi') ||
      combinedText.includes('gotong royong') ||
      combinedText.includes('sekolah') ||
      combinedText.includes('teman') ||
      combinedText.includes('bangsa') ||
      combinedText.includes('suku') ||
      combinedText.includes('pancasila') ||
      combinedText.includes('pasar') ||
      combinedText.includes('daerah')
    ) {
      konteks = 'Sosial Budaya';
    } else {
      konteks = 'Personal';
    }
  }

  // 5. Indicator (Indikator Soal)
  const indikator =
    (raw.indikator || '').trim() ||
    `Disajikan stimulus atau konteks ${konteks.toLowerCase()}, peserta didik dapat menyelesaikan persoalan ${subElemen} dengan tepat.`;

  // 6. Question Type & Number
  const tipeSoal = (raw.tipeSoal || raw.bentukSoal || '').trim() || 'Pilihan Ganda';
  const nomorSoal = Number(raw.nomorSoal || raw.no || index + 1);
  const bobot = Number(raw.bobot || 1);

  return {
    no: index + 1,
    elemen,
    subElemen,
    kompetensi,
    levelKognitif,
    konteks,
    indikator,
    tipeSoal,
    nomorSoal,
    // Backward compatibility aliases
    cp_kd: kompetensi,
    materi: subElemen,
    bentukSoal: tipeSoal,
    bobot,
  };
}

/**
 * Intelligently analyzes question text and subject to deduce curriculum CP/KD,
 * topic (materi pokok), indicator, cognitive level (L1/L2/L3), and form.
 */
export function generateAutoKisiKisi(
  questions: Question[],
  mapel = 'Matematika',
  kelas = '6'
): KisiKisiItem[] {
  if (!questions || questions.length === 0) return [];

  const cleanMapel = (mapel || '').toLowerCase();

  return questions.map((q, idx) => {
    const noSoal = idx + 1;
    const soalText = (q.soal || '').trim();
    const lowerSoal = soalText.toLowerCase();

    // 1. Determine Bentuk Soal / Tipe Soal
    let tipeSoal = 'Pilihan Ganda';
    if (q.type === 'pgk_mcma') {
      tipeSoal = 'PGK (Multi-Jawaban)';
    } else if (q.type === 'pgk_kategori') {
      const col1 = (q as any).col1 || 'Benar';
      const col2 = (q as any).col2 || 'Salah';
      tipeSoal = `PGK (${col1} - ${col2})`;
    }

    // 2. Determine Level Kognitif
    let levelKognitif: 'L1' | 'L2' | 'L3' = 'L2';
    if (
      lowerSoal.includes('mengapa') ||
      lowerSoal.includes('analis') ||
      lowerSoal.includes('kesimpulan') ||
      lowerSoal.includes('faktor penyebab') ||
      lowerSoal.includes('manakah pernyataan yang benar') ||
      lowerSoal.includes('berdasarkan tabel') ||
      lowerSoal.includes('berdasarkan grafik') ||
      lowerSoal.includes('pernyataan berikut yang paling tepat') ||
      q.type === 'pgk_mcma' ||
      q.type === 'pgk_kategori'
    ) {
      levelKognitif = 'L3';
    } else if (
      lowerSoal.includes('adalah') ||
      lowerSoal.includes('disebut') ||
      lowerSoal.includes('dilambangkan') ||
      lowerSoal.includes('simbol') ||
      lowerSoal.includes('artinya') ||
      lowerSoal.includes('ibukota') ||
      lowerSoal.includes('ibu kota') ||
      lowerSoal.includes('nama') ||
      lowerSoal.includes('pengertian') ||
      lowerSoal.includes('siapakah')
    ) {
      levelKognitif = 'L1';
    }

    // 3. Deduce Konteks (Personal / Sosial Budaya / Saintifik)
    let konteks: 'Personal' | 'Sosial Budaya' | 'Saintifik' = 'Personal';
    if (
      lowerSoal.includes('ekosistem') ||
      lowerSoal.includes('rantai makanan') ||
      lowerSoal.includes('tumbuhan') ||
      lowerSoal.includes('hewan') ||
      lowerSoal.includes('planet') ||
      lowerSoal.includes('tata surya') ||
      lowerSoal.includes('magnet') ||
      lowerSoal.includes('listrik') ||
      lowerSoal.includes('gaya') ||
      lowerSoal.includes('energi') ||
      lowerSoal.includes('percobaan') ||
      lowerSoal.includes('laboratorium') ||
      lowerSoal.includes('alam') ||
      lowerSoal.includes('suhu') ||
      lowerSoal.includes('kalor')
    ) {
      konteks = 'Saintifik';
    } else if (
      lowerSoal.includes('gotong royong') ||
      lowerSoal.includes('masyarakat') ||
      lowerSoal.includes('desa') ||
      lowerSoal.includes('budaya') ||
      lowerSoal.includes('tradisi') ||
      lowerSoal.includes('sekolah') ||
      lowerSoal.includes('teman') ||
      lowerSoal.includes('pancasila') ||
      lowerSoal.includes('warga') ||
      lowerSoal.includes('bangsa') ||
      lowerSoal.includes('suku') ||
      lowerSoal.includes('pasar')
    ) {
      konteks = 'Sosial Budaya';
    }

    // 4. Subject-Specific Heuristic Mapping for Elemen, Sub Elemen, Kompetensi, and Indikator
    let elemen = cleanMapel.includes('matematika')
      ? 'Bilangan'
      : cleanMapel.includes('ipas')
      ? 'Pemahaman IPAS'
      : cleanMapel.includes('indo')
      ? 'Membaca dan Memirsa'
      : cleanMapel.includes('pkn') || cleanMapel.includes('pancasila')
      ? 'Pancasila'
      : mapel;
    let subElemen = `${mapel} Kelas ${kelas}`;
    let kompetensi = `Peserta didik mampu memahami, menganalisis, dan menyelesaikan masalah terkait materi ${mapel} fase fondasi/lanjutan.`;
    let indikator = `Disajikan stimulus/pertanyaan konteks ${konteks.toLowerCase()}, peserta didik dapat menentukan jawaban yang benar dengan tepat.`;

    if (cleanMapel.includes('matematika') || cleanMapel.includes('mtk')) {
      if (
        lowerSoal.includes('pecahan') ||
        lowerSoal.includes('\\frac') ||
        lowerSoal.includes('desimal') ||
        lowerSoal.includes('%') ||
        lowerSoal.includes('persen')
      ) {
        elemen = 'Bilangan';
        subElemen = 'Pecahan & Desimal';
        kompetensi = 'Peserta didik dapat memahami, membandingkan, dan melakukan operasi hitung pecahan dan desimal.';
        indikator = 'Disajikan permasalahan kegiatan sehari-hari, peserta didik dapat menyelesaikan operasi hitung pecahan dengan tepat.';
        konteks = 'Personal';
      } else if (
        lowerSoal.includes('luas') ||
        lowerSoal.includes('keliling') ||
        lowerSoal.includes('persegi') ||
        lowerSoal.includes('panjang') ||
        lowerSoal.includes('segitiga') ||
        lowerSoal.includes('lingkaran')
      ) {
        elemen = 'Geometri';
        subElemen = 'Geometri Bangun Datar';
        kompetensi = 'Peserta didik dapat mengidentifikasi unsur bangun datar serta menghitung keliling dan luas bangun datar.';
        indikator = 'Disajikan ukuran bidang atau taman pada lingkungan sekitar, peserta didik dapat menghitung keliling atau luas bidang tersebut.';
        konteks = 'Sosial Budaya';
      } else if (
        lowerSoal.includes('volume') ||
        lowerSoal.includes('kubus') ||
        lowerSoal.includes('balok') ||
        lowerSoal.includes('tabung') ||
        lowerSoal.includes('prisma') ||
        lowerSoal.includes('rusuk') ||
        lowerSoal.includes('sisi')
      ) {
        elemen = 'Geometri';
        subElemen = 'Geometri Bangun Ruang';
        kompetensi = 'Peserta didik dapat mengidentifikasi sifat-sifat bangun ruang serta menghitung volume dan luas permukaannya.';
        indikator = 'Disajikan data dimensi wadah penampungan, peserta didik dapat menentukan volume atau kapasitasnya.';
        konteks = 'Personal';
      } else if (
        lowerSoal.includes('diagram') ||
        lowerSoal.includes('rata-rata') ||
        lowerSoal.includes('median') ||
        lowerSoal.includes('modus') ||
        lowerSoal.includes('data') ||
        lowerSoal.includes('tabel')
      ) {
        elemen = 'Analisis Data dan Peluang';
        subElemen = 'Pengolahan Data & Statistika';
        kompetensi = 'Peserta didik dapat mengumpulkan, menyajikan, dan menganalisis data dalam bentuk tabel dan diagram.';
        indikator = 'Disajikan tabel atau diagram data pengamatan, peserta didik dapat menafsirkan atau menghitung ukuran pemusatan data.';
        konteks = 'Saintifik';
      } else if (
        lowerSoal.includes('skala') ||
        lowerSoal.includes('jarak') ||
        lowerSoal.includes('perbandingan') ||
        lowerSoal.includes('kecepatan')
      ) {
        elemen = 'Pengukuran';
        subElemen = 'Perbandingan, Rasio & Skala';
        kompetensi = 'Peserta didik dapat menyelesaikan masalah rasio perbandingan, skala peta, dan kecepatan perpindahan.';
        indikator = 'Disajikan denah lokasi atau perjalanan antarkota, peserta didik dapat menghitung nilai besaran yang ditanyakan.';
        konteks = 'Sosial Budaya';
      } else if (lowerSoal.includes('kpk') || lowerSoal.includes('fpb') || lowerSoal.includes('faktor')) {
        elemen = 'Bilangan';
        subElemen = 'KPK dan FPB';
        kompetensi = 'Peserta didik dapat menentukan kelipatan, faktor, KPK, dan FPB dari dua atau tiga bilangan.';
        indikator = 'Disajikan soal pemecahan masalah pembagian paket atau jadwal berulang, peserta didik dapat menentukan KPK atau FPB.';
        konteks = 'Personal';
      } else {
        elemen = 'Bilangan';
        subElemen = 'Operasi Hitung Bilangan';
        kompetensi = 'Peserta didik dapat melakukan operasi hitung penjumlahan, pengurangan, perkalian, dan pembagian bilangan bulat.';
        indikator = 'Disajikan operasi hitung kontekstual, peserta didik dapat menghitung hasil operasi dengan cermat.';
      }
    } else if (cleanMapel.includes('ipas') || cleanMapel.includes('ipa') || cleanMapel.includes('sains')) {
      if (
        lowerSoal.includes('ekosistem') ||
        lowerSoal.includes('rantai makanan') ||
        lowerSoal.includes('produsen') ||
        lowerSoal.includes('konsumen') ||
        lowerSoal.includes('dekomposer') ||
        lowerSoal.includes('simbiosis')
      ) {
        elemen = 'Pemahaman IPAS (Makhluk Hidup & Lingkungan)';
        subElemen = 'Ekosistem & Rantai Makanan';
        kompetensi = 'Peserta didik menganalisis hubungan antarmakhluk hidup pada suatu ekosistem dalam rantai dan jaring makanan.';
        indikator = 'Disajikan ilustrasi jaring-jaring makanan pada ekosistem alam, peserta didik dapat memprediksi dampak perubahan populasi.';
        konteks = 'Saintifik';
      } else if (
        lowerSoal.includes('gaya') ||
        lowerSoal.includes('gerak') ||
        lowerSoal.includes('magnet') ||
        lowerSoal.includes('listrik') ||
        lowerSoal.includes('gravitasi') ||
        lowerSoal.includes('gesek')
      ) {
        elemen = 'Pemahaman IPAS (Energi & Gaya)';
        subElemen = 'Gaya, Gerak, dan Energi';
        kompetensi = 'Peserta didik mendeskripsikan pengaruh berbagai macam gaya terhadap gerak dan bentuk benda.';
        indikator = 'Disajikan aktivitas olahraga atau pemanfaatan alat mekanis, peserta didik dapat mengidentifikasi jenis gaya yang bekerja.';
        konteks = 'Saintifik';
      } else if (
        lowerSoal.includes('tumbuhan') ||
        lowerSoal.includes('daun') ||
        lowerSoal.includes('akar') ||
        lowerSoal.includes('fotosintesis') ||
        lowerSoal.includes('bunga') ||
        lowerSoal.includes('klorofil')
      ) {
        elemen = 'Pemahaman IPAS (Makhluk Hidup & Lingkungan)';
        subElemen = 'Struktur & Fungsi Tumbuhan';
        kompetensi = 'Peserta didik mengidentifikasi bagian tubuh tumbuhan dan memahami fungsinya bagi kelangsungan hidup.';
        indikator = 'Disajikan gambar atau fungsi bagian tumbuhan, peserta didik dapat menentukan organ tumbuhan yang dimaksud.';
        konteks = 'Saintifik';
      } else if (
        lowerSoal.includes('organ') ||
        lowerSoal.includes('pencernaan') ||
        lowerSoal.includes('pernapasan') ||
        lowerSoal.includes('jantung') ||
        lowerSoal.includes('darah') ||
        lowerSoal.includes('lambung')
      ) {
        elemen = 'Pemahaman IPAS (Makhluk Hidup & Lingkungan)';
        subElemen = 'Sistem Organ Tubuh Manusia';
        kompetensi = 'Peserta didik menganalisis organ pernapasan, pencernaan, dan peredaran darah serta memelihara kesehatannya.';
        indikator = 'Disajikan proses fisiologis tubuh dan pola hidup sehat, peserta didik dapat menentukan fungsi organ yang bersangkutan.';
        konteks = 'Personal';
      } else if (
        lowerSoal.includes('tata surya') ||
        lowerSoal.includes('planet') ||
        lowerSoal.includes('bumi') ||
        lowerSoal.includes('bulan') ||
        lowerSoal.includes('rotasi') ||
        lowerSoal.includes('revolusi')
      ) {
        elemen = 'Pemahaman IPAS (Bumi & Antariksa)';
        subElemen = 'Tata Surya & Bumi';
        kompetensi = 'Peserta didik memahami sistem tata surya dan peristiwa rotasi serta revolusi bumi dan dampaknya.';
        indikator = 'Disajikan karakteristik benda langit, peserta didik dapat mengidentifikasi nama planet atau fenomena rotasi/revolusi.';
        konteks = 'Saintifik';
      } else {
        elemen = 'Pemahaman IPAS (Bumi & Lingkungan)';
        subElemen = 'Gejala Alam & Lingkungan Hidup';
        kompetensi = 'Peserta didik memahami fenomena alam, lingkungan biotik dan abiotik di sekitarnya.';
        indikator = 'Disajikan fenomena alam sekitar, peserta didik dapat menganalisis penyebab atau dampak peristiwanya.';
        konteks = 'Saintifik';
      }
    } else if (cleanMapel.includes('bahasa indonesia') || cleanMapel.includes('indo')) {
      if (
        lowerSoal.includes('ide pokok') ||
        lowerSoal.includes('gagasan') ||
        lowerSoal.includes('kalimat utama') ||
        lowerSoal.includes('paragraf')
      ) {
        elemen = 'Membaca dan Memirsa';
        subElemen = 'Ide Pokok & Struktur Paragraf';
        kompetensi = 'Peserta didik mampu menemukan ide pokok, gagasan pendukung, dan pesan tersirat dalam teks bacaan.';
        indikator = 'Disajikan paragraf bacaan artikel atau wacana populer, peserta didik dapat menentukan ide pokok paragraf.';
        konteks = 'Sosial Budaya';
      } else if (
        lowerSoal.includes('puisi') ||
        lowerSoal.includes('pantun') ||
        lowerSoal.includes('bait') ||
        lowerSoal.includes('rima') ||
        lowerSoal.includes('sampiran') ||
        lowerSoal.includes('isi')
      ) {
        elemen = 'Membaca dan Memirsa';
        subElemen = 'Sastra Puisi & Pantun';
        kompetensi = 'Peserta didik mampu mengapresiasi dan menganalisis karya sastra puisi atau pantun anak.';
        indikator = 'Disajikan bait pantun kearifan lokal, peserta didik dapat menentukan amanat atau melengkapi baris yang rumpang.';
        konteks = 'Sosial Budaya';
      } else if (
        lowerSoal.includes('ejaan') ||
        lowerSoal.includes('huruf kapital') ||
        lowerSoal.includes('tanda baca') ||
        lowerSoal.includes('baku') ||
        lowerSoal.includes('kalimat efektif')
      ) {
        elemen = 'Menulis';
        subElemen = 'Tata Bahasa & Ejaan Baku';
        kompetensi = 'Peserta didik mampu menerapkan kaidah kebahasaan, tanda baca, huruf kapital, dan kosakata baku.';
        indikator = 'Disajikan kalimat dengan kesalahan penulisan, peserta didik dapat menentukan perbaikan tanda baca atau kata baku.';
        konteks = 'Personal';
      } else if (
        lowerSoal.includes('sinonim') ||
        lowerSoal.includes('antonim') ||
        lowerSoal.includes('makna kata') ||
        lowerSoal.includes('arti kata')
      ) {
        elemen = 'Membaca dan Memirsa';
        subElemen = 'Makna Kata & Kosakata';
        kompetensi = 'Peserta didik mampu memahami dan memperkaya perbendaharaan kosakata dan makna kata.';
        indikator = 'Disajikan kalimat dengan kata khusus bertema lingkungan, peserta didik dapat menentukan arti kata tersebut.';
        konteks = 'Saintifik';
      } else {
        elemen = 'Membaca dan Memirsa';
        subElemen = 'Pemahaman Teks Bacaan';
        kompetensi = 'Peserta didik mampu memahami pesan, informasi tersurat dan tersirat dalam teks informatif.';
        indikator = 'Disajikan kutipan teks bacaan narasi, peserta didik dapat menjawab pertanyaan isi teks dengan tepat.';
        konteks = 'Personal';
      }
    } else if (cleanMapel.includes('pancasila') || cleanMapel.includes('pkn') || cleanMapel.includes('ppkn')) {
      if (
        lowerSoal.includes('sila') ||
        lowerSoal.includes('pancasila') ||
        lowerSoal.includes('bintang') ||
        lowerSoal.includes('rantai') ||
        lowerSoal.includes('pohon beringin') ||
        lowerSoal.includes('banteng') ||
        lowerSoal.includes('padi')
      ) {
        elemen = 'Pancasila';
        subElemen = 'Simbol & Pengamalan Sila';
        kompetensi = 'Peserta didik memahami simbol, makna, dan penerapan nilai-nilai luhur Pancasila dalam kehidupan berbangsa.';
        indikator = 'Disajikan contoh perilaku kehidupan sehari-hari di rumah atau sekolah, peserta didik dapat menentukan sila Pancasila yang relevan.';
        konteks = 'Sosial Budaya';
      } else if (
        lowerSoal.includes('hak') ||
        lowerSoal.includes('kewajiban') ||
        lowerSoal.includes('tanggung jawab')
      ) {
        elemen = 'Undang-Undang Dasar Negara Republik Indonesia 1945';
        subElemen = 'Hak & Kewajiban Warga Negara';
        kompetensi = 'Peserta didik mampu membedakan pelaksanaan hak, kewajiban, dan tanggung jawab sebagai warga negara.';
        indikator = 'Disajikan studi kasus musyawarah atau kegiatan kelas, peserta didik dapat mengidentifikasi wujud hak atau kewajiban.';
        konteks = 'Sosial Budaya';
      } else if (
        lowerSoal.includes('keberagaman') ||
        lowerSoal.includes('suku') ||
        lowerSoal.includes('budaya') ||
        lowerSoal.includes('agama') ||
        lowerSoal.includes('bhinneka')
      ) {
        elemen = 'Bhinneka Tunggal Ika';
        subElemen = 'Keberagaman Suku & Budaya Bangsa';
        kompetensi = 'Peserta didik menumbuhkan sikap toleransi dan menghargai keragaman budaya, suku, dan agama di Indonesia.';
        indikator = 'Disajikan keragaman adat/budaya Nusantara, peserta didik dapat menentukan sikap toleransi yang tepat.';
        konteks = 'Sosial Budaya';
      } else {
        elemen = 'Negara Kesatuan Republik Indonesia';
        subElemen = 'Norma, Aturan & Cinta Tanah Air';
        kompetensi = 'Peserta didik memahami norma, aturan hukum, dan keutuhan Negara Kesatuan Republik Indonesia.';
        indikator = 'Disajikan aturan kehidupan bermasyarakat, peserta didik dapat menentukan sikap patuh terhadap norma.';
        konteks = 'Sosial Budaya';
      }
    } else if (cleanMapel.includes('inggris') || cleanMapel.includes('english')) {
      elemen = 'Membaca - Memirsa';
      subElemen = 'English Vocabulary & Context';
      kompetensi = 'Peserta didik mampu memahami teks deskriptif sederhana, kosakata fungsional, dan percakapan kontekstual.';
      indikator = 'Disajikan percakapan singkat perkenalan atau hobi, peserta didik dapat menentukan respon yang tepat.';
      konteks = 'Personal';
    }

    return {
      no: idx + 1,
      elemen,
      subElemen,
      kompetensi,
      levelKognitif,
      konteks,
      indikator,
      tipeSoal,
      nomorSoal: noSoal,
      // Backward compatibility aliases
      cp_kd: kompetensi,
      materi: subElemen,
      bentukSoal: tipeSoal,
      bobot: q.bobot || 1,
    };
  });
}

/**
 * Safely extracts or restores Kisi-Kisi items for an exam, normalizing all items
 * into the 8-column format: Elemen, Sub Elemen, Kompetensi, Level Kognitif, Konteks, Indikator, Tipe Soal, Nomor Soal.
 */
export function extractKisiKisiFromUjian(ujian: Ujian, fallbackQuestions?: Question[]): KisiKisiItem[] {
  // 1. Direct Kisi_Kisi_JSON field
  if (ujian.Kisi_Kisi_JSON && ujian.Kisi_Kisi_JSON.trim()) {
    try {
      const parsed = JSON.parse(ujian.Kisi_Kisi_JSON);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => normalizeKisiKisiItem(item, idx, ujian.Mapel, ujian.Kelas));
      }
    } catch {}
  }

  // 2. ExamPayload inside Soal_JSON
  let questions: Question[] = [];
  if (ujian.Soal_JSON && ujian.Soal_JSON.trim()) {
    try {
      const parsed = JSON.parse(ujian.Soal_JSON);
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.kisi_kisi) && parsed.kisi_kisi.length > 0) {
          return parsed.kisi_kisi.map((item: any, idx: number) =>
            normalizeKisiKisiItem(item, idx, ujian.Mapel, ujian.Kelas)
          );
        }
        if (Array.isArray(parsed.questions)) {
          questions = parsed.questions;
        } else if (Array.isArray(parsed)) {
          questions = parsed;
        }
      }
    } catch {}
  }

  if (questions.length === 0 && fallbackQuestions && fallbackQuestions.length > 0) {
    questions = fallbackQuestions;
  }

  // 3. Fallback: Auto-generate
  return generateAutoKisiKisi(questions, ujian.Mapel, ujian.Kelas);
}

interface ExportKisiParams {
  ujian: Ujian;
  items: KisiKisiItem[];
  schoolProfile?: SchoolProfile | null;
  guruName?: string;
}

/**
 * Export Kisi-Kisi Soal to official Excel spreadsheet (.xlsx).
 */
export function exportKisiKisiToExcel({
  ujian,
  items,
  schoolProfile,
  guruName = 'Guru Mata Pelajaran',
}: ExportKisiParams): void {
  const wb = XLSX.utils.book_new();

  const namaSekolah = schoolProfile?.namaSekolah || DEFAULT_SCHOOL_NAME;
  const thnAjar = schoolProfile?.tahunAjaran || '2025/2026';
  const semester = schoolProfile?.semester || 'Genap';
  const kepsek = schoolProfile?.kepalaSekolah || 'Hj. Siti Rokhmah, S.Pd.SD';
  const nipKepsek = schoolProfile?.nipKepalaSekolah || '196805121992032008';

  const rows: any[][] = [];

  // Title
  rows.push(['KISI-KISI PENULISAN SOAL ASESMEN / UJIAN SEKOLAH']);
  rows.push([namaSekolah.toUpperCase()]);
  rows.push([`TAHUN AJARAN ${thnAjar} - SEMESTER ${semester.toUpperCase()}`]);
  rows.push([]); // blank

  // Header metadata
  rows.push(['Satuan Pendidikan', ':', namaSekolah]);
  rows.push(['Mata Pelajaran', ':', ujian.Mapel || 'Matematika']);
  rows.push(['Kelas / Semester', ':', `${ujian.Kelas || '6'} / ${semester}`]);
  rows.push(['Bentuk Soal', ':', 'Pilihan Ganda & PG Kompleks']);
  rows.push(['Alokasi Waktu', ':', `${ujian.Durasi_Menit || 60} Menit`]);
  rows.push(['Jumlah Butir Soal', ':', `${items.length} Soal`]);
  rows.push(['Penyusun / Guru', ':', guruName]);
  rows.push([]); // blank

  // Table Headers
  rows.push([
    'No',
    'Elemen',
    'Sub Elemen',
    'Kompetensi',
    'Level Kognitif',
    'Konteks',
    'Indikator',
    'Tipe Soal',
    'Nomor Soal',
    'Bobot',
  ]);

  // Data rows
  items.forEach((it, idx) => {
    rows.push([
      idx + 1,
      it.elemen || it.materi || '-',
      it.subElemen || it.materi || '-',
      it.kompetensi || it.cp_kd || '-',
      it.levelKognitif || 'L2',
      it.konteks || 'Personal',
      it.indikator || '-',
      it.tipeSoal || it.bentukSoal || 'Pilihan Ganda',
      it.nomorSoal || idx + 1,
      it.bobot || 1,
    ]);
  });

  // Footer / Signatures
  rows.push([]);
  rows.push([]);
  rows.push([
    '',
    '',
    'Mengetahui,',
    '',
    '',
    '',
    'Tegal, ' + new Date().toLocaleDateString('id-ID', { dateStyle: 'long' }),
    '',
  ]);
  rows.push([
    '',
    '',
    'Kepala Sekolah',
    '',
    '',
    '',
    'Guru Mata Pelajaran',
    '',
  ]);
  rows.push([]);
  rows.push([]);
  rows.push([]);
  rows.push([
    '',
    '',
    kepsek,
    '',
    '',
    '',
    guruName,
    '',
  ]);
  rows.push([
    '',
    '',
    nipKepsek ? `NIP. ${nipKepsek}` : 'NIP. -',
    '',
    '',
    '',
    'NIP. -',
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column width styling
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 22 }, // Elemen
    { wch: 22 }, // Sub Elemen
    { wch: 38 }, // Kompetensi
    { wch: 14 }, // Level Kognitif
    { wch: 16 }, // Konteks
    { wch: 45 }, // Indikator
    { wch: 22 }, // Tipe Soal
    { wch: 12 }, // Nomor Soal
    { wch: 8 },  // Bobot
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Kisi-Kisi Soal');

  const safeTitle = (ujian.Judul_Ujian || 'Kisi_Kisi_Soal')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 35);
  XLSX.writeFile(wb, `Kisi_Kisi_${safeTitle}.xlsx`);
}

/**
 * Export Kisi-Kisi Soal to Microsoft Word document (.doc) with complete formal formatting.
 */
export function exportKisiKisiToWord({
  ujian,
  items,
  schoolProfile,
  guruName = 'Guru Mata Pelajaran',
}: ExportKisiParams): void {
  const namaSekolah = schoolProfile?.namaSekolah || DEFAULT_SCHOOL_NAME;
  const alamatSekolah = schoolProfile?.alamat || DEFAULT_SCHOOL_ADDRESS;
  const thnAjar = schoolProfile?.tahunAjaran || '2025/2026';
  const semester = schoolProfile?.semester || 'Genap';
  const kepsek = schoolProfile?.kepalaSekolah || 'Hj. Siti Rokhmah, S.Pd.SD';
  const nipKepsek = schoolProfile?.nipKepalaSekolah || '196805121992032008';

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const tableRowsHtml = items
    .map(
      (it, idx) => `
    <tr>
      <td style="text-align:center; vertical-align:top; padding:6px 4px;">${idx + 1}</td>
      <td style="vertical-align:top; padding:6px 6px;"><strong>${it.elemen || it.materi || '-'}</strong></td>
      <td style="vertical-align:top; padding:6px 6px;">${it.subElemen || it.materi || '-'}</td>
      <td style="vertical-align:top; padding:6px 6px; text-align:justify;">${it.kompetensi || it.cp_kd || '-'}</td>
      <td style="text-align:center; vertical-align:top; padding:6px 4px; font-weight:bold;">${it.levelKognitif || 'L2'}</td>
      <td style="text-align:center; vertical-align:top; padding:6px 4px;">${it.konteks || 'Personal'}</td>
      <td style="vertical-align:top; padding:6px 6px; text-align:justify;">${it.indikator || '-'}</td>
      <td style="text-align:center; vertical-align:top; padding:6px 4px;">${it.tipeSoal || it.bentukSoal || 'Pilihan Ganda'}</td>
      <td style="text-align:center; vertical-align:top; padding:6px 4px; font-weight:bold;">${it.nomorSoal || idx + 1}</td>
      <td style="text-align:center; vertical-align:top; padding:6px 4px;">${it.bobot || 1}</td>
    </tr>
  `
    )
    .join('');

  const docHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>Kisi-Kisi Soal - ${ujian.Judul_Ujian}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 1.5cm 1.5cm 1.5cm 1.5cm;
      mso-page-orientation: landscape;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.3;
      color: #000;
    }
    .kop-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 3px double #000;
      margin-bottom: 12pt;
      padding-bottom: 6pt;
    }
    .kop-center {
      text-align: center;
    }
    .kop-center h2 {
      margin: 0;
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
    .kop-center h1 {
      margin: 2pt 0;
      font-size: 16pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    .kop-center p {
      margin: 0;
      font-size: 9.5pt;
      font-style: italic;
    }
    .title-doc {
      text-align: center;
      font-size: 13pt;
      font-weight: bold;
      text-decoration: underline;
      margin: 8pt 0 4pt 0;
      text-transform: uppercase;
    }
    .subtitle-doc {
      text-align: center;
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 12pt;
    }
    .meta-table {
      width: 100%;
      margin-bottom: 12pt;
      font-size: 10.5pt;
      border-collapse: collapse;
    }
    .meta-table td {
      padding: 2pt 4pt;
      vertical-align: top;
    }
    .kisi-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-bottom: 18pt;
    }
    .kisi-table th {
      background-color: #f2f2f2;
      border: 1pt solid #000;
      padding: 6pt 4pt;
      text-align: center;
      font-weight: bold;
    }
    .kisi-table td {
      border: 1pt solid #000;
    }
    .ttd-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15pt;
      font-size: 10.5pt;
      page-break-inside: avoid;
    }
    .ttd-table td {
      text-align: center;
      vertical-align: top;
      width: 45%;
    }
  </style>
</head>
<body>

  <!-- KOP SEKOLAH RESMI -->
  <table class="kop-table">
    <tr>
      <td class="kop-center">
        <h2>${DEFAULT_SCHOOL_SUBTITLE}</h2>
        <h1>${namaSekolah}</h1>
        <p>${alamatSekolah}</p>
      </td>
    </tr>
  </table>

  <div class="title-doc">KISI-KISI PENULISAN SOAL ASESMEN / CBT</div>
  <div class="subtitle-doc">${ujian.Judul_Ujian.toUpperCase()}</div>

  <!-- IDENTITAS ASESMEN -->
  <table class="meta-table">
    <tr>
      <td style="width: 18%;"><strong>Satuan Pendidikan</strong></td>
      <td style="width: 2%;">:</td>
      <td style="width: 35%;">${namaSekolah}</td>
      <td style="width: 18%;"><strong>Kelas / Semester</strong></td>
      <td style="width: 2%;">:</td>
      <td style="width: 25%;">${ujian.Kelas || '6'} / ${semester}</td>
    </tr>
    <tr>
      <td><strong>Mata Pelajaran</strong></td>
      <td>:</td>
      <td>${ujian.Mapel || 'Matematika'}</td>
      <td><strong>Alokasi Waktu</strong></td>
      <td>:</td>
      <td>${ujian.Durasi_Menit || 60} Menit</td>
    </tr>
    <tr>
      <td><strong>Tahun Ajaran</strong></td>
      <td>:</td>
      <td>${thnAjar}</td>
      <td><strong>Jumlah Soal</strong></td>
      <td>:</td>
      <td>${items.length} Butir Soal</td>
    </tr>
    <tr>
      <td><strong>Penyusun Soal</strong></td>
      <td>:</td>
      <td>${guruName}</td>
      <td><strong>Bentuk Asesmen</strong></td>
      <td>:</td>
      <td>Pilihan Ganda & PG Kompleks</td>
    </tr>
  </table>

  <!-- TABEL KISI-KISI -->
  <table class="kisi-table">
    <thead>
      <tr>
        <th style="width:3%;">No</th>
        <th style="width:11%;">Elemen</th>
        <th style="width:12%;">Sub Elemen</th>
        <th style="width:20%;">Kompetensi</th>
        <th style="width:8%;">Level Kognitif</th>
        <th style="width:8%;">Konteks</th>
        <th style="width:22%;">Indikator</th>
        <th style="width:8%;">Tipe Soal</th>
        <th style="width:5%;">Nomor Soal</th>
        <th style="width:3%;">Skor</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>

  <!-- TANDA TANGAN PENGESAHAN -->
  <table class="ttd-table">
    <tr>
      <td>
        Mengetahui,<br>
        <strong>Kepala Sekolah</strong>
        <br><br><br><br><br>
        <strong><u>${kepsek}</u></strong><br>
        ${nipKepsek ? `NIP. ${nipKepsek}` : 'NIP. -'}
      </td>
      <td style="width: 10%;"></td>
      <td>
        Adiwerna, ${dateStr}<br>
        <strong>Guru Mata Pelajaran</strong>
        <br><br><br><br><br>
        <strong><u>${guruName}</u></strong><br>
        NIP. -
      </td>
    </tr>
  </table>

</body>
</html>`;

  const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeTitle = (ujian.Judul_Ujian || 'Kisi_Kisi_Soal')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 35);
  link.download = `Kisi_Kisi_${safeTitle}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Print Kisi-Kisi Document directly via browser window / PDF printer with landscape layout.
 */
export function printKisiKisiDocument({
  ujian,
  items,
  schoolProfile,
  guruName = 'Guru Mata Pelajaran',
}: ExportKisiParams): void {
  const namaSekolah = schoolProfile?.namaSekolah || DEFAULT_SCHOOL_NAME;
  const alamatSekolah = schoolProfile?.alamat || DEFAULT_SCHOOL_ADDRESS;
  const thnAjar = schoolProfile?.tahunAjaran || '2025/2026';
  const semester = schoolProfile?.semester || 'Genap';
  const kepsek = schoolProfile?.kepalaSekolah || 'Hj. Siti Rokhmah, S.Pd.SD';
  const nipKepsek = schoolProfile?.nipKepalaSekolah || '196805121992032008';

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const tableRowsHtml = items
    .map(
      (it, idx) => `
    <tr>
      <td style="text-align:center; padding:5px 4px; vertical-align:top;">${idx + 1}</td>
      <td style="padding:5px 6px; vertical-align:top; font-weight:600;">${it.elemen || it.materi || '-'}</td>
      <td style="padding:5px 6px; vertical-align:top;">${it.subElemen || it.materi || '-'}</td>
      <td style="padding:5px 6px; vertical-align:top; text-align:justify;">${it.kompetensi || it.cp_kd || '-'}</td>
      <td style="text-align:center; padding:5px 4px; vertical-align:top; font-weight:bold;">
        <span class="badge-${(it.levelKognitif || 'L2').toLowerCase()}">${it.levelKognitif || 'L2'}</span>
      </td>
      <td style="text-align:center; padding:5px 4px; vertical-align:top;">
        <span class="badge-konteks badge-konteks-${(it.konteks || 'personal').toLowerCase().replace(/\s+/g, '-')}">${it.konteks || 'Personal'}</span>
      </td>
      <td style="padding:5px 6px; vertical-align:top; text-align:justify;">${it.indikator || '-'}</td>
      <td style="text-align:center; padding:5px 4px; vertical-align:top;">${it.tipeSoal || it.bentukSoal || 'Pilihan Ganda'}</td>
      <td style="text-align:center; padding:5px 4px; vertical-align:top; font-weight:bold;">${it.nomorSoal || idx + 1}</td>
      <td style="text-align:center; padding:5px 4px; vertical-align:top;">${it.bobot || 1}</td>
    </tr>
  `
    )
    .join('');

  const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cetak Kisi-Kisi Soal - ${ujian.Judul_Ujian}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 1.2cm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10.5pt;
      line-height: 1.35;
      color: #111;
      margin: 0;
      padding: 10px;
    }
    .kop-header {
      text-align: center;
      border-bottom: 3px double #000;
      padding-bottom: 8px;
      margin-bottom: 14px;
    }
    .kop-header h3 {
      margin: 0;
      font-size: 13pt;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .kop-header h2 {
      margin: 2px 0;
      font-size: 16pt;
      font-weight: 900;
    }
    .kop-header p {
      margin: 0;
      font-size: 9pt;
      font-style: italic;
    }
    .title-box {
      text-align: center;
      margin-bottom: 14px;
    }
    .title-box h1 {
      margin: 0;
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      text-decoration: underline;
    }
    .title-box h2 {
      margin: 2px 0;
      font-size: 11pt;
      font-weight: bold;
      color: #333;
    }
    .meta-grid {
      display: table;
      width: 100%;
      margin-bottom: 12px;
      font-size: 10pt;
    }
    .meta-row {
      display: table-row;
    }
    .meta-cell {
      display: table-cell;
      padding: 2px 6px;
      vertical-align: top;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-bottom: 20px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #000;
    }
    table.data-table th {
      background-color: #f3f4f6;
      padding: 6px 4px;
      text-align: center;
      font-weight: bold;
    }
    .badge-l1 {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 4px;
      background-color: #dbeafe;
      color: #1e40af;
      font-size: 8pt;
    }
    .badge-l2 {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 4px;
      background-color: #fef3c7;
      color: #92400e;
      font-size: 8pt;
    }
    .badge-l3 {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 4px;
      background-color: #fce7f3;
      color: #9d174d;
      font-size: 8pt;
    }
    .badge-konteks {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: bold;
    }
    .badge-konteks-personal {
      background-color: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .badge-konteks-sosial-budaya {
      background-color: #f5f3ff;
      color: #5b21b6;
      border: 1px solid #ddd6fe;
    }
    .badge-konteks-saintifik {
      background-color: #ecfeff;
      color: #155e75;
      border: 1px solid #a5f3fc;
    }
    .ttd-box {
      width: 100%;
      margin-top: 15px;
      page-break-inside: avoid;
    }
    .ttd-table {
      width: 100%;
      border-collapse: collapse;
    }
    .ttd-table td {
      text-align: center;
      vertical-align: top;
      width: 45%;
      font-size: 10pt;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="kop-header">
    <h3>${DEFAULT_SCHOOL_SUBTITLE}</h3>
    <h2>${namaSekolah}</h2>
    <p>${alamatSekolah}</p>
  </div>

  <div class="title-box">
    <h1>KISI-KISI PENULISAN SOAL ASESMEN / UJIAN SEKOLAH</h1>
    <h2>${ujian.Judul_Ujian.toUpperCase()}</h2>
  </div>

  <table style="width: 100%; margin-bottom: 12px; font-size: 10pt; border-collapse: collapse;">
    <tr>
      <td style="width: 16%;"><strong>Satuan Pendidikan</strong></td>
      <td style="width: 2%;">:</td>
      <td style="width: 32%;">${namaSekolah}</td>
      <td style="width: 16%;"><strong>Kelas / Semester</strong></td>
      <td style="width: 2%;">:</td>
      <td style="width: 32%;">${ujian.Kelas || '6'} / ${semester}</td>
    </tr>
    <tr>
      <td><strong>Mata Pelajaran</strong></td>
      <td>:</td>
      <td>${ujian.Mapel || 'Matematika'}</td>
      <td><strong>Alokasi Waktu</strong></td>
      <td>:</td>
      <td>${ujian.Durasi_Menit || 60} Menit</td>
    </tr>
    <tr>
      <td><strong>Tahun Pelajaran</strong></td>
      <td>:</td>
      <td>${thnAjar}</td>
      <td><strong>Jumlah Soal</strong></td>
      <td>:</td>
      <td>${items.length} Butir Soal</td>
    </tr>
    <tr>
      <td><strong>Penyusun Soal</strong></td>
      <td>:</td>
      <td>${guruName}</td>
      <td><strong>Bentuk Asesmen</strong></td>
      <td>:</td>
      <td>Pilihan Ganda & PG Kompleks</td>
    </tr>
  </table>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width:3%;">No</th>
        <th style="width:11%;">Elemen</th>
        <th style="width:12%;">Sub Elemen</th>
        <th style="width:20%;">Kompetensi</th>
        <th style="width:8%;">Level Kognitif</th>
        <th style="width:8%;">Konteks</th>
        <th style="width:22%;">Indikator</th>
        <th style="width:8%;">Tipe Soal</th>
        <th style="width:5%;">Nomor Soal</th>
        <th style="width:3%;">Skor</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>

  <div class="ttd-box">
    <table class="ttd-table">
      <tr>
        <td>
          Mengetahui,<br>
          <strong>Kepala Sekolah</strong>
          <br><br><br><br>
          <strong><u>${kepsek}</u></strong><br>
          ${nipKepsek ? `NIP. ${nipKepsek}` : 'NIP. -'}
        </td>
        <td style="width: 10%;"></td>
        <td>
          Adiwerna, ${dateStr}<br>
          <strong>Guru Mata Pelajaran</strong>
          <br><br><br><br>
          <strong><u>${guruName}</u></strong><br>
          NIP. -
        </td>
      </tr>
    </table>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(printHtml);
    win.document.close();
  }
}
