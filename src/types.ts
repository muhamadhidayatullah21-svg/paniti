export interface Paslon {
  id: string;
  nomorUrut: string; // e.g. "01", "02", "03"
  namaKetua: string;
  namaWakil: string;
  kelasKetua: string;
  kelasWakil: string;
  fotoUrl: string;
  slogan: string;
  visi: string;
  misi: string[];
  programUnggulan: string[];
  suara: number;
  warnaTema?: string; // Hex or tailwind color
}

export interface Voter {
  id: string;
  nama: string;
  kelas: string;
  nisn?: string;
  hasVoted: boolean;
  votedAt?: string;
}

export interface VoteLog {
  id: string;
  voteHash: string;
  paslonId: string;
  paslonNomor: string;
  pemilihInisial: string;
  kelas: string;
  timestamp: string;
}

export interface AppSettings {
  namaSekolah: string;
  namaAcara: string;
  tahunAjaran: string;
  statusVoting: 'active' | 'closed' | 'paused';
  logoSekolahUrl: string;
  allowAutoRegisterDPT: boolean; // if true, voter not in DPT can vote and gets auto-added to DPT
  pengumuman: string;
}

export interface VoteStats {
  totalDPT: number;
  totalSuaraMasuk: number;
  totalBelumMemilih: number;
  persentasePartisipasi: number;
  paslonStats: {
    id: string;
    nomorUrut: string;
    nama: string;
    suara: number;
    persentase: number;
    warnaTema: string;
  }[];
  suaraPerKelas: {
    kelas: string;
    total: number;
    sudahMemilih: number;
    belumMemilih: number;
  }[];
  liveLogs: VoteLog[];
}

export interface InitialDataResponse {
  settings: AppSettings;
  paslon: Paslon[];
  stats: VoteStats;
}

export interface SupabaseSyncStatus {
  connected: boolean;
  url: string;
  anonKeyConfigured: boolean;
  tables: {
    settings: boolean;
    paslon: boolean;
    dpt: boolean;
    votes: boolean;
  };
  lastSyncTime?: string;
  message: string;
}
