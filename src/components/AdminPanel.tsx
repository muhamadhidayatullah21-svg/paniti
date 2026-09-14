import React, { useState, useRef } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Users,
  Vote,
  FileSpreadsheet,
  Settings as SettingsIcon,
  Trash2,
  Plus,
  Edit2,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  ShieldCheck,
  Search,
  KeyRound,
  FileText,
  Database,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { AppSettings, Paslon, Voter, VoteStats, VoteLog, SupabaseSyncStatus } from "../types";
import { parseVoterFile, downloadVoterTemplate, exportDptToExcel, exportRecapToExcel } from "../utils/excelHelper";

interface AdminPanelProps {
  isAdminLoggedIn: boolean;
  onLogin: (token: string) => void;
  onLogout: () => void;
  settings: AppSettings;
  paslonList: Paslon[];
  stats: VoteStats;
  onRefreshData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isAdminLoggedIn,
  onLogin,
  onLogout,
  settings,
  paslonList,
  stats,
  onRefreshData
}) => {
  // Login State
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Admin Sub-Tab
  const [adminTab, setAdminTab] = useState<"dashboard" | "paslon" | "dpt" | "votes" | "settings" | "supabase">("dashboard");

  // Supabase Cloud State
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseSyncStatus | null>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseSql, setSupabaseSql] = useState("");
  const [copiedSql, setCopiedSql] = useState(false);
  const [supabaseSyncing, setSupabaseSyncing] = useState(false);
  const [supabaseResultMsg, setSupabaseResultMsg] = useState("");

  // Paslon Modal State
  const [paslonModalOpen, setPaslonModalOpen] = useState(false);
  const [editingPaslon, setEditingPaslon] = useState<Paslon | null>(null);
  const [paslonForm, setPaslonForm] = useState({
    nomorUrut: "",
    namaKetua: "",
    namaWakil: "",
    kelasKetua: "",
    kelasWakil: "",
    fotoUrl: "",
    slogan: "",
    visi: "",
    misiText: "",
    prokerText: "",
    warnaTema: "#06b6d4"
  });

  // DPT State
  const [dptList, setDptList] = useState<Voter[]>([]);
  const [dptLoading, setDptLoading] = useState(false);
  const [dptSearch, setDptSearch] = useState("");
  const [dptFilterStatus, setDptFilterStatus] = useState("all");
  const [voterModalOpen, setVoterModalOpen] = useState(false);
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [voterForm, setVoterForm] = useState({ nisn: "", nama: "", kelas: "" });

  // Excel Import State
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [importParsedData, setImportParsedData] = useState<any[]>([]);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Mass Delete Security Modal State
  const [massDeleteModal, setMassDeleteModal] = useState<{
    type: "paslon" | "dpt" | "votes" | "defaults" | null;
    title: string;
    expectedText: string;
    description: string;
  }>({
    type: null,
    title: "",
    expectedText: "",
    description: ""
  });
  const [massDeleteInput, setMassDeleteInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<AppSettings>({ ...settings });
  const [adminPasswordForm, setAdminPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });

  // Load DPT on demand
  const fetchDPT = async () => {
    setDptLoading(true);
    try {
      const res = await fetch(`/api/admin/dpt?search=${encodeURIComponent(dptSearch)}&status=${dptFilterStatus}`, {
        headers: { "x-admin-token": "admin-session-active" }
      });
      const data = await res.json();
      if (res.ok) {
        setDptList(data.data || []);
      }
    } catch (err) {
      console.error("Error loading DPT:", err);
    } finally {
      setDptLoading(false);
    }
  };

  // -------------------------------------------------------------
  // LOGIN SUBMIT
  // -------------------------------------------------------------
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Password salah!");
      }

      onLogin(data.token);
      setPasswordInput("");
    } catch (err: any) {
      setLoginError(err.message || "Gagal masuk ke sistem admin.");
    } finally {
      setLoginLoading(false);
    }
  };

  // -------------------------------------------------------------
  // PASLON ACTIONS
  // -------------------------------------------------------------
  const handleOpenAddPaslon = () => {
    setEditingPaslon(null);
    setPaslonForm({
      nomorUrut: String(paslonList.length + 1).padStart(2, "0"),
      namaKetua: "",
      namaWakil: "",
      kelasKetua: "",
      kelasWakil: "",
      fotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
      slogan: "",
      visi: "",
      misiText: "",
      prokerText: "",
      warnaTema: "#06b6d4"
    });
    setPaslonModalOpen(true);
  };

  const handleOpenEditPaslon = (p: Paslon) => {
    setEditingPaslon(p);
    setPaslonForm({
      nomorUrut: p.nomorUrut,
      namaKetua: p.namaKetua,
      namaWakil: p.namaWakil,
      kelasKetua: p.kelasKetua,
      kelasWakil: p.kelasWakil,
      fotoUrl: p.fotoUrl,
      slogan: p.slogan,
      visi: p.visi,
      misiText: p.misi.join("\n"),
      prokerText: p.programUnggulan ? p.programUnggulan.join("\n") : "",
      warnaTema: p.warnaTema || "#06b6d4"
    });
    setPaslonModalOpen(true);
  };

  const handleSavePaslon = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    const payload = {
      nomorUrut: paslonForm.nomorUrut,
      namaKetua: paslonForm.namaKetua,
      namaWakil: paslonForm.namaWakil,
      kelasKetua: paslonForm.kelasKetua,
      kelasWakil: paslonForm.kelasWakil,
      fotoUrl: paslonForm.fotoUrl,
      slogan: paslonForm.slogan,
      visi: paslonForm.visi,
      misi: paslonForm.misiText.split("\n").map((m) => m.trim()).filter(Boolean),
      programUnggulan: paslonForm.prokerText.split("\n").map((p) => p.trim()).filter(Boolean),
      warnaTema: paslonForm.warnaTema
    };

    try {
      const url = editingPaslon ? `/api/admin/paslon/${editingPaslon.id}` : "/api/admin/paslon";
      const method = editingPaslon ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": "admin-session-active"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Gagal menyimpan Paslon.");
      }

      setPaslonModalOpen(false);
      onRefreshData();
      setActionMessage({ type: "success", text: "Data Paslon berhasil disimpan!" });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePaslon = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data Paslon ini?")) return;
    try {
      const res = await fetch(`/api/admin/paslon/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": "admin-session-active" }
      });
      if (res.ok) {
        onRefreshData();
        setActionMessage({ type: "success", text: "Paslon berhasil dihapus." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  // -------------------------------------------------------------
  // DPT ACTIONS
  // -------------------------------------------------------------
  const handleSaveVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = editingVoter ? `/api/admin/dpt/${editingVoter.id}` : "/api/admin/dpt";
      const method = editingVoter ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": "admin-session-active"
        },
        body: JSON.stringify(voterForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan pemilih.");

      setVoterModalOpen(false);
      fetchDPT();
      onRefreshData();
      setActionMessage({ type: "success", text: "Data pemilih berhasil disimpan!" });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVoter = async (id: string) => {
    if (!window.confirm("Hapus pemilih ini dari DPT?")) return;
    try {
      const res = await fetch(`/api/admin/dpt/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": "admin-session-active" }
      });
      if (res.ok) {
        fetchDPT();
        onRefreshData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // -------------------------------------------------------------
  // EXCEL IMPORT ACTIONS
  // -------------------------------------------------------------
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseVoterFile(file);
      if (parsed.length === 0) {
        alert("Tidak ada baris data pemilih yang valid dalam file ini. Periksa format header (Nama, Kelas, NISN).");
        return;
      }
      setImportParsedData(parsed);
      setExcelModalOpen(true);
    } catch (err: any) {
      alert("Gagal membaca file Excel/CSV: " + err.message);
    }
  };

  const handleConfirmImportExcel = async () => {
    if (importParsedData.length === 0) return;
    setImportLoading(true);

    try {
      const res = await fetch("/api/admin/dpt/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": "admin-session-active"
        },
        body: JSON.stringify({
          voters: importParsedData,
          mode: importMode
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengimpor data.");

      setImportSuccessMsg(data.message);
      setImportParsedData([]);
      setTimeout(() => {
        setExcelModalOpen(false);
        setImportSuccessMsg("");
      }, 1500);

      fetchDPT();
      onRefreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  // -------------------------------------------------------------
  // MASS DELETE (BULK RESET) ACTIONS WITH DOUBLE CONFIRMATION
  // -------------------------------------------------------------
  const triggerMassDeleteConfirm = (type: "paslon" | "dpt" | "votes" | "defaults") => {
    setMassDeleteInput("");
    if (type === "paslon") {
      setMassDeleteModal({
        type: "paslon",
        title: "HAPUS SEMUA DATA PASLON",
        expectedText: "HAPUS SEMUA",
        description: "Seluruh Paslon beserta visi, misi, dan perolehan suara akan dihapus permanen dari server utama."
      });
    } else if (type === "dpt") {
      setMassDeleteModal({
        type: "dpt",
        title: "HAPUS SEMUA DPT (DATA PEMILIH)",
        expectedText: "HAPUS SEMUA",
        description: "Seluruh daftar pemilih tetap akan dikosongkan. Gunakan jika ingin mengunggah file DPT baru dari awal."
      });
    } else if (type === "votes") {
      setMassDeleteModal({
        type: "votes",
        title: "RESET / HAPUS SEMUA SUARA MASUK",
        expectedText: "HAPUS SEMUA SUARA",
        description: "Semua suara masuk akan dinolkan kembali, dan seluruh pemilih yang sudah memilih akan di-reset menjadi belum memilih."
      });
    } else if (type === "defaults") {
      setMassDeleteModal({
        type: "defaults",
        title: "RESET KE DEFAULT DATA SMK LENTERA BANGSA 2",
        expectedText: "RESET DEFAULT",
        description: "Aplikasi akan memuat ulang 3 Paslon resmi contoh, DPT sampel, dan pengaturan bawaan sekolah."
      });
    }
  };

  const executeMassDelete = async () => {
    if (massDeleteInput !== massDeleteModal.expectedText) {
      alert(`Teks konfirmasi salah. Harap ketik "${massDeleteModal.expectedText}" secara tepat.`);
      return;
    }

    setActionLoading(true);
    try {
      let endpoint = "";
      if (massDeleteModal.type === "paslon") endpoint = "/api/admin/paslon/bulk-delete";
      if (massDeleteModal.type === "dpt") endpoint = "/api/admin/dpt/bulk-delete";
      if (massDeleteModal.type === "votes") endpoint = "/api/admin/votes/bulk-delete";
      if (massDeleteModal.type === "defaults") endpoint = "/api/admin/reset-defaults";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": "admin-session-active"
        },
        body: JSON.stringify({ confirmationText: massDeleteInput })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal melakukan aksi massal.");

      setMassDeleteModal({ type: null, title: "", expectedText: "", description: "" });
      setActionMessage({ type: "success", text: data.message });
      onRefreshData();
      if (massDeleteModal.type === "dpt") fetchDPT();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // SETTINGS ACTIONS & LOGO UPLOAD
  // -------------------------------------------------------------
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file logo maksimal 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSettingsForm((prev) => ({ ...prev, logoSekolahUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": "admin-session-active"
        },
        body: JSON.stringify(settingsForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui pengaturan.");

      setActionMessage({ type: "success", text: "Pengaturan identitas sekolah & aplikasi berhasil disimpan!" });
      onRefreshData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordForm.newPassword !== adminPasswordForm.confirmPassword) {
      alert("Konfirmasi password baru tidak cocok!");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": "admin-session-active"
        },
        body: JSON.stringify({
          oldPassword: adminPasswordForm.oldPassword,
          newPassword: adminPasswordForm.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah password.");

      alert("Password Admin berhasil diperbarui! Silakan simpan password baru Anda.");
      setAdminPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // SUPABASE CLOUD SYNC HANDLERS
  // -------------------------------------------------------------
  const fetchSupabaseStatus = async () => {
    setSupabaseLoading(true);
    setSupabaseResultMsg("");
    try {
      const [statusRes, sqlRes] = await Promise.all([
        fetch("/api/supabase/status"),
        fetch("/api/supabase/sql")
      ]);
      const statusData = await statusRes.json();
      const sqlData = await sqlRes.json();
      setSupabaseStatus(statusData);
      if (sqlData && sqlData.sql) setSupabaseSql(sqlData.sql);
    } catch (err: any) {
      console.error("Error fetching Supabase info:", err);
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handlePushSupabase = async () => {
    setSupabaseSyncing(true);
    setSupabaseResultMsg("");
    try {
      const res = await fetch("/api/supabase/push", {
        method: "POST",
        headers: { "x-admin-token": "admin-session-active" }
      });
      const data = await res.json();
      setSupabaseResultMsg(data.message || (data.success ? "Berhasil mengunggah data ke Supabase!" : "Gagal mengunggah data."));
      await fetchSupabaseStatus();
    } catch (err: any) {
      setSupabaseResultMsg("Terjadi kesalahan: " + (err.message || String(err)));
    } finally {
      setSupabaseSyncing(false);
    }
  };

  const handlePullSupabase = async () => {
    setSupabaseSyncing(true);
    setSupabaseResultMsg("");
    try {
      const res = await fetch("/api/supabase/pull", {
        method: "POST",
        headers: { "x-admin-token": "admin-session-active" }
      });
      const data = await res.json();
      setSupabaseResultMsg(data.message || (data.success ? "Berhasil menarik data dari Supabase!" : "Gagal menarik data."));
      if (data.success) {
        onRefreshData();
      }
      await fetchSupabaseStatus();
    } catch (err: any) {
      setSupabaseResultMsg("Terjadi kesalahan: " + (err.message || String(err)));
    } finally {
      setSupabaseSyncing(false);
    }
  };

  const handleCopySql = () => {
    if (!supabaseSql) return;
    navigator.clipboard.writeText(supabaseSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // =============================================================
  // RENDER: LOGIN FORM (If not logged in)
  // CRITICAL REQUIREMENT: Password input MUST be type="password"
  // =============================================================
  if (!isAdminLoggedIn) {
    return (
      <div className="w-full max-w-md mx-auto py-8">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-white text-center font-heading">
            Masuk Panel Admin OSIS
          </h2>
          <p className="text-slate-400 text-xs text-center mt-1">
            Area terbatas untuk Panitia Pemilihan & Pengawas E-Voting SMK Lentera Bangsa 2.
          </p>

          {loginError && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi Admin <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                {/* 
                  STRICT SECURITY ENFORCEMENT:
                  Input uses type="password" by default so characters are hidden while typing.
                */}
                <input
                  id="admin-password-input"
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi admin..."
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm font-medium tracking-wider"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-admin-login-submit"
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50 transition"
            >
              <Lock className="w-4 h-4" />
              <span>{loginLoading ? "Memverifikasi..." : "Buka Panel Admin"}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =============================================================
  // RENDER: ADMIN DASHBOARD (Logged In)
  // =============================================================
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Admin Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel rounded-3xl p-5 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white font-heading">
                Pusat Kendali Admin E-Voting
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Terautentikasi
              </span>
            </div>
            <p className="text-xs text-slate-400">
              SMK Lentera Bangsa 2 • Server Utama Terpusat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onRefreshData}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white"
            title="Muat Ulang Data Server"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            id="btn-admin-logout"
            onClick={onLogout}
            className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Admin</span>
          </button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {actionMessage.text && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage({ type: "", text: "" })} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Admin Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 text-xs font-bold">
        {[
          { id: "dashboard", label: "Dashboard Rekapitulasi", icon: Vote },
          { id: "paslon", label: `Manajemen Paslon (${paslonList.length})`, icon: Users },
          { id: "dpt", label: `Data Pemilih / DPT (${stats.totalDPT})`, icon: FileSpreadsheet },
          { id: "votes", label: `Log Suara (${stats.totalSuaraMasuk})`, icon: FileText },
          { id: "settings", label: "Pengaturan & Identitas", icon: SettingsIcon },
          { id: "supabase", label: "Supabase Cloud", icon: Database }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-admin-${tab.id}`}
              onClick={() => {
                setAdminTab(tab.id as any);
                if (tab.id === "dpt") fetchDPT();
                if (tab.id === "supabase") fetchSupabaseStatus();
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =======================================================
          TAB 1: DASHBOARD REKAPITULASI (Quick Summary)
      ======================================================= */}
      {adminTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-5 border border-white/10">
              <span className="text-xs text-slate-400 font-semibold block mb-1">Total DPT</span>
              <span className="text-3xl font-black text-white font-heading">{stats.totalDPT}</span>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-white/10">
              <span className="text-xs text-emerald-400 font-semibold block mb-1">Suara Masuk</span>
              <span className="text-3xl font-black text-emerald-400 font-heading">{stats.totalSuaraMasuk}</span>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-white/10">
              <span className="text-xs text-amber-400 font-semibold block mb-1">Belum Memilih</span>
              <span className="text-3xl font-black text-amber-300 font-heading">{stats.totalBelumMemilih}</span>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-white/10">
              <span className="text-xs text-cyan-400 font-semibold block mb-1">Tingkat Partisipasi</span>
              <span className="text-3xl font-black text-cyan-400 font-heading">{stats.persentasePartisipasi}%</span>
            </div>
          </div>

          {/* Perolehan Suara Paslon Cards */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white font-heading">
                Perolehan Suara Per Paslon (Real-Time Server)
              </h2>
              <button
                onClick={() => exportRecapToExcel(paslonList, stats.totalSuaraMasuk, "Rekap_Suara_Admin.xlsx")}
                className="py-1.5 px-3 rounded-lg bg-slate-800 text-xs text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Rekap Excel</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.paslonStats.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className="w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center text-slate-950"
                      style={{ backgroundColor: p.warnaTema || "#06b6d4" }}
                    >
                      {p.nomorUrut}
                    </span>
                    <span className="text-xl font-black text-white font-heading">{p.suara} Suara</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white truncate">{p.nama}</h3>
                    <span className="text-xs text-cyan-400 font-bold">{p.persentase}% perolehan</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${p.persentase}%`, backgroundColor: p.warnaTema || "#06b6d4" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Butuh membersihkan data suara sebelum pemilu dimulai?
            </div>
            <button
              onClick={() => triggerMassDeleteConfirm("votes")}
              className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset / Hapus Semua Suara Masuk</span>
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 2: MANAJEMEN PASLON (CRUD + MASS DELETE)
      ======================================================= */}
      {adminTab === "paslon" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white font-heading">
                Manajemen Pasangan Calon (Paslon)
              </h2>
              <p className="text-xs text-slate-400">
                Tambah, perbarui profil, visi, misi, program kerja, serta foto resmi Paslon.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-add-paslon"
                onClick={handleOpenAddPaslon}
                className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Paslon Baru</span>
              </button>
              <button
                id="btn-bulk-delete-paslon"
                onClick={() => triggerMassDeleteConfirm("paslon")}
                className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Semua Paslon</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paslonList.map((p) => (
              <div
                key={p.id}
                className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className="w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center text-slate-950 shadow"
                      style={{ backgroundColor: p.warnaTema || "#06b6d4" }}
                    >
                      {p.nomorUrut}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-xs font-bold text-cyan-300 border border-white/10">
                      {p.suara} Suara Terkumpul
                    </span>
                  </div>

                  <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-900 border border-white/5 mb-3">
                    <img
                      src={p.fotoUrl}
                      alt={p.namaKetua}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <h3 className="text-base font-bold text-white font-heading">
                    {p.namaKetua} & {p.namaWakil}
                  </h3>
                  <p className="text-xs text-cyan-400 italic mt-1 line-clamp-1">
                    "{p.slogan}"
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => handleOpenEditPaslon(p)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Edit Profil</span>
                  </button>
                  <button
                    onClick={() => handleDeletePaslon(p.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer"
                    title="Hapus Paslon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 3: MANAJEMEN DPT (CRUD + EXCEL IMPORT + MASS DELETE)
      ======================================================= */}
      {adminTab === "dpt" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white font-heading">
                Daftar Pemilih Tetap (DPT)
              </h2>
              <p className="text-xs text-slate-400">
                Kelola data pemilih sah SMK Lentera Bangsa 2, import Excel massal, dan reset data.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <button
                id="btn-import-excel-dpt"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import Excel / CSV</span>
              </button>
              <button
                onClick={downloadVoterTemplate}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-white/10 cursor-pointer"
                title="Unduh Format Excel"
              >
                <Download className="w-4 h-4" />
                <span>Format Excel</span>
              </button>
              <button
                id="btn-add-voter-manual"
                onClick={() => {
                  setEditingVoter(null);
                  setVoterForm({ nisn: "", nama: "", kelas: "" });
                  setVoterModalOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Manual</span>
              </button>
              <button
                id="btn-bulk-delete-dpt"
                onClick={() => triggerMassDeleteConfirm("dpt")}
                className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Semua DPT</span>
              </button>
            </div>
          </div>

          {/* Search & Filter bar */}
          <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={dptSearch}
                onChange={(e) => setDptSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchDPT()}
                placeholder="Cari berdasarkan nama atau NISN..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={dptFilterStatus}
                onChange={(e) => setDptFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="all">Semua Status</option>
                <option value="voted">Sudah Memilih</option>
                <option value="not_voted">Belum Memilih</option>
              </select>

              <button
                onClick={fetchDPT}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Filter
              </button>

              <button
                onClick={() => exportDptToExcel(dptList)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1 border border-white/10"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* DPT Table */}
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="p-3.5 pl-4">No</th>
                    <th className="p-3.5">NISN / NIS</th>
                    <th className="p-3.5">Nama Lengkap</th>
                    <th className="p-3.5">Kelas</th>
                    <th className="p-3.5">Status Memilih</th>
                    <th className="p-3.5 text-right pr-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dptLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Memuat data pemilih...
                      </td>
                    </tr>
                  ) : dptList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Tidak ada pemilih ditemukan. Klik "Import Excel" atau "Tambah Manual" untuk mengisi data.
                      </td>
                    </tr>
                  ) : (
                    dptList.map((voter, idx) => (
                      <tr key={voter.id} className="hover:bg-white/5 transition">
                        <td className="p-3.5 pl-4 font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-3.5 font-mono text-slate-400">{voter.nisn}</td>
                        <td className="p-3.5 font-semibold text-white">{voter.nama}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-[11px] text-slate-300">
                            {voter.kelas}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {voter.hasVoted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Sudah Coblos
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              Belum Memilih
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right pr-4 space-x-2">
                          <button
                            onClick={() => {
                              setEditingVoter(voter);
                              setVoterForm({ nisn: voter.nisn, nama: voter.nama, kelas: voter.kelas });
                              setVoterModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVoter(voter.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 4: AUDIT LOG SUARA (LIVE AUDIT TRAIL)
      ======================================================= */}
      {adminTab === "votes" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white font-heading">
                Log Audit Rekapitulasi Suara
              </h2>
              <p className="text-xs text-slate-400">
                Riwayat suara masuk dengan kode hash kriptografis untuk menjaga keaslian & anonimitas pemilih.
              </p>
            </div>
            <button
              onClick={() => triggerMassDeleteConfirm("votes")}
              className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Semua Log Suara (Reset Suara)</span>
            </button>
          </div>

          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="p-3.5 pl-4">No</th>
                    <th className="p-3.5">Kode Hash Digital</th>
                    <th className="p-3.5">Inisial Pemilih</th>
                    <th className="p-3.5">Kelas</th>
                    <th className="p-3.5">Pilihan Paslon</th>
                    <th className="p-3.5">Waktu Masuk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats.liveLogs && stats.liveLogs.length > 0 ? (
                    stats.liveLogs.map((vote, idx) => (
                      <tr key={vote.id} className="hover:bg-white/5">
                        <td className="p-3.5 pl-4 font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-3.5 font-mono text-cyan-400 font-bold">{vote.voteHash}</td>
                        <td className="p-3.5 font-semibold text-white">{vote.pemilihInisial}</td>
                        <td className="p-3.5">{vote.kelas}</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-950 text-cyan-300 border border-cyan-800">
                            Paslon {vote.paslonNomor}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">
                          {new Date(vote.timestamp).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Belum ada suara yang masuk.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 5: PENGATURAN IDENTITAS SEKOLAH & APLIKASI
      ======================================================= */}
      {adminTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Identitas Sekolah & Acara */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-6">
            <h2 className="text-base font-bold text-white font-heading flex items-center gap-2 border-b border-white/10 pb-3">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              <span>Identitas Sekolah & Pengaturan Aplikasi</span>
            </h2>

            {/* School Logo Customization */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Photo Logo Sekolah (SMK Lentera Bangsa 2)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border border-cyan-500/30 shrink-0 shadow-lg">
                  {settingsForm.logoSekolahUrl ? (
                    <img
                      src={settingsForm.logoSekolahUrl}
                      alt="Logo Sekolah"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                      No Logo
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah Foto Logo Baru</span>
                    </button>
                    {settingsForm.logoSekolahUrl && (
                      <button
                        type="button"
                        onClick={() => setSettingsForm((prev) => ({ ...prev, logoSekolahUrl: "" }))}
                        className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs"
                        title="Hapus Logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Logo akan otomatis tampil di Header & Navbar di semua perangkat pemilih secara real-time.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Sekolah
                </label>
                <input
                  type="text"
                  value={settingsForm.namaSekolah}
                  onChange={(e) => setSettingsForm({ ...settingsForm, namaSekolah: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Acara Pemilihan
                </label>
                <input
                  type="text"
                  value={settingsForm.namaAcara}
                  onChange={(e) => setSettingsForm({ ...settingsForm, namaAcara: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  value={settingsForm.tahunAjaran}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tahunAjaran: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Status Pemungutan Suara
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "active", label: "Buka (Aktif)", color: "text-emerald-400" },
                    { val: "paused", label: "Jeda", color: "text-amber-400" },
                    { val: "closed", label: "Tutup (Selesai)", color: "text-rose-400" }
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, statusVoting: s.val as any })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                        settingsForm.statusVoting === s.val
                          ? "bg-slate-800 border-cyan-400 text-white shadow"
                          : "bg-slate-900/50 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pengumuman / Catatan Panitia
                </label>
                <textarea
                  value={settingsForm.pengumuman}
                  onChange={(e) => setSettingsForm({ ...settingsForm, pengumuman: e.target.value })}
                  rows={2}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs cursor-pointer shadow"
              >
                Simpan Perubahan Pengaturan
              </button>
            </form>
          </div>

          {/* Keamanan & Reset Data */}
          <div className="space-y-6">
            {/* Ganti Password Admin */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
              <h2 className="text-base font-bold text-white font-heading flex items-center gap-2 border-b border-white/10 pb-3">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                <span>Ubah Kata Sandi Admin</span>
              </h2>

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Password Lama</label>
                  <input
                    type="password"
                    value={adminPasswordForm.oldPassword}
                    onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, oldPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Password Baru (Minimal 6 Karakter)</label>
                  <input
                    type="password"
                    value={adminPasswordForm.newPassword}
                    onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    value={adminPasswordForm.confirmPassword}
                    onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold cursor-pointer"
                >
                  Perbarui Password
                </button>
              </form>
            </div>

            {/* Reset Defaults Helper */}
            <div className="glass-panel rounded-3xl p-6 border border-amber-500/20 bg-amber-500/5 space-y-3">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>Reset Database ke Data Bawaan</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingin kembali ke data awal demo SMK Lentera Bangsa 2 (3 paslon lengkap dengan visi misi, serta 15 pemilih sampel)?
              </p>
              <button
                type="button"
                onClick={() => triggerMassDeleteConfirm("defaults")}
                className="py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-pointer"
              >
                Reset ke Default SMK Lentera Bangsa 2
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 6: SUPABASE CLOUD DATABASE INTEGRATION
      ======================================================= */}
      {adminTab === "supabase" && (
        <div className="space-y-6">
          {/* Header & Status Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
                    <span>Supabase Cloud Integration</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      PostgreSQL Cloud
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Data voting, paslon, DPT, dan pengaturan tersimpan secara online & tahan restart server.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchSupabaseStatus}
                  disabled={supabaseLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${supabaseLoading ? "animate-spin" : ""}`} />
                  <span>Periksa Status</span>
                </button>
                <a
                  href="https://supabase.com/dashboard/project/otejfijcmvjgvdvkrzqi"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition"
                >
                  <span>Buka Supabase</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Connection Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400">SUPABASE REST API URL</span>
                <p className="font-mono text-cyan-300 font-semibold truncate select-all">
                  {supabaseStatus?.url || "https://otejfijcmvjgvdvkrzqi.supabase.co"}
                </p>
                <span className="text-[10px] text-slate-500">Koneksi REST API & Real-Time Engine</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400">ANON PUBLIC KEY</span>
                <p className="font-mono text-emerald-300 font-semibold truncate select-all">
                  eyJhbGciOiJIUzI1NiIsInR5cCI...FY0 (Aktif & Terkonfigurasi)
                </p>
                <span className="text-[10px] text-slate-500">Otorisasi publik dengan Row Level Security (RLS)</span>
              </div>
            </div>

            {/* Tables Status */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Status Tabel Database di Supabase
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: "settings", label: "Pengaturan", exists: supabaseStatus?.tables.settings },
                  { name: "paslon", label: "Kandidat Paslon", exists: supabaseStatus?.tables.paslon },
                  { name: "dpt", label: "Daftar Pemilih (DPT)", exists: supabaseStatus?.tables.dpt },
                  { name: "votes", label: "Log & Struk Suara", exists: supabaseStatus?.tables.votes }
                ].map((tbl) => (
                  <div
                    key={tbl.name}
                    className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                      tbl.exists
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                        : "bg-slate-900/50 border-white/5 text-slate-400"
                    }`}
                  >
                    <div>
                      <div className="font-mono text-xs font-bold">{tbl.name}</div>
                      <div className="text-[10px] text-slate-400">{tbl.label}</div>
                    </div>
                    {tbl.exists ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        Belum ada
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {supabaseStatus?.message && (
                <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-xs text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{supabaseStatus.message}</span>
                </div>
              )}
            </div>

            {/* Sync Controls */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handlePushSupabase}
                disabled={supabaseSyncing}
                className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-lg shadow-cyan-500/20"
              >
                <Upload className={`w-4 h-4 ${supabaseSyncing ? "animate-spin" : ""}`} />
                <span>Unggah & Sinkronkan Data ke Supabase Cloud</span>
              </button>

              <button
                type="button"
                onClick={handlePullSupabase}
                disabled={supabaseSyncing}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${supabaseSyncing ? "animate-spin" : ""}`} />
                <span>Tarik Data Terbaru dari Supabase Cloud</span>
              </button>
            </div>

            {supabaseResultMsg && (
              <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-cyan-300">
                {supabaseResultMsg}
              </div>
            )}
          </div>

          {/* SQL Setup Instructions */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                  <span>Skrip SQL Setup Tabel Supabase</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Buka SQL Editor di dashboard Supabase, paste skrip ini lalu klik RUN untuk membuat tabel & security rules.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopySql}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  copiedSql
                    ? "bg-emerald-500 text-slate-950 font-black"
                    : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30"
                }`}
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Skrip SQL</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick 3-Step Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="font-black text-cyan-400">Langkah 1:</span>
                <p className="text-slate-300">
                  Buka <strong>SQL Editor</strong> di dashboard Supabase (atau klik tombol "Buka Supabase" di atas).
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="font-black text-cyan-400">Langkah 2:</span>
                <p className="text-slate-300">
                  Klik <strong>"New Query"</strong>, paste skrip SQL di bawah ini, lalu klik tombol <strong>RUN</strong>.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="font-black text-cyan-400">Langkah 3:</span>
                <p className="text-slate-300">
                  Kembali ke sini dan klik <strong>"Unggah & Sinkronkan"</strong>. Aplikasi resmi online di Supabase!
                </p>
              </div>
            </div>

            {/* Code Box */}
            <div className="relative rounded-2xl bg-slate-950 border border-white/10 p-4 font-mono text-[11px] text-slate-300 max-h-60 overflow-y-auto leading-relaxed">
              <pre className="whitespace-pre-wrap">{supabaseSql || "Memuat skrip SQL..."}</pre>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: TAMBAH / EDIT PASLON
      ======================================================= */}
      {paslonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold text-white font-heading mb-4">
              {editingPaslon ? "Edit Data Paslon" : "Tambah Paslon Baru"}
            </h3>

            <form onSubmit={handleSavePaslon} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nomor Urut *</label>
                  <input
                    type="text"
                    value={paslonForm.nomorUrut}
                    onChange={(e) => setPaslonForm({ ...paslonForm, nomorUrut: e.target.value })}
                    placeholder="Contoh: 01"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Warna Aksen / Tema</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={paslonForm.warnaTema}
                      onChange={(e) => setPaslonForm({ ...paslonForm, warnaTema: e.target.value })}
                      className="w-10 h-8 rounded-lg bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-slate-400">{paslonForm.warnaTema}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nama Calon Ketua *</label>
                  <input
                    type="text"
                    value={paslonForm.namaKetua}
                    onChange={(e) => setPaslonForm({ ...paslonForm, namaKetua: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kelas Calon Ketua</label>
                  <input
                    type="text"
                    value={paslonForm.kelasKetua}
                    onChange={(e) => setPaslonForm({ ...paslonForm, kelasKetua: e.target.value })}
                    placeholder="Contoh: XI TKJ 1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nama Calon Wakil Ketua *</label>
                  <input
                    type="text"
                    value={paslonForm.namaWakil}
                    onChange={(e) => setPaslonForm({ ...paslonForm, namaWakil: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kelas Calon Wakil</label>
                  <input
                    type="text"
                    value={paslonForm.kelasWakil}
                    onChange={(e) => setPaslonForm({ ...paslonForm, kelasWakil: e.target.value })}
                    placeholder="Contoh: X RPL 2"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">URL Foto Resmi Paslon</label>
                <input
                  type="url"
                  value={paslonForm.fotoUrl}
                  onChange={(e) => setPaslonForm({ ...paslonForm, fotoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Slogan Paslon</label>
                <input
                  type="text"
                  value={paslonForm.slogan}
                  onChange={(e) => setPaslonForm({ ...paslonForm, slogan: e.target.value })}
                  placeholder="BERSATU KREATIF, BERGERAK DIGITAL..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Visi Paslon</label>
                <textarea
                  value={paslonForm.visi}
                  onChange={(e) => setPaslonForm({ ...paslonForm, visi: e.target.value })}
                  rows={2}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Misi Paslon (Pisahkan dengan baris baru)</label>
                <textarea
                  value={paslonForm.misiText}
                  onChange={(e) => setPaslonForm({ ...paslonForm, misiText: e.target.value })}
                  rows={3}
                  placeholder="Misi 1&#10;Misi 2&#10;Misi 3"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Program Kerja Unggulan (Pisahkan dengan baris baru)</label>
                <textarea
                  value={paslonForm.prokerText}
                  onChange={(e) => setPaslonForm({ ...paslonForm, prokerText: e.target.value })}
                  rows={2}
                  placeholder="Program 1&#10;Program 2"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPaslonModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Simpan Paslon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: TAMBAH / EDIT PEMILIH (MANUAL)
      ======================================================= */}
      {voterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white/10 shadow-2xl">
            <h3 className="text-lg font-bold text-white font-heading mb-4">
              {editingVoter ? "Edit Data Pemilih" : "Tambah Pemilih Baru"}
            </h3>

            <form onSubmit={handleSaveVoter} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">NISN / NIS</label>
                <input
                  type="text"
                  value={voterForm.nisn}
                  onChange={(e) => setVoterForm({ ...voterForm, nisn: e.target.value })}
                  placeholder="Contoh: 0071234501"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={voterForm.nama}
                  onChange={(e) => setVoterForm({ ...voterForm, nama: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Kelas *</label>
                <input
                  type="text"
                  value={voterForm.kelas}
                  onChange={(e) => setVoterForm({ ...voterForm, kelas: e.target.value })}
                  placeholder="Contoh: X TKJ 1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setVoterModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="py-2 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: PREVIEW & IMPORT EXCEL DPT
      ======================================================= */}
      {excelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-emerald-500/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-heading">
                  Konfirmasi Import Data Pemilih (Excel/CSV)
                </h3>
                <p className="text-xs text-slate-400">
                  Ditemukan <strong className="text-emerald-400">{importParsedData.length}</strong> baris data siap diimpor.
                </p>
              </div>
            </div>

            {importSuccessMsg && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                {importSuccessMsg}
              </div>
            )}

            {/* Mode selection */}
            <div className="mb-4 p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Pilihan Mode Import:</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/80 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === "append"}
                    onChange={() => setImportMode("append")}
                  />
                  <span>Tambahkan ke DPT yang ada (Append)</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/80 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                  />
                  <span className="text-rose-300 font-semibold">Ganti Semua DPT (Replace All)</span>
                </label>
              </div>
            </div>

            {/* Preview table (up to 8 rows) */}
            <div className="border border-white/10 rounded-xl overflow-hidden mb-6 max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="p-2 pl-3">NISN</th>
                    <th className="p-2">Nama</th>
                    <th className="p-2">Kelas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {importParsedData.slice(0, 10).map((row, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="p-2 pl-3 font-mono text-slate-400">{row.nisn}</td>
                      <td className="p-2 font-medium text-white">{row.nama}</td>
                      <td className="p-2">{row.kelas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importParsedData.length > 10 && (
                <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-900/50">
                  ... dan {importParsedData.length - 10} data lainnya
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setExcelModalOpen(false)}
                disabled={importLoading}
                className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmImportExcel}
                disabled={importLoading}
                className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{importLoading ? "Mengimpor..." : `Impor ${importParsedData.length} Pemilih`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: PERINGATAN GANDA MASS DELETE (SECURITY CONFIRMATION)
      ======================================================= */}
      {massDeleteModal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-rose-500/40 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-center text-white font-heading">
              {massDeleteModal.title}
            </h3>
            <p className="text-xs text-slate-400 text-center mt-2 leading-relaxed">
              {massDeleteModal.description}
            </p>

            <div className="my-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              <span>Untuk melanjutkan, ketik kata konfirmasi di bawah ini:</span>
              <div className="font-mono font-black text-white text-sm mt-1 select-all">
                "{massDeleteModal.expectedText}"
              </div>
            </div>

            <input
              id="input-mass-delete-confirmation"
              type="text"
              value={massDeleteInput}
              onChange={(e) => setMassDeleteInput(e.target.value)}
              placeholder={`Ketik "${massDeleteModal.expectedText}"`}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-rose-500/40 text-white font-mono text-xs focus:outline-none focus:border-rose-400 mb-5"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMassDeleteModal({ type: null, title: "", expectedText: "", description: "" })}
                disabled={actionLoading}
                className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                id="btn-confirm-mass-delete"
                type="button"
                onClick={executeMassDelete}
                disabled={actionLoading || massDeleteInput !== massDeleteModal.expectedText}
                className="py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-500/20"
              >
                {actionLoading ? "Memproses..." : "Ya, Hapus Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
