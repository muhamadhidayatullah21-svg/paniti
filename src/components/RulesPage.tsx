import React from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Users,
  Vote,
  Sparkles,
  Lock,
  ArrowRight,
  Clock,
  Laptop,
  CheckSquare
} from "lucide-react";

interface RulesPageProps {
  onGoToVoting: () => void;
  schoolName: string;
}

export const RulesPage: React.FC<RulesPageProps> = ({ onGoToVoting, schoolName }) => {
  const steps = [
    {
      step: "01",
      title: "Masuk & Verifikasi Diri",
      desc: "Ketik Nama Lengkap Anda dan pilih Kelas sesuai data kesiswaan SMK Lentera Bangsa 2.",
      icon: Laptop
    },
    {
      step: "02",
      title: "Pahami Visi-Misi",
      desc: "Pelajari visi, misi, dan program kerja unggulan dari setiap Pasangan Calon (Paslon).",
      icon: Users
    },
    {
      step: "03",
      title: "Tentukan Pilihan",
      desc: "Klik tombol 'Coblos Paslon' pada kandidat pilihan hati nurani Anda.",
      icon: Vote
    },
    {
      step: "04",
      title: "Konfirmasi Suara",
      desc: "Periksa kembali di pop-up konfirmasi. Suara yang sudah terkirim tidak dapat diganti.",
      icon: CheckSquare
    },
    {
      step: "05",
      title: "Simpan Bukti Coblos",
      desc: "Dapatkan tanda terima digital dengan kode unik (Vote Hash) sebagai bukti sah pemilihan.",
      icon: ShieldCheck
    }
  ];

  const rules = [
    {
      title: "Asas LUBER JURDIL",
      desc: "Pemilihan dilaksanakan secara Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil. Pilihan Anda dijamin kerahasiaannya oleh sistem enkripsi server."
    },
    {
      title: "Satu Siswa, Satu Suara (One Person, One Vote)",
      desc: "Setiap siswa/siswi yang terdaftar hanya memiliki 1 (satu) hak suara. Percobaan voting ganda akan otomatis ditolak dan diblokir oleh sistem."
    },
    {
      title: "Waktu & Jadwal Pemilihan",
      desc: "Pemilihan dibuka sesuai jadwal resmi yang ditentukan oleh Panitia KPU OSIS SMK Lentera Bangsa 2. Suara di luar jam tayang tidak akan diproses."
    },
    {
      title: "Larangan Praktik Suap & Kampanye Hitam",
      desc: "Dilarang memaksakan pilihan kepada orang lain, melakukan intimidasi, atau memberikan imbalan uang/barang untuk memilih paslon tertentu."
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Panduan Resmi Pemilihan Digital</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
          Aturan & Tata Cara E-Voting OSIS
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Pastikan Anda membaca seluruh ketentuan dan tata cara di bawah ini agar proses pemungutan suara {schoolName} berjalan lancar, tertib, dan demokratis.
        </p>
      </div>

      {/* 5 Langkah Praktis (Steps) */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
          <Vote className="w-5 h-5 text-cyan-400" />
          <span>5 Langkah Mudah Memberikan Suara</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="glass-card-interactive rounded-2xl p-5 border border-white/10 flex flex-col justify-between relative overflow-hidden group"
              >
                <div className="absolute top-2 right-3 text-3xl font-black text-slate-800/60 select-none group-hover:text-cyan-500/20 transition">
                  {item.step}
                </div>
                <div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white font-heading mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Syarat & Ketentuan Pemilihan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule, idx) => (
          <div
            key={idx}
            className="glass-panel rounded-2xl p-6 border border-white/10 space-y-2 hover:border-cyan-500/30 transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-sm font-bold shrink-0">
                {idx + 1}
              </div>
              <h3 className="text-base font-bold text-white font-heading">
                {rule.title}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 pl-10 leading-relaxed">
              {rule.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Security & Integrity Box */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/40">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-heading">
              Keamanan Server Terpusat & Enkripsi Kriptografis
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Server utama menggunakan identifikasi satu kali pakai dan rekapitulasi waktu nyata (real-time stream) sehingga setiap kecurangan atau manipulasi suara langsung terdeteksi.
            </p>
          </div>
        </div>
        <button
          id="btn-rules-go-vote"
          onClick={onGoToVoting}
          className="py-3.5 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-cyan-400/20 shrink-0 cursor-pointer"
        >
          <span>Mulai Memilih Sekarang</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* FAQ Accordion */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white font-heading">
            Pertanyaan Umum (FAQ)
          </h3>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <p className="font-bold text-cyan-300">Q: Bagaimana jika nama saya tidak ditemukan di daftar kelas?</p>
            <p className="text-slate-400">
              A: Pilih opsi "Ketik Manual Kelas" pada formulir masuk atau hubungi pengawas / panitia OSIS yang bertugas di TPS untuk mendaftarkan nama Anda ke DPT.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <p className="font-bold text-cyan-300">Q: Apakah pilihan saya bisa diketahui oleh orang lain atau guru?</p>
            <p className="text-slate-400">
              A: Tidak. Sistem audit hanya mencatat inisial anonim dan kelas untuk keperluan verifikasi kehadiran pemilih, sedangkan pilihan paslon disimpan secara terenkripsi.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <p className="font-bold text-cyan-300">Q: Bisakah saya mengubah pilihan setelah menekan tombol konfirmasi?</p>
            <p className="text-slate-400">
              A: Tidak bisa. Demi asas kejujuran pemilu, setiap suara yang sudah masuk ke server utama bersifat final dan permanen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
