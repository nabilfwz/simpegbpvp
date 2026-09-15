"use client";

import { useEffect } from "react";
import { Shield, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const handleSsoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const ssoBase =
      process.env.NEXT_PUBLIC_SSO_URL || "https://sso-bpvp.vercel.app";
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://simpegbpvp.vercel.app";
    const callbackUrl = `${origin}/auth/sso-callback`;
    window.location.href = `${ssoBase}?service=simpeg&callbackUrl=${encodeURIComponent(
      callbackUrl
    )}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001744] via-[#002266] to-[#003399] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-b from-[#003399] to-[#002266] p-8 text-center text-white">
            <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full p-2 flex items-center justify-center shadow-lg border-2 border-amber-400/60">
              <img
                src="/images/logo-kemnaker.svg"
                alt="Logo Kemnaker RI"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="inline-block px-2.5 py-0.5 bg-amber-400/20 border border-amber-400/40 rounded-full text-amber-300 text-[10px] font-bold tracking-wider uppercase mb-2">
              Kementerian Ketenagakerjaan RI
            </div>
            <h1 className="text-xl font-extrabold text-white mb-1 tracking-tight">
              SIMPEG BPVP Banda Aceh
            </h1>
            <p className="text-blue-200 text-xs font-medium">
              Sistem Informasi Manajemen Pegawai &amp; SDM Aparatur
            </p>
          </div>

          {/* Body */}
          <div className="p-8 space-y-6">
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-700">
                Selamat Datang
              </p>
              <p className="text-xs text-slate-500">
                Gunakan akun SSO Kemnaker Anda untuk masuk ke sistem.
              </p>
            </div>

            {/* SSO Button */}
            <a
              href="#"
              onClick={handleSsoClick}
              id="btn-sso-login"
              className="w-full py-4 px-5 bg-gradient-to-r from-[#003399] to-[#002266] hover:from-[#002266] hover:to-[#001744] text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-between group border border-amber-400/40 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white p-1.5 shrink-0 flex items-center justify-center">
                  <img
                    src="/images/logo-kemnaker.svg"
                    alt="SSO Kemnaker"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-white tracking-wide">
                      Masuk dengan SSO Kemnaker
                    </span>
                    <span className="text-[9px] bg-amber-400 text-blue-950 font-extrabold px-1.5 py-0.5 rounded uppercase">
                      SIAPkerja
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200 font-normal">
                    Satu Akun ASN untuk Seluruh Layanan Kemnaker
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-300 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
            </a>

            {/* Security info */}
            <div className="flex items-start gap-2.5 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <Shield className="w-4 h-4 text-[#003399] mt-0.5 shrink-0" />
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Login diverifikasi oleh <strong>Identity Provider (IdP) terpusat</strong> Kemnaker RI menggunakan NIP dan kata sandi ASN Anda.
              </p>
            </div>

            {/* Admin link */}
            <div className="text-center pt-1 border-t border-slate-100">
              <a
                href="/admin"
                id="link-admin-login"
                className="text-xs text-slate-400 hover:text-slate-600 transition underline underline-offset-2"
              >
                Login Administrator
              </a>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center mt-5 text-blue-200/70 text-xs font-medium space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Terhubung ke Layanan Single Sign-On (SSO) Kemnaker RI
          </p>
          <p>&copy; 2026 Kementerian Ketenagakerjaan RI &bull; BPVP Banda Aceh</p>
        </div>
      </div>
    </div>
  );
}
