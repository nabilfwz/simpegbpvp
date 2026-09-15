"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { SearchableSelect } from "@/app/components/ui/searchable-select";
import { isStaffRole } from "@/lib/constants";

interface Pegawai {
  id: string;
  nip: string;
  nama: string;
  aktif: boolean;
  jenisKelamin: { label: string };
  dirjen?: { label: string } | null;
  unitKerja: { label: string };
  subUnitKerja?: { label: string } | null;
  eselon?: { label: string } | null;
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
  const { data: session } = useSession();
  const isAdmin = isStaffRole((session?.user as any)?.role);

  const [pegawais, setPegawais] = useState<Pegawai[]>([]);
  const [counts, setCounts] = useState({ active: 0, trash: 0 });
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [dirjen, setDirjen] = useState("");
  const [unitKerja, setUnitKerja] = useState("");
  const [statusPegawai, setStatusPegawai] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // Master Data Lists
  const [dirjenList, setDirjenList] = useState<{ id: string; label: string; kode?: string | null }[]>([]);
  const [unitKerjaList, setUnitKerjaList] = useState<{ id: string; label: string; kode?: string | null }[]>([]);
  const [statusPegawaiList, setStatusPegawaiList] = useState<{ id: string; label: string }[]>([]);
  const [jenisKelaminList, setJenisKelaminList] = useState<{ id: string; label: string }[]>([]);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append("search", search);
      if (dirjen) params.append("dirjen", dirjen);
      if (unitKerja) params.append("unitKerja", unitKerja);
      if (statusPegawai) params.append("statusPegawai", statusPegawai);
      if (jenisKelamin) params.append("jenisKelamin", jenisKelamin);

