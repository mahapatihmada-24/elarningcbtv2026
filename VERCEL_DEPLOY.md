# Panduan Deploy E-Learning CBT ke Vercel (vercel.app)

Aplikasi E-Learning dan CBT SDN Harjosari Kidul 01 ini telah dikonfigurasi secara lengkap untuk dapat langsung di-deploy ke **Vercel** (`https://<nama-proyek>.vercel.app`).

---

## 1. File Konfigurasi yang Telah Disiapkan

1. **`vercel.json`**:
   - **Framework Preset**: `vite`
   - **Output Directory**: `dist`
   - **Build Command**: `npm run build`
   - **SPA Routing (Rewrites)**: Semua rute frontend otomatis diarahkan ke `/index.html` sehingga navigasi halaman tidak 404 saat di-refresh.
   - **Serverless API**: Rute `/api/*` secara otomatis diarahkan ke Vercel Serverless Functions di folder `/api`.

2. **`/api` (Serverless Functions)**:
   - `/api/health.ts`: Endpoint pengecekan status server dan ketersediaan Gemini AI.
   - `/api/generate-soal-kisi-kisi.ts`: Endpoint serverless pembuatan soal ujian otomatis menggunakan Gemini AI.

3. **`firebase-applet-config.json`**:
   - Proyek Firebase `elearningcbt-sebayuloka` sudah tertanam di aplikasi sehingga aplikasi langsung terhubung ke database Firestore secara instan tanpa perlu pengaturan manual tambahan.

---

## 2. Cara Deploy via GitHub (Direkomendasikan)

1. **Sinkronkan / Push Kode Terbaru ke GitHub**:
   - Dari AI Studio, klik menu **Settings (ikon gerigi)** -> **Export to GitHub** ke repositori Anda (`sebayuloka5758-svg/elarningcbtv2026`).
   - Perbaikan dependensi (`esbuild`, `.npmrc`, dan `vercel.json`) akan otomatis terkirim ke branch `main`.
2. **Redeploy Otomatis di Vercel**:
   - Saat kode ter-push ke GitHub, Vercel akan otomatis mendeteksi commit baru dan menjalankan build ulang secara otomatis.
   - Atau di dashboard Vercel pada proyek Anda: Klik tab **Deployments** > pilih titik tiga (...) pada deployment terakhir > klik **Redeploy**.
3. **Konfigurasi Project Settings di Vercel**:
   - **Framework Preset**: Pilih **Vite**
   - **Root Directory**: `./` (default)
   - **Install Command**: `npm install --legacy-peer-deps` (sudah otomatis diset di `vercel.json`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables (Opsional)**:
   - `GEMINI_API_KEY`: Masukkan API Key Google Gemini Anda (jika ingin mengaktifkan generator soal AI).
   *(Catatan: Jika dikosongkan, generator soal lokal bawaan tetap berjalan 100% lancar).*
6. **Klik "Deploy"**:
   - Vercel akan memproses build dalam waktu ~1 menit dan memberikan domain online aktif, contoh:  
     `https://elearning-cbt-sdnharjosarikidul.vercel.app`

---

## 3. Cara Deploy via Vercel CLI (Terminal / Command Prompt)

Jika Anda ingin deploy langsung dari komputer:
```bash
# 1. Install Vercel CLI jika belum ada
npm i -g vercel

# 2. Login ke akun Vercel
vercel login

# 3. Jalankan deploy
vercel

# 4. Untuk deploy langsung ke production (vercel.app utama)
vercel --prod
```

---

## 4. Langkah Penting di Firebase Console (Wajib Dilakukan)

Agar fitur login dan database Firebase berjalan lancar di domain Vercel baru Anda:

1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Pilih proyek Anda: **`elearningcbt-sebayuloka`**.
3. Masuk ke menu **Build** > **Authentication** > tab **Settings** > **Authorized domains**.
4. Klik **Add domain**, lalu masukkan domain Vercel Anda, misalnya:
   - `nama-aplikasi-anda.vercel.app`
5. Klik **Save**.
