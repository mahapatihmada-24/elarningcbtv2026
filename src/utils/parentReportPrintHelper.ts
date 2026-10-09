import { Nilai, SchoolProfile, User } from '../types';

const DEFAULT_SCHOOL_NAME = 'SD NEGERI HARJOSARI KIDUL 01';
const DEFAULT_SCHOOL_SUBTITLE = 'DINAS PENDIDIKAN DAN KEBUDAYAAN KABUPATEN TEGAL';
const DEFAULT_SCHOOL_ADDRESS =
  'Jl. Raya Harjosari Kidul No. 01, Kec. Adiwerna, Kab. Tegal, Jawa Tengah 52194';

export interface ParentReportPrintParams {
  student: User;
  nilaiList: Nilai[];
  schoolProfile?: SchoolProfile | null;
  kkm?: number;
}

export function generateParentReportHtml({
  student,
  nilaiList,
  schoolProfile,
  kkm = 75,
}: ParentReportPrintParams): string {
  const schoolName = schoolProfile?.namaSekolah || DEFAULT_SCHOOL_NAME;
  const schoolSubtitle = DEFAULT_SCHOOL_SUBTITLE;
  const schoolAddress = schoolProfile?.alamat || DEFAULT_SCHOOL_ADDRESS;
  const thnAjar = schoolProfile?.tahunAjaran || '2025/2026';
  const semester = schoolProfile?.semester || 'Genap';
  const kepsek = schoolProfile?.kepalaSekolah || 'Hj. Siti Rokhmah, S.Pd.SD';
  const nipKepsek = schoolProfile?.nipKepalaSekolah || '196805121992032008';

  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const total = nilaiList.length;
  const numericNilai = nilaiList.map((n) => Number(n.Nilai || 0));
  const avg =
    total > 0
      ? (numericNilai.reduce((a, b) => a + b, 0) / total).toLocaleString('id-ID', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : '0.0';
  const maxNilai = total > 0 ? Math.max(...numericNilai).toFixed(1) : '0';
  const minNilai = total > 0 ? Math.min(...numericNilai).toFixed(1) : '0';
  const tuntasCount = nilaiList.filter((n) => Number(n.Nilai || 0) >= kkm).length;
  const tuntasPct = total > 0 ? Math.round((tuntasCount / total) * 100) : 0;
  const totalPelanggaran = nilaiList.reduce((acc, curr) => acc + (curr.Pelanggaran || 0), 0);

  // Group by Mapel for per-subject summary
  const mapelMap = new Map<string, { total: number; sum: number; count: number }>();
  nilaiList.forEach((n) => {
    // Detect subject from Judul_Ujian if Mapel is not directly on Nilai
    let mapel = 'Umum';
    const title = n.Judul_Ujian || '';
    if (/matematika|mtk/i.test(title)) mapel = 'Matematika';
    else if (/ipa|sains/i.test(title)) mapel = 'IPA';
    else if (/ips|sosial/i.test(title)) mapel = 'IPS';
    else if (/bahasa indonesia|b\.indonesia|bind/i.test(title)) mapel = 'Bahasa Indonesia';
    else if (/bahasa inggris|english/i.test(title)) mapel = 'Bahasa Inggris';
    else if (/pjok|olahraga/i.test(title)) mapel = 'PJOK';
    else if (/pai|agama/i.test(title)) mapel = 'Pendidikan Agama';
    else if (/pkn|ppkn|pancasila/i.test(title)) mapel = 'Pendidikan Pancasila';
    else if (/seni|sbk/i.test(title)) mapel = 'Seni Budaya';

    const cur = mapelMap.get(mapel) || { total: 0, sum: 0, count: 0 };
    cur.sum += Number(n.Nilai || 0);
    cur.count += 1;
    mapelMap.set(mapel, cur);
  });

  const mapelRowsHtml = Array.from(mapelMap.entries())
    .map(([mapel, data], idx) => {
      const avgM = (data.sum / data.count).toFixed(1);
      const numAvg = parseFloat(avgM);
      let predikat = 'C';
      if (numAvg >= 90) predikat = 'A (Sangat Baik)';
      else if (numAvg >= 80) predikat = 'B (Baik)';
      else if (numAvg >= kkm) predikat = 'C (Cukup)';
      else predikat = 'D (Perlu Bimbingan)';

      const status = numAvg >= kkm ? 'Tuntas' : 'Perlu Penguatan';
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 6px 8px; text-align: center;">${idx + 1}</td>
          <td style="padding: 6px 8px; font-weight: bold; color: #1e293b;">${mapel}</td>
          <td style="padding: 6px 8px; text-align: center;">${data.count} Ujian</td>
          <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: #0f172a;">${avgM}</td>
          <td style="padding: 6px 8px; text-align: center;">${predikat}</td>
          <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: ${
            numAvg >= kkm ? '#15803d' : '#b91c1c'
          };">${status}</td>
        </tr>
      `;
    })
    .join('');

  const detailRowsHtml = nilaiList
    .map((n, idx) => {
      const numNilai = Number(n.Nilai || 0);
      const isTuntas = numNilai >= kkm;
      const countPelanggaran = n.Pelanggaran || 0;
      const waktu = n.Waktu_Submit ? n.Waktu_Submit.slice(0, 16) : '-';
      const catatan = n.Catatan_Guru ? n.Catatan_Guru : '-';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10.5px; page-break-inside: avoid;">
          <td style="padding: 6px 8px; text-align: center;">${idx + 1}</td>
          <td style="padding: 6px 8px; color: #475569;">${waktu}</td>
          <td style="padding: 6px 8px; font-weight: bold; color: #1e293b;">${n.Judul_Ujian || '-'}</td>
          <td style="padding: 6px 8px; text-align: center; font-weight: bold; font-size: 12px; color: ${
            isTuntas ? '#15803d' : '#b91c1c'
          }; background: ${isTuntas ? '#f0fdf4' : '#fef2f2'};">
            ${numNilai}
          </td>
          <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: ${
            isTuntas ? '#15803d' : '#b91c1c'
          };">
            ${isTuntas ? 'TUNTAS' : 'REMEDIAL'}
          </td>
          <td style="padding: 6px 8px; text-align: center; color: ${countPelanggaran === 0 ? '#15803d' : '#b45309'};">
            ${countPelanggaran === 0 ? '✓ Tertib (0x)' : `⚠️ ${countPelanggaran}x`}
          </td>
          <td style="padding: 6px 8px; color: #334155; font-style: italic;">
            ${catatan}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan_Belajar_${student.nama.replace(/\s+/g, '_')}_Ortu</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      line-height: 1.4;
    }
    .kop-table {
      width: 100%;
      border-bottom: 3px double #000;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .kop-logo {
      width: 65px;
      height: 65px;
      object-fit: contain;
    }
    .kop-text {
      text-align: center;
      padding-left: 10px;
    }
    .kop-subtitle {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .kop-school {
      font-size: 15pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 2px 0;
    }
    .kop-address {
      font-size: 8.5pt;
      font-style: italic;
      margin: 0;
      color: #334155;
    }
    .doc-title {
      text-align: center;
      margin: 12px 0 6px 0;
      font-size: 13pt;
      font-weight: bold;
      text-decoration: underline;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-subtitle {
      text-align: center;
      margin: 0 0 12px 0;
      font-size: 9.5pt;
      color: #475569;
    }
    .meta-box {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
    }
    .meta-box td {
      padding: 5px 8px;
      font-size: 10pt;
    }
    .stats-container {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 14px;
    }
    .stat-card {
      flex: 1;
      border: 1px solid #cbd5e1;
      padding: 8px;
      text-align: center;
      background: #f8fafc;
      border-radius: 4px;
    }
    .stat-val {
      font-size: 14pt;
      font-weight: bold;
      color: #0f172a;
    }
    .stat-lbl {
      font-size: 8pt;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .table-data {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .table-data th {
      background: #0f172a;
      color: #ffffff;
      padding: 6px 8px;
      font-size: 9.5pt;
      font-weight: bold;
      text-align: center;
      border: 1px solid #0f172a;
    }
    .section-title {
      font-size: 10.5pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #1e293b;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 3px;
      margin: 14px 0 8px 0;
    }
    .sig-table {
      width: 100%;
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .sig-table td {
      width: 50%;
      text-align: center;
      vertical-align: top;
      font-size: 10pt;
    }
    .sig-space {
      height: 55px;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <!-- KOP SURAT RESMI -->
  <table class="kop-table">
    <tr>
      <td style="width: 75px; text-align: center; vertical-align: middle;">
        <img src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png" class="kop-logo" alt="Logo Tut Wuri" onerror="this.style.display='none'" />
      </td>
      <td class="kop-text">
        <div class="kop-subtitle">${schoolSubtitle}</div>
        <div class="kop-school">${schoolName}</div>
        <div class="kop-address">${schoolAddress}</div>
      </td>
    </tr>
  </table>

  <!-- JUDUL DOKUMEN -->
  <div class="doc-title">LEMBAR RAPOR & REKAP PERKEMBANGAN BELAJAR SISWA</div>
  <div class="doc-subtitle">Dokumen Resmi Pendampingan Belajar Orang Tua / Wali Siswa Melalui Portal Digital CBT</div>

  <!-- BIODATA SISWA -->
  <table class="meta-box">
    <tr>
      <td style="width: 18%; font-weight: bold;">Nama Lengkap</td>
      <td style="width: 2%;">:</td>
      <td style="width: 35%; font-weight: bold; color: #0f172a;">${student.nama}</td>
      <td style="width: 18%; font-weight: bold;">Tahun Ajaran</td>
      <td style="width: 2%;">:</td>
      <td style="width: 25%;">${thnAjar} (${semester})</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">NISN / Username</td>
      <td>:</td>
      <td>${student.username}</td>
      <td style="font-weight: bold;">Standar KKM</td>
      <td>:</td>
      <td style="font-weight: bold; color: #b91c1c;">${kkm} (Minimal Tuntas)</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Kelas</td>
      <td>:</td>
      <td>${student.kelas}</td>
      <td style="font-weight: bold;">Tanggal Cetak</td>
      <td>:</td>
      <td>${dateStr}</td>
    </tr>
  </table>

  <!-- STATISTIK KUNCI -->
  <div class="stats-container">
    <div class="stat-card">
      <div class="stat-val" style="color: ${parseFloat(avg) >= kkm ? '#15803d' : '#b91c1c'};">${avg}</div>
      <div class="stat-lbl">Rata-Rata Nilai</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${total}</div>
      <div class="stat-lbl">Total Ujian Diikuti</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #15803d;">${tuntasPct}%</div>
      <div class="stat-lbl">Ketuntasan (${tuntasCount}/${total})</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #0369a1;">${maxNilai} / ${minNilai}</div>
      <div class="stat-lbl">Tertinggi / Terendah</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: ${totalPelanggaran === 0 ? '#15803d' : '#b45309'};">${totalPelanggaran === 0 ? 'Tertib' : totalPelanggaran + 'x'}</div>
      <div class="stat-lbl">Kepatuhan Anti-Contek</div>
    </div>
  </div>

  <!-- BAGIAN 1: REKAPITULASI CAPAIAN PER MATA PELAJARAN -->
  <div class="section-title">I. REKAPITULASI NILAI BERDASARKAN MATA PELAJARAN</div>
  <table class="table-data" style="border: 1px solid #cbd5e1;">
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 35%; text-align: left;">Mata Pelajaran</th>
        <th style="width: 15%;">Jumlah Ujian</th>
        <th style="width: 15%;">Nilai Rerata</th>
        <th style="width: 15%;">Predikat</th>
        <th style="width: 15%;">Keterangan</th>
      </tr>
    </thead>
    <tbody>
      ${mapelRowsHtml || '<tr><td colspan="6" style="text-align: center; padding: 10px; color: #64748b;">Belum ada riwayat ujian yang tersimpan.</td></tr>'}
    </tbody>
  </table>

  <!-- BAGIAN 2: RINCIAN RIWAYAT UJIAN CBT HARIAN -->
  <div class="section-title">II. RIWAYAT LENGKAP PELAKSANAAN UJIAN CBT</div>
  <table class="table-data" style="border: 1px solid #cbd5e1;">
    <thead>
      <tr>
        <th style="width: 4%;">No</th>
        <th style="width: 16%;">Waktu Submit</th>
        <th style="width: 32%; text-align: left;">Judul Ujian CBT</th>
        <th style="width: 10%;">Nilai</th>
        <th style="width: 11%;">Status KKM</th>
        <th style="width: 12%;">Integritas</th>
        <th style="width: 15%;">Catatan Guru</th>
      </tr>
    </thead>
    <tbody>
      ${detailRowsHtml || '<tr><td colspan="7" style="text-align: center; padding: 10px; color: #64748b;">Belum ada data nilai.</td></tr>'}
    </tbody>
  </table>

  <!-- CATATAN PEMBINAAN & PENDAMPINGAN -->
  <div style="background: #f8fafc; border: 1px dashed #94a3b8; border-radius: 4px; padding: 8px 12px; margin-top: 10px; font-size: 9.5pt; color: #334155;">
    <strong>Catatan Pendampingan untuk Orang Tua / Wali:</strong>
    <p style="margin: 3px 0 0 0; line-height: 1.4;">
      Mohon Ayah/Ibu terus memotivasi ananda dalam belajar di rumah. Manfaatkan fitur <em>Review Pembahasan</em> pada Portal Orang Tua untuk membimbing konsep materi pada butir soal yang dijawab belum tepat.
    </p>
  </div>

  <!-- TANDA TANGAN RESMI -->
  <table class="sig-table">
    <tr>
      <td>
        <div>Mengetahui,</div>
        <div style="font-weight: bold;">Orang Tua / Wali Siswa,</div>
        <div class="sig-space"></div>
        <div style="border-bottom: 1px solid #000; display: inline-block; min-width: 180px;">&nbsp;</div>
        <div style="font-size: 8.5pt; color: #64748b; margin-top: 2px;">(Tanda Tangan & Nama Terang)</div>
      </td>
      <td>
        <div>Tegal, ${dateStr}</div>
        <div style="font-weight: bold;">Guru Kelas / Wali Kelas,</div>
        <div class="sig-space"></div>
        <div style="font-weight: bold; text-decoration: underline;">${schoolProfile?.kepalaSekolah || 'Guru Kelas'}</div>
        <div style="font-size: 8.5pt; color: #475569;">NIP. ${nipKepsek}</div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function printParentReportDocument(params: ParentReportPrintParams) {
  const html = generateParentReportHtml(params);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
  }
}
