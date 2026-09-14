import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { AppSettings, Paslon, Voter, VoteLog, VoteStats } from "./src/types.js";
import {
  getSupabaseStatus,
  getSupabaseSchemaSql,
  pushAllToSupabase,
  pullAllFromSupabase,
  syncVoteToSupabase
} from "./src/lib/supabaseSync.js";

const app = express();
const PORT = 3000;

// Increase payload limit for image uploads (base64) and bulk excel data
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Database storage directory
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DatabaseSchema {
  settings: AppSettings;
  adminPasswordHash: string; // Plain/token for simplicity or hashed
  paslon: Paslon[];
  dpt: Voter[];
  votes: VoteLog[];
}

// Initial default data for SMK Lentera Bangsa 2
const DEFAULT_DB: DatabaseSchema = {
  settings: {
    namaSekolah: "SMK Lentera Bangsa 2",
    namaAcara: "Pemilihan Ketua & Wakil Ketua OSIS",
    tahunAjaran: "2026/2027",
    statusVoting: "active",
    logoSekolahUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=300&auto=format&fit=crop&q=80",
    allowAutoRegisterDPT: true,
    pengumuman: "Selamat datang di E-Voting OSIS SMK Lentera Bangsa 2! Gunakan hak suara Anda secara Luber dan Jurdil (Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil)."
  },
  adminPasswordHash: "panitia2026",
  paslon: [
    {
      id: "paslon-1",
      nomorUrut: "01",
      namaKetua: "Muhammad Farhan Al-Fatih",
      namaWakil: "Aisyah Putri Zahra",
      kelasKetua: "XI Teknik Komputer & Jaringan 1",
      kelasWakil: "X Rekayasa Perangkat Lunak 2",
      fotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
      slogan: "BERSATU KREATIF, BERGERAK DIGITAL, WUJUDKAN SMK UNGGUL!",
      visi: "Menjadikan OSIS SMK Lentera Bangsa 2 sebagai wadah kolaborasi siswa yang inovatif, berkarakter mulia, adaptif dengan teknologi industri, dan berjiwa wirausaha muda.",
      misi: [
        "Meningkatkan keimanan dan solidaritas antar jurusan melalui kegiatan keagamaan dan bakti sosial.",
        "Mengembangkan minat bakat siswa di bidang sains, IT, olahraga, dan seni berbasis digital creative hub.",
        "Menjalin sinergi erat dengan guru, mitra industri, dan alumni untuk memperluas peluang magang dan karir.",
        "Menciptakan iklim sekolah yang inklusif, bebas perundungan (anti-bullying), dan ramah lingkungan."
      ],
      programUnggulan: [
        "Lentera Tech & Creative Expo Tahunan",
        "Pekan Olahraga & E-Sports Championship Antar Kelas (PORSENI)",
        "Kotak Aspirasi Digital Siswa Real-time (LenteraVoice)",
        "Gerakan Bank Sampah & Green School Initiative"
      ],
      suara: 0,
      warnaTema: "#06b6d4" // Cyan neon
    },
    {
      id: "paslon-2",
      nomorUrut: "02",
      namaKetua: "Bagas Arya Pratama",
      namaWakil: "Nabila Syakira Dewi",
      kelasKetua: "XI Rekayasa Perangkat Lunak 1",
      kelasWakil: "XI Otomatisasi Tata Kelola Perkantoran 1",
      fotoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
      slogan: "AKSI NYATA, DISIPLIN PRESTASI, SUARAKAN INOVASI GENERASI!",
      visi: "Mewujudkan OSIS yang responsif, transparan, berintegritas tinggi, serta menjadi pionir prestasi akademik dan non-akademik di tingkat regional maupun nasional.",
      misi: [
        "Mengoptimalkan peran ekstrakurikuler sebagai inkubator prestasi sekolah.",
        "Menyelenggarakan forum diskusi terbuka 'Temu OSIS & Perwakilan Kelas' secara berkala tiap bulan.",
        "Mendorong literasi digital, kepemimpinan kepemudaan, dan sertifikasi keahlian siswa SMK.",
        "Memperkuat kedisiplinan dan rasa kepemilikan terhadap almamater SMK Lentera Bangsa 2."
      ],
      programUnggulan: [
        "Lentera Leadership Bootcamp & Mentorship",
        "Festival Seni & Musik Akustik Kampus 2 (Lentera Fest)",
        "Satu Siswa Satu Karya (Pameran Karya Portofolio Siswa)",
        "Program Jumat Berkah Berbagi & Clean Campus Squad"
      ],
      suara: 0,
      warnaTema: "#8b5cf6" // Purple neon
    },
    {
      id: "paslon-3",
      nomorUrut: "03",
      namaKetua: "Rizky Dwi Ramadhan",
      namaWakil: "Clarissa Jessica Anggraini",
      kelasKetua: "XI Teknik Bisnis Sepeda Motor 1",
      kelasWakil: "X Akuntansi Keuangan Lembaga 1",
      fotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
      slogan: "KOMPAK BERSAMA, BERKARYA TANPA BATAS, BANGKITKAN SEMANGAT JUARA!",
      visi: "Membangun karakter siswa SMK Lentera Bangsa 2 yang mandiri, berdaya saing global, beretika profesional, dan berwawasan lingkungan.",
      misi: [
        "Meningkatkan apresiasi bakat vokasi dan karya inovasi praktikum siswa.",
        "Mengadakan workshop kewirausahaan muda 'Studentpreneur' dengan praktisi UMKM.",
        "Mewadahi aspirasi seluruh jurusan secara adil dan merata tanpa kesenjangan.",
        "Memaksimalkan publikasi media sosial OSIS dengan konten edukatif dan kekinian."
      ],
      programUnggulan: [
        "Lentera Skill Olympiad & Vocation Fest",
        "Podcast OSIS 'Lentera Talks': Inspirasi Anak SMK",
        "Pekan Sehat Mental & Konseling Sahabat Sebaya",
        "Revitalisasi Fasilitas Santai & Spot Kreatif Siswa"
      ],
      suara: 0,
      warnaTema: "#10b981" // Emerald neon
    }
  ],
  dpt: [
    { id: "voter-1", nisn: "0071234501", nama: "Aditya Pratama Putra", kelas: "X TKJ 1", hasVoted: false },
    { id: "voter-2", nisn: "0071234502", nama: "Anisa Rahmawati", kelas: "X TKJ 1", hasVoted: false },
    { id: "voter-3", nisn: "0071234503", nama: "Bayu Saputra", kelas: "X TKJ 2", hasVoted: false },
    { id: "voter-4", nisn: "0071234504", nama: "Citra Kirana Lestari", kelas: "X RPL 1", hasVoted: false },
    { id: "voter-5", nisn: "0071234505", nama: "Dimas Anggara", kelas: "X RPL 2", hasVoted: false },
    { id: "voter-6", nisn: "0071234506", nama: "Eka Nur Fitriani", kelas: "XI TKJ 1", hasVoted: false },
    { id: "voter-7", nisn: "0071234507", nama: "Fajar Hidayatullah", kelas: "XI TKJ 2", hasVoted: false },
    { id: "voter-8", nisn: "0071234508", nama: "Gita Maharani", kelas: "XI RPL 1", hasVoted: false },
    { id: "voter-9", nisn: "0071234509", nama: "Hendra Wijaya", kelas: "XI RPL 2", hasVoted: false },
    { id: "voter-10", nisn: "0071234510", nama: "Indah Permatasari", kelas: "XI OTKP 1", hasVoted: false },
    { id: "voter-11", nisn: "0071234511", nama: "Joko Susilo", kelas: "XI OTKP 2", hasVoted: false },
    { id: "voter-12", nisn: "0071234512", nama: "Kezia Olivia", kelas: "XI AKL 1", hasVoted: false },
    { id: "voter-13", nisn: "0071234513", nama: "Lukman Hakim", kelas: "XII TKJ 1", hasVoted: false },
    { id: "voter-14", nisn: "0071234514", nama: "Mega Utami", kelas: "XII RPL 1", hasVoted: false },
    { id: "voter-15", nisn: "0071234515", nama: "Naufal Ramadhan", kelas: "XII AKL 1", hasVoted: false }
  ],
  votes: []
};

