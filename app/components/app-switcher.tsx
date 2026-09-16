"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Grid, ExternalLink, ShieldCheck, Check, Copy, Sparkles, X, Loader2 } from "lucide-react";

interface AppItem {
  id: string;
  nama: string;
  deskripsi: string;
  kategori: string;
  url: string;
  launchUrl?: string;
  icon: string;
  color: string;
  badge?: string;
  isCurrent?: boolean;
}

export function AppSwitcher() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [token, setToken] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !token && session?.user) {
      setLoading(true);
      fetch("/api/sso/token")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setToken(data.token);
            setApps(data.apps || []);
          }
        })
        .catch((err) => console.error("Gagal memuat token SSO:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, token, session]);

  const handleCopyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      {/* 9-Dot Launcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition shadow-2xs group"
        title="Ekosistem Aplikasi BPVP (SSO Terpadu)"
      >
        <div className="w-5 h-5 flex flex-wrap items-center justify-between p-0.5 gap-0.5 group-hover:scale-105 transition-transform">
          {[...Array(9)].map((_, i) => (
            <span
              key={i}
              className="w-1 h-1 rounded-xs bg-[#003399] group-hover:bg-amber-500 transition-colors"
            />
          ))}
        </div>
        <span className="hidden lg:inline text-xs font-semibold text-slate-700 group-hover:text-[#003399]">
          Ekosistem BPVP
        </span>
      </button>

      {/* Launcher Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#003399] via-[#002266] to-slate-900 text-white p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-blue-950">
                    <ShieldCheck className="w-3 h-3" /> SIAPkerja SSO Active
                  </span>
                  <span className="text-xs text-blue-200">Kemnaker RI</span>
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Ekosistem Aplikasi Terpadu BPVP
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Beralih ke aplikasi BPVP lain secara instan tanpa perlu login berulang kali.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active User Card & SSO Status */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#003399] text-amber-300 font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                  {session?.user?.name?.slice(0, 2).toUpperCase() || "BP"}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">
                    {session?.user?.name || "Pegawai BPVP"}
                  </p>
                  <p className="text-slate-500 text-[11px] truncate">
                    {session?.user?.email} • Role: <span className="font-semibold text-[#003399]">{(session?.user as any)?.role || "user"}</span>
                  </p>
                </div>
              </div>

              {/* Token Info & Copy */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={!token}
                  onClick={handleCopyToken}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition shadow-2xs"
                  title="Salin Token SSO Kriptografis"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Salin Token SSO</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Apps Grid */}
            <div className="p-5 max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="py-12 text-center space-y-3">
                  <Loader2 className="w-7 h-7 text-[#003399] animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">
                    Menghasilkan Token SSO &amp; menyinkronkan ekosistem aplikasi...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {apps.map((app) => (
                    <a
                      key={app.id}
                      href={app.launchUrl || app.url}
                      onClick={() => {
                        if (app.isCurrent) setIsOpen(false);
                      }}
                      className={`p-3.5 rounded-xl border transition-all text-left flex items-start gap-3.5 group relative ${
                        app.isCurrent
                          ? "bg-blue-50/70 border-[#003399]/40 ring-1 ring-[#003399]/20"
                          : "bg-white hover:bg-slate-50/80 border-slate-200 hover:border-[#003399]/40 hover:shadow-md"
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-xs bg-gradient-to-br ${app.color} text-white group-hover:scale-105 transition-transform`}
                      >
                        {app.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#003399] transition-colors truncate">
                            {app.nama}
                          </h4>
                          {app.isCurrent ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#003399] text-white uppercase">
                              Sedang Aktif
                            </span>
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#003399] shrink-0 ml-auto transition-colors" />
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">
                          {app.kategori}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-snug">
                          {app.deskripsi}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Token SSO HMAC-SHA256 Aktif &amp; Terenkripsi
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
