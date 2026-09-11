"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Shield,
  UserCheck,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Search,
  Loader2,
  ShieldAlert,
  Layers,
  Sparkles,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

interface ASNAccount {
  id: string;
  nama: string;
  email: string;
  nip?: string;
  role: string;
  subUnit?: string;
  statusPegawai?: string;
  isSystemUser?: boolean;
}

function KemnakerSSOContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [activeTab, setActiveTab] = useState<"accounts" | "custom" | "ecosystem">("accounts");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [accounts, setAccounts] = useState<ASNAccount[]>([]);
  const [filterSearch, setFilterSearch] = useState("");
  const [error, setError] = useState("");

  // Input for custom verification
  const [identifier, setIdentifier] = useState("");

  // Fetch registered ASN accounts from database
  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await fetch("/api/sso/accounts");
        if (res.ok) {
          const data = await res.json();
          const list: ASNAccount[] = [];

          // Add System Users
          if (data.users && data.users.length > 0) {
            for (const u of data.users) {
              list.push({
                id: u.id,
                nama: u.nama,
                email: u.email,
                role: u.role,
                subUnit: u.role === "admin" ? "Subbagian Umum (Administrator Sistem)" : "Tata Usaha / Operator",
                isSystemUser: true,
              });
            }
          }

          // Add Pegawai ASN
          if (data.pegawais && data.pegawais.length > 0) {
            for (const p of data.pegawais) {
              // Avoid exact duplicate email if already added as system user
              if (!list.some((item) => item.email.toLowerCase() === p.email?.toLowerCase())) {
                list.push({
                  id: p.id,
                  nama: p.nama,
                  email: p.email || `${p.nip}@kemnaker.go.id`,
                  nip: p.nip,
                  role: p.subUnitKerja?.label?.includes("Pimpinan") || p.subUnitKerja?.label?.includes("Umum") ? "admin" : "operator",
                  subUnit: p.subUnitKerja?.label || "Balai Pelatihan Vokasi BPVP",
                  statusPegawai: p.statusPegawai?.label,
                  isSystemUser: false,
                });
              }
            }
          }

          setAccounts(list);
        }
      } catch (err) {
        console.error("Gagal memuat akun SSO:", err);
      } finally {
        setDataLoading(false);
      }
    }

    loadAccounts();
  }, []);

  const handleSSOLogin = async (loginIdentifier: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await signIn("sso-kemnaker", {
        email: loginIdentifier,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        // Hard navigate to ensure fresh session cookie
        window.location.href = callbackUrl || "/";
      }
    } catch (err: any) {
      setError("Gagal terhubung dengan layanan SSO Kemnaker.");
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Masukkan NIP (18 digit) atau Email Kedinasan.");
      return;
    }
    handleSSOLogin(identifier.trim());
  };

  // Filter accounts by search query
  const filteredAccounts = accounts.filter((acc) => {
    const q = filterSearch.toLowerCase();
    return (
      acc.nama.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      (acc.nip && acc.nip.includes(q)) ||
      (acc.subUnit && acc.subUnit.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Banner Kemnaker */}
      <header className="bg-[#003399] text-white py-3 px-6 shadow-md border-b-2 border-amber-400">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-kemnaker.svg"
              alt="Kemnaker RI"
              className="w-10 h-10 bg-white rounded-full p-1 border border-amber-400"
            />
            <div>
              <h1 className="text-sm font-bold tracking-wide uppercase text-amber-300">
                Kementerian Ketenagakerjaan Republik Indonesia
              </h1>
              <p className="text-xs text-blue-100 font-medium">
                Portal Single Sign-On (SSO) Terpadu — Ekosistem Digital BPVP &amp; SIAPkerja
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>Terverifikasi Database Pegawai</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-slate-900 via-[#002266] to-[#003399] p-6 text-white text-center relative">
            <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-2xl p-2.5 shadow-md border-2 border-amber-400 flex items-center justify-center">
              <img
                src="/images/logo-kemnaker.svg"
                alt="Logo Kemnaker"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="inline-block px-3 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full text-[11px] font-bold uppercase tracking-wider mb-1">
              Identity Provider Resmi Kemnaker RI
            </span>
            <h2 className="text-xl font-extrabold tracking-tight">
              Single Sign-On (SSO) Ekosistem BPVP
            </h2>
            <p className="text-xs text-blue-200 mt-1 max-w-lg mx-auto">
              Satu akun terintegrasi untuk seluruh aplikasi BPVP Banda Aceh (SIMPEG, Skillhub, Maganghub, LSP, Keuangan, &amp; PTSP).
            </p>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/15">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("accounts");
                  setError("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "accounts"
                    ? "bg-amber-400 text-blue-950 shadow-xs"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Akun ASN Terdaftar ({accounts.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("custom");
                  setError("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "custom"
                    ? "bg-amber-400 text-blue-950 shadow-xs"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Uji Validasi NIP / Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("ecosystem");
                  setError("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "ecosystem"
                    ? "bg-amber-400 text-blue-950 shadow-xs"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Ekosistem Aplikasi
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Error / Rejection Banner */}
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-xl shadow-xs text-red-800 space-y-1 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="font-bold text-sm">Akses SSO Ditolak Sistem</p>
                </div>
                <p className="text-xs text-red-700 leading-relaxed pl-7">{error}</p>
                <div className="text-[11px] text-red-600 pl-7 pt-1 font-medium">
                  Aturan: Hanya pegawai terdaftar di Database Manajemen Pegawai BPVP dengan status <strong>AKTIF</strong> yang diizinkan masuk.
                </div>
              </div>
            )}

            {/* TAB 1: ACCOUNTS LIST */}
            {activeTab === "accounts" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pilih Akun ASN Resmi BPVP
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verifikasi Database Aktif
                  </span>
                </div>

                {/* Search Bar for Accounts */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="text"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Cari nama ASN, NIP, atau Subbagian Umum..."
                    className="pl-9 h-10 text-xs sm:text-sm bg-slate-50"
                  />
                </div>

                {/* Accounts List */}
                {dataLoading ? (
                  <div className="p-8 text-center space-y-3">
                    <Loader2 className="w-7 h-7 animate-spin text-[#003399] mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">
                      Memuat data identitas ASN dari database SIMPEG BPVP...
                    </p>
                  </div>
                ) : filteredAccounts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                    Tidak ditemukan akun ASN yang cocok dengan kata kunci &quot;{filterSearch}&quot;.
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto space-y-2.5 pr-1">
                    {filteredAccounts.map((acc) => {
                      const initials = acc.nama
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();
                      const isAdmin = acc.role === "admin";

                      return (
                        <button
                          key={acc.id + acc.email}
                          type="button"
                          disabled={loading}
                          onClick={() => handleSSOLogin(acc.nip || acc.email)}
                          className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-[#003399] hover:bg-blue-50/40 transition-all text-left flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-[#003399]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 transition-colors ${
                                isAdmin
                                  ? "bg-blue-100 text-[#003399] group-hover:bg-[#003399] group-hover:text-white"
                                  : "bg-amber-100 text-amber-900 group-hover:bg-amber-500 group-hover:text-white"
                              }`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-800 text-xs sm:text-sm truncate group-hover:text-[#003399]">
                                  {acc.nama}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                                    isAdmin
                                      ? "bg-blue-50 text-blue-800 border-blue-200"
                                      : "bg-amber-50 text-amber-800 border-amber-200"
                                  }`}
                                >
                                  {isAdmin ? "Admin" : "Operator"}
                                </span>
                                {acc.statusPegawai && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                    {acc.statusPegawai}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{acc.email}</p>
                              <p className="text-[10px] text-slate-400 font-mono truncate">
                                {acc.nip ? `NIP. ${acc.nip} • ` : ""}
                                {acc.subUnit}
                              </p>
                            </div>
                          </div>
                          <UserCheck className="w-4 h-4 text-slate-300 group-hover:text-[#003399] shrink-0 ml-2 transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CUSTOM VERIFIER */}
            {activeTab === "custom" && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-700" />
                    Uji Validasi Ketat Kepegawaian BPVP:
                  </p>
                  <p>
                    Sistem akan memverifikasi apakah identitas yang Anda masukkan terdaftar dan berstatus <strong>AKTIF</strong> di Database Manajemen Pegawai BPVP.
                  </p>
                  <ul className="list-disc pl-5 text-[11px] text-amber-800 space-y-0.5 mt-1">
                    <li>Contoh Orang Luar: <code className="bg-white/80 px-1 rounded">orang.luar@gmail.com</code> (Otomatis Ditolak)</li>
                    <li>Contoh Pegawai Nonaktif: NIP pegawai yang berada di tong sampah (Otomatis Ditolak)</li>
                    <li>Contoh Pegawai Resmi: <code className="bg-white/80 px-1 rounded">198001012005011001</code> atau <code className="bg-white/80 px-1 rounded">admin@bpvp.local</code> (Diterima)</li>
                  </ul>
                </div>

                <form onSubmit={handleCustomSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      NIP Pegawai (18 Digit) atau Email Kedinasan
                    </label>
                    <Input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Contoh: 198001012005011001 atau ahmad@kemnaker.go.id"
                      className="h-11 text-sm bg-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[#003399] hover:bg-[#002266] text-white font-bold text-sm shadow-md"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memeriksa Status di Database Pegawai...
                      </span>
                    ) : (
                      "Verifikasi & Masuk ke Ekosistem BPVP"
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* TAB 3: ECOSYSTEM APPS EXPLANATION */}
            {activeTab === "ecosystem" && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-[#003399]">
                    <Layers className="w-4 h-4" />
                    Arsitektur Single Sign-On Ekosistem BPVP:
                  </p>
                  <p className="text-blue-900 leading-relaxed">
                    Setelah login melalui SIMPEG atau SSO Kemnaker, sistem menerbitkan <strong>Cross-App SSO Token (HMAC-SHA256)</strong>. Anda dapat berpindah ke seluruh aplikasi ekosistem BPVP tanpa memasukkan kata sandi lagi:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-lg">👥</span>
                    <h4 className="font-bold text-slate-800">SIMPEG BPVP (Induk)</h4>
                    <p className="text-slate-500 text-[11px]">Sistem Informasi Manajemen Pegawai &amp; Data ASN</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-lg">🎓</span>
                    <h4 className="font-bold text-slate-800">Skillhub BPVP</h4>
                    <p className="text-slate-500 text-[11px]">Pelatihan Vokasi, Instruktur &amp; Kurikulum</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-lg">🏢</span>
                    <h4 className="font-bold text-slate-800">Maganghub BPVP</h4>
                    <p className="text-slate-500 text-[11px]">Penempatan Pemagangan Industri Dalam/Luar Negeri</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-lg">🏅</span>
                    <h4 className="font-bold text-slate-800">LSP-P1 BPVP</h4>
                    <p className="text-slate-500 text-[11px]">Sertifikasi Profesi &amp; Asesmen Lisensi BNSP</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-lg">💰</span>
                    <h4 className="font-bold text-slate-800">Keuangan &amp; BMN</h4>
                    <p className="text-slate-500 text-[11px]">Anggaran DIPA, Perbendaharaan, &amp; Aset Negara</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-lg">🏛️</span>
                    <h4 className="font-bold text-slate-800">Kios Siap Kerja / PTSP</h4>
                    <p className="text-slate-500 text-[11px]">Pelayanan Terpadu Satu Pintu &amp; Pasar Kerja</p>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <Button
                    onClick={() => setActiveTab("accounts")}
                    className="bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold px-6 h-9"
                  >
                    Mulai Masuk dengan Akun ASN
                  </Button>
                </div>
              </div>
            )}

            {/* Back to regular login */}
            <div className="pt-4 border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 mx-auto font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Halaman Login Kredensial Manual
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-[11px] py-4 px-6 text-center border-t border-slate-800">
        <p className="font-medium text-slate-300">
          Kementerian Ketenagakerjaan Republik Indonesia • Balai Pelatihan Vokasi dan Produktivitas (BPVP) Banda Aceh
        </p>
        <p className="mt-0.5 text-slate-500">
          Sistem Informasi Manajemen Pegawai (SIMPEG) — Terintegrasi dengan Ekosistem Digital Kemnaker
        </p>
      </footer>
    </div>
  );
}

export default function KemnakerSSOPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="p-6 bg-white rounded-xl shadow-md border text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#003399] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Memuat Layanan SSO Kemnaker...</p>
          </div>
        </div>
      }
    >
      <KemnakerSSOContent />
    </Suspense>
  );
}
