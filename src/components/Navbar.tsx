import React, { useState } from "react";
import { Vote, Users, ShieldAlert, BarChart3, Settings, Menu, X, Radio, GraduationCap, CheckCircle2 } from "lucide-react";
import { AppSettings } from "../types";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  settings: AppSettings;
  isConnected: boolean;
  isAdminLoggedIn: boolean;
  currentVoter?: { nama: string; kelas: string } | null;
  onLogoutVoter?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  isConnected,
  isAdminLoggedIn,
  currentVoter,
  onLogoutVoter
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getStatusBadge = () => {
    switch (settings.statusVoting) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Voting Dibuka
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Voting Dijeda
          </span>
        );
      case "closed":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Voting Ditutup
          </span>
        );
    }
  };

  const navItems = [
    { id: "voting", label: "Bilik Suara", icon: Vote },
    { id: "paslon", label: "Visi-Misi Paslon", icon: Users },
    { id: "rules", label: "Aturan Pemilihan", icon: ShieldAlert },
    { id: "quickcount", label: "Quick Count", icon: BarChart3 },
    { id: "admin", label: isAdminLoggedIn ? "Dashboard Admin" : "Login Admin", icon: Settings }
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & School Identity */}
          <div
            id="brand-logo-container"
            onClick={() => handleNavClick("voting")}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-cyan-500/30 shadow-lg flex items-center justify-center group-hover:border-cyan-400 transition-all">
                {settings.logoSekolahUrl ? (
                  <img
                    src={settings.logoSekolahUrl}
                    alt={settings.namaSekolah}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback icon on image error
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <GraduationCap className="w-7 h-7 text-cyan-400" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-950 flex items-center justify-center">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-cyan-400 animate-ping" : "bg-rose-500"}`}
                  title={isConnected ? "Server Utama Terhubung Real-Time" : "Koneksi Terputus"}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent font-heading">
                  {settings.namaSekolah || "SMK Lentera Bangsa 2"}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
                  E-Voting
                </span>
              </div>
              <span className="text-xs text-slate-400 line-clamp-1 font-medium">
                {settings.namaAcara} • Th. {settings.tahunAjaran}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Status & Active Voter Details */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Live Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isConnected
                  ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-300"
                  : "bg-rose-950/40 border-rose-500/30 text-rose-300"
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isConnected ? "animate-pulse text-cyan-400" : "text-rose-400"}`} />
              <span>{isConnected ? "Multi-Client Live" : "Offline"}</span>
            </div>

            {/* Voting Status */}
            {getStatusBadge()}

            {/* Current Voter Tag */}
            {currentVoter && (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-200 line-clamp-1">{currentVoter.nama}</p>
                  <p className="text-[10px] text-cyan-400 font-semibold">Pemilih Aktif</p>
                </div>
                {onLogoutVoter && (
                  <button
                    id="btn-logout-voter"
                    onClick={onLogoutVoter}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition"
                    title="Ganti Pemilih"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            {getStatusBadge()}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-slate-950/95 backdrop-blur-xl px-4 pt-2 pb-6 space-y-2">
          {currentVoter && (
            <div className="p-3 mb-2 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-cyan-400 font-semibold">Pemilih Aktif Saat Ini:</p>
                <p className="text-sm font-bold text-white">{currentVoter.nama}</p>
              </div>
              {onLogoutVoter && (
                <button
                  onClick={onLogoutVoter}
                  className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30"
                >
                  Keluar
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              {isConnected ? "Server Utama Terhubung" : "Server Terputus"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-semibold text-left transition ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
