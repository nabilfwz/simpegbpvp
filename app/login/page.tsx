"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen bg-gradient-to-br from-[#003399] to-[#0055cc] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-[#003399] p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
              <div className="text-[#003399] font-bold text-2xl">BPVP</div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Sistem Informasi Manajemen Pegawai
            </h1>
            <p className="text-blue-100 text-sm">
              Balai Pelatihan Vokasi dan Produktivitas
            </p>
            <p className="text-blue-200 text-xs mt-1">
              Kementerian Ketenagakerjaan Republik Indonesia
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003399] focus:border-transparent outline-none transition"
                placeholder="email@bpvp.local"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003399] focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#003399] hover:bg-[#002266] text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Masuk..." : "Masuk"}
            </button>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Kredensial default:</p>
              <p className="font-mono text-xs mt-1">
                admin@bpvp.local / admin123
              </p>
            </div>
          </form>
        </div>

        <div className="text-center mt-6 text-white text-sm">
          <p>&copy; 2026 Kementerian Ketenagakerjaan RI</p>
        </div>
      </div>
    </div>
  );
}
