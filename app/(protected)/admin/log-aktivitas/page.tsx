"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface LogAktivitas {
  id: string;
  userId: string;
  aksi: "CREATE" | "UPDATE" | "DELETE";
  entitas: string;
  entitasId: string;
  deskripsi: string;
  dataSebelum: any;
  dataSesudah: any;
  ipAddress: string | null;
  createdAt: string;
  user: {
    nama: string;
  };
}

interface FilterParams {
  startDate: string;
  endDate: string;
  aksi: string;
  entitas: string;
  userId: string;
}

export default function LogAktivitasPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogAktivitas[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({
    startDate: "",
    endDate: "",
    aksi: "",
    entitas: "",
    userId: "",
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [userList, setUserList] = useState<{ id: string; nama: string }[]>([]);
  const [entitasList, setEntitasList] = useState<{ label: string }[]>([]);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.aksi) params.append("aksi", filters.aksi);
      if (filters.entitas) params.append("entitas", filters.entitas);
      if (filters.userId) params.append("userId", filters.userId);

      const res = await fetch(`/api/log-aktivitas?${params}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();

      setLogs(data.data);
      setPagination(data.pagination);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [userRes] = await Promise.all([
        fetch("/api/users?limit=100"),
      ]);

      if (userRes.ok) {
        const users = await userRes.json();
        setUserList(users.data || users);
      }
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

  useEffect(() => {
    fetchFilters();
    fetchData();
  }, []);

  const formatDataDiff = (before: any, after: any) => {
    if (!before || !after) return null;

    const changes: any[] = [];
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of keys) {
      if (key === "id" || key === "createdAt" || key === "updatedAt") continue;
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes.push({ key, before: before[key], after: after[key] });
      }
    }

    return changes;
  };

  const renderChange = (before: any, after: any) => {
    if (before === null || before === undefined) {
      return <span className="text-green-600">{after}</span>;
    }
    if (after === null || after === undefined) {
      return <span className="text-red-600 line-through">{before}</span>;
    }
    return (
      <div className="space-y-1">
        <span className="text-red-600 line-through text-sm">{before}</span>
        <span className="text-green-600 text-sm">{after}</span>
      </div>
    );
  };

  const getAksiColor = (aksi: string) => {
    switch (aksi) {
      case "CREATE":
        return "bg-green-100 text-green-700";
      case "UPDATE":
        return "bg-blue-100 text-blue-700";
      case "DELETE":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getEntitasLabel = (entitas: string) => {
    const labels: Record<string, string> = {
      MasterData: "Master Data",
      Pegawai: "Pegawai",
      RiwayatPangkat: "Riwayat Pangkat",
      RiwayatJabatan: "Riwayat Jabatan",
      User: "User",
    };
    return labels[entitas] || entitas;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003399]">Log Aktivitas</h1>
        <p className="text-gray-600 mt-1">Pantau semua aktivitas sistem</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => {
              setFilters({ ...filters, startDate: e.target.value });
              fetchData(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
            placeholder="Dari Tanggal"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => {
              setFilters({ ...filters, endDate: e.target.value });
              fetchData(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
            placeholder="Sampai Tanggal"
          />
          <select
            value={filters.aksi}
            onChange={(e) => {
              setFilters({ ...filters, aksi: e.target.value });
              fetchData(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
          >
            <option value="">Semua Aksi</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
          <select
            value={filters.entitas}
            onChange={(e) => {
              setFilters({ ...filters, entitas: e.target.value });
              fetchData(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
          >
            <option value="">Semua Entitas</option>
            {entitasList.map((e) => (
              <option key={e.label} value={e.label}>
                {e.label}
              </option>
            ))}
          </select>
          <select
            value={filters.userId}
            onChange={(e) => {
              setFilters({ ...filters, userId: e.target.value });
              fetchData(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
          >
            <option value="">Semua User</option>
            {userList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Memuat data...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Waktu</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Entitas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Deskripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Belum ada aktivitas
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(log.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{log.user.nama}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAksiColor(log.aksi)}`}>
                        {log.aksi}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{getEntitasLabel(log.entitas)}</td>
                    <td className="px-4 py-3 text-sm">{log.deskripsi}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => fetchData(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Sebelumnya
          </button>
          <span className="px-4 py-1 text-sm">
            Halaman {pagination.page} dari {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchData(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
}
