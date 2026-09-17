"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { Clock, RefreshCw, ShieldCheck, Activity, Zap, CheckCircle2 } from "lucide-react";

export function SessionTracker() {
  const { data: session, update } = useSession();
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastActivityText, setLastActivityText] = useState<string>("Baru saja");
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [isSimulated55m, setIsSimulated55m] = useState<boolean>(false);

  const lastActivityTimestampRef = useRef<number>(Date.now());
  const expiryTimestampRef = useRef<number>(Date.now() + 3600 * 1000);
  const lastRefreshTimestampRef = useRef<number>(Date.now());
  const popoverRef = useRef<HTMLDivElement>(null);

  // Inisialisasi waktu kedaluwarsa dari session NextAuth
  useEffect(() => {
    if (session) {
      const exp = (session as any)?.expiresAt;
      if (typeof exp === "number" && exp > Date.now()) {
        expiryTimestampRef.current = exp;
      } else {
        expiryTimestampRef.current = Date.now() + 3600 * 1000;
      }
    }
  }, [session]);

  // Fungsi perpanjang sesi (panggil update NextAuth)
  const refreshSession = useCallback(
    async (reason: "auto" | "manual") => {
      if (isRefreshing) return;
      setIsRefreshing(true);
      try {
        await update();
        // Reset waktu kedaluwarsa ke 1 jam ke depan
        expiryTimestampRef.current = Date.now() + 3600 * 1000;
        lastRefreshTimestampRef.current = Date.now();
        setIsSimulated55m(false);

        const msg =
          reason === "auto"
            ? "⚡ Aktivitas terdeteksi! Token sesi otomatis diperpanjang 1 jam ke depan."
            : "✅ Token sesi berhasil diperpanjang 1 jam ke depan.";

        setShowNotification(msg);
        setTimeout(() => setShowNotification(null), 5000);
      } catch (err) {
        console.error("Gagal refresh sesi:", err);
      } finally {
        setIsRefreshing(false);
      }
    },
    [isRefreshing, update]
  );

  // Monitor aktivitas user (klik, ketik, scroll, touch)
  useEffect(() => {
    let lastRecorded = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      // Batasi throttling aktivitas setiap 3 detik
      if (now - lastRecorded > 3000) {
        lastRecorded = now;
        lastActivityTimestampRef.current = now;
        setLastActivityText("Baru saja");

        // CEK SLIDING/ROLLING SESSION:
        // Jika sesi sudah berjalan mendekati menit 55 (sisa <= 5 menit / 300 detik)
        // ATAU simulasi menit 55 aktif, maka perpanjang otomatis!
        const remaining = Math.max(0, Math.floor((expiryTimestampRef.current - now) / 1000));
        const timeSinceLastRefresh = now - lastRefreshTimestampRef.current;

        // Auto update jika sisa waktu <= 5 menit (300 detik) dan belum baru saja di-refresh
        if (remaining <= 300 && timeSinceLastRefresh > 10000) {
          refreshSession("auto");
        }
      }
    };

    window.addEventListener("mousedown", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });
    window.addEventListener("scroll", handleUserActivity, { passive: true });
    window.addEventListener("touchstart", handleUserActivity, { passive: true });

    return () => {
      window.removeEventListener("mousedown", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
    };
  }, [refreshSession]);

  // Timer interval setiap 1 detik untuk countdown & teks aktivitas
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiryTimestampRef.current - now) / 1000));
      setRemainingSeconds(diff);

      // Hitung label aktivitas terakhir
      const secSinceAct = Math.floor((now - lastActivityTimestampRef.current) / 1000);
      if (secSinceAct < 10) {
        setLastActivityText("Baru saja");
      } else if (secSinceAct < 60) {
        setLastActivityText(`${secSinceAct} dtk lalu`);
      } else {
        const min = Math.floor(secSinceAct / 60);
        setLastActivityText(`${min} mnt lalu`);
      }

      // Jika waktu benar-benar habis, arahkan ke login
      if (diff <= 0) {
        signOut({ callbackUrl: "/login?reason=expired" });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Tutup popover jika klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Format menit & detik MM:SS
  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Uji Coba: Simulasi Menit ke-55 (Sisa 5 menit)
  const triggerSimulate55Min = () => {
    // Set expiry ke 5 menit lagi dari sekarang (seperti sudah 55 menit berjalan)
    expiryTimestampRef.current = Date.now() + 5 * 60 * 1000;
    lastRefreshTimestampRef.current = Date.now() - 55 * 60 * 1000;
    setIsSimulated55m(true);
    setShowNotification(
      "⏱️ Simulasi aktif: Sisa waktu diatur ke 5 menit (menit ke-55). Lakukan aktivitas (klik/scroll/ketik) untuk menguji auto-refresh!"
    );
    setTimeout(() => setShowNotification(null), 6000);
  };

  const isWarning = remainingSeconds <= 300; // <= 5 menit

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Toast Notification Alert jika auto update terjadi */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-blue-500/30 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1 text-xs leading-relaxed">
            <p className="font-semibold text-white">Sliding Session BPVP</p>
            <p className="text-slate-300 mt-0.5">{showNotification}</p>
          </div>
          <button
            onClick={() => setShowNotification(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Trigger Button di Desktop Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer ${
          isWarning
            ? "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 animate-pulse"
            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
        }`}
        title="Klik untuk melihat status token & kontrol pengujian sliding session"
      >
        <Clock className={`w-3.5 h-3.5 ${isWarning ? "text-amber-600" : "text-[#003399]"}`} />
        <span className="font-mono text-xs font-bold tracking-tight">
          {formatTime(remainingSeconds)}
        </span>
        <span
          className={`w-2 h-2 rounded-full ${
            isWarning ? "bg-amber-500" : "bg-emerald-500"
          } animate-ping`}
        />
      </button>

      {/* Popover Dropdown Panel Info & Testing */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#003399]" />
              <h4 className="text-xs font-bold text-slate-900">Masa Aktif Token Sesi</h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#003399] border border-blue-100">
              1 Jam (Sliding)
            </span>
          </div>

          {/* Countdown Display Card */}
          <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
            <p className="text-[11px] font-medium text-slate-500 mb-1">Sisa Masa Berlaku</p>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-2xl font-black font-mono tracking-tight ${isWarning ? "text-amber-600" : "text-[#003399]"}`}>
                {formatTime(remainingSeconds)}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 60:00</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-center gap-1">
              <Activity className="w-3 h-3 text-emerald-500" />
              Aktivitas: <strong className="text-slate-700">{lastActivityText}</strong>
            </p>
          </div>

          {/* Konsep Rolling Session Info */}
          <div className="mt-3 p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-[#003399] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              Auto-Extend pada Menit ke-55
            </p>
            <p className="leading-relaxed text-[10.5px]">
              Token berlaku <strong>1 jam</strong>. Jika ada aktivitas user saat mendekati menit ke-55 (sisa 5 menit), token akan <strong>otomatis diperpanjang 1 jam lagi</strong> secara mulus.
            </p>
          </div>

          {/* Fitur Uji Coba (Testing Controls) */}
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Fitur Pengujian (Testing):
            </p>

            <button
              onClick={() => refreshSession("manual")}
              disabled={isRefreshing}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#003399] text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Memperbarui Sesi..." : "Perpanjang Sekarang (+1 Jam)"}
            </button>

            <button
              onClick={triggerSimulate55Min}
              disabled={isRefreshing || isSimulated55m}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold hover:bg-amber-100 disabled:opacity-50 transition-colors cursor-pointer"
              title="Mengatur sisa waktu sesi menjadi 5 menit untuk mengetes auto-refresh saat ada aktivitas"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              Simulasi Menit 55 (Sisa 5m)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