      const res = await fetch(`/api/pegawai?${params}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const result = await res.json();

      setPegawais(result.data || []);
      if (result.counts) {
        setCounts(result.counts);
      }
      setPagination(result.pagination);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, search, dirjen, unitKerja, statusPegawai, jenisKelamin]);

  const fetchMasterData = async () => {
    try {
      const [dirjenRes, unitRes, statusRes, jkRes] = await Promise.all([
        fetch("/api/master-data?kategori=DIRJEN"),
        fetch("/api/master-data?kategori=UNIT_KERJA"),
        fetch("/api/master-data?kategori=STATUS_PEGAWAI"),
        fetch("/api/master-data?kategori=JENIS_KELAMIN"),
      ]);

      if (dirjenRes.ok) setDirjenList(await dirjenRes.json());
      if (unitRes.ok) setUnitKerjaList(await unitRes.json());
      if (statusRes.ok) setStatusPegawaiList(await statusRes.json());
      if (jkRes.ok) setJenisKelaminList(await jkRes.json());
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  // Soft Delete: Pindahkan ke Tong Sampah
  const handleSoftDelete = async (pegawai: Pegawai) => {
    if (!confirm(`Pindahkan pegawai "${pegawai.nama}" (${pegawai.nip}) ke Tong Sampah?\n\nData masih tersimpan dan dapat dipulihkan kapan saja.`)) {
      return;
    }

    setActionLoadingId(pegawai.id);
    try {
      const res = await fetch(`/api/pegawai/${pegawai.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memindahkan ke tong sampah");
      }

      toast.success(`Pegawai ${pegawai.nama} berhasil dipindahkan ke Tong Sampah`);
      fetchData(pagination.page);
    } catch (error: any) {
      toast.error(error.message || "Gagal memproses penghapusan");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Data Pegawai BPVP
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Kelola data aparatur sipil, penempatan kerja, dan arsip kepegawaian
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/tong-sampah")}
              className="text-xs h-11 px-4 font-bold border-2 border-slate-300 flex items-center gap-2 hover:bg-slate-100"
            >
              <span>🗑️</span> Tong Sampah
              {counts.trash > 0 && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-extrabold rounded-full border border-rose-300">
                  {counts.trash}
                </span>
              )}
            </Button>
          )}
          <Button
            onClick={() => router.push("/pegawai/tambah")}
            className="bg-[#003399] hover:bg-[#002266] text-white font-bold h-11 px-5 shadow-sm rounded-lg flex items-center gap-2 border border-[#002266]"
          >
            <span>+</span> Tambah Pegawai
          </Button>
        </div>
      </div>

      {/* Filter Bar with Searchable Dropdowns */}
      <div className="bg-white rounded-xl shadow-xs p-4 border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <Input
              type="text"
              placeholder="Cari NIP atau nama pegawai..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchData(1);
              }}
              className="h-10 text-sm"
            />
          </div>

          {/* Unit Kerja Filter */}
          <div>
            <SearchableSelect
              options={[
                { value: "", label: "Semua Unit Kerja" },
                ...unitKerjaList.map((u) => ({
                  value: u.id,
                  label: u.label,
                  kode: u.kode,
                })),
              ]}
              value={unitKerja}
              onChange={(val) => {
                setUnitKerja(val);
              }}
              placeholder="Unit Kerja..."
              searchPlaceholder="Cari unit kerja..."
            />
          </div>

          {/* Status Pegawai Filter */}
          <div>
            <SearchableSelect
              options={[
                { value: "", label: "Semua Status" },
                ...statusPegawaiList.map((s) => ({
                  value: s.id,
                  label: s.label,
                })),
              ]}
              value={statusPegawai}
              onChange={(val) => {
                setStatusPegawai(val);
              }}
              placeholder="Status Pegawai..."
              searchPlaceholder="Cari status..."
            />
          </div>

          {/* Jenis Kelamin Filter */}
          <div>
            <SearchableSelect
              options={[
                { value: "", label: "Semua Jenis Kelamin" },
                ...jenisKelaminList.map((j) => ({
                  value: j.id,
                  label: j.label,
                })),
              ]}
              value={jenisKelamin}
              onChange={(val) => {
                setJenisKelamin(val);
              }}
              placeholder="Jenis Kelamin..."
              searchPlaceholder="Cari jenis kelamin..."
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Menampilkan <strong className="text-slate-800">{pegawais.length}</strong> dari{" "}
            <strong className="text-slate-800">{pagination.total}</strong> pegawai aktif
          </span>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDirjen("");
              setUnitKerja("");
              setStatusPegawai("");
              setJenisKelamin("");
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-lg cursor-pointer transition shadow-2xs hover:text-slate-950"
          >
            ↺ Reset Filter
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 bg-white rounded-xl border border-slate-200">
          <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-[#003399] rounded-full animate-spin mb-2" />
          <p className="text-sm font-medium">Memuat data pegawai...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-left">Foto</th>
                  <th className="px-4 py-3.5 text-left">NIP</th>
                  <th className="px-4 py-3.5 text-left">Nama Lengkap</th>
                  <th className="px-4 py-3.5 text-left">Penempatan / Sub Unit</th>
                  <th className="px-4 py-3.5 text-left">Eselon / Tingkat</th>
                  <th className="px-4 py-3.5 text-left">Status</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pegawais.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                      <div className="space-y-1">
                        <p className="text-3xl">👥</p>
                        <p className="font-semibold text-slate-800 text-sm">Belum ada pegawai</p>
                        <p className="text-xs text-slate-400">Silakan tambahkan pegawai baru melalui tombol di atas</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pegawais.map((p) => {
                    const isProcessing = actionLoadingId === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        {/* Foto */}
                        <td className="px-4 py-3.5">
                          {p.fotoUrl ? (
                            <img
                              src={p.fotoUrl}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                              alt=""
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003399] to-[#0055cc] flex items-center justify-center text-white text-xs font-bold shadow-2xs">
                              {p.nama.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </td>

                        {/* NIP */}
                        <td className="px-4 py-3.5 text-sm font-mono text-slate-900 font-semibold">
                          {p.nip}
                        </td>

                        {/* Nama & JK */}
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-semibold text-slate-900">{p.nama}</p>
                          <p className="text-xs text-slate-500">{p.jenisKelamin?.label || "-"}</p>
                        </td>

                        {/* Penempatan */}
                        <td className="px-4 py-3.5 text-sm">
                          <p className="font-medium text-slate-800">{p.unitKerja?.label || "-"}</p>
                          {p.subUnitKerja && (
                            <p className="text-xs text-blue-700 font-medium">{p.subUnitKerja.label}</p>
                          )}
                        </td>

                        {/* Eselon / Jabatan */}
                        <td className="px-4 py-3.5 text-sm">
                          {p.eselon ? (
                            <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded text-xs font-semibold">
                              {p.eselon.label}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">
                              {p.riwayatJabatan[0]?.jabatan?.label || "-"}
                            </span>
                          )}
                        </td>

                        {/* Status Pegawai */}
                        <td className="px-4 py-3.5 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {p.statusPegawai?.label || "Aktif"}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => router.push(`/pegawai/${p.id}`)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-[#003399] hover:bg-[#002266] rounded-lg shadow-sm border border-[#002266] transition inline-flex items-center gap-1 active:scale-95"
                          >
                            👁️ Lihat Profil
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleSoftDelete(p)}
                            className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-700 hover:text-white rounded-lg border-2 border-rose-300 shadow-2xs transition inline-flex items-center gap-1 active:scale-95 disabled:opacity-50"
                          >
                            {isProcessing ? "Menghapus..." : "🗑️ Hapus"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <Button
            onClick={() => fetchData(pagination.page - 1)}
            disabled={pagination.page === 1}
            variant="outline"
            className="text-xs h-9"
          >
            ← Sebelumnya
          </Button>
          <span className="px-4 py-2 text-xs font-medium text-slate-700">
            Halaman {pagination.page} dari {pagination.totalPages}
          </span>
          <Button
            onClick={() => fetchData(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            variant="outline"
            className="text-xs h-9"
          >
            Selanjutnya →
          </Button>
        </div>
      )}
    </div>
  );
}
