import { Question, QuestionPG, QuestionPGKMCMA, QuestionPGKKategori } from '../types';

/**
 * Parses raw text copied from Word or Notepad into Question[]
 */
export function parseQuickTextQuestions(rawText: string): Question[] {
  if (!rawText || !rawText.trim()) return [];

  const questions: Question[] = [];

  // Normalize line endings and ensure first question number is preceded by \n for reliable splitting
  const normalizedText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^(\s*(?:No\.?\s*|\bSoal\s*)?\d+[\.\)]\s*)/i, '\n$1');

  // Split by newline followed by numbered items like "1.", "2.", "No. 1", "Soal 1:"
  const blocks = normalizedText
    .split(/\n\s*(?:(?:No\.?\s*|\bSoal\s*)?\d+[\.\)]\s*)/i)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  // If split didn't catch numbered markers or there's only 1 chunk that starts with number
  let actualBlocks = blocks;
  if (blocks.length <= 1) {
    // Try splitting by double newline
    actualBlocks = normalizedText
      .split(/\n\s*\n+/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);
  }

  for (const block of actualBlocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) continue;

    // Check for Type indicator
    const isCategory = /\[(?:TABEL|KATEGORI)\]/i.test(block) || lines.some((l) => /\[(?:Benar|Salah|Sebelum|Sesudah)\]/i.test(l));
    const isMcma = /\[(?:PGK|CENTANG|MCMA)\]/i.test(block) || /Kunci\s*:\s*[A-E]\s*,\s*[A-E]/i.test(block);

    // Extract Kunci and Bobot and Pembahasan
    let kunciRaw = 'A';
    let bobot = 1;
    let pembahasan: string | undefined = undefined;
    const filteredLines: string[] = [];

    for (const line of lines) {
      const kunciMatch = line.match(/^Kunci(?:\s*Jawaban)?\s*[:\-=]\s*([A-E,\s]+)/i);
      if (kunciMatch) {
        kunciRaw = kunciMatch[1].trim().toUpperCase();
        continue;
      }
      const bobotMatch = line.match(/^Bobot\s*[:\-=]\s*(\d+)/i);
      if (bobotMatch) {
        bobot = parseInt(bobotMatch[1], 10) || 1;
        continue;
      }
      const pembahasanMatch = line.match(/^Pembahasan(?:\s*Soal)?\s*[:\-=]\s*(.*)/i);
      if (pembahasanMatch) {
        const val = pembahasanMatch[1].trim();
        pembahasan = (pembahasan ? pembahasan + '\n' : '') + val;
        continue;
      }
      filteredLines.push(line);
    }

    if (filteredLines.length === 0) continue;

    // Question stem is the top lines before options
    const soalLines: string[] = [];
    const optionMap: Record<string, string> = { a: '', b: '', c: '', d: '', e: '' };
    const optionLines: { key: string; text: string }[] = [];
    const categoryRows: { text: string; key: 'col1' | 'col2' }[] = [];

    let isParsingOptions = false;

    for (const line of filteredLines) {
      // Check for A. / A) / [A] up to E
      const optMatch = line.match(/^[\(\[]?([A-E])[\)\]\.\-:]\s*(.*)/i);
      if (optMatch) {
        isParsingOptions = true;
        const key = optMatch[1].toLowerCase();
        const text = optMatch[2].trim();
        optionMap[key] = text;
        optionLines.push({ key: optMatch[1].toUpperCase(), text });
        continue;
      }

      // Check for Category line: - Pernyataan ini [Benar]
      const catMatch = line.match(/^[-*•]?\s*(.*?)\s*\[(Benar|Salah|col1|col2)\]/i);
      if (catMatch) {
        isParsingOptions = true;
        const catText = catMatch[1].trim();
        const catKey = /Benar|col1/i.test(catMatch[2]) ? 'col1' : 'col2';
        categoryRows.push({ text: catText, key: catKey });
        continue;
      }

      if (!isParsingOptions) {
        soalLines.push(line);
      } else {
        // Appending to last option if continuation line
        if (optionLines.length > 0) {
          const last = optionLines[optionLines.length - 1];
          last.text += ' ' + line;
          optionMap[last.key.toLowerCase()] += ' ' + line;
        }
      }
    }

    const soalText = soalLines
      .join('\n')
      .replace(/^(?:No\.?\s*|\bSoal\s*)?\d+[\.\)]\s*/i, '')
      .replace(/\[(?:PGK|CENTANG|MCMA|TABEL|KATEGORI)\]/gi, '')
      .trim();

    if (!soalText) continue;

    if (isCategory && categoryRows.length > 0) {
      const qKategori: QuestionPGKKategori = {
        type: 'pgk_kategori',
        bobot: bobot > 1 ? bobot : 2,
        soal: soalText,
        col1: 'Benar',
        col2: 'Salah',
        rows: categoryRows,
        pembahasan: pembahasan || undefined,
      };
      questions.push(qKategori);
    } else if (isMcma || kunciRaw.includes(',')) {
      // PGK MCMA
      const keysList = kunciRaw.split(',').map((k) => k.trim().toUpperCase());
      const opts = optionLines.map((o) => ({
        text: o.text || 'Opsi ' + o.key,
        isKey: keysList.includes(o.key),
      }));

      // Fallback if none matched
      if (opts.every((o) => !o.isKey) && opts.length > 0) {
        opts[0].isKey = true;
      }

      const qMcma: QuestionPGKMCMA = {
        type: 'pgk_mcma',
        bobot: bobot > 1 ? bobot : 2,
        soal: soalText,
        options: opts.length > 0 ? opts : [
          { text: optionMap.a || 'Pilihan 1', isKey: true },
          { text: optionMap.b || 'Pilihan 2', isKey: false },
        ],
        pembahasan: pembahasan || undefined,
      };
      questions.push(qMcma);
    } else {
      // Standard Multiple Choice PG
      const cleanKey = kunciRaw.charAt(0).toUpperCase();
      const validKey: 'A' | 'B' | 'C' | 'D' | 'E' =
        cleanKey === 'A' || cleanKey === 'B' || cleanKey === 'C' || cleanKey === 'D' || cleanKey === 'E'
          ? (cleanKey as 'A' | 'B' | 'C' | 'D' | 'E')
          : 'A';

      const qPg: QuestionPG = {
        type: 'pg',
        bobot: bobot || 1,
        soal: soalText,
        a: optionMap.a || optionLines[0]?.text || '',
        b: optionMap.b || optionLines[1]?.text || '',
        c: optionMap.c || optionLines[2]?.text || '',
        d: optionMap.d || optionLines[3]?.text || '',
        ...(optionMap.e || optionLines[4]?.text ? { e: optionMap.e || optionLines[4]?.text } : {}),
        kunci: validKey,
        pembahasan: pembahasan || undefined,
      };
      questions.push(qPg);
    }
  }

  return questions;
}

