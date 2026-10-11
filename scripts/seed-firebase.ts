import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { INITIAL_USERS, INITIAL_MATERI, INITIAL_UJIAN, INITIAL_NILAI } from '../src/services/seedData';
import { DEFAULT_SCHOOL_PROFILE, DEFAULT_MASTER_KELAS, DEFAULT_MASTER_MAPEL } from '../src/services/api';

async function seed() {
  console.log(`Starting Firestore initial seed for project: ${firebaseConfig.projectId}...`);
  const app = initializeApp(firebaseConfig);
  const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  });

  // 1. Seed Users
  console.log(`Seeding ${INITIAL_USERS.length} users...`);
  for (const u of INITIAL_USERS) {
    const cleanDoc = { ...u, username: u.username.toLowerCase() };
    await setDoc(doc(db, 'users', cleanDoc.username), cleanDoc);
    console.log(`  - User '${cleanDoc.username}' seeded.`);
  }

  // 2. Seed Materi
  console.log(`Seeding ${INITIAL_MATERI.length} materi items...`);
  for (const m of INITIAL_MATERI) {
    await setDoc(doc(db, 'materi', m.ID), m);
    console.log(`  - Materi '${m.ID}' (${m.Judul}) seeded.`);
  }

  // 3. Seed Ujian
  console.log(`Seeding ${INITIAL_UJIAN.length} ujian packages...`);
  for (const uj of INITIAL_UJIAN) {
    await setDoc(doc(db, 'ujian', uj.ID), uj);
    console.log(`  - Ujian '${uj.ID}' (${uj.Judul_Ujian}) seeded.`);
  }

  // 4. Seed Nilai
  console.log(`Seeding ${INITIAL_NILAI.length} nilai records...`);
  for (const n of INITIAL_NILAI) {
    await setDoc(doc(db, 'nilai', n.ID), n);
    await setDoc(doc(db, 'rekap_nilai', n.ID), n);
    await setDoc(doc(db, 'hasil_ujian', n.ID), n);
    console.log(`  - Nilai '${n.ID}' (${n.Nama_Murid}) seeded.`);
  }

  // 5. Seed School Settings & Profile
  console.log(`Seeding school profile & master data...`);
  await setDoc(doc(db, 'settings', 'school_profile'), DEFAULT_SCHOOL_PROFILE);
  await setDoc(doc(db, 'settings', 'master_kelas'), { classes: DEFAULT_MASTER_KELAS });
  await setDoc(doc(db, 'settings', 'master_mapel'), { mapels: DEFAULT_MASTER_MAPEL });
  console.log(`  - School settings seeded.`);

  // 6. Seed Announcements
  const today = new Date().toISOString().split('T')[0];
  const initialAnnouncements = [
    {
      id: 'PENG-01',
      judul: 'Panduan & Jadwal Pelaksanaan Asesmen CBT Semester Genap',
      isi: 'Diberitahukan kepada seluruh Guru dan Siswa, berikut terlampir berkas kisi-kisi dan panduan pelaksanaan asesmen CBT. Dokumen dapat diunduh langsung atau dilihat melalui tautan lampiran di bawah.',
      tanggal: today,
      penulis: 'Hj. Siti Rohmah, M.Pd. (Kepala Sekolah)',
      target: 'semua',
      kategori: 'ujian',
      pinned: true,
      linkUrl: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      linkTitle: 'Panduan Pelaksanaan & Kisi-Kisi CBT (Google Drive / Docs)',
    },
    {
      id: 'PENG-02',
      judul: 'Selamat Datang di Portal CBT SDN Harjosari Kidul 01',
      isi: 'Sistem CBT kini dilengkapi fitur acak soal, proteksi anti-contek, format soal berstandar nasional, serta papan pengumuman resmi dengan dukungan unduh berkas (PDF, Excel, Word) dan Google Drive.',
      tanggal: today,
      penulis: 'Administrator',
      target: 'semua',
      kategori: 'info',
    },
  ];
  for (const ann of initialAnnouncements) {
    await setDoc(doc(db, 'announcements', ann.id), ann);
    console.log(`  - Announcement '${ann.id}' seeded.`);
  }

  // Verification
  const usersSnap = await getDocs(collection(db, 'users'));
  console.log(`\nVerification successful: Total users in Firestore = ${usersSnap.size}`);
  console.log(`All master data successfully injected into Firebase project: ${firebaseConfig.projectId}!`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