// Ensure database file exists and load into memory
let db: DatabaseSchema = JSON.parse(JSON.stringify(DEFAULT_DB));

function initDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(data);
      console.log("Database loaded from", DB_FILE);
    } else {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
      db = JSON.parse(JSON.stringify(DEFAULT_DB));
      console.log("Initialized new database at", DB_FILE);
    }
  } catch (err) {
    console.error("Error initializing database:", err);
    db = JSON.parse(JSON.stringify(DEFAULT_DB));
  }
}

function saveDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database to file:", err);
  }
}

initDb();

// Server-Sent Events (SSE) subscribers for real-time live updates
const sseClients: Response[] = [];

function broadcastSse(eventType: string, payload: any) {
  const data = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.write(`event: ${eventType}\ndata: ${data}\n\n`);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

function computeStats(): VoteStats {
  const totalDPT = db.dpt.length;
  const totalSuaraMasuk = db.votes.length;
  const totalBelumMemilih = Math.max(0, totalDPT - totalSuaraMasuk);
  const persentasePartisipasi = totalDPT > 0 ? Number(((totalSuaraMasuk / totalDPT) * 100).toFixed(1)) : 0;

  // Calculate paslon stats
  const paslonVoteCounts: Record<string, number> = {};
  db.paslon.forEach((p) => {
    paslonVoteCounts[p.id] = 0;
  });
  db.votes.forEach((v) => {
    if (paslonVoteCounts[v.paslonId] !== undefined) {
      paslonVoteCounts[v.paslonId]++;
    }
  });

  const paslonStats = db.paslon.map((p) => {
    const suara = paslonVoteCounts[p.id] || 0;
    const persentase = totalSuaraMasuk > 0 ? Number(((suara / totalSuaraMasuk) * 100).toFixed(1)) : 0;
    return {
      id: p.id,
      nomorUrut: p.nomorUrut,
      nama: `${p.namaKetua} & ${p.namaWakil}`,
      suara,
      persentase,
      warnaTema: p.warnaTema || "#06b6d4"
    };
  });

  // Calculate per class stats
  const kelasMap: Record<string, { total: number; sudah: number }> = {};
  db.dpt.forEach((v) => {
    const k = v.kelas.trim() || "Lainnya";
    if (!kelasMap[k]) kelasMap[k] = { total: 0, sudah: 0 };
    kelasMap[k].total++;
    if (v.hasVoted) {
      kelasMap[k].sudah++;
    }
  });

  const suaraPerKelas = Object.entries(kelasMap).map(([kelas, val]) => ({
    kelas,
    total: val.total,
    sudahMemilih: val.sudah,
    belumMemilih: Math.max(0, val.total - val.sudah)
  })).sort((a, b) => a.kelas.localeCompare(b.kelas));

  return {
    totalDPT,
    totalSuaraMasuk,
    totalBelumMemilih,
    persentasePartisipasi,
    paslonStats,
    suaraPerKelas,
    liveLogs: db.votes.slice(-20).reverse() // 20 most recent votes
  };
}

// ==========================================
// API ROUTES
// ==========================================

// SSE endpoint for live sync across multi-clients
app.get("/api/stream", (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });

  res.write(`data: ${JSON.stringify({ type: "connected", time: new Date().toISOString() })}\n\n`);
  sseClients.push(res);

  req.on("close", () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

// Initial application data for voter & admin view
app.get("/api/init", (_req: Request, res: Response) => {
  const stats = computeStats();
  res.json({
    settings: db.settings,
    paslon: db.paslon,
    stats
  });
});

// Check voter status before voting
app.post("/api/check-voter", (req: Request, res: Response) => {
  const { nama, kelas } = req.body;
  if (!nama) {
    return res.status(400).json({ error: "Nama Lengkap wajib diisi" });
  }

  const cleanNama = nama.trim().toLowerCase();
  const cleanKelas = (kelas || "").trim().toLowerCase();

  const matched = db.dpt.find((v) => {
    const matchName = v.nama.trim().toLowerCase() === cleanNama;
    if (!matchName) return false;
    if (cleanKelas) {
      return v.kelas.trim().toLowerCase() === cleanKelas;
    }
    return true;
  });

  if (matched) {
    return res.json({
      registered: true,
      hasVoted: matched.hasVoted,
      voter: {
        id: matched.id,
        nama: matched.nama,
        kelas: matched.kelas,
        hasVoted: matched.hasVoted
      }
    });
  }

  // Not strictly in DPT yet
  return res.json({
    registered: false,
    hasVoted: false,
    allowVote: db.settings.allowAutoRegisterDPT
  });
});

// Submit Vote (Multi-Client safe)
app.post("/api/vote", (req: Request, res: Response) => {
  if (db.settings.statusVoting !== "active") {
    return res.status(403).json({
      error: "Pemungutan suara saat ini sedang DITUTUP atau DIJEDA oleh Panitia OSIS."
    });
  }

  const { nama, kelas, paslonId } = req.body;
  if (!nama || !paslonId) {
    return res.status(400).json({ error: "Data pemungutan suara tidak lengkap." });
  }

  const cleanNama = nama.trim();
  const cleanKelas = (kelas || "").trim();
  const normNama = cleanNama.toLowerCase();
  const normKelas = cleanKelas.toLowerCase();

  // Find targeted paslon
  const selectedPaslon = db.paslon.find((p) => p.id === paslonId);
  if (!selectedPaslon) {
    return res.status(404).json({ error: "Pasangan calon tidak ditemukan." });
  }

  // Check if voter already in DPT and already voted
  let voter = db.dpt.find((v) => {
    const matchName = v.nama.trim().toLowerCase() === normNama;
    if (!matchName) return false;
    if (normKelas) {
      return v.kelas.trim().toLowerCase() === normKelas;
    }
    return true;
  });

  if (voter && voter.hasVoted) {
    return res.status(400).json({
      error: `Pemilih dengan nama "${cleanNama}" telah melakukan voting sebelumnya! Hak suara hanya 1 kali.`
    });
  }

  // Check existing vote logs for double submission protection
  const alreadyInLogs = db.votes.some(
    (v) => (
      v.id.includes(normNama.replace(/\s+/g, "")) ||
      (v.pemilihInisial.toLowerCase() === getInitials(cleanNama).toLowerCase() && (!normKelas || v.kelas.toLowerCase() === normKelas))
    )
  );

  if (alreadyInLogs) {
    return res.status(400).json({
      error: "Suara untuk identitas pemilih ini telah tercatat sebelumnya."
    });
  }

  const now = new Date().toISOString();
  const voteHash = "LB2-" + Math.random().toString(36).substring(2, 9).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();

  // Mark in DPT or auto-register if enabled
  if (voter) {
    voter.hasVoted = true;
    voter.votedAt = now;
  } else if (db.settings.allowAutoRegisterDPT) {
    voter = {
      id: "voter-auto-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
      nisn: "AUTO-" + Math.floor(100000 + Math.random() * 900000),
      nama: cleanNama,
      kelas: cleanKelas,
      hasVoted: true,
      votedAt: now
    };
    db.dpt.push(voter);
  } else {
    return res.status(400).json({
      error: "Nama Anda belum terdaftar dalam Daftar Pemilih Tetap (DPT). Silakan hubungi Panitia Pemilihan OSIS."
    });
  }

  // Record vote log (privacy-preserved: initials + kelas)
  const newVoteLog: VoteLog = {
    id: "vote-" + normNama.replace(/\s+/g, "") + "-" + Date.now(),
    voteHash,
    paslonId: selectedPaslon.id,
    paslonNomor: selectedPaslon.nomorUrut,
    pemilihInisial: getInitials(cleanNama),
    kelas: cleanKelas,
    timestamp: now
  };

  db.votes.push(newVoteLog);
  selectedPaslon.suara = (selectedPaslon.suara || 0) + 1;

  // Persist to disk
  saveDb();

  // Background sync to Supabase Cloud (fail-safe)
  syncVoteToSupabase(newVoteLog, voter, selectedPaslon).catch(() => {});

  // Compute updated stats and broadcast to ALL connected clients
  const stats = computeStats();
  broadcastSse("vote_cast", {
    voteLog: newVoteLog,
    stats,
    paslon: db.paslon
  });

  return res.json({
    success: true,
    message: "Suara Anda berhasil tercatat di server utama!",
    receipt: {
      voteHash,
      paslonNomor: selectedPaslon.nomorUrut,
      paslonNama: `${selectedPaslon.namaKetua} & ${selectedPaslon.namaWakil}`,
      pemilih: cleanNama,
      kelas: cleanKelas,
      waktu: now
    }
  });
});

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase() + "***";
  return parts.map((p) => p[0].toUpperCase()).join(".") + "***";
}

// ==========================================
// ADMIN AUTH & MANAGEMENT ROUTES
// ==========================================

// Simple auth middleware using token or header
function verifyAdmin(req: Request, res: Response, next: express.NextFunction) {
  const authHeader = req.headers["x-admin-token"] || req.headers.authorization;
  if (!authHeader || authHeader !== "admin-session-active") {
    return res.status(401).json({ error: "Sesi Admin tidak valid atau telah kedaluwarsa. Silakan login kembali." });
  }
  next();
}

// Admin login
app.post("/api/admin/login", (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Password wajib diisi." });
  }

  if (password === db.adminPasswordHash) {
    return res.json({
      success: true,
      token: "admin-session-active",
      message: "Login Admin berhasil."
    });
  }

  return res.status(401).json({ error: "Password Admin salah. Akses ditolak!" });
});

