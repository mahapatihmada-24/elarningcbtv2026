import express from 'express';
import path from 'path';
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
