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
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#003399] to-[#0055cc] p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-md">
              <div className="text-[#003399] font-bold text-3xl">BPVP</div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Sistem Informasi Manajemen Pegawai
            </h1>
            <p className="text-blue-100 text-sm">
              Balai Pelatihan Vokasi dan Produktivitas
            </p>
            <p className="text-blue-200 text-xs mt-1">
              Kementerian Ketenagakerjaan Republik Indonesia
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Contoh: admin@bpvp.local"
                className="w-full h-11 text-base"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Masukkan password Anda"
                className="w-full h-11 text-base"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#003399] hover:bg-[#002266] text-white font-semibold text-base"
            >
              {loading ? "Sedang masuk..." : "Masuk"}
            </Button>

            <div className="border-t border-slate-200 pt-6 text-center">
              <p className="text-xs text-slate-600 mb-2">Kredensial demo:</p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="font-mono text-sm text-slate-700">admin@bpvp.local</p>
                <p className="font-mono text-sm text-slate-700">admin123</p>
              </div>
            </div>
          </form>
        </div>

        <div className="text-center mt-8 text-slate-600 text-sm">
          <p>&copy; 2026 Kementerian Ketenagakerjaan RI</p>
        </div>
      </div>
    </div>
  );
}