/**
 * Parses CSV lines into Question[]
 */
export function parseCsvQuestions(csvText: string): Question[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = parseCsvToRows(csvText);
  if (lines.length < 2) return [];

  // Identify column indices from header
  const header = lines[0].map((h) => h.toLowerCase().trim().replace(/[\s_-]+/g, ''));
  const getIdx = (patterns: string[]) => {
    return header.findIndex((h) => patterns.some((p) => h.includes(p)));
  };

  const idxType = getIdx(['jenis', 'type', 'bentuk']);
  let idxSoal = header.findIndex(
    (h, idx) =>
      idx !== idxType &&
      (h.includes('tekssoal') ||
        h.includes('pertanyaan') ||
        h.includes('isisoal') ||
        h === 'soal' ||
        h === 'pertanyaan')
  );
  if (idxSoal === -1) {
    idxSoal = header.findIndex(
      (h, idx) =>
        idx !== idxType &&
        !h.includes('jenis') &&
        !h.includes('tipe') &&
        !h.includes('bentuk') &&
        h.includes('soal')
    );
  }
  if (idxSoal === -1) {
    idxSoal = idxType === 1 ? 2 : 1;
  }
  const idxA = getIdx(['pilihana', 'opsia', 'a']);
  const idxB = getIdx(['pilihanb', 'opsib', 'b']);
  const idxC = getIdx(['pilihanc', 'opsic', 'c']);
  const idxD = getIdx(['pilihand', 'opsid', 'd']);
  const idxKunci = getIdx(['kunci', 'jawaban', 'key', 'kuncijawaban']);
  const idxBobot = getIdx(['bobot', 'poin', 'score']);
  const idxGambar = getIdx(['gambar', 'image', 'linkgambar', 'img']);
  const idxPembahasan = getIdx(['pembahasan', 'penjelasan', 'solusi', 'explanation']);

  const questions: Question[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || (row.length === 1 && !row[0].trim())) continue;

    const rawSoal = idxSoal !== -1 ? row[idxSoal]?.trim() : row[1]?.trim() || '';
    if (!rawSoal) continue;

    const rawType = (idxType !== -1 ? row[idxType]?.trim().toLowerCase() : 'pg') || 'pg';
    const rawA = idxA !== -1 ? row[idxA]?.trim() : row[2]?.trim() || '';
    const rawB = idxB !== -1 ? row[idxB]?.trim() : row[3]?.trim() || '';
    const rawC = idxC !== -1 ? row[idxC]?.trim() : row[4]?.trim() || '';
    const rawD = idxD !== -1 ? row[idxD]?.trim() : row[5]?.trim() || '';
    const rawKunci = (idxKunci !== -1 ? row[idxKunci]?.trim() : row[6]?.trim() || 'A').toUpperCase();
    const rawBobot = parseInt(idxBobot !== -1 ? row[idxBobot]?.trim() : row[7]?.trim() || '1', 10) || 1;
    const rawGambar = idxGambar !== -1 ? row[idxGambar]?.trim() : row[8]?.trim() || '';
    const rawPembahasan = idxPembahasan !== -1 ? row[idxPembahasan]?.trim() : '';
    const rawGambarList = rawGambar
      ? rawGambar
          .split(/[|\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const gambarMain = rawGambarList[0] || (rawGambar || undefined);
    const gambarList = rawGambarList.length > 0 ? rawGambarList : undefined;

    if (rawType.includes('mcma') || rawType.includes('centang')) {
      // Options can be semicolon separated in A or standard A,B,C,D
      let optTexts: string[] = [];
      if (rawA.includes(';')) {
        optTexts = rawA.split(';').map((s) => s.trim()).filter(Boolean);
      } else {
        optTexts = [rawA, rawB, rawC, rawD].filter(Boolean);
      }

      const keys = rawKunci.split(/[;,]/).map((s) => s.trim().toUpperCase());
      const opts = optTexts.map((txt, oIdx) => {
        const char = String.fromCharCode(65 + oIdx);
        return {
          text: txt,
          isKey: keys.includes(char) || keys.includes(txt.toUpperCase()),
        };
      });

      questions.push({
        type: 'pgk_mcma',
        bobot: rawBobot > 1 ? rawBobot : 2,
        soal: rawSoal,
        gambar: gambarMain,
        gambar_list: gambarList,
        options: opts,
        pembahasan: rawPembahasan || undefined,
      });
    } else if (rawType.includes('tabel') || rawType.includes('kategori')) {
      // Row items semicolon separated in rawA, e.g. "Pernyataan 1:col1;Pernyataan 2:col2"
      const col1Name = rawB || 'Benar';
      const col2Name = rawC || 'Salah';
      const catRows: { text: string; key: 'col1' | 'col2' }[] = [];

      if (rawA.includes(';')) {
        const items = rawA.split(';').map((s) => s.trim()).filter(Boolean);
        items.forEach((item) => {
          const parts = item.split(':');
          const txt = parts[0]?.trim();
          const targetKey = parts[1]?.trim().toLowerCase() === 'col2' ? 'col2' : 'col1';
          if (txt) catRows.push({ text: txt, key: targetKey });
        });
      } else {
        catRows.push({ text: rawA || 'Pernyataan 1', key: 'col1' });
      }

      questions.push({
        type: 'pgk_kategori',
        bobot: rawBobot > 1 ? rawBobot : 2,
        soal: rawSoal,
        gambar: gambarMain,
        gambar_list: gambarList,
        col1: col1Name,
        col2: col2Name,
        rows: catRows,
        pembahasan: rawPembahasan || undefined,
      });
    } else {
      // Pilihan Ganda (PG)
      const cleanKey = rawKunci.charAt(0).toUpperCase();
      const validKey: 'A' | 'B' | 'C' | 'D' =
        cleanKey === 'A' || cleanKey === 'B' || cleanKey === 'C' || cleanKey === 'D'
          ? cleanKey
          : 'A';

      questions.push({
        type: 'pg',
        bobot: rawBobot || 1,
        soal: rawSoal,
        gambar: gambarMain,
        gambar_list: gambarList,
        a: rawA,
        b: rawB,
        c: rawC,
        d: rawD,
        kunci: validKey,
        pembahasan: rawPembahasan || undefined,
      });
    }
  }

  return questions;
}

/**
 * Standard RFC-compliant CSV parser handling quoted strings with commas and newlines
 */
function parseCsvToRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal);
      rows.push(currentRow);
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }

  return rows;
}
