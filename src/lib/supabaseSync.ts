import { createClient } from "@supabase/supabase-js";
import { AppSettings, Paslon, Voter, VoteLog, SupabaseSyncStatus } from "../types.js";

// Clean Supabase URL: remove any trailing /rest/v1/
const rawUrl = process.env.SUPABASE_URL || "https://otejfijcmvjgvdvkrzqi.supabase.co";
export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, "");
export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZWpmaWpjbXZqZ3ZkdmtyenFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTU4MDYsImV4cCI6MjEwNDk5MTgwNn0.UxyDC3AgX8opuFgqj42YM1QRtJM_ZC1YzlGeemAmFY0";

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false
  }
});

/**
 * Returns SQL DDL script to create tables and RLS policies in Supabase SQL editor
 */
export function getSupabaseSchemaSql(): string {
  return `-- ==========================================================
-- SKRIP SETUP DATABASE E-VOTING OSIS SMK LENTERA BANGSA 2
-- Salin seluruh skrip ini, buka Supabase Dashboard -> SQL Editor
-- Buat 'New Query', paste di sana, lalu klik 'RUN'.
-- ==========================================================

-- 1. TABEL PENGATURAN APLIKASI
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    nama_sekolah TEXT NOT NULL,
    nama_acara TEXT NOT NULL,
    tahun_ajaran TEXT NOT NULL,
    status_voting TEXT NOT NULL DEFAULT 'active',
    logo_sekolah_url TEXT,
    allow_auto_register_dpt BOOLEAN DEFAULT TRUE,
    pengumuman TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL PASANGAN CALON (PASLON)
CREATE TABLE IF NOT EXISTS public.paslon (
    id TEXT PRIMARY KEY,
    nomor_urut TEXT NOT NULL,
    nama_ketua TEXT NOT NULL,
    nama_wakil TEXT NOT NULL,
    kelas_ketua TEXT,
    kelas_wakil TEXT,
    foto_url TEXT,
    slogan TEXT,
    visi TEXT,
    misi JSONB DEFAULT '[]'::jsonb,
    program_unggulan JSONB DEFAULT '[]'::jsonb,
    suara INTEGER DEFAULT 0,
    warna_tema TEXT DEFAULT '#06b6d4',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL DAFTAR PEMILIH TETAP (DPT)
CREATE TABLE IF NOT EXISTS public.dpt (
    id TEXT PRIMARY KEY,
    nisn TEXT,
    nama TEXT NOT NULL,
    kelas TEXT,
    has_voted BOOLEAN DEFAULT FALSE,
    voted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL LOG SUARA MASUK (AUDIT TRAIL & STRUK DIGITAL)
CREATE TABLE IF NOT EXISTS public.votes (
    id TEXT PRIMARY KEY,
    vote_hash TEXT NOT NULL,
    paslon_id TEXT NOT NULL,
    paslon_nomor TEXT NOT NULL,
    pemilih_inisial TEXT NOT NULL,
    kelas TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AKTIFKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paslon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- 6. KEBIJAKAN AKSES (POLICIES) UNTUK PUBLIC ANON
DROP POLICY IF EXISTS "Anon public access settings" ON public.settings;
CREATE POLICY "Anon public access settings" ON public.settings FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon public access paslon" ON public.paslon;
CREATE POLICY "Anon public access paslon" ON public.paslon FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon public access dpt" ON public.dpt;
CREATE POLICY "Anon public access dpt" ON public.dpt FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon public access votes" ON public.votes;
CREATE POLICY "Anon public access votes" ON public.votes FOR ALL TO anon USING (true) WITH CHECK (true);
`;
}

/**
 * Checks connection and table presence in Supabase
 */
export async function getSupabaseStatus(): Promise<SupabaseSyncStatus> {
  const result: SupabaseSyncStatus = {
    connected: false,
    url: SUPABASE_URL,
    anonKeyConfigured: Boolean(SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 20),
    tables: {
      settings: false,
      paslon: false,
      dpt: false,
      votes: false
    },
    message: "Memeriksa koneksi Supabase..."
  };

  try {
    // Check settings table
    const checkSettings = await supabase.from("settings").select("id").limit(1);
    if (!checkSettings.error) {
      result.tables.settings = true;
      result.connected = true;
    }

    // Check paslon table
    const checkPaslon = await supabase.from("paslon").select("id").limit(1);
    if (!checkPaslon.error) {
      result.tables.paslon = true;
      result.connected = true;
    }

    // Check dpt table
    const checkDpt = await supabase.from("dpt").select("id").limit(1);
    if (!checkDpt.error) {
      result.tables.dpt = true;
      result.connected = true;
    }

    // Check votes table
    const checkVotes = await supabase.from("votes").select("id").limit(1);
    if (!checkVotes.error) {
      result.tables.votes = true;
      result.connected = true;
    }

    const allTablesPresent =
      result.tables.settings &&
      result.tables.paslon &&
      result.tables.dpt &&
      result.tables.votes;

    if (allTablesPresent) {
      result.message = "Tersambung ke Supabase Cloud. Seluruh tabel database aktif & siap sinkronisasi!";
    } else if (result.connected) {
      result.message = "Tersambung ke Supabase, namun beberapa tabel belum dibuat di SQL Editor.";
    } else {
      result.message = "Tersambung ke project Supabase. Tabel database belum dibuat di SQL Editor.";
    }
  } catch (err: any) {
    result.message = `Gagal memeriksa status Supabase: ${err.message || String(err)}`;
  }

  return result;
}

