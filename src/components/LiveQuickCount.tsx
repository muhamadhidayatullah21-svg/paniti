import React, { useState } from "react";
import {
  BarChart3,
  PieChart,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Download,
  Radio,
  Sparkles,
  Award,
  Layers,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";
import { VoteStats, Paslon } from "../types";
import { exportRecapToExcel } from "../utils/excelHelper";

interface LiveQuickCountProps {
  stats: VoteStats;
  paslonList: Paslon[];
  isConnected: boolean;
  schoolName: string;
}

export const LiveQuickCount: React.FC<LiveQuickCountProps> = ({
  stats,
  paslonList,
  isConnected,
  schoolName
}) => {
  // Determine the leading candidate
  const sortedPaslonStats = [...stats.paslonStats].sort((a, b) => b.suara - a.suara);
  const leadingPaslon = sortedPaslonStats[0];

  const handleExport = () => {
    exportRecapToExcel(paslonList, stats.totalSuaraMasuk, `Rekapitulasi_Suara_${schoolName.replace(/\s+/g, "_")}.xlsx`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header & Live Stream Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? "text-cyan-400 animate-pulse" : "text-rose-400"}`} />
            <span>{isConnected ? "Live Stream Terpusat Aktif" : "Offline / Polling Mode"}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Rekapitulasi Suara Real-Time (Quick Count)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Data suara masuk diperbarui secara otomatis dan langsung dari seluruh perangkat pemilih yang terhubung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-quickcount-excel"
            onClick={handleExport}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Unduh Rekap Excel</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total DPT */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Total DPT Terdaftar</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-heading">
            {stats.totalDPT.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Pemilih Resmi Terdata</span>
        </div>

        {/* Card 2: Suara Masuk */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Total Suara Masuk</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-heading">
            {stats.totalSuaraMasuk.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-emerald-300/80 mt-1 block">
            {stats.persentasePartisipasi}% Hak Suara Digunakan
          </span>
        </div>

        {/* Card 3: Belum Memilih */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Belum Memberikan Suara</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-heading">
            {stats.totalBelumMemilih.toLocaleString("id-ID")}
          </div>
          <span className="text-[11px] text-amber-200/80 mt-1 block">
            {stats.totalDPT > 0 ? (100 - stats.persentasePartisipasi).toFixed(1) : 0}% Belum Coblos
          </span>
        </div>

        {/* Card 4: Paslon Terunggul */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Paslon Teratas Sementara</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          {stats.totalSuaraMasuk > 0 && leadingPaslon ? (
            <div>
              <div className="text-xl sm:text-2xl font-black text-white font-heading truncate">
                No. {leadingPaslon.nomorUrut}
              </div>
              <span className="text-[11px] text-cyan-300 font-bold block truncate">
                {leadingPaslon.persentase}% ({leadingPaslon.suara} Suara)
              </span>
            </div>
          ) : (
            <div>
              <div className="text-xl font-bold text-slate-400 font-heading">-</div>
              <span className="text-[11px] text-slate-500 mt-1 block">Menunggu Suara Masuk</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar of Overall Turnout */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Tingkat Partisipasi Siswa (Turnout Rate):
          </span>
          <span className="text-cyan-400 text-sm">{stats.persentasePartisipasi}%</span>
        </div>
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-700 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, stats.persentasePartisipasi))}%` }}
          />
        </div>
      </div>

      {/* Main Graphs & Paslon Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Graph & Visual Bars */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-white/10 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <span>Perolehan Suara Pasangan Calon</span>
            </h2>
            <span className="text-xs text-cyan-400 font-semibold px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/20">
              Update Real-Time
            </span>
          </div>

          <div className="space-y-6">
            {stats.paslonStats.map((item) => {
              const color = item.warnaTema || "#06b6d4";

              return (
                <div key={item.id} className="space-y-2 p-4 rounded-2xl bg-slate-900/60 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center text-slate-950 shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {item.nomorUrut}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white font-heading">{item.nama}</h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-white font-heading">
                        {item.suara.toLocaleString("id-ID")} <span className="text-xs text-slate-400 font-normal">suara</span>
                      </span>
                      <div className="text-xs font-black text-cyan-400">
                        {item.persentase}%
                      </div>
                    </div>
                  </div>

                  {/* Progress visual bar */}
                  <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-white/10 p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(1, item.persentase)}%`,
                        backgroundColor: color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Live Vote Feed & Audit Stream */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Live Feed Suara Masuk</span>
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                REAL-TIME
              </span>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {stats.liveLogs && stats.liveLogs.length > 0 ? (
                stats.liveLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-900/70 border border-white/5 text-xs space-y-1 hover:border-cyan-500/30 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">
                        {log.pemilihInisial}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 font-semibold px-1.5 py-0.5 rounded bg-cyan-950/80">
                        Paslon {log.paslonNomor}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span className="text-emerald-400 font-semibold">Tervalidasi Digital</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono truncate">
                      Hash: {log.voteHash}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-xs text-slate-500">
                  <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                  <span>Belum ada suara masuk. Suara pemilih baru akan muncul di sini secara langsung.</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Sistem Enkripsi Transparan OSIS LB2
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
