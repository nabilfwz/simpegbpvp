"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DashboardStats {
  totalPegawai: number;
  pegawaiPerUnitKerja: { label: string; count: number }[];
  pegawaiPerStatus: { label: string; count: number }[];
  aktivitasTerbaru: Array<{
    id: string;
    aksi: string;
    entitas: string;
    deskripsi: string;
    createdAt: string;
    user: { nama: string };
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Gagal memuat dashboard");
      const data = await res.json();
      setStats(data);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboard();
    }
  }, [status]);

  const formatCount = (count: number) => count;
  const formatPercent = (count: number, total: number) => {
    if (total === 0) return "0%";
    return ((count / total) * 100).toFixed(1) + "%";
  };

  const getAksiColor = (aksi: string) => {
    switch (aksi) {
      case "CREATE":
        return "text-green-600 bg-green-50";
      case "UPDATE":
        return "text-blue-600 bg-blue-50";
      case "DELETE":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getAksiIcon = (aksi: string) => {
    switch (aksi) {
      case "CREATE":
        return "✨";
      case "UPDATE":
        return "✏️";
      case "DELETE":
        return "🗑️";
      default:
        return "📝";
    }
  };

  if (status === "loading") {
    return <div className="p-6">Memuat...</div>;
  }

  if (!session && status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (loading || !stats) {
    return <div className="p-6">Memuat dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard Manajemen Pegawai
        </h1>
        <p className="text-slate-600 mt-1">Selamat datang, {session?.user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#003399] to-[#0055cc] rounded-xl shadow-md p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-75 mb-1">Total Pegawai</p>
              <p className="text-4xl font-bold">{formatCount(stats.totalPegawai)}</p>
            </div>
            <span className="text-4xl">👥</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-75 mb-1">Unit Kerja</p>
              <p className="text-4xl font-bold">{stats.pegawaiPerUnitKerja.length}</p>
            </div>
            <span className="text-4xl">🏢</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-75 mb-1">Status Pegawai</p>
              <p className="text-4xl font-bold">{stats.pegawaiPerStatus.length}</p>
            </div>
            <span className="text-4xl">📊</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-75 mb-1">Aktivitas Hari Ini</p>
              <p className="text-4xl font-bold">{stats.aktivitasTerbaru.length}</p>
            </div>
            <span className="text-4xl">⚡</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pegawai per Unit Kerja */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Pegawai per Unit Kerja
          </h2>
          {stats.pegawaiPerUnitKerja.length === 0 ? (
            <p className="text-slate-500">Belum ada data</p>
          ) : (
            <div className="space-y-4">
              {stats.pegawaiPerUnitKerja.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-slate-600 font-semibold">
                      {formatCount(item.count)} ({formatPercent(item.count, stats.totalPegawai)})
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#003399] to-[#0055cc] h-2 rounded-full transition-all"
                      style={{ width: `${(item.count / stats.totalPegawai) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pegawai per Status */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Pegawai per Status
          </h2>
          {stats.pegawaiPerStatus.length === 0 ? (
            <p className="text-slate-500">Belum ada data</p>
          ) : (
            <div className="space-y-4">
              {stats.pegawaiPerStatus.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-slate-600 font-semibold">
                      {formatCount(item.count)} ({formatPercent(item.count, stats.totalPegawai)})
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${(item.count / stats.totalPegawai) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          5 Aktivitas Terbaru
        </h2>
        {stats.aktivitasTerbaru.length === 0 ? (
          <p className="text-slate-500">Belum ada aktivitas</p>
        ) : (
          <div className="space-y-4">
            {stats.aktivitasTerbaru.map((activity) => (
              <div key={activity.id} className="flex gap-4 items-start pb-4 border-b border-slate-200 last:border-0">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-semibold ${getAksiColor(activity.aksi)}`}>
                    {getAksiIcon(activity.aksi)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="font-semibold text-slate-900">{activity.user.nama}</p>
                    <span className="text-xs text-slate-500">
                      {new Date(activity.createdAt).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">{activity.deskripsi}</p>
                  <p className="text-xs text-slate-500 mt-1 uppercase font-semibold">
                    {activity.entitas}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