// Update admin password
app.put("/api/admin/password", verifyAdmin, (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Password lama dan baru wajib diisi." });
  }
  if (oldPassword !== db.adminPasswordHash) {
    return res.status(400).json({ error: "Password lama tidak sesuai." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password baru minimal 6 karakter." });
  }

  db.adminPasswordHash = newPassword;
  saveDb();
  return res.json({ success: true, message: "Password Admin berhasil diperbarui." });
});

// Get settings
app.get("/api/settings", (_req: Request, res: Response) => {
  res.json(db.settings);
});

// Update settings
app.put("/api/admin/settings", verifyAdmin, (req: Request, res: Response) => {
  const { namaSekolah, namaAcara, tahunAjaran, statusVoting, logoSekolahUrl, allowAutoRegisterDPT, pengumuman } = req.body;

  if (namaSekolah) db.settings.namaSekolah = namaSekolah;
  if (namaAcara) db.settings.namaAcara = namaAcara;
  if (tahunAjaran) db.settings.tahunAjaran = tahunAjaran;
  if (statusVoting) db.settings.statusVoting = statusVoting;
  if (logoSekolahUrl) db.settings.logoSekolahUrl = logoSekolahUrl;
  if (typeof allowAutoRegisterDPT === "boolean") db.settings.allowAutoRegisterDPT = allowAutoRegisterDPT;
  if (pengumuman !== undefined) db.settings.pengumuman = pengumuman;

  saveDb();
  broadcastSse("settings_updated", db.settings);
  res.json({ success: true, settings: db.settings, message: "Pengaturan berhasil disimpan." });
});

// --- PASLON CRUD ---

// Get all paslon
app.get("/api/admin/paslon", verifyAdmin, (_req: Request, res: Response) => {
  res.json(db.paslon);
});

// Create paslon
app.post("/api/admin/paslon", verifyAdmin, (req: Request, res: Response) => {
  const { nomorUrut, namaKetua, namaWakil, kelasKetua, kelasWakil, fotoUrl, slogan, visi, misi, programUnggulan, warnaTema } = req.body;

  if (!nomorUrut || !namaKetua || !namaWakil) {
    return res.status(400).json({ error: "Nomor Urut, Nama Ketua, dan Nama Wakil wajib diisi." });
  }

  const newPaslon: Paslon = {
    id: "paslon-" + Date.now(),
    nomorUrut,
    namaKetua,
    namaWakil,
    kelasKetua: kelasKetua || "",
    kelasWakil: kelasWakil || "",
    fotoUrl: fotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    slogan: slogan || "",
    visi: visi || "",
    misi: Array.isArray(misi) ? misi : (misi ? [misi] : []),
    programUnggulan: Array.isArray(programUnggulan) ? programUnggulan : (programUnggulan ? [programUnggulan] : []),
    suara: 0,
    warnaTema: warnaTema || "#06b6d4"
  };

  db.paslon.push(newPaslon);
  // Sort by nomorUrut
  db.paslon.sort((a, b) => a.nomorUrut.localeCompare(b.nomorUrut, undefined, { numeric: true }));
  saveDb();

  const stats = computeStats();
  broadcastSse("paslon_updated", { paslon: db.paslon, stats });
  res.json({ success: true, paslon: newPaslon });
});

// Update paslon
app.put("/api/admin/paslon/:id", verifyAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.paslon.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Paslon tidak ditemukan." });
  }

  const existing = db.paslon[index];
  const { nomorUrut, namaKetua, namaWakil, kelasKetua, kelasWakil, fotoUrl, slogan, visi, misi, programUnggulan, warnaTema } = req.body;

  db.paslon[index] = {
    ...existing,
    nomorUrut: nomorUrut ?? existing.nomorUrut,
    namaKetua: namaKetua ?? existing.namaKetua,
    namaWakil: namaWakil ?? existing.namaWakil,
    kelasKetua: kelasKetua ?? existing.kelasKetua,
    kelasWakil: kelasWakil ?? existing.kelasWakil,
    fotoUrl: fotoUrl ?? existing.fotoUrl,
    slogan: slogan ?? existing.slogan,
    visi: visi ?? existing.visi,
    misi: Array.isArray(misi) ? misi : existing.misi,
    programUnggulan: Array.isArray(programUnggulan) ? programUnggulan : existing.programUnggulan,
    warnaTema: warnaTema ?? existing.warnaTema
  };

  db.paslon.sort((a, b) => a.nomorUrut.localeCompare(b.nomorUrut, undefined, { numeric: true }));
  saveDb();

  const stats = computeStats();
  broadcastSse("paslon_updated", { paslon: db.paslon, stats });
  res.json({ success: true, paslon: db.paslon[index] });
});

