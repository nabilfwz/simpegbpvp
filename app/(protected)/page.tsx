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
        return "text-green-600";
      case "UPDATE":
        return "text-blue-600";
      case "DELETE":
        return "text-red-600";
      default:
        return "text-gray-600";
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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#003399]">
          Dashboard Manajemen Pegawai
        </h1>
        <p className="text-gray-600 mt-1">Selamat datang, {session?.user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#003399] rounded-lg shadow p-6 text-white">
          <p className="text-sm opacity-75 mb-1">Total Pegawai</p>
          <p className="text-4xl font-bold">{formatCount(stats.totalPegawai)}</p>
        </div>
        <div className="bg-gradient-to-br from-[#0055cc] to-[#004499] rounded-lg shadow p-6 text-white">
          <p className="text-sm opacity-75 mb-1">Unit Kerja</p>
          <p className="text-4xl font-bold">{formatCount(stats.pegawaiPerUnitKerja.length)}</p>
        </div>
        <div className="bg-gradient-to-br from-[#0066dd] to-[#0055cc] rounded-lg shadow p-6 text-white">
          <p className="text-sm opacity-75 mb-1">Status Pegawai</p>
          <p className="text-4xl font-bold">{formatCount(stats.pegawaiPerStatus.length)}</p>
        </div>
        <div className="bg-gradient-to-br from-[#0077ee] to-[#0066dd] rounded-lg shadow p-6 text-white">
          <p className="text-sm opacity-75 mb-1">Aktivitas Hari Ini</p>
          <p className="text-4xl font-bold">
            {stats.aktivitasTerbaru.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-[#003399]">
            Pegawai per Unit Kerja
          </h2>
          {stats.pegawaiPerUnitKerja.length === 0 ? (
            <p className="text-gray-500">Belum ada data</p>
          ) : (
            <div className="space-y-3">
              {stats.pegawaiPerUnitKerja.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-medium">
                      {formatCount(item.count)} ({formatPercent(item.count, stats.totalPegawai)})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#003399] h-2 rounded-full"
                      style={{ width: `${(item.count / stats.totalPegawai) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-[#003399]">
            Pegawai per Status
          </h2>
          {stats.pegawaiPerStatus.length === 0 ? (
            <p className="text-gray-500">Belum ada data</p>
          ) : (
            <div className="space-y-3">
              {stats.pegawaiPerStatus.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-medium">
                      {formatCount(item.count)} ({formatPercent(item.count, stats.totalPegawai)})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#003399] h-2 rounded-full"
                      style={{ width: `${(item.count / stats.totalPegawai) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-[#003399]">
          5 Aktivitas Terbaru
        </h2>
        {stats.aktivitasTerbaru.length === 0 ? (
          <p className="text-gray-500">Belum ada aktivitas</p>
        ) : (
          <div className="space-y-4">
            {stats.aktivitasTerbaru.map((activity) => (
              <div key={activity.id} className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.aksi === "CREATE" ? "bg-green-100" :
                    activity.aksi === "UPDATE" ? "bg-blue-100" :
                    "bg-red-100"
                  }`}>
                    <span className={`font-bold ${getAksiColor(activity.aksi)}`}>
                      {activity.aksi[0]}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <p className="font-medium">{activity.user.nama}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{activity.deskripsi}</p>
                  <p className="text-xs text-gray-400 mt-1">
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
