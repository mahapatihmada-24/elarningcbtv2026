import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
} from 'docx';
import mammoth from 'mammoth';
import {
  Question,
  QuestionPG,
  QuestionPGKMCMA,
  QuestionPGKKategori,
  McmaOption,
  KategoriRow,
  SchoolProfile,
} from '../types';

/**
 * Downloads a Blob file in the browser safely with cleanup.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Helper to build styled text runs.
 */
function boldText(text: string, size = 22): TextRun {
  return new TextRun({ text, bold: true, size, font: 'Calibri' });
}

function normalText(text: string, size = 22): TextRun {
  return new TextRun({ text, size, font: 'Calibri' });
}

function italicText(text: string, size = 20): TextRun {
  return new TextRun({ text, italics: true, size, font: 'Calibri', color: '475569' });
}

/**
 * Creates standard cell borders.
 */
const standardBorder = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: 'CBD5E1',
};

const cellBorders = {
  top: standardBorder,
  bottom: standardBorder,
  left: standardBorder,
  right: standardBorder,
};

/**
 * 1. DOWNLOAD TEMPLATE WORD (.docx)
 * Generates an official, beautifully structured Word template containing clear guidelines
 * and sample questions for all 3 supported question types:
 * - Soal Pilihan Ganda (PG)
 * - Soal Pilihan Ganda Kompleks Kategori (PGK Kategori)
 * - Soal Menjodohkan / MCMA (Pilihan Ganda Kompleks)
 */