// Delete single paslon
app.delete("/api/admin/paslon/:id", verifyAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.paslon.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Paslon tidak ditemukan." });
  }

  db.paslon.splice(index, 1);
  saveDb();

  const stats = computeStats();
  broadcastSse("paslon_updated", { paslon: db.paslon, stats });
  res.json({ success: true, message: "Data Paslon berhasil dihapus." });
});

// Bulk delete all paslon
app.post("/api/admin/paslon/bulk-delete", verifyAdmin, (req: Request, res: Response) => {
  const { confirmationText } = req.body;
  if (confirmationText !== "HAPUS SEMUA") {
    return res.status(400).json({ error: "Teks konfirmasi salah. Ketik 'HAPUS SEMUA' untuk melanjutkan." });
  }

  db.paslon = [];
  saveDb();

  const stats = computeStats();
  broadcastSse("paslon_updated", { paslon: [], stats });
  res.json({ success: true, message: "Semua data Paslon berhasil dihapus." });
});

// --- DPT (DAFTAR PEMILIH TETAP) CRUD ---

// Get DPT list
app.get("/api/admin/dpt", verifyAdmin, (req: Request, res: Response) => {
  const search = (req.query.search as string || "").toLowerCase();
  const kelas = (req.query.kelas as string || "").toLowerCase();
  const status = req.query.status as string; // 'voted', 'not_voted', 'all'

  let filtered = db.dpt;
  if (search) {
    filtered = filtered.filter(
      (v) => v.nama.toLowerCase().includes(search) || (v.nisn && v.nisn.toLowerCase().includes(search))
    );
  }
  if (kelas && kelas !== "all") {
    filtered = filtered.filter((v) => v.kelas.toLowerCase() === kelas);
  }
  if (status === "voted") {
    filtered = filtered.filter((v) => v.hasVoted);
  } else if (status === "not_voted") {
    filtered = filtered.filter((v) => !v.hasVoted);
  }

  res.json({
    total: db.dpt.length,
    filteredTotal: filtered.length,
    data: filtered
  });
});

