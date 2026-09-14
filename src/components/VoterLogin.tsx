import React, { useState } from "react";
import { UserCheck, Shield, Sparkles, AlertCircle, ArrowRight, BookOpen, Clock } from "lucide-react";
import { AppSettings, Voter } from "../types";

interface VoterLoginProps {
  onLoginSuccess: (voter: { nama: string; kelas: string }) => void;
  settings: AppSettings;
  sampleVoters?: Voter[];
}

export const VoterLogin: React.FC<VoterLoginProps> = ({
  onLoginSuccess,
  settings,
  sampleVoters = []
}) => {
  const [nama, setNama] = useState("");
  const [selectedVoterKelas, setSelectedVoterKelas] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanNama = nama.trim();

    if (!cleanNama) {
      setErrorMsg("Nama Lengkap wajib diisi.");
      return;
    }

    if (settings.statusVoting !== "active") {
      setErrorMsg(
        settings.statusVoting === "paused"
          ? "Sesi pemungutan suara sedang DIJEDA sementara oleh panitia."
          : "Sesi pemungutan suara telah DITUTUP secara resmi."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/check-voter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: cleanNama, kelas: selectedVoterKelas })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memverifikasi data pemilih.");
      }

      if (data.hasVoted) {
        setErrorMsg(`Pemilih "${cleanNama}" telah menggunakan hak suara sebelumnya! Setiap pemilih hanya dapat voting 1 kali.`);
        return;
      }

      // Check auto register permission
      if (!data.registered && !data.allowVote) {
        setErrorMsg("Nama Anda belum terdaftar di DPT. Silakan hubungi Panitia OSIS di TPS.");
        return;
      }

      // Proceed to voting booth
      onLoginSuccess({ nama: cleanNama, kelas: data.voter?.kelas || selectedVoterKelas || "" });
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  const handlePickSampleVoter = (v: Voter) => {
    setNama(v.nama);
    setSelectedVoterKelas(v.kelas);
    setErrorMsg("");
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Header Info Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-4">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Sistem E-Voting Multi-Client Terpusat</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading mb-2">
          Masuk ke Bilik Suara Digital
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
          Silakan masukkan Nama Lengkap Anda untuk memulai pemilihan Ketua & Wakil Ketua OSIS {settings.namaSekolah}.
        </p>
      </div>

      {/* Main Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Voting Status Alert if not active */}
        {settings.statusVoting !== "active" && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3 text-sm">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">
                {settings.statusVoting === "paused" ? "Pemungutan Suara Sedang Dijeda" : "Pemungutan Suara Ditutup"}
              </p>
              <p className="text-xs text-amber-200/80 mt-1">
                {settings.pengumuman || "Panitia OSIS saat ini membatasi pengiriman suara baru. Anda tetap dapat meninjau visi-misi dan quick count."}
              </p>
            </div>
          </div>
        )}

        {/* Error / Double-Vote Notification */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-300">Perhatian / Akses Terbatas</p>
              <p className="text-xs text-rose-200/90 mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input Nama Lengkap */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Nama Lengkap Pemilih <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                id="input-voter-nama"
                type="text"
                value={nama}
                onChange={(e) => {
                  setNama(e.target.value);
                  setSelectedVoterKelas("");
                }}
                placeholder="Masukkan nama lengkap Anda..."
                className="w-full px-4 py-4 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-sm sm:text-base font-medium transition"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              Satu pemilih hanya memiliki 1 (satu) hak suara yang sah dan rahasia.
            </p>
          </div>

          {/* Submit Action */}
          <button
            id="btn-enter-booth"
            type="submit"
            disabled={loading || settings.statusVoting !== "active"}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 cursor-pointer"
          >
            {loading ? (
              <span>Memeriksa Status Hak Suara...</span>
            ) : (
              <>
                <span>Masuk & Mulai Memilih</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Quick Testing Helper: Sample Voters from DPT */}
        {sampleVoters && sampleVoters.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                Uji Coba Cepat (Contoh Pemilih DPT):
              </span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
              {sampleVoters.slice(0, 8).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handlePickSampleVoter(v)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                    v.hasVoted
                      ? "bg-slate-900/50 border-white/5 text-slate-500 cursor-not-allowed line-through"
                      : "bg-slate-800/80 border-cyan-500/20 text-slate-200 hover:text-cyan-300 hover:border-cyan-400"
                  }`}
                  title={v.hasVoted ? "Sudah memilih" : "Belum memilih (Siap coblos)"}
                >
                  {v.nama} {v.hasVoted && "✓"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