/**
 * Push all local data to Supabase (Settings, Paslon, DPT, Votes)
 */
export async function pushAllToSupabase(db: {
  settings: AppSettings;
  paslon: Paslon[];
  dpt: Voter[];
  votes: VoteLog[];
}): Promise<{ success: boolean; message: string; details: any }> {
  const details = {
    settings: false,
    paslonCount: 0,
    dptCount: 0,
    votesCount: 0,
    errors: [] as string[]
  };

  try {
    // 1. Settings
    const settingsPayload = {
      id: "global",
      nama_sekolah: db.settings.namaSekolah,
      nama_acara: db.settings.namaAcara,
      tahun_ajaran: db.settings.tahunAjaran,
      status_voting: db.settings.statusVoting,
      logo_sekolah_url: db.settings.logoSekolahUrl,
      allow_auto_register_dpt: db.settings.allowAutoRegisterDPT,
      pengumuman: db.settings.pengumuman,
      updated_at: new Date().toISOString()
    };
    const sRes = await supabase.from("settings").upsert(settingsPayload);
    if (sRes.error) {
      details.errors.push(`Settings: ${sRes.error.message}`);
    } else {
      details.settings = true;
    }

    // 2. Paslon
    if (db.paslon.length > 0) {
      const paslonPayload = db.paslon.map((p) => ({
        id: p.id,
        nomor_urut: p.nomorUrut,
        nama_ketua: p.namaKetua,
        nama_wakil: p.namaWakil,
        kelas_ketua: p.kelasKetua,
        kelas_wakil: p.kelasWakil,
        foto_url: p.fotoUrl,
        slogan: p.slogan,
        visi: p.visi,
        misi: p.misi,
        program_unggulan: p.programUnggulan,
        suara: p.suara,
        warna_tema: p.warnaTema || "#06b6d4",
        updated_at: new Date().toISOString()
      }));
      const pRes = await supabase.from("paslon").upsert(paslonPayload);
      if (pRes.error) {
        details.errors.push(`Paslon: ${pRes.error.message}`);
      } else {
        details.paslonCount = paslonPayload.length;
      }
    }

    // 3. DPT
    if (db.dpt.length > 0) {
      const dptPayload = db.dpt.map((v) => ({
        id: v.id,
        nisn: v.nisn || null,
        nama: v.nama,
        kelas: v.kelas,
        has_voted: v.hasVoted,
        voted_at: v.votedAt || null,
        updated_at: new Date().toISOString()
      }));
      // Batch upsert chunks of 100 to avoid payload size limit
      for (let i = 0; i < dptPayload.length; i += 100) {
        const chunk = dptPayload.slice(i, i + 100);
        const dRes = await supabase.from("dpt").upsert(chunk);
        if (dRes.error) {
          details.errors.push(`DPT chunk ${i}: ${dRes.error.message}`);
          break;
        } else {
          details.dptCount += chunk.length;
        }
      }
    }

    // 4. Votes
    if (db.votes.length > 0) {
      const votesPayload = db.votes.map((v) => ({
        id: v.id,
        vote_hash: v.voteHash,
        paslon_id: v.paslonId,
        paslon_nomor: v.paslonNomor,
        pemilih_inisial: v.pemilihInisial,
        kelas: v.kelas,
        timestamp: v.timestamp
      }));
      for (let i = 0; i < votesPayload.length; i += 100) {
        const chunk = votesPayload.slice(i, i + 100);
        const vRes = await supabase.from("votes").upsert(chunk);
        if (vRes.error) {
          details.errors.push(`Votes chunk ${i}: ${vRes.error.message}`);
          break;
        } else {
          details.votesCount += chunk.length;
        }
      }
    }

    if (details.errors.length > 0) {
      return {
        success: false,
        message: `Sinkronisasi sebagian berhasil dengan peringatan: ${details.errors[0]}`,
        details
      };
    }

    return {
      success: true,
      message: `Berhasil mengunggah data ke Supabase Cloud! (${details.paslonCount} Paslon, ${details.dptCount} DPT, ${details.votesCount} Suara)`,
      details
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal sinkronisasi ke Supabase: ${err.message || String(err)}`,
      details
    };
  }
}

/**
 * Pull all data from Supabase into application
 */
export async function pullAllFromSupabase(): Promise<{
  success: boolean;
  message: string;
  data?: {
    settings?: AppSettings;
    paslon?: Paslon[];
    dpt?: Voter[];
    votes?: VoteLog[];
  };
}> {
  try {
    const data: any = {};

    // 1. Settings
    const sRes = await supabase.from("settings").select("*").eq("id", "global").maybeSingle();
    if (!sRes.error && sRes.data) {
      data.settings = {
        namaSekolah: sRes.data.nama_sekolah,
        namaAcara: sRes.data.nama_acara,
        tahunAjaran: sRes.data.tahun_ajaran,
        statusVoting: sRes.data.status_voting,
        logoSekolahUrl: sRes.data.logo_sekolah_url,
        allowAutoRegisterDPT: sRes.data.allow_auto_register_dpt,
        pengumuman: sRes.data.pengumuman
      };
    }

    // 2. Paslon
    const pRes = await supabase.from("paslon").select("*").order("nomor_urut");
    if (!pRes.error && pRes.data && pRes.data.length > 0) {
      data.paslon = pRes.data.map((row: any) => ({
        id: row.id,
        nomorUrut: row.nomor_urut,
        namaKetua: row.nama_ketua,
        namaWakil: row.nama_wakil,
        kelasKetua: row.kelas_ketua || "",
        kelasWakil: row.kelas_wakil || "",
        fotoUrl: row.foto_url,
        slogan: row.slogan,
        visi: row.visi,
        misi: Array.isArray(row.misi) ? row.misi : [],
        programUnggulan: Array.isArray(row.program_unggulan) ? row.program_unggulan : [],
        suara: Number(row.suara) || 0,
        warnaTema: row.warna_tema || "#06b6d4"
      }));
    }

    // 3. DPT
    const dRes = await supabase.from("dpt").select("*");
    if (!dRes.error && dRes.data && dRes.data.length > 0) {
      data.dpt = dRes.data.map((row: any) => ({
        id: row.id,
        nisn: row.nisn,
        nama: row.nama,
        kelas: row.kelas || "",
        hasVoted: Boolean(row.has_voted),
        votedAt: row.voted_at || undefined
      }));
    }

    // 4. Votes
    const vRes = await supabase.from("votes").select("*").order("timestamp");
    if (!vRes.error && vRes.data && vRes.data.length > 0) {
      data.votes = vRes.data.map((row: any) => ({
        id: row.id,
        voteHash: row.vote_hash,
        paslonId: row.paslon_id,
        paslonNomor: row.paslon_nomor,
        pemilihInisial: row.pemilih_inisial,
        kelas: row.kelas || "",
        timestamp: row.timestamp
      }));
    }

    const hasAnyData = Boolean(data.settings || data.paslon || data.dpt || data.votes);
    if (!hasAnyData) {
      return {
        success: false,
        message: "Tidak ada data yang ditemukan di Supabase Cloud untuk diimpor."
      };
    }

    return {
      success: true,
      message: "Data berhasil ditarik dari Supabase Cloud!",
      data
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menarik data dari Supabase: ${err.message || String(err)}`
    };
  }
}

/**
 * Async background sync single vote to Supabase
 */
export async function syncVoteToSupabase(voteLog: VoteLog, voter: Voter, paslon: Paslon) {
  try {
    // 1. Insert vote log
    await supabase.from("votes").insert({
      id: voteLog.id,
      vote_hash: voteLog.voteHash,
      paslon_id: voteLog.paslonId,
      paslon_nomor: voteLog.paslonNomor,
      pemilih_inisial: voteLog.pemilihInisial,
      kelas: voteLog.kelas,
      timestamp: voteLog.timestamp
    });

    // 2. Update/upsert voter has_voted
    await supabase.from("dpt").upsert({
      id: voter.id,
      nisn: voter.nisn || null,
      nama: voter.nama,
      kelas: voter.kelas,
      has_voted: true,
      voted_at: voter.votedAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 3. Update paslon suara count
    await supabase
      .from("paslon")
      .update({ suara: paslon.suara, updated_at: new Date().toISOString() })
      .eq("id", paslon.id);
  } catch (err) {
    console.warn("Background Supabase vote sync skipped or failed (local copy preserved):", err);
  }
}
