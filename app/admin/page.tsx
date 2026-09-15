"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Shield, Eye, EyeOff, Loader2, ShieldAlert, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        setError(
          result.error === "CredentialsSignin"
            ? "Email atau kata sandi salah. Coba lagi."
            : result.error
        );
        setLoading(false);
      } else if (result?.ok) {
        window.location.href = "/";
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
        setLoading(false);
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-800 p-8 text-center text-white">
            <div className="w-16 h-16 mx-auto mb-3 bg-slate-700 rounded-2xl p-3 flex items-center justify-center shadow-md border border-slate-600">
              <Shield className="w-full h-full text-amber-400" />
            </div>
            <div className="inline-block px-2.5 py-0.5 bg-amber-400/20 border border-amber-400/40 rounded-full text-amber-300 text-[10px] font-bold tracking-wider uppercase mb-2">
              Akses Terbatas
            </div>
            <h1 className="text-xl font-extrabold text-white mb-1 tracking-tight">
              Login Administrator
            </h1>
            <p className="text-slate-400 text-xs font-medium">
              SIMPEG BPVP Banda Aceh &bull; Kemnaker RI
            </p>
          </div>

          {/* Form */}
          <div className="p-8 space-y-5">
            {/* Error Banner */}
            {error && (
              <div className="p-3.5 bg-red-50 border-l-4 border-red-600 rounded-r-xl text-red-800 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs font-semibold leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Email Administrator
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bpvp.local"
                  className="w-full px-3 h-11 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 pr-10 h-11 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="btn-admin-submit"
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-lg shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <span>Masuk sebagai Administrator</span>
                )}
              </button>
            </form>

            {/* Back link */}
            <div className="text-center pt-2 border-t border-slate-100">
              <a
                href="/login"
                id="link-back-to-sso"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#003399] transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Login SSO
              </a>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center mt-5 text-slate-500 text-xs font-medium space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            Halaman ini hanya untuk administrator sistem
          </p>
          <p>&copy; 2026 Kementerian Ketenagakerjaan RI &bull; BPVP Banda Aceh</p>
        </div>
      </div>
    </div>
  );
}