// Create single voter
app.post("/api/admin/dpt", verifyAdmin, (req: Request, res: Response) => {
  const { nisn, nama, kelas } = req.body;
  if (!nama || !kelas) {
    return res.status(400).json({ error: "Nama dan Kelas pemilih wajib diisi." });
  }

  const exists = db.dpt.some(
    (v) => v.nama.trim().toLowerCase() === nama.trim().toLowerCase() && v.kelas.trim().toLowerCase() === kelas.trim().toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ error: "Pemilih dengan Nama dan Kelas ini sudah ada di DPT." });
  }

  const newVoter: Voter = {
    id: "voter-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    nisn: nisn ? nisn.trim() : "NISN-" + Math.floor(100000 + Math.random() * 900000),
    nama: nama.trim(),
    kelas: kelas.trim(),
    hasVoted: false
  };

  db.dpt.push(newVoter);
  saveDb();

  const stats = computeStats();
  broadcastSse("dpt_updated", stats);
  res.json({ success: true, voter: newVoter });
});

// Update single voter
app.put("/api/admin/dpt/:id", verifyAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.dpt.findIndex((v) => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Pemilih tidak ditemukan." });
  }

  const { nisn, nama, kelas, hasVoted } = req.body;
  if (nisn !== undefined) db.dpt[index].nisn = nisn;
  if (nama) db.dpt[index].nama = nama.trim();
  if (kelas) db.dpt[index].kelas = kelas.trim();
  if (typeof hasVoted === "boolean") db.dpt[index].hasVoted = hasVoted;

  saveDb();
  const stats = computeStats();
  broadcastSse("dpt_updated", stats);
  res.json({ success: true, voter: db.dpt[index] });
});

