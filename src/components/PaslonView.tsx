import React, { useState } from "react";
import {
  Users,
  Target,
  ListChecks,
  Award,
  Vote,
  Sparkles,
  Search,
  CheckCircle2,
  Share2
} from "lucide-react";
import { Paslon } from "../types";

interface PaslonViewProps {
  paslonList: Paslon[];
  onSelectPaslonToVote: (paslon: Paslon) => void;
}

export const PaslonView: React.FC<PaslonViewProps> = ({
  paslonList,
  onSelectPaslonToVote
}) => {
  const [activePaslonId, setActivePaslonId] = useState<string>(
    paslonList[0]?.id || ""
  );

  const currentPaslon = paslonList.find((p) => p.id === activePaslonId) || paslonList[0];

  if (!currentPaslon) {
    return (
      <div className="text-center py-16 text-slate-400">
        Belum ada data Pasangan Calon yang ditambahkan oleh Panitia OSIS.
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Kenali Pemimpin Pilihanmu</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
          Profil & Visi-Misi Pasangan Calon
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Cermati rekam jejak, komitmen, dan program kerja unggulan calon Ketua & Wakil Ketua OSIS SMK Lentera Bangsa 2.
        </p>
      </div>

      {/* Paslon Quick Selector Tabs */}
      <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2">
        {paslonList.map((p) => {
          const isSelected = p.id === currentPaslon.id;
          const color = p.warnaTema || "#06b6d4";

          return (
            <button
              key={p.id}
              id={`tab-paslon-${p.nomorUrut}`}
              onClick={() => setActivePaslonId(p.id)}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl transition border cursor-pointer whitespace-nowrap ${
                isSelected
                  ? "bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20 text-white"
                  : "bg-slate-950/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <span
                className="w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center text-slate-950"
                style={{ backgroundColor: color }}
              >
                {p.nomorUrut}
              </span>
              <div className="text-left">
                <span className="text-xs font-bold block">
                  Paslon {p.nomorUrut}
                </span>
                <span className="text-[11px] text-slate-400 block max-w-[130px] truncate">
                  {p.namaKetua}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Candidate Showcase */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Photo & Slogan */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-xl group">
              <div className="absolute top-4 left-4 z-10">
                <span
                  className="px-4 py-1.5 rounded-xl font-black text-sm text-slate-950 shadow-lg"
                  style={{ backgroundColor: currentPaslon.warnaTema || "#06b6d4" }}
                >
                  NOMOR URUT {currentPaslon.nomorUrut}
                </span>
              </div>

              <div className="w-full h-96 sm:h-[420px] overflow-hidden">
                <img
                  src={currentPaslon.fotoUrl}
                  alt={`Paslon ${currentPaslon.nomorUrut}`}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80";
                  }}
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-xs font-black uppercase tracking-wider text-cyan-300 drop-shadow">
                  "{currentPaslon.slogan || "Maju Bersama SMK Lentera Bangsa 2"}"
                </p>
              </div>
            </div>

            <button
              id={`btn-pilih-direct-${currentPaslon.nomorUrut}`}
              onClick={() => onSelectPaslonToVote(currentPaslon)}
              className="w-full py-4 px-6 rounded-2xl font-black text-slate-950 text-base tracking-wide flex items-center justify-center gap-2 shadow-xl hover:opacity-95 transition cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${currentPaslon.warnaTema || "#06b6d4"}, #ffffff)`
              }}
            >
              <Vote className="w-5 h-5 text-slate-950" />
              <span>COBLOS PASLON {currentPaslon.nomorUrut} SEKARANG</span>
            </button>
          </div>

          {/* Right Column: Names, Visi, Misi & Proker */}
          <div className="lg:col-span-7 space-y-6">
            {/* Header Names */}
            <div className="border-b border-white/10 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                    Calon Ketua OSIS
                  </span>
                  <h2 className="text-xl font-bold text-white font-heading">{currentPaslon.namaKetua}</h2>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                    Calon Wakil Ketua OSIS
                  </span>
                  <h2 className="text-xl font-bold text-white font-heading">{currentPaslon.namaWakil}</h2>
                </div>
              </div>
            </div>

            {/* Visi */}
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-400 mb-2 font-heading">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>VISI UTAMA</span>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/20 text-sm text-slate-200 leading-relaxed">
                {currentPaslon.visi}
              </div>
            </div>

            {/* Misi */}
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-400 mb-2 font-heading">
                <ListChecks className="w-4 h-4 text-cyan-400" />
                <span>MISI KERJA</span>
              </div>
              <div className="space-y-2.5">
                {currentPaslon.misi.map((item, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-3 text-xs sm:text-sm text-slate-300"
                  >
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Program Unggulan */}
            {currentPaslon.programUnggulan && currentPaslon.programUnggulan.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-amber-400 mb-2 font-heading">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>PROGRAM KERJA UNGGULAN</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentPaslon.programUnggulan.map((prog, index) => (
                    <div
                      key={index}
                      className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/20 flex items-start gap-2.5"
                    >
                      <span className="text-amber-400 font-bold mt-0.5">★</span>
                      <span className="text-xs sm:text-sm font-medium text-slate-200">{prog}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
