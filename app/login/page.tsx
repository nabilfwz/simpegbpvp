"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Mail,
  Loader2,
  Sparkles,
  UserCheck,
  Building2,
  CheckCircle2,
} from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>(() => {
    if (urlError === "UnauthorizedGoogleEmail" || urlError === "AccessDenied") {
      return "Akses Ditolak: Email Google Anda tidak terdaftar sebagai pegawai resmi BPVP Banda Aceh.";
    }
    if (urlError === "InactiveEmployee" || urlError === "InactiveUser") {
      return "Akses Ditolak: Akun/Pegawai ini berstatus nonaktif di sistem BPVP.";
    }
    return "";
  });

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError("");
    setLoading(true);

    try {
      const res = await signIn("sso-email", {
        email: email.trim(),
        redirect: false,
        callbackUrl: "/",
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else if (res?.ok) {
        window.location.href = "/";
      } else {
        setError("Gagal melakukan verifikasi SSO. Silakan periksa kembali email Anda.");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan pada sistem SSO.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      // Trigger NextAuth Google OAuth
      const res = await signIn("google", {
        callbackUrl: "/",
        redirect: false,
      });

      if (res?.error) {
        // Jika GOOGLE_CLIENT_ID belum terkonfigurasi di .env
        if (res.error.includes("OAuthSignin") || res.error.includes("Signin")) {
          setError(
            "Google OAuth belum dikonfigurasi di server (.env). Anda dapat memasukkan email Google Anda langsung di form email untuk verifikasi."
          );
        } else {
          setError(res.error);
        }
        setLoading(false);
      } else if (res?.url) {
        window.location.href = res.url;
      }
    } catch {
      setError("Gagal memulai otentikasi Google. Silakan coba masuk via Email.");
      setLoading(false);
    }
  };

  const selectQuickAccount = (quickEmail: string) => {
    setEmail(quickEmail);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001433] via-[#002266] to-[#003399] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-blue-900/20 overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="bg-gradient-to-b from-[#003399] to-[#002266] px-8 pt-8 pb-7 text-center text-white relative overflow-hidden">
            {/* Background Pattern Accent */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-3 bg-white rounded-2xl p-2.5 flex items-center justify-center shadow-xl border-2 border-amber-400/50">
                <img
                  src="/images/logo-kemnaker.svg"
                  alt="Logo Kemnaker RI"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-amber-400/20 border border-amber-400/40 rounded-full text-amber-300 text-[10px] font-bold tracking-wider uppercase mb-2">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Single Sign-On (SSO) Kemnaker RI
              </div>

              <h1 className="text-xl font-black text-white tracking-tight">
                SIMPEG BPVP Banda Aceh
              </h1>
              <p className="text-blue-200 text-xs font-medium mt-1">
                Sistem Informasi Manajemen Pegawai &amp; SDM Aparatur
              </p>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-7 sm:p-8 space-y-6">
            {/* Notification / Error Banner */}
            {error && (
              <div className="p-3.5 bg-red-50 border-l-4 border-red-600 rounded-r-xl text-red-800 flex items-start gap-2.5 animate-in fade-in duration-200">
                <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div className="text-xs font-medium leading-relaxed">
                  <p className="font-bold text-red-900 mb-0.5">Autentikasi Ditolak</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Opsi 1: Masuk dengan Akun Google / Sosmed */}
            <div className="space-y-3">
              <button
                type="button"
                id="btn-google-login"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border-2 border-slate-200 hover:border-[#003399]/40 shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 group"
              >
                {/* Official Google SVG Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-slate-800 group-hover:text-[#003399]">
                  Masuk dengan Akun Google
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                atau masuk dengan email
              </span>
            </div>

            {/* Opsi 2: Masuk dengan Email (Tanpa Password) */}
            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <div>
                <label
                  htmlFor="sso-email"
                  className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between"
                >
                  <span>Alamat Email Kedinasan / ASN</span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Tanpa Kata Sandi
                  </span>
                </label>
                <div className="relative">
                  <input
                    id="sso-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama.asn@kemnaker.go.id"
                    className="w-full pl-10 pr-4 h-11 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003399] focus:border-transparent transition text-slate-800 placeholder:text-slate-400"
                    autoComplete="email"
                    disabled={loading}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <button
                id="btn-submit-sso"
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full h-11 bg-gradient-to-r from-[#003399] to-[#002266] hover:from-[#002266] hover:to-[#001744] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi SSO...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk dengan SSO BPVP</span>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Accounts for Testing */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-2">
                <UserCheck className="w-3.5 h-3.5 text-[#003399]" />
                <span>Uji Coba Cepat (Akun Terdaftar di BPVP):</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => selectQuickAccount("inispectre@gmail.com")}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-left transition cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 truncate text-[11px]">
                      Muhammad Nabil Fawwaz
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      inispectre@gmail.com
                    </p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 uppercase shrink-0">
                    Superadmin
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => selectQuickAccount("iskandar.umum@kemnaker.go.id")}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-left transition cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 truncate text-[11px]">
                      Iskandar Muda, S.Sos., M.M.
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      iskandar.umum@kemnaker.go.id
                    </p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase shrink-0">
                    Admin (TU)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => selectQuickAccount("cut.nurul@kemnaker.go.id")}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-left transition cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 truncate text-[11px]">
                      Cut Nurul Fazilah, S.T.
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      cut.nurul@kemnaker.go.id
                    </p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 uppercase shrink-0">
                    User (Pegawai)
                  </span>
                </button>
              </div>
            </div>

            {/* Info Keamanan & Ekosistem SSO */}
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1.5">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-[#003399]" />
                <span>Verifikasi Basis Data Pegawai &amp; Token SSO</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Hanya email yang terdaftar di basis data <strong>Pegawai BPVP Banda Aceh</strong> yang diizinkan masuk. Token SSO lintas aplikasi diterbitkan otomatis saat autentikasi.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-5 text-blue-200/70 text-xs font-medium space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            Terhubung ke Single Sign-On (SSO) Terpadu Kemnaker RI
          </p>
          <p>&copy; 2026 Kementerian Ketenagakerjaan RI &bull; BPVP Banda Aceh</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#001433] flex items-center justify-center">
          <div className="p-4 text-white text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
            <p className="text-xs font-semibold">Memuat Layanan SSO...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
