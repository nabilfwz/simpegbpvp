"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { AlertTriangle, Clock, RefreshCw, LogOut, CheckCircle2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export function SessionTracker() {
  const { data: session, update } = useSession();
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showExtendedToast, setShowExtendedToast] = useState<boolean>(false);

  const lastActivityTimestampRef = useRef<number>(Date.now());
  const expiryTimestampRef = useRef<number>(Date.now() + 3600 * 1000);
  const lastRefreshTimestampRef = useRef<number>(Date.now());

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

  // Fungsi perpanjang sesi
  const refreshSession = useCallback(async (showFeedback = false) => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await update();
      // Reset waktu kedaluwarsa ke 1 jam ke depan
      expiryTimestampRef.current = Date.now() + 3600 * 1000;
      lastRefreshTimestampRef.current = Date.now();

      if (showFeedback) {
        setShowExtendedToast(true);
        setTimeout(() => setShowExtendedToast(false), 4000);
      }
    } catch (err) {
      console.error("Gagal memperpanjang sesi:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, update]);

  // Monitor aktivitas user di background (klik, ketik, scroll, touch)
  useEffect(() => {
    let lastRecorded = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttling pencatatan setiap 3 detik
      if (now - lastRecorded > 3000) {
        lastRecorded = now;
        lastActivityTimestampRef.current = now;

        const remaining = Math.max(0, Math.floor((expiryTimestampRef.current - now) / 1000));
        const timeSinceLastRefresh = now - lastRefreshTimestampRef.current;

        // AUTO SLIDING SESSION:
        // Jika sisa waktu <= 5 menit (300 detik) dan user baru saja kembali aktif,
        // perpanjang sesi otomatis dan sembunyikan peringatan idle
        if (remaining <= 300 && timeSinceLastRefresh > 10000) {
          refreshSession(true);
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

  // Timer interval setiap 1 detik
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiryTimestampRef.current - now) / 1000));
      setRemainingSeconds(diff);

      // Jika waktu benar-benar habis, arahkan ke login
      if (diff <= 0) {
        signOut({ callbackUrl: "/login?reason=expired" });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format menit & detik MM:SS
  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Hanya muncul jika sisa waktu <= 5 menit (300 detik) karena user idle/tidak beraktivitas
  const isIdleWarning = remainingSeconds <= 300;

  return (
    <>
      {/* Toast konfirmasi saat sesi berhasil diperpanjang otomatis setelah idle */}
      {showExtendedToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-white">Sesi Dilanjutkan</p>
            <p className="text-emerald-200 mt-0.5">Token sesi berhasil diperpanjang 1 jam ke depan.</p>
          </div>
        </div>
      )}

      {/* Floating Dialog Peringatan: HANYA muncul di 5 menit terakhir jika komputer ditinggal idle */}
      {isIdleWarning && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 animate-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Sesi Anda Akan Berakhir</h3>
                <p className="text-xs text-slate-500">Tidak ada aktivitas terdeteksi belakangan ini</p>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-center mb-5">
              <p className="text-xs text-amber-900 font-medium mb-1">
                Sesi login Anda akan otomatis ditutup dalam:
              </p>
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-amber-700 animate-spin" />
                <span className="text-3xl font-black font-mono text-amber-900 tracking-tight">
                  {formatTime(remainingSeconds)}
                </span>
              </div>
              <p className="text-[11px] text-amber-700 mt-2">
                Gerakkan mouse, ketik tombol apa saja, atau klik tombol di bawah untuk melanjutkan bekerja tanpa keluar sistem.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Keluar Sekarang
              </Button>
              <Button
                size="sm"
                onClick={() => refreshSession(true)}
                disabled={isRefreshing}
                className="text-xs bg-[#003399] hover:bg-blue-800 text-white cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Memperpanjang..." : "Lanjutkan Bekerja (+1 Jam)"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
