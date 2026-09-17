"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { AlertTriangle, Clock } from "lucide-react";

export function SessionTracker() {
  const { data: session, update } = useSession();
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

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
  const refreshSession = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await update();
      // Reset waktu kedaluwarsa ke 1 jam ke depan
      expiryTimestampRef.current = Date.now() + 3600 * 1000;
      lastRefreshTimestampRef.current = Date.now();
    } catch (err) {
      console.error("Gagal memperpanjang sesi:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, update]);

  // Monitor aktivitas user di background (klik, ketik, scroll, touch, mousemove)
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
        // Jika sisa waktu <= 5 menit (300 detik) dan user ada aktivitas,
        // perpanjang sesi otomatis 1 jam lagi dan notifikasi warning langsung hilang
        if (remaining <= 300 && timeSinceLastRefresh > 10000) {
          refreshSession();
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

  // Hanya muncul jika sisa waktu <= 5 menit (300 detik) karena user idle
  const isIdleWarning = remainingSeconds <= 300;

  if (!isIdleWarning) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm bg-amber-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-500 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
      <AlertTriangle className="w-5 h-5 text-amber-200 shrink-0" />
      <div className="text-xs">
        <p className="font-bold text-white">Peringatan: Sesi Akan Berakhir</p>
        <p className="text-amber-100 mt-0.5 flex items-center gap-1.5">
          <span>Tidak ada aktivitas. Sisa:</span>
          <span className="font-mono font-bold bg-amber-700/80 px-1.5 py-0.2 rounded text-white flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-300" />
            {formatTime(remainingSeconds)}
          </span>
        </p>
      </div>
    </div>
  );
}