// Delete single voter
app.delete("/api/admin/dpt/:id", verifyAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.dpt.findIndex((v) => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Pemilih tidak ditemukan." });
  }

  db.dpt.splice(index, 1);
  saveDb();

  const stats = computeStats();
  broadcastSse("dpt_updated", stats);
  res.json({ success: true, message: "Data pemilih berhasil dihapus." });
});

// Bulk Import DPT from Excel/CSV (Array of { nisn, nama, kelas })
app.post("/api/admin/dpt/import", verifyAdmin, (req: Request, res: Response) => {
  const { voters, mode } = req.body; // mode: 'append' or 'replace'

  if (!Array.isArray(voters) || voters.length === 0) {
    return res.status(400).json({ error: "Data pemilih kosong atau format tidak valid." });
  }

  let addedCount = 0;
  let skippedCount = 0;

  if (mode === "replace") {
    db.dpt = [];
  }

  const existingMap = new Set(
    db.dpt.map((v) => `${v.nama.trim().toLowerCase()}_${v.kelas.trim().toLowerCase()}`)
  );

  voters.forEach((item: any, idx: number) => {
    const rawNama = item.nama || item.Nama || item["Nama Lengkap"] || item.name;
    const rawKelas = item.kelas || item.Kelas || item.class;
    const rawNisn = item.nisn || item.NISN || item.nis || item.NIS || `NIS-${idx + 1000}`;

    if (!rawNama || !rawKelas) {
      skippedCount++;
      return;
    }

    const key = `${String(rawNama).trim().toLowerCase()}_${String(rawKelas).trim().toLowerCase()}`;
    if (existingMap.has(key)) {
      skippedCount++;
      return;
    }

    existingMap.add(key);
    db.dpt.push({
      id: "voter-imp-" + Date.now() + "-" + idx,
      nisn: String(rawNisn).trim(),
      nama: String(rawNama).trim(),
      kelas: String(rawKelas).trim(),
      hasVoted: false
    });
    addedCount++;
  });

  saveDb();
  const stats = computeStats();
  broadcastSse("dpt_updated", stats);

  res.json({
    success: true,
    addedCount,
    skippedCount,
    totalDPT: db.dpt.length,
    message: `Berhasil mengimpor ${addedCount} data pemilih. (${skippedCount} dilewati/duplikat)`
  });
});