export async function downloadExamWordTemplate(): Promise<void> {
  const doc = new Document({
    creator: 'SDN Harjosari Kidul 01 CBT System',
    title: 'Template Bank Soal CBT Word',
    description: 'Format baku penulisan soal CBT untuk Word (.docx)',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1200,
              right: 1200,
            },
          },
        },
        children: [
          // Header / Kop Dokumen
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              boldText('PEMERINTAH KABUPATEN TEGAL', 24),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              boldText('DINAS PENDIDIKAN DAN KEBUDAYAAN', 24),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              boldText('SD NEGERI HARJOSARI KIDUL 01 - KECAMATAN ADIWERNA', 26),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              normalText('Jl. Raya Harjosari Kidul No. 01, Kec. Adiwerna, Kab. Tegal, Jawa Tengah 52194', 18),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              normalText('_______________________________________________________________________________', 20),
            ],
          }),

          // Judul Dokumen
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 150 },
            children: [
              boldText('PANDUAN & TEMPLAT PENULISAN BANK SOAL UJIAN CBT (.DOCX)', 26),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 250 },
            children: [
              italicText('Mendukung Seluruh Jenis Soal: Pilihan Ganda (PG), PGK Kategori (Benar/Salah), dan Menjodohkan / MCMA', 20),
            ],
          }),

          // PETUNJUK UMUM PENGISIAN
          new Paragraph({
            spacing: { before: 150, after: 100 },
            children: [
              boldText('A. PETUNJUK UMUM PENULISAN SOAL', 22),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              normalText('1. Anda dapat menulis soal menggunakan format tabel atau format kartu bernomor seperti contoh di bawah ini.', 20),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              normalText('2. Sistem CBT dilengkapi kecerdasan parser otomatis yang dapat mendeteksi jenis soal (PG, PGK_KATEGORI, atau MCMA/MENJODOHKAN), opsi jawaban, kunci jawaban, bobot nilai, serta pembahasan soal.', 20),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              normalText('3. Teks rumus matematika seperti $a^2 + b^2 = c^2$ atau $\\frac{1}{2}$ didukung penuh oleh sistem CBT (KaTeX).', 20),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              normalText('4. Jangan menghapus penanda tag [JENIS: ...] atau label "Kunci:" agar sistem dapat mengimpor seluruh soal secara akurat.', 20),
            ],
          }),

          // CONTOH 1: PILIHAN GANDA (PG)
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              boldText('B. CONTOH SOAL TIPE 1: PILIHAN GANDA (PG)', 22),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              italicText('Karakteristik: Memiliki 4 atau 5 pilihan jawaban (A, B, C, D, E) dengan 1 jawaban yang benar.', 20),
            ],
          }),

          // Box Soal 1
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'EEF2FF' },
                    borders: cellBorders,
                    children: [
                      new Paragraph({
                        children: [
                          boldText('SOAL NO. 1  |  [JENIS: PG]  |  Bobot: 1', 20),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    borders: cellBorders,
                    children: [
                      new Paragraph({
                        spacing: { before: 80, after: 80 },
                        children: [
                          boldText('Soal: ', 20),
                          normalText('Bu Aminah, seorang pedagang kain di Pasar Adiwerna, memotong selembar kain batik menjadi 8 bagian sama besar untuk dijadikan taplak meja. Bagian kain yang sudah terjual adalah 3 bagian. Pecahan yang senilai dengan bagian kain yang sudah terjual Bu Aminah adalah ....', 20),
                        ],
                      }),
                      new Paragraph({ children: [normalText('A. 2/4', 20)] }),
                      new Paragraph({ children: [normalText('B. 6/16', 20)] }),
                      new Paragraph({ children: [normalText('C. 4/6', 20)] }),
                      new Paragraph({ children: [normalText('D. 5/6', 20)] }),
                      new Paragraph({
                        spacing: { before: 80, after: 60 },
                        children: [
                          boldText('Kunci: ', 20),
                          normalText('B', 20),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 80 },
                        children: [
                          boldText('Pembahasan: ', 20),
                          italicText('Kain terjual = 3/8 bagian. Pecahan senilai dicari dengan mengalikan pembilang dan penyebut dengan bilangan yang sama: (3 x 2) / (8 x 2) = 6/16. Jawaban yang tepat adalah B.', 19),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // CONTOH 2: PILIHAN GANDA KOMPLEKS KATEGORI (PGK KATEGORI)
          new Paragraph({
            spacing: { before: 250, after: 100 },
            children: [
              boldText('C. CONTOH SOAL TIPE 2: PGK KATEGORI (BENAR / SALAH)', 22),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              italicText('Karakteristik: Disajikan beberapa baris pernyataan, siswa diminta mengelompokkan ke dalam kategori (misal: Benar/Salah, Sesuai/Tidak Sesuai, atau Setuju/Tidak Setuju).', 20),
            ],
          }),

          // Box Soal 2
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'F0FDF4' },
                    borders: cellBorders,
                    children: [
                      new Paragraph({
                        children: [
                          boldText('SOAL NO. 2  |  [JENIS: PGK_KATEGORI]  |  Bobot: 1', 20),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    borders: cellBorders,
                    children: [
                      new Paragraph({
                        spacing: { before: 80, after: 80 },
                        children: [
                          boldText('Soal: ', 20),
                          normalText('Tentukan apakah setiap pernyataan matematika berikut Bernilai Benar atau Salah berdasarkan konsep pecahan senilai dan perbandingan nilai pecahan!', 20),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 60 },
                        children: [
                          boldText('Kategori Kolom: ', 20),
                          normalText('Benar | Salah', 20),
                        ],
                      }),
                      new Paragraph({ children: [normalText('- Pecahan 1/2 memiliki nilai yang sama besar dengan pecahan 2/4 => Benar', 20)] }),
                      new Paragraph({ children: [normalText('- Pecahan 3/4 bernilai lebih kecil daripada pecahan 1/4 => Salah', 20)] }),
                      new Paragraph({ children: [normalText('- Pecahan 5/10 jika disederhanakan menghasilkan 1/2 => Benar', 20)] }),
                      new Paragraph({ children: [normalText('- Penjumlahan 1/3 + 1/3 menghasilkan nilai 2/6 => Salah', 20)] }),
                      new Paragraph({
                        spacing: { before: 80, after: 60 },
                        children: [
                          boldText('Kunci: ', 20),
                          normalText('Tabel Kategori (Benar, Salah, Benar, Salah)', 20),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 80 },
                        children: [
                          boldText('Pembahasan: ', 20),
                          italicText('1/2 = 2/4 (Benar); 3/4 > 1/4 bukan lebih kecil (Salah); 5/10 = 1/2 (Benar); 1/3 + 1/3 = 2/3 bukan 2/6 (Salah).', 19),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // CONTOH 3: MENJODOHKAN / MCMA
          new Paragraph({
            spacing: { before: 250, after: 100 },
            children: [
              boldText('D. CONTOH SOAL TIPE 3: MENJODOHKAN / MCMA (PILIHAN GANDA KOMPLEKS BANYAK KUNCI)', 22),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              italicText('Karakteristik: Memiliki pilihan jawaban lebih dari satu yang benar, atau memasangkan pernyataan dengan jawaban yang sesuai.', 20),
            ],
          }),

          // Box Soal 3
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'FEF3C7' },
                    borders: cellBorders,
                    children: [
                      new Paragraph({
                        children: [
                          boldText('SOAL NO. 3  |  [JENIS: MCMA]  |  Bobot: 1', 20),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    borders: cellBorders,
                    children: [
                      new Paragraph({
                        spacing: { before: 80, after: 80 },
                        children: [
                          boldText('Soal: ', 20),
                          normalText('Di bawah ini disajikan beberapa sifat bangun datar geometri. Pilihlah semua pernyataan yang BENAR mengenai sifat-sifat bangun datar Persegi Panjang! (Jawaban benar lebih dari satu)', 20),
                        ],
                      }),
                      new Paragraph({ children: [normalText('A. Memiliki 4 sisi dengan 2 pasang sisi yang berhadapan sama panjang dan sejajar', 20)] }),
                      new Paragraph({ children: [normalText('B. Memiliki 4 simetri lipat dan 4 simetri putar', 20)] }),
                      new Paragraph({ children: [normalText('C. Memiliki 4 buah sudut yang semuanya merupakan sudut siku-siku 90°', 20)] }),
                      new Paragraph({ children: [normalText('D. Semua panjang keempat sisinya selalu sama persis', 20)] }),
                      new Paragraph({ children: [normalText('E. Kedua diagonalnya sama panjang dan saling membagi dua sama panjang', 20)] }),
                      new Paragraph({
                        spacing: { before: 80, after: 60 },
                        children: [
                          boldText('Kunci: ', 20),
                          normalText('A, C, E', 20),
                        ],
                      }),
                      new Paragraph({
                        spacing: { after: 80 },
                        children: [
                          boldText('Pembahasan: ', 20),
                          italicText('Persegi panjang memiliki 4 sudut siku-siku (C), sisi berhadapan sama panjang dan sejajar (A), serta diagonal sama panjang (E). Opsi B salah karena simetri lipat persegi panjang ada 2, dan opsi D salah karena itu ciri persegi/bujur sangkar.', 19),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Catatan Penutup
          new Paragraph({
            spacing: { before: 300 },
            children: [
              boldText('E. LANGKAH IMPOR KE SISTEM CBT:', 22),
            ],
          }),
          new Paragraph({
            children: [
              normalText('1. Tulis atau salin seluruh butir soal Anda di bawah ini mengikuti format di atas.', 20),
            ],
          }),
          new Paragraph({
            children: [
              normalText('2. Simpan dokumen ini dengan format .docx (Microsoft Word).', 20),
            ],
          }),
          new Paragraph({
            children: [
              normalText('3. Buka halaman Kelola Soal CBT, klik tombol "Impor Word", lalu pilih berkas ini. Soal akan otomatis masuk ke bank soal secara instan.', 20),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, 'Template_Bank_Soal_CBT.docx');
}

/**
 * 2. EXPORT QUESTIONS TO WORD (.docx)
 * Exports the current questions stored in the exam bank into a fully formatted Word document.
 */
export async function exportQuestionsToWord(
  judulUjian: string,
  questions: Question[],
  schoolProfile?: SchoolProfile | null
): Promise<void> {
  const schoolName = schoolProfile?.namaSekolah || 'SD NEGERI HARJOSARI KIDUL 01';
  const schoolAddress =
    schoolProfile?.alamat ||
    'Jl. Raya Harjosari Kidul No. 01, Kec. Adiwerna, Kab. Tegal, Jawa Tengah 52194';

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const docChildren: (Paragraph | Table)[] = [
    // Header Kop
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [boldText(schoolName.toUpperCase(), 24)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [boldText('NASKAH BANK SOAL UJIAN & CBT LURING / REVIEW', 22)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [normalText(schoolAddress, 18)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        normalText('_______________________________________________________________________________', 20),
      ],
    }),

    // Exam Info
    new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [
        boldText('Judul Ujian / Asesmen: ', 22),
        normalText(judulUjian || 'Ujian CBT', 22),
      ],
    }),
    new Paragraph({
      spacing: { after: 150 },
      children: [
        boldText('Jumlah Soal: ', 20),
        normalText(`${questions.length} Butir Soal`, 20),
        boldText('  |  Tanggal Cetak/Ekspor: ', 20),
        normalText(dateStr, 20),
      ],
    }),
  ];

  // Render each question
  questions.forEach((q, idx) => {
    const no = idx + 1;
    const typeLabel =
      q.type === 'pg'
        ? 'PILIHAN GANDA (PG)'
        : q.type === 'pgk_kategori'
        ? 'PGK KATEGORI (BENAR / SALAH)'
        : 'MENJODOHKAN / MCMA';

    const bobot = Number(q.bobot) || 1;
    const headerBg =
      q.type === 'pg' ? 'EEF2FF' : q.type === 'pgk_kategori' ? 'F0FDF4' : 'FEF3C7';

    const cellContents: Paragraph[] = [
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [
          boldText(`Soal: `, 20),
          normalText(q.soal || '(Teks soal kosong)', 20),
        ],
      }),
    ];

    if (q.type === 'pg') {
      const opts = [
        { label: 'A', text: q.a },
        { label: 'B', text: q.b },
        { label: 'C', text: q.c },
        { label: 'D', text: q.d },
        { label: 'E', text: q.e },
      ].filter((o) => o.text && o.text.trim());

      opts.forEach((o) => {
        const isKey = (q.kunci || '').toUpperCase().trim() === o.label;
        cellContents.push(
          new Paragraph({
            children: [
              isKey
                ? boldText(`${o.label}. ${o.text}  [KUNCI JAWABAN]`, 20)
                : normalText(`${o.label}. ${o.text}`, 20),
            ],
          })
        );
      });

      cellContents.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            boldText('Kunci Jawaban: ', 20),
            boldText(q.kunci || 'A', 20),
          ],
        })
      );
    } else if (q.type === 'pgk_mcma') {
      const opts = q.options || [];
      const keysList: string[] = [];

      opts.forEach((o, oIdx) => {
        const letter = String.fromCharCode(65 + oIdx);
        if (o.isKey) keysList.push(letter);
        cellContents.push(
          new Paragraph({
            children: [
              o.isKey
                ? boldText(`[✓] ${letter}. ${o.text}  [KUNCI BENAR]`, 20)
                : normalText(`[  ] ${letter}. ${o.text}`, 20),
            ],
          })
        );
      });

      cellContents.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            boldText('Kunci Jawaban: ', 20),
            boldText(keysList.length > 0 ? keysList.join(', ') : 'A', 20),
          ],
        })
      );
    } else if (q.type === 'pgk_kategori') {
      cellContents.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            boldText('Kategori Kolom: ', 20),
            normalText(`${q.col1 || 'Benar'}  |  ${q.col2 || 'Salah'}`, 20),
          ],
        })
      );

      (q.rows || []).forEach((r) => {
        const targetColName = r.key === 'col1' ? q.col1 || 'Benar' : q.col2 || 'Salah';
        cellContents.push(
          new Paragraph({
            children: [
              normalText(`• ${r.text}  =>  `, 20),
              boldText(`[${targetColName}]`, 20),
            ],
          })
        );
      });

      cellContents.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            boldText('Kunci Jawaban: ', 20),
            normalText('Tabel Kategori Sesuai Pemetaan di Atas', 20),
          ],
        })
      );
    }

    if (q.pembahasan && q.pembahasan.trim()) {
      cellContents.push(
        new Paragraph({
          spacing: { before: 80, after: 80 },
          children: [
            boldText('Pembahasan / Pembuktian: ', 20),
            italicText(q.pembahasan.trim(), 19),
          ],
        })
      );
    }

    const qTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: cellBorders,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: headerBg },
              borders: cellBorders,
              children: [
                new Paragraph({
                  children: [
                    boldText(`SOAL NO. ${no}  |  [JENIS: ${typeLabel}]  |  Bobot Nilai: ${bobot}`, 20),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              children: cellContents,
            }),
          ],
        }),
      ],
    });

    docChildren.push(
      new Paragraph({ spacing: { before: 150 } }),
      qTable
    );
  });

  const doc = new Document({
    creator: 'SDN Harjosari Kidul 01 CBT System',
    title: `Soal - ${judulUjian}`,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1200,
              right: 1200,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanTitle = (judulUjian || 'Bank_Soal_CBT').replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadBlob(blob, `Soal_${cleanTitle}_${Date.now()}.docx`);
}

/**
 * 3. PARSE QUESTIONS FROM WORD (.docx)
 * Intelligent parser extracting PG, PGK Kategori, and MCMA/Menjodohkan questions
 * from uploaded Word documents.
 */
export async function parseQuestionsFromWord(file: File): Promise<Question[]> {
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const rawTextResult = await mammoth.extractRawText({ arrayBuffer });

  const html = htmlResult.value || '';
  const rawText = rawTextResult.value || '';

  if (!html.trim() && !rawText.trim()) {
    throw new Error('Dokumen Word kosong atau tidak dapat dibaca.');
  }

  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');

  const questions: Question[] = [];

  // STRATEGY 1: Parse from Tables
  // If the word file contains tables with multiple questions or question cards
  const tables = Array.from(dom.querySelectorAll('table'));
  for (const table of tables) {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) continue;

    // Check if it's a tabular question bank (columns: No, Jenis, Soal, A, B, C, D, Kunci...)
    const firstRowText = (rows[0].textContent || '').toLowerCase();
    if (
      (firstRowText.includes('soal') || firstRowText.includes('pertanyaan')) &&
      (firstRowText.includes('kunci') || firstRowText.includes('opsi') || firstRowText.includes('pilihan') || firstRowText.includes('jenis'))
    ) {
      const headers = Array.from(rows[0].querySelectorAll('th, td')).map((c) =>
        (c.textContent || '').trim().toLowerCase()
      );

      const jenisIdx = headers.findIndex((h) => h.includes('jenis') || h.includes('tipe') || h === 'type');
      let soalIdx = headers.findIndex((h, idx) => idx !== jenisIdx && (h.includes('teks soal') || h.includes('pertanyaan') || h === 'soal'));
      if (soalIdx < 0) soalIdx = headers.findIndex((h) => h.includes('soal'));

      const aIdx = headers.findIndex((h) => h.includes('pilihan a') || h.includes('opsi a') || h === 'a');
      const bIdx = headers.findIndex((h) => h.includes('pilihan b') || h.includes('opsi b') || h === 'b');
      const cIdx = headers.findIndex((h) => h.includes('pilihan c') || h.includes('opsi c') || h === 'c');
      const dIdx = headers.findIndex((h) => h.includes('pilihan d') || h.includes('opsi d') || h === 'd');
      const eIdx = headers.findIndex((h) => h.includes('pilihan e') || h.includes('opsi e') || h === 'e');
      const kunciIdx = headers.findIndex((h) => h.includes('kunci') || h.includes('jawaban'));
      const bobotIdx = headers.findIndex((h) => h.includes('bobot') || h.includes('nilai'));
      const pembahasanIdx = headers.findIndex((h) => h.includes('pembahasan') || h.includes('penjelasan'));

      for (let r = 1; r < rows.length; r++) {
        const cells = Array.from(rows[r].querySelectorAll('td')).map((c) => (c.textContent || '').trim());
        if (cells.length < 2) continue;

        const soalText = soalIdx >= 0 ? cells[soalIdx] : cells[2] || cells[1];
        if (!soalText || soalText.length < 3) continue;

        const jenisStr = (jenisIdx >= 0 ? cells[jenisIdx] : '').toUpperCase();
        const kunciRaw = kunciIdx >= 0 ? cells[kunciIdx] : '';
        const bobotVal = Number(bobotIdx >= 0 ? cells[bobotIdx] : 1) || 1;
        const pembahasanText = pembahasanIdx >= 0 ? cells[pembahasanIdx] : '';

        if (jenisStr.includes('KATEGORI')) {
          // Parse as PGK Kategori
          const kategoriLines = (cells[aIdx >= 0 ? aIdx : 3] || '').split(/[\n;]/).map((s) => s.trim()).filter(Boolean);
          const rowItems: KategoriRow[] = [];
          for (const line of kategoriLines) {
            const parts = line.split(/=>|->|:/);
            if (parts.length >= 2) {
              const text = parts[0].trim();
              const keyVal = parts[1].trim().toLowerCase();
              const isCol1 = keyVal.includes('benar') || keyVal.includes('1') || keyVal.includes('col1') || keyVal.includes('setuju') || keyVal.includes('sesuai');
              rowItems.push({ text, key: isCol1 ? 'col1' : 'col2' });
            }
          }
          questions.push({
            type: 'pgk_kategori',
            bobot: bobotVal,
            soal: soalText,
            col1: 'Benar',
            col2: 'Salah',
            rows: rowItems.length > 0 ? rowItems : [
              { text: 'Pernyataan 1', key: 'col1' },
              { text: 'Pernyataan 2', key: 'col2' },
            ],
            pembahasan: pembahasanText,
          });
        } else if (jenisStr.includes('MCMA') || jenisStr.includes('MENJODOHKAN') || (jenisStr.includes('PGK') && !jenisStr.includes('KATEGORI')) || kunciRaw.includes(',')) {
          // Parse as MCMA / Menjodohkan
          const optsText = [
            aIdx >= 0 ? cells[aIdx] : '',
            bIdx >= 0 ? cells[bIdx] : '',
            cIdx >= 0 ? cells[cIdx] : '',
            dIdx >= 0 ? cells[dIdx] : '',
            eIdx >= 0 ? cells[eIdx] : '',
          ].filter(Boolean);

          const upperKey = kunciRaw.toUpperCase();
          const mcmaOpts: McmaOption[] = optsText.map((t, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isKey = upperKey.includes(letter);
            return { text: t, isKey };
          });

          questions.push({
            type: 'pgk_mcma',
            bobot: bobotVal,
            soal: soalText,
            options: mcmaOpts,
            pembahasan: pembahasanText,
          });
        } else {
          // Default PG
          let cleanKey = kunciRaw.toUpperCase().replace(/[^A-E]/g, '')[0] || 'A';
          if (!['A', 'B', 'C', 'D', 'E'].includes(cleanKey)) cleanKey = 'A';

          questions.push({
            type: 'pg',
            bobot: bobotVal,
            soal: soalText,
            a: aIdx >= 0 ? cells[aIdx] || '' : '',
            b: bIdx >= 0 ? cells[bIdx] || '' : '',
            c: cIdx >= 0 ? cells[cIdx] || '' : '',
            d: dIdx >= 0 ? cells[dIdx] || '' : '',
            e: eIdx >= 0 ? cells[eIdx] || '' : '',
            kunci: cleanKey as 'A' | 'B' | 'C' | 'D' | 'E',
            pembahasan: pembahasanText,
          });
        }
      }
    }
  }

  // If table parser successfully parsed questions, return them!
  if (questions.length > 0) {
    return questions;
  }

  // STRATEGY 2: Intelligent Block / Paragraph Parsing (Card format or template format)
  // Split raw text or HTML by question boundaries
  // Recognized boundaries: "SOAL NO.", "No. 1", "[JENIS:", "\n1. ", "\n2. ", "---"
  const rawCleanText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split chunks by question markers
  const questionBlocks = rawCleanText
    .split(/(?=(?:\[(?:JENIS|TIPE|SOAL)[^\]]*\]|\bSOAL\s*(?:NO\.?|\#)?\s*\d+|\bNO\.?\s*\d+[\.:\s]+(?:\[|\bjenis\b|\bsoal\b)|^\s*\d+[\.\)]\s+(?:\[|[A-Za-z])))/gim)
    .map((b) => b.trim())
    .filter((b) => {
      // Must contain question indicator and some text
      const lower = b.toLowerCase();
      return (
        (lower.includes('soal') || lower.includes('kunci') || lower.includes('pembahasan') || lower.includes('kategori')) &&
        b.length > 20
      );
    });

  for (const block of questionBlocks) {
    // Determine type
    const lowerBlock = block.toLowerCase();
    let qType: 'pg' | 'pgk_kategori' | 'pgk_mcma' = 'pg';

    if (
      lowerBlock.includes('kategori') ||
      lowerBlock.includes('pgk_kategori') ||
      lowerBlock.includes('benar | salah') ||
      lowerBlock.includes('benar/salah')
    ) {
      qType = 'pgk_kategori';
    } else if (
      lowerBlock.includes('mcma') ||
      lowerBlock.includes('menjodohkan') ||
      lowerBlock.includes('pgk_mcma') ||
      lowerBlock.includes('[✓]') ||
      (lowerBlock.includes('kunci:') && /[A-E]\s*,\s*[A-E]/i.test(block))
    ) {
      qType = 'pgk_mcma';
    }

    // Extract Bobot
    let bobot = 1;
    const bobotMatch = block.match(/bobot(?:\s*nilai)?\s*[:=]?\s*(\d+)/i);
    if (bobotMatch) {
      bobot = parseInt(bobotMatch[1], 10) || 1;
    }

    // Extract Pembahasan
    let pembahasan = '';
    const pembMatch = block.match(/(?:pembahasan|penjelasan|keterangan)\s*[:=]?\s*([\s\S]+)$/i);
    if (pembMatch) {
      pembahasan = pembMatch[1].trim();
    }

    // Clean block from Pembahasan for question & option parsing
    const contentWithoutPembahasan = pembMatch ? block.substring(0, pembMatch.index) : block;

    // Extract Kunci Jawaban
    let kunciRaw = '';
    const kunciMatch = contentWithoutPembahasan.match(/(?:kunci(?:\s+jawaban)?|jawaban(?:\s+benar)?|key)\s*[:=]?\s*([^\n\r]+)/i);
    if (kunciMatch) {
      kunciRaw = kunciMatch[1].trim();
    }

    // Extract Teks Soal
    let soalText = '';
    const soalMatch = contentWithoutPembahasan.match(/(?:soal|pertanyaan)\s*[:=]?\s*([\s\S]+?)(?=(?:\n\s*[A-E][\.\:\)]|\n\s*Kategori|\n\s*[-•]\s*Pernyataan|\n\s*Kunci|\n\s*\[\s*[✓x]|\n\s*1[\.\)]|\n\s*A\b|$))/i);
    if (soalMatch) {
      soalText = soalMatch[1].trim();
    } else {
      // Fallback: take lines before options
      const lines = contentWithoutPembahasan.split('\n').map((l) => l.trim()).filter(Boolean);
      const filteredLines = lines.filter((l) => !l.toLowerCase().startsWith('soal no') && !l.toLowerCase().includes('[jenis:'));
      soalText = filteredLines[0] || 'Pertanyaan';
    }

    // Clean unwanted headers from soalText
    soalText = soalText.replace(/^\[(?:JENIS|TIPE)[^\]]*\]/i, '').replace(/^SOAL\s*(?:NO\.?|\#)?\s*\d+[\s\:\-]*/i, '').trim();

    if (qType === 'pg') {
      // Extract options A, B, C, D, E
      const optA = extractOption(contentWithoutPembahasan, 'A');
      const optB = extractOption(contentWithoutPembahasan, 'B');
      const optC = extractOption(contentWithoutPembahasan, 'C');
      const optD = extractOption(contentWithoutPembahasan, 'D');
      const optE = extractOption(contentWithoutPembahasan, 'E');

      let cleanKey = kunciRaw.toUpperCase().replace(/[^A-E]/g, '')[0] || 'A';
      if (!['A', 'B', 'C', 'D', 'E'].includes(cleanKey)) cleanKey = 'A';

      if (optA || optB || optC) {
        questions.push({
          type: 'pg',
          bobot,
          soal: soalText || 'Soal Pilihan Ganda',
          a: optA,
          b: optB,
          c: optC,
          d: optD,
          e: optE,
          kunci: cleanKey as 'A' | 'B' | 'C' | 'D' | 'E',
          pembahasan,
        });
      }
    } else if (qType === 'pgk_mcma') {
      // Extract options
      const optA = extractOption(contentWithoutPembahasan, 'A');
      const optB = extractOption(contentWithoutPembahasan, 'B');
      const optC = extractOption(contentWithoutPembahasan, 'C');
      const optD = extractOption(contentWithoutPembahasan, 'D');
      const optE = extractOption(contentWithoutPembahasan, 'E');

      const upperKey = kunciRaw.toUpperCase();
      const rawOptions = [optA, optB, optC, optD, optE].filter(Boolean);

      const mcmaOptions: McmaOption[] = rawOptions.map((text, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const isKey = upperKey.includes(letter) || text.includes('[KUNCI') || text.includes('[✓]');
        const cleanText = text.replace(/\[(?:KUNCI|BENAR|✓|x)[^\]]*\]/gi, '').trim();
        return {
          text: cleanText,
          isKey,
        };
      });

      if (mcmaOptions.length > 0) {
        // If no keys were marked, default first key to true
        if (!mcmaOptions.some((o) => o.isKey)) {
          mcmaOptions[0].isKey = true;
        }
        questions.push({
          type: 'pgk_mcma',
          bobot,
          soal: soalText || 'Soal Menjodohkan / MCMA',
          options: mcmaOptions,
          pembahasan,
        });
      }
    } else if (qType === 'pgk_kategori') {
      // Extract categories (col1 and col2)
      let col1 = 'Benar';
      let col2 = 'Salah';
      const catMatch = contentWithoutPembahasan.match(/kategori(?:\s*kolom)?\s*[:=]?\s*([^\n\r]+)/i);
      if (catMatch) {
        const catParts = catMatch[1].split(/\||\/|vs/i).map((s) => s.trim());
        if (catParts.length >= 2) {
          col1 = catParts[0];
          col2 = catParts[1];
        }
      }

      // Extract statement rows
      const rows: KategoriRow[] = [];
      const lines = contentWithoutPembahasan.split('\n');
      for (const line of lines) {
        if (line.includes('=>') || line.includes('->') || (line.includes('[') && (line.includes('Benar') || line.includes('Salah')))) {
          let stmtText = '';
          let isCol1 = true;

          if (line.includes('=>') || line.includes('->')) {
            const parts = line.split(/=>|->/);
            stmtText = parts[0].replace(/^[-•*0-9\.\)]\s*/, '').trim();
            const val = parts[1].trim().toLowerCase();
            isCol1 = val.includes(col1.toLowerCase()) || val.includes('benar') || val.includes('setuju') || val.includes('1');
          } else {
            stmtText = line.replace(/\[[^\]]+\]/g, '').replace(/^[-•*0-9\.\)]\s*/, '').trim();
            isCol1 = line.toLowerCase().includes(col1.toLowerCase()) || line.toLowerCase().includes('benar');
          }

          if (stmtText.length > 2) {
            rows.push({
              text: stmtText,
              key: isCol1 ? 'col1' : 'col2',
            });
          }
        }
      }

      if (rows.length === 0) {
        // Fallback demo rows
        rows.push({ text: 'Pernyataan 1', key: 'col1' });
        rows.push({ text: 'Pernyataan 2', key: 'col2' });
      }

      questions.push({
        type: 'pgk_kategori',
        bobot,
        soal: soalText || 'Soal PGK Kategori',
        col1,
        col2,
        rows,
        pembahasan,
      });
    }
  }

  if (questions.length === 0) {
    throw new Error(
      'Format soal dalam dokumen Word tidak dikenali. Silakan gunakan tombol "Format Word" untuk mengunduh templat resmi berstruktur baku (PG, PGK Kategori, atau Menjodohkan/MCMA).'
    );
  }

  return questions;
}

/**
 * Helper to extract option text for a letter (A, B, C, D, E) from a text block.
 */
function extractOption(text: string, letter: string): string {
  // Regex to match "A. text" or "A) text" or "Pilihan A: text"
  const regex = new RegExp(
    `(?:\\b${letter}[\\.\\:\\)]|pilihan\\s*${letter}\\s*[:=]?)\\s*([^\\n\\r]+)`,
    'i'
  );
  const match = text.match(regex);
  if (match) {
    let opt = match[1].trim();
    // Clean trailing option letters if any
    opt = opt.replace(/\s*(?:\[KUNCI[^\]]*\]|\[BENAR\])/gi, '').trim();
    return opt;
  }
  return '';
}
