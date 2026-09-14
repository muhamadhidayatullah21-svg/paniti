import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { VoterLogin } from "./components/VoterLogin";
import { VotingBooth } from "./components/VotingBooth";
import { PaslonView } from "./components/PaslonView";
import { RulesPage } from "./components/RulesPage";
import { LiveQuickCount } from "./components/LiveQuickCount";
import { AdminPanel } from "./components/AdminPanel";
import { AppSettings, Paslon, VoteStats, Voter } from "./types";
import { ShieldCheck, Sparkles, Heart, Radio } from "lucide-react";

const INITIAL_SETTINGS: AppSettings = {
  namaSekolah: "SMK Lentera Bangsa 2",
  namaAcara: "Pemilihan Ketua & Wakil Ketua OSIS",
  tahunAjaran: "2026/2027",
  statusVoting: "active",
  logoSekolahUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=300&auto=format&fit=crop&q=80",
  allowAutoRegisterDPT: true,
  pengumuman: "Selamat datang di E-Voting OSIS SMK Lentera Bangsa 2!"
};

const INITIAL_STATS: VoteStats = {
  totalDPT: 0,
  totalSuaraMasuk: 0,
  totalBelumMemilih: 0,
  persentasePartisipasi: 0,
  paslonStats: [],
  suaraPerKelas: [],
  liveLogs: []
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("voting");
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [paslonList, setPaslonList] = useState<Paslon[]>([]);
  const [stats, setStats] = useState<VoteStats>(INITIAL_STATS);
  const [sampleDpt, setSampleDpt] = useState<Voter[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [currentVoter, setCurrentVoter] = useState<{ nama: string; kelas: string } | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return sessionStorage.getItem("lb2_admin_token");
  });
  const [liveToast, setLiveToast] = useState<{ id: number; message: string } | null>(null);

  // Fetch initial state from server
  const fetchInitialData = useCallback(async () => {
    try {
      const res = await fetch("/api/init");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.paslon) setPaslonList(data.paslon);
        if (data.stats) setStats(data.stats);
        setIsConnected(true);
      }

      // Also get small sample DPT for voter quick helper
      const dptRes = await fetch("/api/admin/dpt", {
        headers: { "x-admin-token": "admin-session-active" }
      });
      if (dptRes.ok) {
        const dptData = await dptRes.json();
        if (dptData.data) setSampleDpt(dptData.data.slice(0, 10));
      }
    } catch (err) {
      console.warn("Could not load initial data:", err);
      setIsConnected(false);
    }
  }, []);

  // SSE Real-time Multi-Client Stream Listener
  useEffect(() => {
    fetchInitialData();

    // Setup Server-Sent Events (SSE) stream
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource("/api/stream");

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.addEventListener("vote_cast", (event: MessageEvent) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.data.stats) setStats(parsed.data.stats);
            if (parsed.data.paslon) setPaslonList(parsed.data.paslon);

            // Trigger live toast
            if (parsed.data.voteLog) {
              setLiveToast({
                id: Date.now(),
                message: `Suara baru berhasil masuk dari ${parsed.data.voteLog.pemilihInisial}!`
              });
              setTimeout(() => setLiveToast(null), 4500);
            }
          } catch (e) {
            console.error("Error parsing vote_cast event:", e);
          }
        });

        eventSource.addEventListener("settings_updated", (event: MessageEvent) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.data) setSettings(parsed.data);
          } catch (e) {
            console.error("Error parsing settings_updated event:", e);
          }
        });

        eventSource.addEventListener("paslon_updated", (event: MessageEvent) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.data.paslon) setPaslonList(parsed.data.paslon);
            if (parsed.data.stats) setStats(parsed.data.stats);
          } catch (e) {
            console.error("Error parsing paslon_updated event:", e);
          }
        });

        eventSource.addEventListener("dpt_updated", (event: MessageEvent) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.data) setStats(parsed.data);
          } catch (e) {
            console.error("Error parsing dpt_updated event:", e);
          }
        });

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          // Retry connection after 4 seconds
          setTimeout(connectSSE, 4000);
        };
      } catch (err) {
        setIsConnected(false);
        setTimeout(connectSSE, 5000);
      }
    };

    connectSSE();

    // Background polling fallback every 8 seconds
    const interval = setInterval(fetchInitialData, 8000);

    return () => {
      eventSource?.close();
      clearInterval(interval);
    };
  }, [fetchInitialData]);

  // Admin login / logout
  const handleAdminLogin = (token: string) => {
    sessionStorage.setItem("lb2_admin_token", token);
    setAdminToken(token);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("lb2_admin_token");
    setAdminToken(null);
  };

  // Voter flow
  const handleVoterLoginSuccess = (voter: { nama: string; kelas: string }) => {
    setCurrentVoter(voter);
    setActiveTab("booth");
  };

  const handleLogoutVoter = () => {
    setCurrentVoter(null);
    setActiveTab("voting");
  };

  const handleVoteSuccess = () => {
    // Keep receipt visible, update sample DPT
    fetchInitialData();
  };

  const handleSelectPaslonFromView = (_paslon: Paslon) => {
    if (currentVoter) {
      setActiveTab("booth");
    } else {
      setActiveTab("voting");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white relative">
      {/* Background Subtle Gradient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab === "booth" ? "voting" : activeTab}
        setActiveTab={(tab) => {
          if (tab === "voting" && currentVoter) {
            setActiveTab("booth");
          } else {
            setActiveTab(tab);
          }
        }}
        settings={settings}
        isConnected={isConnected}
        isAdminLoggedIn={!!adminToken}
        currentVoter={currentVoter}
        onLogoutVoter={handleLogoutVoter}
      />

      {/* Live Activity Toast */}
      {liveToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="glass-panel py-3 px-4 rounded-2xl border border-cyan-500/40 text-xs font-semibold text-white shadow-2xl flex items-center gap-3 bg-slate-900/90">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{liveToast.message}</span>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Voting Tab: Login or Booth */}
        {activeTab === "voting" && (
          <VoterLogin
            onLoginSuccess={handleVoterLoginSuccess}
            settings={settings}
            sampleVoters={sampleDpt}
          />
        )}

        {/* Voting Booth (When Voter is Authenticated) */}
        {activeTab === "booth" && (
          currentVoter ? (
            <VotingBooth
              voter={currentVoter}
              paslonList={paslonList}
              onVoteSuccess={handleVoteSuccess}
              onBackToLogin={handleLogoutVoter}
              onViewQuickCount={() => setActiveTab("quickcount")}
            />
          ) : (
            <VoterLogin
              onLoginSuccess={handleVoterLoginSuccess}
              settings={settings}
              sampleVoters={sampleDpt}
            />
          )
        )}

        {/* Paslon Showcase & Vision-Mission */}
        {activeTab === "paslon" && (
          <PaslonView
            paslonList={paslonList}
            onSelectPaslonToVote={handleSelectPaslonFromView}
          />
        )}

        {/* Rules & Guidelines */}
        {activeTab === "rules" && (
          <RulesPage
            onGoToVoting={() => setActiveTab("voting")}
            schoolName={settings.namaSekolah}
          />
        )}

        {/* Live Quick Count */}
        {activeTab === "quickcount" && (
          <LiveQuickCount
            stats={stats}
            paslonList={paslonList}
            isConnected={isConnected}
            schoolName={settings.namaSekolah}
          />
        )}

        {/* Admin Management Panel */}
        {activeTab === "admin" && (
          <AdminPanel
            isAdminLoggedIn={!!adminToken}
            onLogin={handleAdminLogin}
            onLogout={handleAdminLogout}
            settings={settings}
            paslonList={paslonList}
            stats={stats}
            onRefreshData={fetchInitialData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/90 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 font-heading">
              {settings.namaSekolah}
            </span>
            <span>•</span>
            <span>Panitia KPU OSIS Periode {settings.tahunAjaran}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Sistem Suara Terpusat & Terenkripsi
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Real-Time Multi-Client
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