// Bulk Delete All DPT
app.post("/api/admin/dpt/bulk-delete", verifyAdmin, (req: Request, res: Response) => {
  const { confirmationText } = req.body;
  if (confirmationText !== "HAPUS SEMUA") {
    return res.status(400).json({ error: "Teks konfirmasi salah. Ketik 'HAPUS SEMUA' untuk melanjutkan." });
  }

  db.dpt = [];
  saveDb();

  const stats = computeStats();
  broadcastSse("dpt_updated", stats);
  res.json({ success: true, message: "Seluruh data pemilih (DPT) berhasil dihapus." });
});

// --- VOTES LOGS & AUDIT TRAIL ---

app.get("/api/admin/votes", verifyAdmin, (_req: Request, res: Response) => {
  res.json({
    total: db.votes.length,
    votes: db.votes
  });
});

// Bulk Delete / Reset All Votes
app.post("/api/admin/votes/bulk-delete", verifyAdmin, (req: Request, res: Response) => {
  const { confirmationText } = req.body;
  if (confirmationText !== "HAPUS SEMUA SUARA") {
    return res.status(400).json({
      error: "Teks konfirmasi salah. Ketik 'HAPUS SEMUA SUARA' untuk konfirmasi reset suara."
    });
  }

  // Clear all vote records
  db.votes = [];
  // Reset paslon counters
  db.paslon.forEach((p) => {
    p.suara = 0;
  });
  // Reset voter status in DPT
  db.dpt.forEach((v) => {
    v.hasVoted = false;
    delete v.votedAt;
  });

  saveDb();
  const stats = computeStats();
  broadcastSse("vote_cast", { stats, paslon: db.paslon });

  res.json({
    success: true,
    message: "Semua suara telah di-reset ke nol dan status pemilih telah dikembalikan ke belum memilih."
  });
});

