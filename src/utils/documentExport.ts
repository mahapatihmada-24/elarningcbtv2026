import { Materi, Ujian, Question, getQuestionImages } from '../types';
import katex from 'katex';

const SCHOOL_NAME = 'SD NEGERI HARJOSARI KIDUL 01';
const SCHOOL_SUBTITLE = 'DINAS PENDIDIKAN DAN KEBUDAYAAN KABUPATEN TEGAL';
const SCHOOL_ADDRESS = 'Jl. Raya Harjosari Kidul No. 01, Kec. Adiwerna, Kab. Tegal, Jawa Tengah 52194';

/**
 * Formats mathematical formulas (LaTeX e.g. \frac{2}{4}, $\frac{3}{5}$, \sqrt, powers, symbols, etc.)
 * into clean, properly rendered visual representations for Word documents (.doc) and Printable views.
 */
export function formatMathForExport(
  raw: string,
  mode: 'word' | 'print' = 'word',
  images: string[] = []
): string {
  if (!raw) return '';

  let text = raw;

  // Format [Gambar X] tag to clean inline image or badge
  text = text.replace(/\[(?:Gambar|Gbr)\s*(\d*)\]/gi, (_, numStr) => {
    const num = numStr ? parseInt(numStr, 10) : 1;
    const imgIdx = num - 1;
    const imgUrl = images && images[imgIdx] ? images[imgIdx] : null;

    if (imgUrl) {
      if (mode === 'print') {
        return `<div style="margin: 8px 0; text-align: left;"><div style="display: inline-block; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px; background: #fff;"><img src="${imgUrl}" alt="Gambar ${num}" referrerpolicy="no-referrer" loading="eager" decoding="sync" style="max-height: 200px; max-width: 100%; object-fit: contain; display: block;" /><div style="font-size: 10px; color: #64748b; font-weight: bold; margin-top: 3px; text-align: center;">Gambar ${num}</div></div></div>`;
      }
      return `<div style="margin: 8pt 0; text-align: left;"><table style="border: 1pt solid #cbd5e1; background: #ffffff; padding: 4pt; border-collapse: collapse;"><tr><td style="text-align: center;"><img src="${imgUrl}" alt="Gambar ${num}" style="max-height: 160pt; max-width: 320pt; display: block; margin: 0 auto;" /><div style="font-size: 8.5pt; color: #475569; font-weight: bold; margin-top: 3pt;">Gambar ${num}</div></td></tr></table></div>`;
    }

    if (mode === 'print') {
      return `<span style="display:inline-flex; align-items:center; padding:1px 6px; margin:0 3px; border-radius:4px; font-size:11px; font-weight:bold; background:#e0e7ff; color:#3730a3; border:1px solid #c7d2fe;">📷 Gambar ${num}</span>`;
    }
    return `<span style="background-color:#e0e7ff; color:#3730a3; font-weight:bold; font-size:9pt; border:1px solid #c7d2fe; padding:1pt 4pt;">[Gambar ${num}]</span>`;
  });

  // Preserve line breaks for multi-line problems/prompts
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '<br/>');

  if (mode === 'print') {
    // For print mode, browser has full CSS/DOM support. Render with KaTeX!
    let processed = text;
    if (processed.includes('\\frac') && !processed.includes('$')) {
      processed = processed.replace(/\\frac\{[^{}]+\}\{[^{}]+\}/g, (m) => `$${m}$`);
    }
    if (processed.includes('\\sqrt') && !processed.includes('$')) {
      processed = processed.replace(/\\sqrt(?:\[[^{}]+\])?\{[^{}]+\}/g, (m) => `$${m}$`);
    }

    const renderedPrint = processed.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^\$\n]+?\$)/g, (match) => {
      let code = match;
      const isDisplay = match.startsWith('$$') || match.startsWith('\\[');
      if (match.startsWith('$$') && match.endsWith('$$')) code = match.slice(2, -2);
      else if (match.startsWith('\\[') && match.endsWith('\\]')) code = match.slice(2, -2);
      else if (match.startsWith('\\(') && match.endsWith('\\)')) code = match.slice(2, -2);
      else if (match.startsWith('$') && match.endsWith('$')) code = match.slice(1, -1);

      try {
        return katex.renderToString(code.trim(), {
          displayMode: isDisplay,
          throwOnError: false,
        });
      } catch {
        return match;
      }
    });

    return applyRichTextFormatting(renderedPrint, 'print');
  }

  // Word Document (.doc) mode
  // A. Fractions: \frac{num}{den} with or without $
  // Add space if immediately followed by words (e.g. $\frac{3}{5}$karung -> fraction + " karung")
  text = text.replace(/\$?(\\frac\{([^{}]+)\}\{([^{}]+)\})\$?(?=[a-zA-Z0-9])/g, (_, __, num, den) => {
    return `<span class="math-frac" style="display:inline-block; vertical-align:middle; text-align:center; font-family:'Calibri','Times New Roman',serif; margin:0 2pt; font-size:95%; line-height:1.1;"><span class="math-num" style="display:block; border-bottom:1pt solid windowtext; padding:0 2pt;">${num}</span><span class="math-den" style="display:block; padding:0 2pt;">${den}</span></span> `;
  });
  text = text.replace(/\$?(\\frac\{([^{}]+)\}\{([^{}]+)\})\$?(\s*)/g, (_, __, num, den, space) => {
    return `<span class="math-frac" style="display:inline-block; vertical-align:middle; text-align:center; font-family:'Calibri','Times New Roman',serif; margin:0 2pt; font-size:95%; line-height:1.1;"><span class="math-num" style="display:block; border-bottom:1pt solid windowtext; padding:0 2pt;">${num}</span><span class="math-den" style="display:block; padding:0 2pt;">${den}</span></span>${space || ''}`;
  });

  // B. Roots: \sqrt[n]{x} and \sqrt{x}
  text = text.replace(/\$?(\\sqrt\[([^{}]+)\]\{([^{}]+)\})\$?(\s*)/g, (_, __, n, x, space) => {
    return `<sup>${n}</sup>√<span style="text-decoration:overline; font-family:'Calibri','Times New Roman',serif;">${x}</span>${space || ''}`;
  });
  text = text.replace(/\$?(\\sqrt\{([^{}]+)\})\$?(\s*)/g, (_, __, x, space) => {
    return `√<span style="text-decoration:overline; font-family:'Calibri','Times New Roman',serif;">${x}</span>${space || ''}`;
  });

  // C. Math symbols
  text = text.replace(/\\times\b/g, '×');
  text = text.replace(/\\div\b/g, '÷');
  text = text.replace(/\\neq\b/g, '≠');
  text = text.replace(/\\leq\b|\\le\b/g, '≤');
  text = text.replace(/\\geq\b|\\ge\b/g, '≥');
  text = text.replace(/\\approx\b/g, '≈');
  text = text.replace(/\\infty\b/g, '∞');
  text = text.replace(/\\pm\b/g, '±');
  text = text.replace(/\\mp\b/g, '∓');
  text = text.replace(/\\cdot\b/g, '·');
  text = text.replace(/\\pi\b/g, 'π');
  text = text.replace(/\\degree\b/g, '°');

  // D. Powers & Subscripts
  text = text.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
  text = text.replace(/\^([0-9a-zA-Z]+)/g, '<sup>$1</sup>');
  text = text.replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>');
  text = text.replace(/_([0-9a-zA-Z]+)/g, '<sub>$1</sub>');

  // E. Clean leftover $ signs
  text = text.replace(/\$/g, '');

  return applyRichTextFormatting(text, mode);
}

