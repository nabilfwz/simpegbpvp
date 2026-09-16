"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ArrowRight, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";

function LoginRedirectContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [redirecting, setRedirecting] = useState(false);

  const ssoBase =
    process.env.NEXT_PUBLIC_SSO_URL || "https://sso-bpvp.vercel.app";
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://simpegbpvp.vercel.app";
  const callbackUrl = `${origin}/auth/sso-callback`;
  const ssoLoginUrl = `${ssoBase}?service=simpeg&callbackUrl=${encodeURIComponent(
    callbackUrl
  )}`;

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setRedirecting(true);
    window.location.href = ssoLoginUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001744] via-[#002266] to-[#003399] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-blue-900/20 overflow-hidden text-center p-8 space-y-6">
          {/* Logo & Header */}
          <div>
            <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-2xl p-2.5 flex items-center justify-center shadow-xl border-2 border-amber-400">
              <img
                src="/images/logo-kemnaker.svg"
                alt="Logo Kemnaker RI"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-[#003399] text-[10px] font-bold tracking-wider uppercase mb-2">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Kementerian Ketenagakerjaan RI
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              SIMPEG BPVP Banda Aceh
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Sistem Informasi Manajemen Pegawai &amp; SDM Aparatur
            </p>
          </div>

          {/* Error handling if returned from callback */}
          {errorParam && (
            <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-xl text-left flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-red-900">Autentikasi Ditolak</p>
                <p className="text-red-700 mt-0.5">
                  Email Anda tidak terdaftar sebagai pegawai resmi BPVP atau akun dinonaktifkan.
                </p>
              </div>
            </div>
          )}

          {/* Descriptive text */}
          <div className="space-y-1.5 py-1">
            <p className="text-sm font-bold text-slate-800">
              Portal Layanan Pegawai Terpadu
            </p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Silakan masuk melalui <strong>Portal Single Sign-On (SSO) BPVP</strong> menggunakan akun Google / Gmail kedinasan Anda.
            </p>
          </div>

          {/* Action Button: ONLY redirects on click */}
          <div>
            <button
              type="button"
              id="btn-goto-sso"
              onClick={handleLoginClick}
              disabled={redirecting}
              className="w-full py-4 px-5 bg-gradient-to-r from-[#003399] to-[#002266] hover:from-[#002266] hover:to-[#001744] text-white rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-between cursor-pointer group disabled:opacity-70"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-white">
                    Masuk dengan SSO BPVP
                  </p>
                  <p className="text-[10px] text-blue-200 font-normal">
                    Google (Gmail) &amp; SIAPkerja
                  </p>
                </div>
              </div>
              {redirecting ? (
                <Loader2 className="w-5 h-5 animate-spin text-amber-300 ml-2" />
              ) : (
                <ArrowRight className="w-5 h-5 text-amber-300 group-hover:translate-x-1 transition-transform ml-2 shrink-0" />
              )}
            </button>
          </div>

          {/* Footer Security Note */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Central Identity Provider (IdP) &bull; BPVP Banda Aceh</span>
          </div>
        </div>

        {/* Outer footer */}
        <div className="text-center mt-5 text-blue-200/70 text-xs font-medium space-y-1">
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
        <div className="min-h-screen bg-[#001744] flex items-center justify-center">
          <div className="p-4 text-white text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
            <p className="text-xs font-semibold">Memuat Layanan SSO...</p>
          </div>
        </div>
      }
    >
      <LoginRedirectContent />
    </Suspense>
  );
}
