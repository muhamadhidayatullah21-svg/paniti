import React, { useState } from "react";
import confetti from "canvas-confetti";
import {
  Vote,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Target,
  ListChecks,
  ChevronRight,
  Printer,
  Share2,
  ShieldCheck,
  Award,
  Clock,
  ArrowLeft
} from "lucide-react";
import { Paslon } from "../types";

interface VotingBoothProps {
  voter: { nama: string; kelas: string };
  paslonList: Paslon[];
  onVoteSuccess: (receipt: any) => void;
  onBackToLogin: () => void;
  onViewQuickCount: () => void;
}

export const VotingBooth: React.FC<VotingBoothProps> = ({
  voter,
  paslonList,
  onVoteSuccess,
  onBackToLogin,
  onViewQuickCount
}) => {
  const [selectedPaslon, setSelectedPaslon] = useState<Paslon | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [detailModalPaslon, setDetailModalPaslon] = useState<Paslon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [voteReceipt, setVoteReceipt] = useState<any | null>(null);

  const handleOpenConfirm = (p: Paslon) => {
    setSelectedPaslon(p);
    setConfirmModalOpen(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedPaslon) return;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: voter.nama,
          kelas: voter.kelas,
          paslonId: selectedPaslon.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirimkan suara.");
      }

      // Trigger energetic celebratory confetti!
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 300);

      setVoteReceipt(data.receipt);
      setConfirmModalOpen(false);
      onVoteSuccess(data.receipt);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mencoblos. Silakan periksa koneksi Anda.");
      setConfirmModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If vote has succeeded, display the Digital Vote Receipt
  if (voteReceipt) {
    return (
      <div className="w-full max-w-xl mx-auto">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/30 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/30">
            Hak Suara Berhasil Digunakan
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 font-heading">
            Terima Kasih Atas Partisipasi Anda!
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-md mx-auto">
            Suara Anda untuk Paslon No. <span className="text-cyan-400 font-bold">{voteReceipt.paslonNomor}</span> telah terenkripsi dan tersimpan di database server utama secara aman & rahasia.
          </p>

          {/* Virtual Digital Receipt Card */}
          <div className="my-6 p-5 rounded-2xl bg-slate-900/90 border border-white/10 text-left space-y-3 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-slate-400">KODE VERIFIKASI DIGITAL:</span>
              <span className="text-cyan-400 font-bold tracking-wider">{voteReceipt.voteHash}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">PEMILIH:</span>
              <span className="text-slate-200 font-bold">{voteReceipt.pemilih}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">PASLON TERPILIH:</span>
              <span className="text-emerald-400 font-bold">No. {voteReceipt.paslonNomor} ({voteReceipt.paslonNama})</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 text-[11px]">
              <span className="text-slate-500">WAKTU TERCATAT:</span>
              <span className="text-slate-400">{new Date(voteReceipt.waktu).toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            <button
              id="btn-view-quickcount-after-vote"
              onClick={onViewQuickCount}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <span>Pantau Quick Count Live</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              id="btn-finish-vote"
              onClick={onBackToLogin}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Selesai & Keluar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Top Banner & Active Voter Greeting */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={onBackToLogin}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 mb-2 font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ganti Akun Pemilih</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading flex items-center gap-2.5">
            <span>Bilik Suara Digital</span>
            <span className="text-cyan-400 text-sm font-sans font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/30">
              LUBER JURDIL
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Halo <strong className="text-cyan-300">{voter.nama}</strong>, tentukan pilihan terbaik Anda untuk masa depan OSIS SMK Lentera Bangsa 2.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Kerahasiaan Suara 100% Terjamin</span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-300">Gagal Mengirim Suara</p>
            <p className="text-xs text-rose-200/90 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Paslon Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paslonList.map((p) => {
          const accentColor = p.warnaTema || "#06b6d4";
          return (
            <div
              key={p.id}
              id={`card-paslon-${p.nomorUrut}`}
              className="glass-card-interactive rounded-3xl overflow-hidden flex flex-col justify-between group relative"
            >
              {/* Badge Nomor Urut */}
              <div className="absolute top-4 left-4 z-10">
                <div
                  className="w-12 h-12 rounded-2xl font-black text-xl flex items-center justify-center text-slate-950 shadow-xl"
                  style={{ backgroundColor: accentColor }}
                >
                  {p.nomorUrut}
                </div>
              </div>

              {/* Photo Area */}
              <div className="relative w-full h-72 overflow-hidden bg-slate-900">
                <img
                  src={p.fotoUrl}
                  alt={`Paslon ${p.nomorUrut}`}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback visual
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Slogan Banner */}
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 line-clamp-1 drop-shadow">
                    "{p.slogan || "Maju Bersama SMK Lentera Bangsa 2"}"
                  </p>
                </div>
              </div>

              {/* Information Body */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  {/* Candidate Names */}
                  <div className="mb-4">
                    <div className="mb-1">
                      <span className="text-xs font-semibold text-slate-400">Calon Ketua OSIS</span>
                    </div>
                    <h3 className="text-lg font-bold text-white font-heading">{p.namaKetua}</h3>

                    <div className="mt-3 mb-1">
                      <span className="text-xs font-semibold text-slate-400">Calon Wakil Ketua</span>
                    </div>
                    <h4 className="text-base font-semibold text-slate-200 font-heading">{p.namaWakil}</h4>
                  </div>

                  {/* Visi preview */}
                  <div className="mb-4 p-3 rounded-xl bg-slate-900/60 border border-white/5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-1">
                      <Target className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Ringkasan Visi:</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {p.visi}
                    </p>
                  </div>

                  {/* Program Unggulan Highlights */}
                  {p.programUnggulan && p.programUnggulan.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Program Unggulan:</span>
                      </div>
                      <div className="space-y-1">
                        {p.programUnggulan.slice(0, 2).map((proker, i) => (
                          <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                            <span className="text-cyan-400 mt-0.5">•</span>
                            <span className="line-clamp-1">{proker}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <button
                    id={`btn-coblos-paslon-${p.nomorUrut}`}
                    type="button"
                    onClick={() => handleOpenConfirm(p)}
                    className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm tracking-wide text-slate-950 flex items-center justify-center gap-2 shadow-lg transition duration-150 cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, #ffffff)`
                    }}
                  >
                    <Vote className="w-4 h-4" />
                    <span>COBLOS PASLON {p.nomorUrut}</span>
                  </button>

                  <button
                    id={`btn-detail-paslon-${p.nomorUrut}`}
                    type="button"
                    onClick={() => setDetailModalPaslon(p)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 border border-white/5 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Lihat Visi-Misi Lengkap</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal Before Casting Vote */}
      {confirmModalOpen && selectedPaslon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-cyan-500/40 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto mb-4">
              <Vote className="w-7 h-7" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-center text-white font-heading">
              Konfirmasi Pilihan Anda
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm text-center mt-1">
              Mohon periksa kembali pilihan Anda sebelum suara dikirim ke server utama.
            </p>

            <div className="my-6 p-4 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl font-black text-2xl flex items-center justify-center text-slate-950 shrink-0"
                style={{ backgroundColor: selectedPaslon.warnaTema || "#06b6d4" }}
              >
                {selectedPaslon.nomorUrut}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-cyan-400">PASLON NOMOR {selectedPaslon.nomorUrut}</span>
                <h4 className="text-base font-bold text-white truncate font-heading">
                  {selectedPaslon.namaKetua}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  & {selectedPaslon.namaWakil}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 mb-6 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                Peringatan: Setiap siswa hanya memiliki <strong>1 kali hak suara</strong>. Pilihan yang sudah dikonfirmasi TIDAK DAPAT diubah lagi!
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-white/5 cursor-pointer"
              >
                Batal / Periksa
              </button>
              <button
                id="btn-confirm-submit-vote"
                type="button"
                onClick={handleConfirmVote}
                disabled={isSubmitting}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Mengirim...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ya, Coblos!</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Detail Modal: Visi & Misi */}
      {detailModalPaslon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl font-bold text-lg flex items-center justify-center text-slate-950"
                  style={{ backgroundColor: detailModalPaslon.warnaTema || "#06b6d4" }}
                >
                  {detailModalPaslon.nomorUrut}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-heading">
                    {detailModalPaslon.namaKetua} & {detailModalPaslon.namaWakil}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setDetailModalPaslon(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-6">
              {/* Slogan */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-center">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">
                  MOTO & SLOGAN
                </span>
                <p className="text-base font-extrabold text-white">
                  "{detailModalPaslon.slogan || "Inovasi & Dedikasi untuk SMK"}"
                </p>
              </div>

              {/* Visi */}
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-cyan-300 mb-2 font-heading">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span>VISI KEPEMIMPINAN</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 text-sm text-slate-300 leading-relaxed">
                  {detailModalPaslon.visi}
                </div>
              </div>

              {/* Misi */}
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-cyan-300 mb-2 font-heading">
                  <ListChecks className="w-4 h-4 text-cyan-400" />
                  <span>MISI STRATEGIS</span>
                </div>
                <div className="space-y-2">
                  {detailModalPaslon.misi.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-300 leading-relaxed">{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Program Unggulan */}
              {detailModalPaslon.programUnggulan && detailModalPaslon.programUnggulan.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-300 mb-2 font-heading">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>PROGRAM KERJA UNGGULAN</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detailModalPaslon.programUnggulan.map((prog, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-amber-500/10 flex items-center gap-2">
                        <span className="text-amber-400 font-bold">★</span>
                        <span className="text-xs font-medium text-slate-200">{prog}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDetailModalPaslon(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = detailModalPaslon;
                  setDetailModalPaslon(null);
                  handleOpenConfirm(target);
                }}
                className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20"
              >
                <Vote className="w-4 h-4" />
                <span>Coblos Paslon {detailModalPaslon.nomorUrut}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
