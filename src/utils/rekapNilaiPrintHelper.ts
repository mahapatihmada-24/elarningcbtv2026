import { Nilai, SchoolProfile } from '../types';
import { formatScore } from './formatHelper';

const DEFAULT_SCHOOL_NAME = 'SD NEGERI HARJOSARI KIDUL 01';
const DEFAULT_SCHOOL_SUBTITLE = 'DINAS PENDIDIKAN DAN KEBUDAYAAN KABUPATEN TEGAL';
const DEFAULT_SCHOOL_ADDRESS =
  'Jl. Raya Harjosari Kidul No. 01, Kec. Adiwerna, Kab. Tegal, Jawa Tengah 52194';

export interface RekapNilaiPrintParams {
  judulUjian: string;
  kelas: string;
  nilaiList: Nilai[];
  schoolProfile?: SchoolProfile | null;
  kkm?: number;
  namaGuru?: string;
  nipGuru?: string;
  guruPengampu?: {
    nama?: string;
    nip?: string;
  } | null;
}

export function generateRekapNilaiHtml(params: RekapNilaiPrintParams): string {
  const { judulUjian, kelas, nilaiList, schoolProfile, kkm = 75 } = params;
  const rawNamaGuru = params.namaGuru || params.guruPengampu?.nama || 'Wildan Pramadika, S.Pd.';
  const rawNipGuru = params.nipGuru !== undefined ? params.nipGuru : params.guruPengampu?.nip;
  const namaGuru = (rawNamaGuru || '').trim() || 'Wildan Pramadika, S.Pd.';
  const cleanNipGuru = (rawNipGuru || '').trim();
  const nipGuruDisplay = cleanNipGuru
    ? (cleanNipGuru.toUpperCase().startsWith('NIP') ? cleanNipGuru : `NIP. ${cleanNipGuru}`)
    : '';
  const schoolName = schoolProfile?.namaSekolah || DEFAULT_SCHOOL_NAME;
  const schoolSubtitle = DEFAULT_SCHOOL_SUBTITLE;
  const schoolAddress = schoolProfile?.alamat || DEFAULT_SCHOOL_ADDRESS;
  const thnAjar = schoolProfile?.tahunAjaran || '2025/2026';
  const semester = schoolProfile?.semester || 'Genap';
  const kepsek = schoolProfile?.kepalaSekolah || 'Hj. Siti Rokhmah, S.Pd.SD';
  const nipKepsek = schoolProfile?.nipKepalaSekolah || '196805121992032008';

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const total = nilaiList.length;
  const numericNilai = nilaiList.map((n) => Number(n.Nilai || 0));
  const avg =
    total > 0
      ? formatScore(numericNilai.reduce((a, b) => a + b, 0) / total)
      : '0,00';
  const maxNilai = total > 0 ? formatScore(Math.max(...numericNilai)) : '0,00';
  const minNilai = total > 0 ? formatScore(Math.min(...numericNilai)) : '0,00';
  const tuntasCount = nilaiList.filter((n) => Number(n.Nilai || 0) >= kkm).length;
  const tuntasPct = total > 0 ? Math.round((tuntasCount / total) * 100) : 0;
  const remedialCount = total - tuntasCount;

  const totalPelanggaran = nilaiList.reduce((acc, curr) => acc + (curr.Pelanggaran || 0), 0);
  const disiplinCount = nilaiList.filter((n) => (n.Pelanggaran || 0) === 0).length;
  const disiplinPct = total > 0 ? Math.round((disiplinCount / total) * 100) : 100;

  const penaltyPerViolation = schoolProfile?.poinPenaltiPelanggaran ?? 5;

  const rowsHtml = nilaiList
    .map((n, idx) => {
      const numNilai = Number(n.Nilai || 0);
      const isTuntas = numNilai >= kkm;
      const countPelanggaran = n.Pelanggaran || 0;

      let antiContekBadge = '';
      if (countPelanggaran === 0) {
        antiContekBadge = `
          <div style="color: #15803d; font-weight: bold; font-size: 11px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22c55e; margin-right:4px;"></span>
            Tertib / 100% Integritas (0x)
          </div>
          <div style="font-size: 10px; color: #64748b;">Fokus penuh tanpa berpindah layar</div>
        `;
      } else if (countPelanggaran <= 2) {
        antiContekBadge = `
          <div style="color: #b45309; font-weight: bold; font-size: 11px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#f59e0b; margin-right:4px;"></span>
            ⚠️ ${countPelanggaran}x Pindah Layar / Tab
          </div>
          <div style="font-size: 10px; color: #dc2626;">Pengurangan Skor: -${countPelanggaran * penaltyPerViolation} Poin</div>
        `;
      } else {
        antiContekBadge = `
          <div style="color: #b91c1c; font-weight: bold; font-size: 11px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ef4444; margin-right:4px;"></span>
            🚨 3x Maksimal (Auto-Close)
          </div>
          <div style="font-size: 10px; color: #b91c1c; font-weight:600;">Penalti -${countPelanggaran * penaltyPerViolation} Poin (Ujian Dihentikan)</div>
        `;
      }

      return `
        <tr style="background-color: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
          <td style="text-align: center; font-weight: bold; padding: 6px 4px; vertical-align: top;">${idx + 1}</td>
          <td style="padding: 6px 8px; vertical-align: top; white-space: nowrap; font-size: 10px; color: #475569;">
            <div><strong style="color: #4338ca;">Mulai:</strong> ${n.Waktu_Mulai || '-'}</div>
            <div style="margin-top: 2px;"><strong style="color: #15803d;">Selesai:</strong> ${n.Waktu_Submit || '-'}</div>
          </td>
          <td style="padding: 6px 8px; vertical-align: top;">
            <strong style="color: #0f172a; font-size: 12px;">${n.Nama_Murid || '-'}</strong>
          </td>
          <td style="padding: 6px 6px; text-align: center; vertical-align: top; font-weight: 600; font-size: 11px;">
            ${n.Kelas || '-'}
          </td>
          <td style="padding: 6px 8px; vertical-align: top; font-size: 11px; color: #334155;">
            ${n.Judul_Ujian || judulUjian}
          </td>
          <td style="padding: 6px 6px; text-align: center; vertical-align: top;">
            <div style="font-size: 13px; font-weight: 800; color: ${isTuntas ? '#15803d' : '#dc2626'};">
              ${formatScore(numNilai)}
            </div>
            <div style="font-size: 9.5px; color: #64748b;">KKM: ${kkm}</div>
          </td>
          <td style="padding: 6px 6px; text-align: center; vertical-align: top;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-weight: 700; font-size: 10px; ${
              isTuntas
                ? 'background-color: #dcfce7; color: #166534; border: 1px solid #86efac;'
                : 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;'
            }">
              ${isTuntas ? 'TUNTAS' : 'REMEDIAL'}
            </span>
          </td>
          <td style="padding: 6px 8px; vertical-align: top;">
            ${antiContekBadge}
          </td>
          <td style="padding: 6px 8px; vertical-align: top; font-size: 11px; color: #475569;">
            ${n.Catatan_Guru || (n.Koreksi_Manual ? 'Koreksi manual selesai' : '-')}
          </td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Rekap Nilai & Log Anti-Contek - ${judulUjian}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm 10mm 10mm 10mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      margin: 0;
      padding: 16px;
      font-size: 11px;
      line-height: 1.4;
    }
    .kop-container {
      border-bottom: 3px double #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
      text-align: center;
    }
    .kop-container h4 {
      margin: 0;
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #1e293b;
      text-transform: uppercase;
    }
    .kop-container h2 {
      margin: 2px 0 0 0;
      font-size: 15pt;
      font-weight: 900;
      letter-spacing: 1px;
      color: #0f172a;
      text-transform: uppercase;
    }
    .kop-container p {
      margin: 2px 0 0 0;
      font-size: 8.5pt;
      color: #475569;
    }
    .title-box {
      text-align: center;
      margin-bottom: 12px;
    }
    .title-box h1 {
      margin: 0;
      font-size: 12.5pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .title-box .subtitle {
      font-size: 9.5pt;
      font-weight: 600;
      color: #4338ca;
      margin-top: 2px;
    }

    .meta-card {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-bottom: 12px;
      background-color: #f8fafc;
      padding: 8px 12px;
    }
    .meta-grid {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }
    .meta-grid td {
      padding: 2px 4px;
      vertical-align: middle;
    }

    .kpi-container {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .kpi-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 8px;
      background: #ffffff;
      text-align: center;
    }
    .kpi-label {
      font-size: 8.5pt;
      color: #64748b;
      font-weight: 600;
      display: block;
      margin-bottom: 2px;
    }
    .kpi-val {
      font-size: 12pt;
      font-weight: 800;
      color: #0f172a;
    }

    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-bottom: 16px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
    }
    table.data-table th {
      background-color: #1e293b;
      color: #ffffff;
      padding: 7px 6px;
      text-align: center;
      font-weight: 700;
      font-size: 9pt;
    }
    table.data-table tr {
      page-break-inside: avoid;
    }

    .ttd-box {
      width: 100%;
      margin-top: 14px;
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
      font-size: 9.5pt;
      color: #0f172a;
    }

    .print-bar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding: 8px 12px;
      background-color: #e0e7ff;
      border: 1px solid #c7d2fe;
      border-radius: 8px;
    }
    .btn-action {
      background-color: #4f46e5;
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 6px;
      border: none;
      font-weight: 700;
      font-size: 11px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .btn-action:hover {
      background-color: #4338ca;
    }

    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      .no-print {
        display: none !important;
      }
      .kop-container {
        border-bottom-color: #000000;
      }
      table.data-table th {
        background-color: #1e293b !important;
        color: #ffffff !important;
      }
    }
  </style>
</head>
<body>

  <!-- Onscreen action bar (hidden during print) -->
  <div class="print-bar no-print">
    <div style="font-size: 11px; color: #3730a3; font-weight: 600; margin-right: auto;">
      💡 Tips: Pilih <strong>"Save as PDF" / "Simpan sebagai PDF"</strong> pada dialog print browser untuk menyimpan laporan ini dalam format file PDF resmi.
    </div>
    <button type="button" class="btn-action" onclick="window.print()">
      🖨️ Cetak / Simpan PDF
    </button>
  </div>

  <!-- Kop Surat Resmi -->
  <div class="kop-container">
    <h4>${schoolSubtitle}</h4>
    <h2>${schoolName}</h2>
    <p>${schoolAddress} • Tahun Ajaran ${thnAjar} (${semester})</p>
  </div>

  <!-- Judul Laporan -->
  <div class="title-box">
    <h1>Laporan Rekapitulasi Hasil Asesmen CBT & Catatan Integritas</h1>
    <div class="subtitle">Sistem Monitoring Ujian Digital & Proteksi Anti-Contek Siswa</div>
  </div>

  <!-- Metadata Ujian -->
  <div class="meta-card">
    <table class="meta-grid">
      <tr>
        <td style="width: 16%;"><strong>Bank Soal / Ujian</strong></td>
        <td style="width: 34%;">: <strong style="color: #4338ca;">${judulUjian}</strong></td>
        <td style="width: 16%;"><strong>Standar KKM</strong></td>
        <td style="width: 34%;">: <strong>${kkm}</strong> (Kriteria Ketuntasan Minimal)</td>
      </tr>
      <tr>
        <td><strong>Rombongan Belajar</strong></td>
        <td>: ${kelas === 'ALL' ? 'Semua Rombel (Gabungan)' : 'Kelas ' + kelas}</td>
        <td><strong>Waktu Pencetakan</strong></td>
        <td>: ${dateStr}, Pukul ${timeStr} WIB</td>
      </tr>
      <tr>
        <td><strong>Satuan Pendidikan</strong></td>
        <td>: ${schoolName}</td>
        <td><strong>Semester / T.A.</strong></td>
        <td>: ${semester} / ${thnAjar}</td>
      </tr>
    </table>
  </div>

  <!-- KPI Ringkasan Statistik -->
  <div class="kpi-container">
    <div class="kpi-box">
      <span class="kpi-label">Total Peserta Ujian</span>
      <span class="kpi-val">${total} <small style="font-size: 9pt; font-weight:normal;">Siswa</small></span>
    </div>
    <div class="kpi-box" style="background-color: #f0fdf4; border-color: #bbf7d0;">
      <span class="kpi-label" style="color: #166534;">Rata-rata Nilai</span>
      <span class="kpi-val" style="color: #15803d;">${avg}</span>
    </div>
    <div class="kpi-box">
      <span class="kpi-label">Tertinggi / Terendah</span>
      <span class="kpi-val" style="font-size: 11pt;">${maxNilai} / ${minNilai}</span>
    </div>
    <div class="kpi-box" style="background-color: ${tuntasPct >= 75 ? '#f0fdf4' : '#fef2f2'}; border-color: ${tuntasPct >= 75 ? '#bbf7d0' : '#fecaca'};">
      <span class="kpi-label" style="color: ${tuntasPct >= 75 ? '#166534' : '#991b1b'};">Ketuntasan (KKM ≥ ${kkm})</span>
      <span class="kpi-val" style="color: ${tuntasPct >= 75 ? '#15803d' : '#b91c1c'};">${tuntasCount} <small style="font-size: 9pt;">(${tuntasPct}%)</small></span>
    </div>
    <div class="kpi-box" style="background-color: ${totalPelanggaran === 0 ? '#f0fdf4' : '#fffbeb'}; border-color: ${totalPelanggaran === 0 ? '#bbf7d0' : '#fde68a'};">
      <span class="kpi-label" style="color: ${totalPelanggaran === 0 ? '#166534' : '#92400e'};">Monitoring Anti-Contek</span>
      <span class="kpi-val" style="color: ${totalPelanggaran === 0 ? '#15803d' : '#b45309'};">${disiplinPct}% <small style="font-size: 8.5pt;">Tertib (${disiplinCount}/${total})</small></span>
    </div>
  </div>

  <!-- Tabel Rekapitulasi Data Siswa & Catatan Anti-Contek -->
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 3%;">No</th>
        <th style="width: 13%;">Waktu Pengerjaan</th>
        <th style="width: 16%;">Nama Lengkap Siswa</th>
        <th style="width: 6%;">Kelas</th>
        <th style="width: 15%;">Judul Ujian CBT</th>
        <th style="width: 9%;">Nilai Akhir</th>
        <th style="width: 9%;">Kelulusan</th>
        <th style="width: 18%;">Catatan Anti-Contek (Integritas)</th>
        <th style="width: 11%;">Catatan Guru</th>
      </tr>
    </thead>
    <tbody>
      ${
        rowsHtml ||
        `<tr><td colspan="9" style="text-align:center; padding: 20px; color:#94a3b8;">Tidak ada data hasil asesmen untuk filter yang dipilih.</td></tr>`
      }
    </tbody>
  </table>

  <!-- Tanda Tangan Pengesahan Resmi -->
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
          <strong>Guru Pengampu / Proktor CBT</strong>
          <br><br><br><br>
          <strong><u>${namaGuru}</u></strong><br>
          ${nipGuruDisplay ? `<span>${nipGuruDisplay}</span>` : ''}
        </td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 14px; font-size: 8.5pt; color: #94a3b8; text-align: right; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
    Dokumen dicetak otomatis dari Sistem E-Learning & CBT ${schoolName} • Dilindungi Proteksi Anti-Contek
  </div>

</body>
</html>`;
}

/**
 * Robust printing function: uses invisible iframe to print directly without popup blockers,
 * with automatic fallback to window.open if needed.
 */
export function printRekapNilaiDocument(params: RekapNilaiPrintParams): void {
  const html = generateRekapNilaiHtml(params);

  // 1. Try hidden iframe printing (immune to popup blocker and keeps exact print styling)
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.warn('Iframe print failed, falling back to window.open:', err);
          fallbackWindowPrint(html);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 8000);
        }
      }, 500);
      return;
    }
  } catch (err) {
    console.warn('Failed mounting print iframe:', err);
  }

  // 2. Fallback window.open
  fallbackWindowPrint(html);
}

function fallbackWindowPrint(html: string): void {
  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 500);
  }
}

/**
 * Triggers downloading the complete standalone HTML report file so user can archive or print anytime
 */
export function downloadRekapNilaiHtml(params: RekapNilaiPrintParams): void {
  const html = generateRekapNilaiHtml(params);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const cleanTitle = (params.judulUjian || 'Rekap_Nilai_CBT').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.href = url;
  a.download = `Laporan_Rekap_Nilai_${cleanTitle}_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
