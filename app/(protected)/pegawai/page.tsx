"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Data Pegawai</h1>
          <p className="text-slate-600 mt-1">Kelola data pegawai dan informasi kepegawaian</p>
        </div>
        <Button
          onClick={() => router.push("/pegawai/tambah")}
          className="bg-[#003399] hover:bg-[#002266] text-white font-semibold h-11 px-6"
        >
          + Tambah Pegawai
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            type="text"
            placeholder="Cari nama atau NIP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              fetchData(1);
            }}
            className="h-11"
          />
          <select
            value={unitKerja}
            onChange={(e) => {
              setUnitKerja(e.target.value);
              fetchData(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none h-11"
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
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none h-11"
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
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none h-11"
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

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Memuat data...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Foto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">NIP</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Jenis Kelamin</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Penempatan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Jabatan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Pangkat</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pegawais.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      Belum ada pegawai
                    </td>
                  </tr>
                ) : (
                  pegawais.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        {p.fotoUrl ? (
                          <img src={p.fotoUrl} className="w-10 h-10 rounded-full object-cover border border-slate-200" alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-xs font-bold">
                            {p.nama.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-900 font-semibold">{p.nip}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.nama}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{p.jenisKelamin.label}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{p.unitKerja.label}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {p.riwayatJabatan[0]?.jabatan?.label || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {p.riwayatPangkat[0]?.pangkatGolongan?.label || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          {p.statusPegawai.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => router.push(`/pegawai/${p.id}`)}
                          className="text-[#003399] hover:text-[#002266] font-semibold text-sm transition"
                        >
                          Lihat
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-600 hover:text-red-700 font-semibold text-sm transition"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => fetchData(pagination.page - 1)}
            disabled={pagination.page === 1}
            variant="outline"
          >
            ← Sebelumnya
          </Button>
          <span className="px-4 py-2 text-sm text-slate-700">
            Halaman {pagination.page} dari {pagination.totalPages}
          </span>
          <Button
            onClick={() => fetchData(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            variant="outline"
          >
            Selanjutnya →
          </Button>
        </div>
      )}
    </div>
  );
}