/**
 * Applies rich typography formatting for exported documents (Word and Print/PDF):
 * Centered titles, text centering, font colors, bold, italic, and underline.
 */
function applyRichTextFormatting(content: string, mode: 'word' | 'print'): string {
  if (!content) return '';
  let s = content;

  // 1. Stimulus Titles: [judul]...[/judul] or [title]...[/title]
  const titleStyle = mode === 'print'
    ? 'text-align: center; font-weight: bold; font-size: 15px; margin: 8px 0; color: #0f172a;'
    : 'text-align: center; font-weight: bold; font-size: 13pt; margin: 6pt 0; color: #000000;';
  s = s.replace(/\[(?:judul|title)\]([\s\S]*?)\[\/(?:judul|title)\]/gi, `<div style="${titleStyle}">$1</div>`);

  // 2. Centered text blocks: [center]...[/center] or <center>...</center>
  const centerStyle = mode === 'print'
    ? 'text-align: center; margin: 6px 0;'
    : 'text-align: center; margin: 4pt 0;';
  s = s.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, `<div style="${centerStyle}">$1</div>`);
  s = s.replace(/<center>([\s\S]*?)<\/center>/gi, `<div style="${centerStyle}">$1</div>`);

  // 3. Font colors: [color=blue], [color=#0284c7], [warna=red], <font color="...">
  const colorMap: Record<string, string> = {
    biru: '#0284c7',
    blue: '#0284c7',
    merah: '#dc2626',
    red: '#dc2626',
    hijau: '#16a34a',
    green: '#16a34a',
    kuning: '#ca8a04',
    yellow: '#ca8a04',
    ungu: '#9333ea',
    purple: '#9333ea',
    oranye: '#ea580c',
    orange: '#ea580c',
    abu: '#64748b',
    gray: '#64748b',
    grey: '#64748b',
    hitam: '#0f172a',
    black: '#0f172a',
  };

  s = s.replace(/\[(?:color|warna)=([#a-zA-Z0-9]+)\]([\s\S]*?)\[\/(?:color|warna)\]/gi, (_, col, inner) => {
    const normalized = col.toLowerCase();
    const finalColor = colorMap[normalized] || (col.startsWith('#') ? col : `#${col}`);
    const safeColor = finalColor.replace(/[^#a-zA-Z0-9]/g, '');
    return `<span style="color: ${safeColor};">${inner}</span>`;
  });

  s = s.replace(/<font\s+color=["']?([#a-zA-Z0-9]+)["']?>([\s\S]*?)<\/font>/gi, (_, col, inner) => {
    const normalized = col.toLowerCase();
    const finalColor = colorMap[normalized] || (col.startsWith('#') ? col : `#${col}`);
    const safeColor = finalColor.replace(/[^#a-zA-Z0-9]/g, '');
    return `<span style="color: ${safeColor};">${inner}</span>`;
  });

  // 4. Explicit formatting tags: [b], [i], [u], [s]
  s = s.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>');
  s = s.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>');
  s = s.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>');
  s = s.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '<del>$1</del>');

  // 5. Markdown Formatting:
  // Bold + Italic: ***text***, **_text_**, _**text**_
  s = s.replace(/\*\*\*([^*\n\r]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*\_([^_\n\r]+)\_\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\_\*\*([^*\n\r]+)\*\*\_/g, '<strong><em>$1</em></strong>');

  // Bold: **text**
  s = s.replace(/\*\*([^*\n\r]+)\*\*/g, '<strong>$1</strong>');

  // Underline: __text__
  s = s.replace(/__([^_]+)__/g, '<u>$1</u>');

  // Italic: *text* and _text_
  s = s.replace(/(^|[^\w*])\*([^*\n\r]+)\*([^\w*]|$)/g, '$1<em>$2</em>$3');
  s = s.replace(/(^|[^\w_])_([^_\n\r]+)_([^\w_]|$)/g, '$1<em>$2</em>$3');

  return s;
}

/**
 * Clean HTML for Word document or printable view, preserving newlines and paragraph structure
 */
function sanitizeContentForWord(raw: string): string {
  if (!raw) return '';

  let clean = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Convert markdown images to HTML img for Word/Print
  clean = clean.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    '<div style="text-align: center; margin: 15pt 0;"><img src="$2" alt="$1" style="max-width: 500px; height: auto; border: 1px solid #ddd; border-radius: 6px;" /><p style="font-size: 9pt; color: #666; font-style: italic; margin-top: 4pt;">$1</p></div>'
  );

  const blockTags = 'div|p|table|thead|tbody|tfoot|tr|th|td|ul|ol|li|h[1-6]|blockquote|pre|hr|section|article|header|footer|figure|figcaption';

  // Strip newlines directly attached to block tags
  clean = clean.replace(new RegExp(`(<(?:\\/)?(?:${blockTags})[^>]*>)\\s*\\n+`, 'gi'), '$1');
  clean = clean.replace(new RegExp(`\\n+\\s*(<(?:\\/)?(?:${blockTags})[^>]*>)`, 'gi'), '$1');

  // Convert double newlines into a clean paragraph spacer for Word
  clean = clean.replace(/\n\s*\n+/g, '<div style="height: 12pt; margin: 0; padding: 0;"></div>');

  // Convert remaining single newlines into <br/>
  clean = clean.replace(/\n/g, '<br/>');

  return clean;
}

/**
 * Downloads Materi as Microsoft Word (.doc) document
 */
export function downloadMateriWord(materi: Materi): void {
  const rawContent = (materi as any).Konten || materi.Konten_Link || '';
  const sanitizedBody = formatMathForExport(sanitizeContentForWord(rawContent), 'word');
  const imageHtml = materi.Gambar_URL
    ? `<div style="text-align: center; margin: 15pt 0;">
        <img src="${materi.Gambar_URL}" alt="${materi.Judul}" style="max-width: 500px; height: auto; border: 1px solid #ddd; border-radius: 6px;" />
        <p style="font-size: 9pt; color: #666; font-style: italic; margin-top: 4pt;">Ilustrasi Materi: ${materi.Judul}</p>
      </div>`
    : '';

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${materi.Judul}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4;
      margin: 2.5cm 2.5cm 2.5cm 2.5cm;
      mso-page-orientation: portrait;
    }
    body {
      font-family: 'Calibri', 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #222;
    }
    .math-frac {
      display: inline-block;
      vertical-align: middle;
      text-align: center;
      font-family: 'Calibri', 'Times New Roman', serif;
      margin: 0 2pt;
      font-size: 95%;
      line-height: 1.1;
    }
    .math-num {
      display: block;
      border-bottom: 1pt solid windowtext;
      padding: 0 2pt;
    }
    .math-den {
      display: block;
      padding: 0 2pt;
    }
    .kop-surat {
      text-align: center;
      border-bottom: 3px double #111;
      padding-bottom: 8pt;
      margin-bottom: 18pt;
    }
    .kop-sub {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      color: #333;
    }
    .kop-main {
      font-size: 15pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 3pt 0;
      color: #0b2559;
    }
    .kop-addr {
      font-size: 9pt;
      color: #555;
      font-style: italic;
    }
    .doc-meta {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14pt;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
    }
    .doc-meta td {
      padding: 6pt 10pt;
      font-size: 10pt;
      border-bottom: 1px solid #e2e8f0;
    }
    .materi-title {
      font-size: 16pt;
      font-weight: bold;
      color: #1e293b;
      margin: 10pt 0 6pt 0;
      text-align: center;
      text-transform: uppercase;
    }
    .content-body {
      text-align: justify;
      text-justify: inter-word;
      line-height: 1.7;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
    }
    table, th, td {
      border: 1px solid #94a3b8;
      padding: 6pt 8pt;
    }
    th {
      background-color: #f1f5f9;
      font-weight: bold;
    }
    .doc-footer {
      margin-top: 30pt;
      padding-top: 10pt;
      border-top: 1px solid #cbd5e1;
      font-size: 9pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="kop-surat">
    <div class="kop-sub">${SCHOOL_SUBTITLE}</div>
    <div class="kop-main">${SCHOOL_NAME}</div>
    <div class="kop-addr">${SCHOOL_ADDRESS}</div>
  </div>

  <table class="doc-meta">
    <tr>
      <td width="20%"><strong>Mata Pelajaran</strong></td>
      <td width="30%">: ${materi.Mapel}</td>
      <td width="20%"><strong>Target Kelas</strong></td>
      <td width="30%">: ${materi.Kelas}</td>
    </tr>
    <tr>
      <td><strong>Penyusun / Guru</strong></td>
      <td>: ${materi.Nama_Guru}</td>
      <td><strong>Sumber Rujukan</strong></td>
      <td>: ${materi.Sumber || 'Materi Guru'}</td>
    </tr>
  </table>

  <h2 class="materi-title">${materi.Judul}</h2>

  ${imageHtml}

  <div class="content-body">
    ${sanitizedBody}
  </div>

  <div class="doc-footer">
    <p><em>Dicetak melalui Sistem Pembelajaran Digital & CBT ${SCHOOL_NAME}</em></p>
    <p>Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>
</body>
</html>
  `;

  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = materi.Judul.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'Materi';
  a.download = `[Materi] ${safeTitle}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Prints Materi or opens printable PDF dialog
 */
export function printMateri(materi: Materi): void {
  const rawContent = (materi as any).Konten || materi.Konten_Link || '';
  const sanitizedBody = formatMathForExport(sanitizeContentForWord(rawContent), 'print');
  const imageHtml = materi.Gambar_URL
    ? `<div style="text-align: center; margin: 15px 0;">
        <img src="${materi.Gambar_URL}" alt="${materi.Judul}" style="max-height: 380px; max-width: 100%; border: 1px solid #e2e8f0; border-radius: 8px;" />
        <p style="font-size: 11px; color: #64748b; font-style: italic; margin-top: 4px;">Ilustrasi Materi</p>
      </div>`
    : '';

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) return;

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${materi.Judul} - ${SCHOOL_NAME}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <style>
    @media print {
      body { margin: 0; padding: 15mm; font-size: 12pt; }
      .no-print { display: none !important; }
      @page { size: A4; margin: 15mm; }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1e293b;
      line-height: 1.7;
      padding: 30px;
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
    }
    .kop {
      text-align: center;
      border-bottom: 3px double #0f172a;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .kop h4 { margin: 0; font-size: 13px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; }
    .kop h2 { margin: 4px 0; font-size: 20px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; }
    .kop p { margin: 0; font-size: 11px; color: #64748b; font-style: italic; }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 16px;
      font-size: 12px;
    }
    .title {
      text-align: center;
      font-size: 20px;
      font-weight: 800;
      margin: 16px 0;
      color: #0f172a;
      text-transform: uppercase;
    }
    .content {
      text-align: justify;
      line-height: 1.8;
      font-size: 13px;
    }
    .content table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    .content table, .content th, .content td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
    }
    .content th { background-color: #f1f5f9; font-weight: 700; text-align: left; }
    .btn-print {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4f46e5;
      color: #fff;
      padding: 10px 18px;
      border-radius: 8px;
      border: none;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <button class="btn-print no-print" onclick="window.print()">Cetak / Simpan PDF</button>

  <div class="kop">
    <h4>${SCHOOL_SUBTITLE}</h4>
    <h2>${SCHOOL_NAME}</h2>
    <p>${SCHOOL_ADDRESS}</p>
  </div>

  <div class="meta-box">
    <div><strong>Mata Pelajaran:</strong> ${materi.Mapel}</div>
    <div><strong>Kelas:</strong> ${materi.Kelas}</div>
    <div><strong>Guru Pengajar:</strong> ${materi.Nama_Guru}</div>
    <div><strong>Sumber Buku:</strong> ${materi.Sumber || 'Materi Pembelajaran Guru'}</div>
  </div>

  <div class="title">${materi.Judul}</div>

  ${imageHtml}

  <div class="content">
    ${sanitizedBody}
  </div>

  <div style="margin-top: 40px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center;">
    Lembar Bahan Ajar Siswa • ${SCHOOL_NAME}
  </div>

  <script>
    window.onload = function() {
      // automatically prompt print on load
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</body>
</html>
  `);
  printWindow.document.close();
}

/**
 * Packages HTML document into MHTML (MIME multipart/related) format for Microsoft Word (.doc).
 * This embeds all base64 and data URL images directly into the document structure, ensuring
 * that Microsoft Word, WPS Office, and LibreOffice render question and option images reliably without
 * security blocks or missing image placeholders (red X).
 */
function convertHtmlToMhtmlWord(htmlContent: string): Blob {
  const boundary = '----=_NextPart_CBT_WORD_DOC_' + Date.now();
  const mimeParts: string[] = [];
  const imageMap = new Map<string, string>();
  let imgCounter = 0;

  // Replace data:image/... in src attributes with local Content-Location references
  const transformedHtml = htmlContent.replace(
    /src=["'](data:image\/([a-zA-Z0-9\+\-]+);base64,([^"'\s]+))["']/gi,
    (_, fullDataUrl, rawFormat, base64Data) => {
      let filename = imageMap.get(fullDataUrl);
      if (!filename) {
        let ext = rawFormat.toLowerCase();
        if (ext === 'jpeg') ext = 'jpg';
        if (ext === 'svg+xml') ext = 'svg';
        filename = `cbt_image_${imgCounter++}.${ext}`;
        imageMap.set(fullDataUrl, filename);

        const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
        const cleanBase64 = base64Data.replace(/[\r\n\s]/g, '');
        const chunkedBase64 = cleanBase64.match(/.{1,76}/g)?.join('\r\n') || cleanBase64;

        mimeParts.push(
          `------${boundary}\r\n` +
          `Content-Type: ${mimeType}\r\n` +
          `Content-Transfer-Encoding: base64\r\n` +
          `Content-Location: ${filename}\r\n` +
          `Content-ID: <${filename}>\r\n\r\n` +
          chunkedBase64
        );
      }
      return `src="${filename}"`;
    }
  );

  if (mimeParts.length > 0) {
    const mhtmlDoc =
      `MIME-Version: 1.0\r\n` +
      `Content-Type: multipart/related; boundary="${boundary}"; type="text/html"\r\n\r\n` +
      `------${boundary}\r\n` +
      `Content-Type: text/html; charset="utf-8"\r\n` +
      `Content-Transfer-Encoding: 8bit\r\n\r\n` +
      transformedHtml +
      `\r\n\r\n` +
      mimeParts.join('\r\n\r\n') +
      `\r\n\r\n------${boundary}--\r\n`;

    return new Blob([mhtmlDoc], {
      type: 'application/msword;charset=utf-8',
    });
  }

  return new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
}

/**
 * Formats and downloads Ujian CBT as an official student worksheet (LKS / Naskah Soal)
 */
export function downloadExamWord(ujian: Ujian, options: { includeAnswers?: boolean } = {}): void {
  let questions: Question[] = [];
  try {
    const parsed = JSON.parse(ujian.Soal_JSON || '{}');
    if (parsed.questions && Array.isArray(parsed.questions)) {
      questions = parsed.questions;
    } else if (Array.isArray(parsed)) {
      questions = parsed;
    }
  } catch {
    questions = [];
  }

  let questionsHtml = '';
  questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const qImages = getQuestionImages(q);

    // Identify which images are already placed inline via [Gambar X]
    const referencedIndices = new Set<number>();
    const regexImg = /\[(?:Gambar|Gbr)\s*(\d*)\]/gi;
    let m;
    let autoIdx = 0;
    while ((m = regexImg.exec(q.soal)) !== null) {
      const idxNum = m[1] ? parseInt(m[1], 10) - 1 : autoIdx++;
      if (idxNum >= 0 && idxNum < qImages.length) {
        referencedIndices.add(idxNum);
      }
    }
    const unreferencedImages = qImages
      .map((img, i) => ({ img, i }))
      .filter(({ i }) => !referencedIndices.has(i));

    const imgHtml = unreferencedImages.length > 0
      ? `<div style="margin: 6pt 0;">${unreferencedImages
          .map(
            ({ img: imgUrl, i: originalIdx }) =>
              `<div style="display: inline-block; margin: 4pt 6pt 4pt 0; vertical-align: top;"><img src="${imgUrl}" style="max-height: 200px; max-width: 380px; border: 1px solid #ccc; display: block;" />${
                qImages.length > 1
                  ? `<div style="font-size: 8pt; color: #666; text-align: center; margin-top: 2pt;">Gambar ${originalIdx + 1}</div>`
                  : ''
              }</div>`
          )
          .join('')}</div>`
      : '';

    let choicesHtml = '';
    if (q.type === 'pg') {
      const keys: ('a' | 'b' | 'c' | 'd' | 'e')[] = q.e !== undefined
        ? ['a', 'b', 'c', 'd', 'e']
        : ['a', 'b', 'c', 'd'];
      choicesHtml = `<table style="width: 100%; border: none; margin-top: 4pt; border-collapse: collapse;">`;
      keys.forEach((k) => {
        const optText = q[k];
        const optImg = (q as any)[`${k}_img`];
        if (optText || optImg) {
          const isCorrect = options.includeAnswers && q.kunci === k.toUpperCase();
          const marker = isCorrect ? ' style="font-weight: bold; color: #15803d; background-color: #dcfce7;"' : '';
          const imgMarkup = optImg
            ? `<div style="margin-top: 3pt;"><img src="${optImg}" alt="Gambar ${k.toUpperCase()}" style="max-height: 120px; max-width: 260px; border: 1px solid #cbd5e1; border-radius: 4px;" /></div>`
            : '';
          choicesHtml += `
            <tr>
              <td width="30pt" valign="top" style="border: none; padding: 3pt 4pt;"${marker}>${k.toUpperCase()}.</td>
              <td valign="top" style="border: none; padding: 3pt 4pt;"${marker}>
                ${optText ? formatMathForExport(optText, 'word') : ''}
                ${imgMarkup}
              </td>
            </tr>
          `;
        }
      });
      choicesHtml += `</table>`;
      if (options.includeAnswers) {
        choicesHtml += `<p style="font-size: 9pt; color: #15803d; font-weight: bold; margin-top: 4pt;">[Kunci Jawaban: ${q.kunci}]</p>`;
      }
    } else if (q.type === 'pgk_mcma') {
      choicesHtml = `<p style="font-size: 9pt; font-style: italic; color: #555; margin: 3pt 0;">(Pilihan Ganda Kompleks: Berikan tanda centang [✓] pada semua pilihan yang benar)</p>`;
      choicesHtml += `<table style="width: 100%; border: none; margin-top: 4pt; border-collapse: collapse;">`;
      const opts = Array.isArray(q.options) ? q.options : [];
      opts.forEach((opt: any, oIdx: number) => {
        const letter = String.fromCharCode(65 + oIdx);
        const isCorrect = options.includeAnswers && Boolean(opt?.isKey);
        const marker = isCorrect ? ' style="font-weight: bold; color: #15803d; background-color: #dcfce7;"' : '';
        const optText = typeof opt === 'string' ? opt : (opt?.text || '');
        const optImg = (opt && typeof opt === 'object')
          ? (opt.img || opt.gambar || opt.image || opt.url)
          : (q as any)[`${letter.toLowerCase()}_img`];
        const imgMarkup = optImg
          ? `<div style="margin-top: 4pt;"><img src="${optImg}" alt="Gambar Opsi ${oIdx + 1}" style="max-height: 120px; max-width: 280px; border: 1px solid #cbd5e1; border-radius: 4px;" /></div>`
          : '';
        choicesHtml += `
          <tr>
            <td width="28pt" valign="top" style="border: none; padding: 3pt 2pt;"${marker}>
              <span style="display:inline-block; width:14pt; height:14pt; border:1.5pt solid #334155; text-align:center; line-height:14pt; font-size:10pt;">
                ${isCorrect ? '✓' : '&nbsp;'}
              </span>
            </td>
            <td valign="top" style="border: none; padding: 3pt 4pt;"${marker}>
              ${optText ? formatMathForExport(optText, 'word') : `<span style="color:#888;">(Pilihan ${oIdx + 1})</span>`} ${isCorrect ? '<strong>(KUNCI BENAR)</strong>' : ''}
              ${imgMarkup}
            </td>
          </tr>
        `;
      });
      choicesHtml += `</table>`;
    } else if (q.type === 'pgk_kategori') {
      choicesHtml = `<p style="font-size: 9pt; font-style: italic; color: #555; margin: 3pt 0;">(Berikan tanda centang [✓] pada kolom yang sesuai)</p>`;
      choicesHtml += `
        <table style="width: 100%; border-collapse: collapse; margin-top: 6pt; border: 1px solid #94a3b8;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="border: 1px solid #94a3b8; padding: 4pt 8pt; text-align: left;">Pernyataan</th>
              <th style="border: 1px solid #94a3b8; padding: 4pt 8pt; width: 80pt; text-align: center;">${formatMathForExport(q.col1, 'word')}</th>
              <th style="border: 1px solid #94a3b8; padding: 4pt 8pt; width: 80pt; text-align: center;">${formatMathForExport(q.col2, 'word')}</th>
            </tr>
          </thead>
          <tbody>
      `;
      q.rows.forEach((r) => {
        const isCol1 = options.includeAnswers && r.key === 'col1';
        const isCol2 = options.includeAnswers && r.key === 'col2';
        const rowImg = r.img || (r as any).gambar || (r as any).image || (r as any).url;
        const rowImgMarkup = rowImg
          ? `<div style="margin-top: 4pt;"><img src="${rowImg}" alt="Gambar Pernyataan" style="max-height: 100pt; max-width: 220pt; border: 1pt solid #cbd5e1; display: block;" /></div>`
          : '';
        choicesHtml += `
          <tr>
            <td style="border: 1px solid #94a3b8; padding: 4pt 8pt;">
              <div>${formatMathForExport(r.text, 'word')}</div>
              ${rowImgMarkup}
            </td>
            <td style="border: 1px solid #94a3b8; padding: 4pt 8pt; text-align: center;">${isCol1 ? '<strong>✓ (Kunci)</strong>' : '[ &nbsp; ]'}</td>
            <td style="border: 1px solid #94a3b8; padding: 4pt 8pt; text-align: center;">${isCol2 ? '<strong>✓ (Kunci)</strong>' : '[ &nbsp; ]'}</td>
          </tr>
        `;
      });
      choicesHtml += `</tbody></table>`;
    }

    questionsHtml += `
      <div style="margin-bottom: 14pt; page-break-inside: avoid;">
        <table style="width: 100%; border: none; border-collapse: collapse;">
          <tr>
            <td width="24pt" valign="top" style="border: none; padding: 0; font-weight: bold;">${qNum}.</td>
            <td valign="top" style="border: none; padding: 0; text-align: justify;">
              ${formatMathForExport(q.soal, 'word', qImages)}
              ${imgHtml}
              ${choicesHtml}
            </td>
          </tr>
        </table>
      </div>
    `;
  });

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${ujian.Judul_Ujian}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4;
      margin: 2cm 2cm 2cm 2cm;
      mso-page-orientation: portrait;
    }
    body {
      font-family: 'Calibri', 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #111;
    }
    .math-frac {
      display: inline-block;
      vertical-align: middle;
      text-align: center;
      font-family: 'Calibri', 'Times New Roman', serif;
      margin: 0 2pt;
      font-size: 95%;
      line-height: 1.1;
    }
    .math-num {
      display: block;
      border-bottom: 1pt solid windowtext;
      padding: 0 2pt;
    }
    .math-den {
      display: block;
      padding: 0 2pt;
    }
    .kop-surat {
      text-align: center;
      border-bottom: 3px double #111;
      padding-bottom: 6pt;
      margin-bottom: 12pt;
    }
    .kop-sub {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    .kop-main {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 2pt 0;
      color: #0b2559;
    }
    .kop-addr {
      font-size: 8.5pt;
      color: #444;
      font-style: italic;
    }
    .identitas-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12pt;
      border: 1px solid #64748b;
    }
    .identitas-table td {
      padding: 4pt 8pt;
      font-size: 10pt;
      border: 1px solid #94a3b8;
    }
    .petunjuk {
      background-color: #f8fafc;
      border: 1px dashed #94a3b8;
      padding: 6pt 10pt;
      font-size: 9pt;
      margin-bottom: 14pt;
    }
    .petunjuk ol {
      margin: 2pt 0 2pt 14pt;
      padding: 0;
    }
  </style>
</head>
<body>
  <div class="kop-surat">
    <div class="kop-sub">${SCHOOL_SUBTITLE}</div>
    <div class="kop-main">${SCHOOL_NAME}</div>
    <div class="kop-addr">${SCHOOL_ADDRESS}</div>
  </div>

  <div style="text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 10pt; text-transform: uppercase;">
    LEMBAR NASKAH SOAL / LATIHAN CBT SISWA
    <br/>
    <span style="font-size: 11pt; font-weight: normal;">${ujian.Judul_Ujian}</span>
  </div>

  <table class="identitas-table">
    <tr>
      <td width="18%"><strong>Nama Siswa</strong></td>
      <td width="32%">: .....................................................</td>
      <td width="18%"><strong>Hari / Tanggal</strong></td>
      <td width="32%">: .....................................................</td>
    </tr>
    <tr>
      <td><strong>Mata Pelajaran</strong></td>
      <td>: ${ujian.Mapel}</td>
      <td><strong>Target Kelas</strong></td>
      <td>: ${ujian.Kelas}</td>
    </tr>
    <tr>
      <td><strong>No. Absen</strong></td>
      <td>: .....................................................</td>
      <td><strong>Alokasi Waktu</strong></td>
      <td>: ${ujian.Durasi_Menit} Menit</td>
    </tr>
  </table>

  <div class="petunjuk">
    <strong>PETUNJUK PENGERJAAN:</strong>
    <ol>
      <li>Berdoalah sebelum memulai mengerjakan soal.</li>
      <li>Tuliskan identitas nama, kelas, dan nomor absen pada lembar naskah soal.</li>
      <li>Bacalah setiap butir pertanyaan dengan cermat dan teliti.</li>
      <li>Pilihlah salah satu jawaban yang paling tepat dengan menyilang atau mencentang opsi yang tersedia.</li>
      <li>Periksa kembali seluruh lembar jawaban sebelum dikumpulkan.</li>
    </ol>
  </div>

  <div style="font-weight: bold; margin-bottom: 10pt; border-bottom: 1px solid #111; padding-bottom: 2pt;">
    I. JAWABLAH PERTANYAAN-PERTANYAAN DI BAWAH INI DENGAN TEPAT!
  </div>

  ${questionsHtml}

  <div style="margin-top: 30pt; border-top: 1px dashed #64748b; padding-top: 8pt; font-size: 9pt; text-align: center; color: #64748b;">
    --- Selamat Mengerjakan & Tetap Percaya Diri ---<br/>
    <em>Dicetak dari Bank Soal CBT ${SCHOOL_NAME}</em>
  </div>
</body>
</html>
  `;

  const blob = convertHtmlToMhtmlWord(htmlContent);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = ujian.Judul_Ujian.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'Soal';
  const tag = options.includeAnswers ? '[Kunci_Jawaban_Guru]' : '[Naskah_Soal_Siswa]';
  a.download = `${tag} ${safeTitle}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Prints Ujian CBT or opens Printable dialog
 */
export function printExamDocument(ujian: Ujian, options: { includeAnswers?: boolean } = {}): void {
  let questions: Question[] = [];
  try {
    const parsed = JSON.parse(ujian.Soal_JSON || '{}');
    if (parsed.questions && Array.isArray(parsed.questions)) {
      questions = parsed.questions;
    } else if (Array.isArray(parsed)) {
      questions = parsed;
    }
  } catch {
    questions = [];
  }

  let questionsHtml = '';
  questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const qImages = getQuestionImages(q);

    // Identify which images are already placed inline via [Gambar X]
    const referencedIndices = new Set<number>();
    const regexImg = /\[(?:Gambar|Gbr)\s*(\d*)\]/gi;
    let m;
    let autoIdx = 0;
    while ((m = regexImg.exec(q.soal)) !== null) {
      const idxNum = m[1] ? parseInt(m[1], 10) - 1 : autoIdx++;
      if (idxNum >= 0 && idxNum < qImages.length) {
        referencedIndices.add(idxNum);
      }
    }
    const unreferencedImages = qImages
      .map((img, i) => ({ img, i }))
      .filter(({ i }) => !referencedIndices.has(i));

    const imgHtml = unreferencedImages.length > 0
      ? `<div style="margin: 8px 0; display: flex; flex-wrap: wrap; gap: 8px;">${unreferencedImages
          .map(
            ({ img: imgUrl, i: originalIdx }) =>
              `<div style="display: inline-block; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px; background: #f8fafc;"><img src="${imgUrl}" alt="Gambar Soal ${originalIdx + 1}" referrerpolicy="no-referrer" loading="eager" decoding="sync" style="max-height: 200px; max-width: 100%; border-radius: 4px; display: block;" />${
                qImages.length > 1
                  ? `<div style="font-size: 11px; color: #64748b; font-weight: bold; text-align: center; margin-top: 3px;">Gambar ${originalIdx + 1}</div>`
                  : ''
              }</div>`
          )
          .join('')}</div>`
      : '';

    let choicesHtml = '';
    if (q.type === 'pg') {
      const keys: ('a' | 'b' | 'c' | 'd' | 'e')[] = q.e !== undefined
        ? ['a', 'b', 'c', 'd', 'e']
        : ['a', 'b', 'c', 'd'];
      choicesHtml = `<div style="margin-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">`;
      keys.forEach((k) => {
        const optText = q[k];
        const optImg = (q as any)[`${k}_img`];
        if (optText || optImg) {
          const isCorrect = options.includeAnswers && q.kunci === k.toUpperCase();
          const badge = isCorrect ? ' background-color: #dcfce7; font-weight: bold; border: 1px solid #86efac;' : '';
          const imgMarkup = optImg
            ? `<div style="margin-top: 4px;"><img src="${optImg}" alt="Gambar ${k.toUpperCase()}" referrerpolicy="no-referrer" loading="eager" decoding="sync" style="max-height: 110px; max-width: 100%; border: 1px solid #cbd5e1; border-radius: 4px; object-fit: contain; display: block;" /></div>`
            : '';
          choicesHtml += `
            <div style="padding: 4px 8px; border-radius: 4px; font-size: 13px;${badge}">
              <strong>${k.toUpperCase()}.</strong> ${optText ? formatMathForExport(optText, 'print') : ''}
              ${imgMarkup}
            </div>
          `;
        }
      });
      choicesHtml += `</div>`;
      if (options.includeAnswers) {
        choicesHtml += `<div style="font-size: 11px; color: #15803d; font-weight: bold; margin-top: 4px;">Kunci Jawaban: ${q.kunci}</div>`;
      }
    } else if (q.type === 'pgk_mcma') {
      choicesHtml = `<div style="font-size: 11px; color: #64748b; font-style: italic; margin-top: 6px;">Pilihan Ganda Kompleks (Centang satu atau lebih pilihan yang benar):</div>`;
      choicesHtml += `<div style="margin-top: 6px; display: flex; flex-direction: column; gap: 6px;">`;
      const opts = Array.isArray(q.options) ? q.options : [];
      opts.forEach((opt: any, oIdx: number) => {
        const letter = String.fromCharCode(65 + oIdx);
        const isCorrect = options.includeAnswers && Boolean(opt?.isKey);
        const badge = isCorrect ? ' background-color: #dcfce7; border: 1px solid #86efac;' : ' background-color: #ffffff; border: 1px solid #e2e8f0;';
        const optText = typeof opt === 'string' ? opt : (opt?.text || '');
        const optImg = (opt && typeof opt === 'object')
          ? (opt.img || opt.gambar || opt.image || opt.url)
          : (q as any)[`${letter.toLowerCase()}_img`];
        const imgMarkup = optImg
          ? `<div style="margin-top: 6px;"><img src="${optImg}" alt="Gambar Opsi ${oIdx + 1}" referrerpolicy="no-referrer" loading="eager" decoding="sync" style="max-height: 120px; max-width: 280px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px; background: #fff; object-fit: contain; display: block;" /></div>`
          : '';
        choicesHtml += `
          <div style="display: flex; align-items: flex-start; gap: 8px; padding: 6px 10px; border-radius: 6px; font-size: 13px;${badge}">
            <div style="display: inline-block; min-width: 18px; height: 18px; border: 1.5px solid #475569; border-radius: 3px; text-align: center; line-height: 16px; font-weight: bold; font-size: 11px; margin-top: 2px; background: #fff;">
              ${isCorrect ? '✓' : '&nbsp;'}
            </div>
            <div style="flex: 1;">
              <span>${optText ? formatMathForExport(optText, 'print') : `<span style="color:#94a3b8; font-style:italic;">Opsi ${oIdx + 1}</span>`}</span>
              ${isCorrect ? ' <span style="color: #15803d; font-weight: bold; font-size: 11px;">[KUNCI BENAR]</span>' : ''}
              ${imgMarkup}
            </div>
          </div>
        `;
      });
      choicesHtml += `</div>`;
    } else if (q.type === 'pgk_kategori') {
      choicesHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px; border: 1px solid #cbd5e1; font-size: 12px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;">Pernyataan</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px 10px; width: 90px; text-align: center;">${formatMathForExport(q.col1, 'print')}</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px 10px; width: 90px; text-align: center;">${formatMathForExport(q.col2, 'print')}</th>
            </tr>
          </thead>
          <tbody>
      `;
      q.rows.forEach((r) => {
        const isCol1 = options.includeAnswers && r.key === 'col1';
        const isCol2 = options.includeAnswers && r.key === 'col2';
        const rowImg = r.img || (r as any).gambar || (r as any).image || (r as any).url;
        const rowImgMarkup = rowImg
          ? `<div style="margin-top: 6px;"><img src="${rowImg}" alt="Gambar Pernyataan" referrerpolicy="no-referrer" loading="eager" decoding="sync" style="max-height: 120px; max-width: 260px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px; background: #fff; object-fit: contain; display: block;" /></div>`
          : '';
        choicesHtml += `
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">
              <div>${formatMathForExport(r.text, 'print')}</div>
              ${rowImgMarkup}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;">${isCol1 ? '<strong>✓ (Kunci)</strong>' : '[ &nbsp; ]'}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;">${isCol2 ? '<strong>✓ (Kunci)</strong>' : '[ &nbsp; ]'}</td>
          </tr>
        `;
      });
      choicesHtml += `</tbody></table>`;
    }

    questionsHtml += `
      <div style="margin-bottom: 16px; page-break-inside: avoid;">
        <div style="display: flex; gap: 8px; align-items: flex-start;">
          <div style="font-weight: bold; width: 22px;">${qNum}.</div>
          <div style="flex: 1;">
            <div style="font-size: 13.5px; line-height: 1.6;">${formatMathForExport(q.soal, 'print', qImages)}</div>
            ${imgHtml}
            ${choicesHtml}
          </div>
        </div>
      </div>
    `;
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="no-referrer">
  <title>Naskah Soal - ${ujian.Judul_Ujian}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <style>
    * { box-sizing: border-box; }
    @media print {
      body { margin: 0; padding: 12mm; font-size: 11pt; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .no-print { display: none !important; }
      @page { size: A4; margin: 12mm; }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      padding: 24px;
      max-width: 820px;
      margin: 0 auto;
      background: #fff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    img {
      max-width: 100% !important;
      page-break-inside: avoid !important;
    }
    .kop {
      text-align: center;
      border-bottom: 3px double #0f172a;
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .kop h4 { margin: 0; font-size: 12px; text-transform: uppercase; color: #475569; }
    .kop h2 { margin: 3px 0; font-size: 18px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; }
    .kop p { margin: 0; font-size: 10px; color: #64748b; font-style: italic; }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      margin-bottom: 14px;
      font-size: 11px;
    }
    .meta-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
    }
    .btn-print {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4f46e5;
      color: #fff;
      padding: 10px 18px;
      border-radius: 8px;
      border: none;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      z-index: 99999;
    }
    .btn-print:hover {
      background: #4338ca;
    }
  </style>
</head>
<body>
  <button class="btn-print no-print" onclick="window.print()">Cetak / Simpan PDF</button>

  <div class="kop">
    <h4>${SCHOOL_SUBTITLE}</h4>
    <h2>${SCHOOL_NAME}</h2>
    <p>${SCHOOL_ADDRESS}</p>
  </div>

  <div style="text-align: center; font-weight: 800; font-size: 15px; margin-bottom: 12px; text-transform: uppercase;">
    LEMBAR NASKAH SOAL CBT SISWA
    <div style="font-size: 13px; font-weight: 600; color: #4338ca;">${ujian.Judul_Ujian}</div>
  </div>

  <table class="meta-table">
    <tr>
      <td width="18%"><strong>Nama Siswa</strong></td>
      <td width="32%">: .....................................................</td>
      <td width="18%"><strong>Hari / Tanggal</strong></td>
      <td width="32%">: .....................................................</td>
    </tr>
    <tr>
      <td><strong>Mata Pelajaran</strong></td>
      <td>: ${ujian.Mapel}</td>
      <td><strong>Target Kelas</strong></td>
      <td>: ${ujian.Kelas}</td>
    </tr>
    <tr>
      <td><strong>No. Absen</strong></td>
      <td>: .....................................................</td>
      <td><strong>Alokasi Waktu</strong></td>
      <td>: ${ujian.Durasi_Menit} Menit</td>
    </tr>
  </table>

  <div style="margin-top: 16px;">
    ${questionsHtml}
  </div>

  <script>
    function waitForImagesAndPrint() {
      var images = Array.prototype.slice.call(document.querySelectorAll('img'));
      var total = images.length;
      if (total === 0) {
        setTimeout(function() { window.print(); }, 250);
        return;
      }
      var loaded = 0;
      var hasPrinted = false;
      function done() {
        loaded++;
        if (loaded >= total && !hasPrinted) {
          hasPrinted = true;
          setTimeout(function() { window.print(); }, 350);
        }
      }
      images.forEach(function(img) {
        if (img.complete && img.naturalWidth > 0) {
          done();
        } else {
          img.addEventListener('load', done);
          img.addEventListener('error', done);
        }
      });
      setTimeout(function() {
        if (!hasPrinted) {
          hasPrinted = true;
          window.print();
        }
      }, 3500);
    }
    if (document.readyState === 'complete') {
      waitForImagesAndPrint();
    } else {
      window.addEventListener('load', waitForImagesAndPrint);
    }
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    // Fallback: create hidden iframe for printing if popup is blocked
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
    }
  }
}

/**
 * Downloads a sample template CSV file for bulk questions upload
 */
export function downloadSampleQuestionCsv(): void {
  const csvHeaders = 'No,Jenis_Soal,Soal,Pilihan_A,Pilihan_B,Pilihan_C,Pilihan_D,Kunci_Jawaban,Bobot,Gambar_URL\n';
  const sampleRows = [
    '1,PG,"Ibu kota negara Indonesia yang baru sesuai dengan UU IKN adalah...","Bandung","Nusantara","Jakarta","Surabaya","B",1,""',
    '2,PG,"Organ tubuh manusia yang berfungsi memompa darah ke seluruh tubuh adalah...","Paru-paru","Lambung","Jantung","Ginjal","C",1,""',
    '3,PGK_CENTANG,"Manakah di antara hewan berikut yang bernapas dengan insang? (Pilih semua yang benar)","Ikan Mas;Ikan Nila;Kucing;Lumba-lumba","","","","A;B",2,""',
    '4,PGK_TABEL,"Tentukan apakah pernyataan berikut Benar atau Salah mengenai fotosintesis!","Fotosintesis menghasilkan oksigen (O2):col1;Fotosintesis terjadi pada malam hari tanpa cahaya:col2;Klorofil adalah zat hijau daun:col1","Benar","Salah","","",2,""',
    '5,PG,"Hasil dari 125 + 75 x 2 adalah...","400","275","325","350","B",1,""',
  ].join('\n');

  const content = csvHeaders + sampleRows;
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Soal_CBT_SDN_Harjosari_Kidul_01.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads sample JSON template for bulk questions
 */
export function downloadSampleQuestionJson(): void {
  const sampleData: Question[] = [
    {
      type: 'pg',
      bobot: 1,
      soal: 'Ibu kota negara Indonesia yang baru sesuai undang-undang adalah...',
      a: 'Bandung',
      b: 'Nusantara',
      c: 'Jakarta',
      d: 'Surabaya',
      kunci: 'B',
    },
    {
      type: 'pgk_mcma',
      bobot: 2,
      soal: 'Pilihlah hewan-hewan yang berkembang biak dengan cara ovipar (bertelur)!',
      options: [
        { text: 'Ayam', isKey: true },
        { text: 'Bebek', isKey: true },
        { text: 'Sapi', isKey: false },
        { text: 'Kucing', isKey: false },
      ],
    },
    {
      type: 'pgk_kategori',
      bobot: 2,
      soal: 'Tentukan Benar atau Salah pernyataan mengenai siklus air berikut:',
      col1: 'Benar',
      col2: 'Salah',
      rows: [
        { text: 'Evaporasi adalah proses penguapan air laut ke udara.', key: 'col1' },
        { text: 'Hujan terjadi sebelum terbentuknya awan mendung.', key: 'col2' },
        { text: 'Air bersih sangat dibutuhkan untuk kelangsungan hidup makhluk hidup.', key: 'col1' },
      ],
    },
  ];

  const content = JSON.stringify(sampleData, null, 2);
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Soal_CBT.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
