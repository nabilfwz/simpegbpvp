"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";

function SsoCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ssoToken = searchParams.get("sso_token");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function processSsoLogin() {
      if (!ssoToken) {
        setError("Token SSO tidak ditemukan dalam parameter callback.");
        setLoading(false);
        return;
      }

      try {
        const res = await signIn("sso-kemnaker", {
          ssoToken,
          redirect: false,
          callbackUrl: "/",
        });

        if (res?.error) {
          setError(res.error);
          setLoading(false);
        } else {
          // Hard navigate to ensure fresh session cookies are picked up
          window.location.href = "/";
        }
      } catch (err: any) {
        setError(err?.message || "Gagal memproses sesi login SSO.");
        setLoading(false);
      }
    }

    processSsoLogin();
  }, [ssoToken]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        {loading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-50 text-[#003399] rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-blue-100">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Memvalidasi Sesi SSO Kemnaker...
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Menghubungkan token kredensial dari Central SSO Server BPVP ke aplikasi SIMPEG.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-red-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Autentikasi SSO Gagal
              </h2>
              <p className="text-xs text-red-600 mt-1.5 bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </p>
            </div>
            <div className="pt-2">
              <Button
                onClick={() => router.push("/login")}
                className="w-full bg-[#003399] hover:bg-[#002266] text-white font-bold text-xs h-10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Halaman Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SsoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="p-6 bg-white rounded-xl shadow-md border text-center space-y-3">
            <div className="w-8 h-8 border-4 border-[#003399] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-700">Memproses Sesi SSO...</p>
          </div>
        </div>
      }
    >
      <SsoCallbackContent />
    </Suspense>
  );
}
