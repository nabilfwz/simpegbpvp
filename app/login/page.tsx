"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSsoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const ssoBase = process.env.NEXT_PUBLIC_SSO_URL || "https://sso-bpvp.vercel.app";
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const callbackUrl = `${origin}/auth/sso-callback`;
    window.location.href = `${ssoBase}?service=simpeg&callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-b from-[#003399] to-[#002266] p-8 text-center text-white relative">
            <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full p-2 flex items-center justify-center shadow-lg border-2 border-amber-400/50">
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

          {/* SSO & Login Form */}
          <div className="p-8 space-y-6">
            {/* SSO Section */}
            <div className="space-y-3">
              <a
                href={`${process.env.NEXT_PUBLIC_SSO_URL || "https://sso-bpvp.vercel.app"}?service=simpeg`}
                onClick={handleSsoClick}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#003399] to-[#002266] hover:from-[#002266] hover:to-[#001744] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-between group border border-amber-400/50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white p-1 shrink-0 flex items-center justify-center">
                    <img
                      src="/images/logo-kemnaker.svg"
                      alt="SSO Kemnaker"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                        Masuk dengan SSO Kemnaker
                      </span>
                      <span className="text-[9px] bg-amber-400 text-blue-950 font-extrabold px-1.5 py-0.2 rounded uppercase">
                        SIAPkerja
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-200 font-normal">
                      Satu Akun ASN untuk Seluruh Layanan
                    </p>
                  </div>
                </div>
                <span className="text-amber-300 group-hover:translate-x-0.5 transition-transform text-base font-bold">
                  &rarr;
                </span>
              </a>

              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs sm:text-sm border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Masuk dengan Google Workspace / Akun Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                atau kredensial manual
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {/* Manual Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@bpvp.local"
                  className="w-full h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-10 text-sm"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700 font-semibold">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm shadow-sm"
              >
                {loading ? "Sedang memverifikasi..." : "Masuk dengan Email & Password"}
              </Button>
            </form>

            <div className="border-t border-slate-100 pt-4 text-center">
              <p className="text-[11px] text-slate-400">
                Akun Demo Default: <span className="font-mono font-semibold text-slate-600">admin@bpvp.local</span> / <span className="font-mono font-semibold text-slate-600">admin123</span>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-slate-500 text-xs font-medium space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            Terhubung ke Layanan Single Sign-On (SSO) Kemnaker RI
          </p>
          <p>&copy; 2026 Kementerian Ketenagakerjaan RI • BPVP Banda Aceh</p>
        </div>
      </div>
    </div>
  );
}
