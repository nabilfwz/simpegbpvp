"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Pegawai {
  id: string;
  nip: string;
  nama: string;
  jenisKelamin: { label: string };
  unitKerja: { label: string };
  statusPegawai: { label: string };
  riwayatJabatan: Array<{
    jabatan: { label: string } | null;
    unitKerja: { label: string } | null;
  }>;
  riwayatPangkat: Array<{
    pangkatGolongan: { label: string } | null;
  }>;
  fotoUrl: string | null;
}

export default function PegawaiPage() {
  const router = useRouter();
  const [pegawais, setPegawais] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [unitKerja, setUnitKerja] = useState("");
  const [statusPegawai, setStatusPegawai] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [unitKerjaList, setUnitKerjaList] = useState<{ id: string; label: string }[]>([]);
  const [statusPegawaiList, setStatusPegawaiList] = useState<{ id: string; label: string }[]>([]);
  const [jenisKelaminList, setJenisKelaminList] = useState<{ id: string; label: string }[]>([]);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append("search", search);
      if (unitKerja) params.append("unitKerja", unitKerja);
      if (statusPegawai) params.append("statusPegawai", statusPegawai);
      if (jenisKelamin) params.append("jenisKelamin", jenisKelamin);

      const res = await fetch(`/api/pegawai?${params}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();

      setPegawais(data.data);
      setPagination(data.pagination);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [unitRes, statusRes, jkRes] = await Promise.all([
        fetch("/api/master-data?kategori=UNIT_KERJA"),
        fetch("/api/master-data?kategori=STATUS_PEGAWAI"),
        fetch("/api/master-data?kategori=JENIS_KELAMIN"),
      ]);

      if (unitRes.ok) setUnitKerjaList(await unitRes.json());
      if (statusRes.ok) setStatusPegawaiList(await statusRes.json());
      if (jkRes.ok) setJenisKelaminList(await jkRes.json());
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Nonaktifkan pegawai ini?")) return;

    try {
      const res = await fetch(`/api/pegawai/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Pegawai berhasil dinonaktifkan");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menonaktifkan pegawai");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#003399]">Manajemen Pegawai</h1>
          <p className="text-gray-600 mt-1">Daftar pegawai dan informasi kepegawaian</p>
        </div>
        <button
          onClick={() => router.push("/pegawai/tambah")}
          className="bg-[#003399] text-white px-4 py-2 rounded-lg hover:bg-[#002266] transition"
        >
          + Tambah Pegawai
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Cari nama atau NIP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              fetchData(1);
            }}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
          />
          <select
            value={unitKerja}
            onChange={(e) => {
              setUnitKerja(e.target.value);
              fetchData(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
          >
            <option value="">Semua Unit Kerja</option>
            {unitKerjaList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
          <select
            value={statusPegawai}
            onChange={(e) => {
              setStatusPegawai(e.target.value);
              fetchData(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
          >
            <option value="">Semua Status</option>
            {statusPegawaiList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={jenisKelamin}
            onChange={(e) => {
              setJenisKelamin(e.target.value);
              fetchData(1);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
          >
            <option value="">Semua Jenis Kelamin</option>
            {jenisKelaminList.map((j) => (
              <option key={j.id} value={j.id}>
                {j.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Memuat data...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Foto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NIP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jenis Kelamin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Penempatan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jabatan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pangkat</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pegawais.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Belum ada pegawai
                  </td>
                </tr>
              ) : (
                pegawais.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {p.fotoUrl ? (
                        <img src={p.fotoUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                          ?
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{p.nip}</td>
                    <td className="px-4 py-3 text-sm font-medium">{p.nama}</td>
                    <td className="px-4 py-3 text-sm">{p.jenisKelamin.label}</td>
                    <td className="px-4 py-3 text-sm">{p.unitKerja.label}</td>
                    <td className="px-4 py-3 text-sm">
                      {p.riwayatJabatan[0]?.jabatan?.label || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {p.riwayatPangkat[0]?.pangkatGolongan?.label || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">{p.statusPegawai.label}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => router.push(`/pegawai/${p.id}`)}
                        className="text-[#003399] hover:underline text-sm"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Nonaktifkan
                      </button>
                    </td>
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
