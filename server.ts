import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Lazy initialization of GoogleGenAI SDK
  let aiClient: GoogleGenAI | null = null;
  function getAI(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return aiClient;
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Server-side fallback proxy for CBT submission (100% guaranteed for mobile devices)
  app.post('/api/submit-nilai', async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || !payload.ID) {
        return res.status(400).json({ success: false, message: 'Payload nilai tidak valid.' });
      }

      let cfg: any = { projectId: 'elearningcbt-sebayuloka', apiKey: '' };
      try {
        const rawCfg = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8');
        cfg = JSON.parse(rawCfg);
      } catch {}

      if (!cfg.projectId || !cfg.apiKey) {
        return res.status(500).json({ success: false, message: 'Firebase configuration not found on server.' });
      }

      const fields: Record<string, any> = {};
      for (const [k, v] of Object.entries(payload)) {
        if (v === undefined || v === null) continue;
        if (typeof v === 'string') fields[k] = { stringValue: v };
        else if (typeof v === 'number') {
          if (Number.isInteger(v)) fields[k] = { integerValue: String(v) };
          else fields[k] = { doubleValue: v };
        } else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
        else if (typeof v === 'object') fields[k] = { stringValue: JSON.stringify(v) };
      }

      const cleanId = encodeURIComponent(String(payload.ID).replace(/[^a-zA-Z0-9_-]/g, '_'));
      const body = JSON.stringify({ fields });
      const headers = { 'Content-Type': 'application/json' };

      const urlRekap = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents/rekap_nilai/${cleanId}?key=${cfg.apiKey}`;
      const urlHasil = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents/hasil_ujian/${cleanId}?key=${cfg.apiKey}`;
      const urlNilai = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents/nilai/${cleanId}?key=${cfg.apiKey}`;

      const [resRekap, resHasil, resNilai] = await Promise.allSettled([
        fetch(urlRekap, { method: 'PATCH', headers, body }),
        fetch(urlHasil, { method: 'PATCH', headers, body }),
        fetch(urlNilai, { method: 'PATCH', headers, body }),
      ]);

      const isOk = (r: PromiseSettledResult<Response>) => r.status === 'fulfilled' && r.value.ok;
      if (isOk(resRekap) || isOk(resHasil) || isOk(resNilai)) {
        return res.json({ success: true, message: 'Hasil ujian berhasil disimpan ke database via server proxy.' });
      } else {
        return res.status(502).json({ success: false, message: 'Gagal menulis ke Firestore via server proxy.' });
      }
    } catch (err: any) {
      console.error('Error in /api/submit-nilai:', err);
      return res.status(500).json({ success: false, message: err.message || 'Server error saat simpan nilai.' });
    }
  });

  // AI Question Generator based on Kisi-Kisi
  app.post('/api/generate-soal-kisi-kisi', async (req, res) => {
    try {
      const { items, subject = 'Matematika', grade = '6', options = {} } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Daftar butir kisi-kisi tidak boleh kosong.',
        });
      }

      const ai = getAI();
      if (!ai) {
        return res.status(200).json({
          success: false,
          fallbackAvailable: true,
          message: 'GEMINI_API_KEY belum dikonfigurasi. Menggunakan Generator Cerdas Kurikulum Lokal.',
        });
      }

      const difficulty = options.difficulty || 'standar';
      const prompt = `Buatkan butir-butir soal CBT Indonesia berstandar Kurikulum Merdeka untuk mata pelajaran ${subject} Kelas ${grade} dengan tingkat kesulitan "${difficulty}".

Daftar spesifikasi kisi-kisi yang harus dibuatkan soalnya:
${JSON.stringify(items, null, 2)}

Ketentuan format soal untuk masing-masing item kisi-kisi:
1. Setiap soal harus relevan secara presisi dengan CP/KD, Materi Pokok, dan Indikator Soal dari kisi-kisi terkait.
2. Perhatikan level kognitif:
   - L1 (Pemahaman/C1-C2): Soal konsep, definisi, atau identifikasi langsung.
   - L2 (Penerapan/C3): Soal perhitungan, penerapan dalam konteks nyata sehari-hari.
   - L3 (Penalaran/HOTS C4-C6): Soal berbasis stimulus teks narasi, data tabel, atau pemecahan masalah kompleks.
3. Jenis tipe soal harus sesuai "bentukSoal":
   - Pilihan Ganda (type: "pg"): Wajib ada "soal", "a", "b", "c", "d", "kunci" ('A'|'B'|'C'|'D'), "bobot" (number), dan "pembahasan" (string).
   - PGK Multi-Jawaban (type: "pgk_mcma"): Wajib ada "soal", "bobot" (number), "pembahasan" (string), dan "options" berupa array 4 objek { "text": string, "isKey": boolean } di mana 2 atau 3 bernilai true.
   - PGK Kategori/Tabel (type: "pgk_kategori"): Wajib ada "soal", "bobot" (number), "pembahasan" (string), "col1": "Benar", "col2": "Salah", dan "rows" berupa array 3-4 objek { "text": string, "key": "col1" | "col2" }.
4. Gunakan notasi LaTeX KaTeX untuk simbol/rumus matematika (contoh: $\\frac{1}{2}$ atau $x^2$).
5. Selalu sertakan field "pembahasan" (string) berupa penjelasan edukatif, runtut, dan langkah pengerjaan yang jelas mengapa jawaban tersebut benar.

KEMBALIKAN HANYA JSON VALID berupa array of Question objects tanpa tanda kutip markdown backticks (\`\`\`json).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'Anda adalah ahli perancangan soal Asesmen Nasional dan Kurikulum Merdeka tingkat SD/SMP/SMA di Indonesia. Anda menghasilkan butir-butir soal CBT yang berkualitas tinggi, valid, tidak ambigu, memiliki distraktor yang masuk akal, dan kunci jawaban yang tepat.',
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      const cleanJson = text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      const parsedQuestions = JSON.parse(cleanJson);

      if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
        return res.json({
          success: true,
          questions: parsedQuestions,
          source: 'gemini',
        });
      }

      throw new Error('Hasil AI tidak menghasilkan array soal yang valid.');
    } catch (err: any) {
      console.error('Error generating questions via Gemini:', err);
      return res.status(200).json({
        success: false,
        fallbackAvailable: true,
        message: err.message || 'Gagal memproses pembuatan soal dengan AI, fallback ke generator lokal.',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