// Reset entire database to default SMK Lentera Bangsa 2 seed
app.post("/api/admin/reset-defaults", verifyAdmin, (req: Request, res: Response) => {
  const { confirmationText } = req.body;
  if (confirmationText !== "RESET DEFAULT") {
    return res.status(400).json({ error: "Ketik 'RESET DEFAULT' untuk mereset data ke awal." });
  }

  db = JSON.parse(JSON.stringify(DEFAULT_DB));
  saveDb();

  const stats = computeStats();
  broadcastSse("settings_updated", db.settings);
  broadcastSse("paslon_updated", { paslon: db.paslon, stats });
  broadcastSse("dpt_updated", stats);

  res.json({ success: true, message: "Database berhasil di-reset ke data default SMK Lentera Bangsa 2." });
});

// --- SUPABASE CLOUD INTEGRATION ROUTES ---

// Check Supabase connection and table status
app.get("/api/supabase/status", async (_req: Request, res: Response) => {
  const status = await getSupabaseStatus();
  res.json(status);
});

// Get SQL DDL to copy into Supabase SQL editor
app.get("/api/supabase/sql", (_req: Request, res: Response) => {
  res.json({ sql: getSupabaseSchemaSql() });
});

// Push local state to Supabase Cloud
app.post("/api/supabase/push", verifyAdmin, async (_req: Request, res: Response) => {
  const result = await pushAllToSupabase(db);
  res.json(result);
});

// Pull remote state from Supabase Cloud to local
app.post("/api/supabase/pull", verifyAdmin, async (_req: Request, res: Response) => {
  const result = await pullAllFromSupabase();
  if (result.success && result.data) {
    if (result.data.settings) db.settings = result.data.settings;
    if (result.data.paslon && result.data.paslon.length > 0) db.paslon = result.data.paslon;
    if (result.data.dpt && result.data.dpt.length > 0) db.dpt = result.data.dpt;
    if (result.data.votes) db.votes = result.data.votes;
    saveDb();

    const stats = computeStats();
    broadcastSse("settings_updated", db.settings);
    broadcastSse("paslon_updated", { paslon: db.paslon, stats });
    broadcastSse("dpt_updated", stats);
    broadcastSse("vote_cast", { stats, paslon: db.paslon });
  }
  res.json(result);
});

// ==========================================
// VITE MIDDLEWARE & SERVER STARTUP
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`E-Voting Server SMK Lentera Bangsa 2 running on port ${PORT}`);
    // Check Supabase status on startup
    try {
      const sbStatus = await getSupabaseStatus();
      console.log(`Supabase Status: ${sbStatus.connected ? "Connected" : "Standby"} (${sbStatus.url})`);
      if (sbStatus.tables.settings || sbStatus.tables.paslon) {
        console.log("Supabase tables detected, checking remote data...");
        const pullRes = await pullAllFromSupabase();
        if (pullRes.success && pullRes.data) {
          if (pullRes.data.settings) db.settings = pullRes.data.settings;
          if (pullRes.data.paslon && pullRes.data.paslon.length > 0) db.paslon = pullRes.data.paslon;
          if (pullRes.data.dpt && pullRes.data.dpt.length > 0) db.dpt = pullRes.data.dpt;
          if (pullRes.data.votes) db.votes = pullRes.data.votes;
          saveDb();
          console.log("Successfully synchronized data from Supabase Cloud.");
        }
      }
    } catch (err) {
      console.warn("Supabase startup check:", err);
    }
  });
}

startServer();
