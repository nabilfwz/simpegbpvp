"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Trash2, RotateCcw, AlertTriangle, ShieldAlert, ArrowLeft, Search, Filter } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { SearchableSelect } from "@/app/components/ui/searchable-select";

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
  updatedAt: string;
  fotoUrl: string | null;
}

export default function AdminTongSampahPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  const [pegawais, setPegawais] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [unitKerja, setUnitKerja] = useState("");
  const [statusPegawai, setStatusPegawai] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // Filter Master Data
  const [unitKerjaList, setUnitKerjaList] = useState<{ id: string; label: string }[]>([]);
  const [statusPegawaiList, setStatusPegawaiList] = useState<{ id: string; label: string }[]>([]);

  // Modal Confirmation for Permanent Delete
  const [deleteConfirmPegawai, setDeleteConfirmPegawai] = useState<Pegawai | null>(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        trash: "true",
      });

      if (search) params.append("search", search);
      if (unitKerja) params.append("unitKerja", unitKerja);
      if (statusPegawai) params.append("statusPegawai", statusPegawai);

      const res = await fetch(`/api/pegawai?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data tong sampah");
      const data = await res.json();

      setPegawais(data.data || []);
      setPagination(data.pagination);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data tong sampah");
    } finally {
      setLoading(false);
    }
  }, [search, unitKerja, statusPegawai, pagination.limit]);

  const fetchFilters = async () => {
    try {
      const [ukRes, spRes] = await Promise.all([
        fetch("/api/master-data?kategori=UNIT_KERJA"),
        fetch("/api/master-data?kategori=STATUS_PEGAWAI"),
      ]);

      if (ukRes.ok) {
        const data = await ukRes.json();
        setUnitKerjaList(data);
      }
      if (spRes.ok) {
        const data = await spRes.json();
        setStatusPegawaiList(data);
      }
    } catch (err) {
      console.error("Error fetching filters:", err);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
      fetchFilters();
      fetchData(1);
    }
  }, [status, isAdmin]);

  // Restore Pegawai
  const handleRestore = async (p: Pegawai) => {
    if (!confirm(`Pulihkan pegawai "${p.nama}" (${p.nip}) kembali ke status pegawai aktif?`)) return;

    setActionLoadingId(p.id);
    try {
      const res = await fetch(`/api/pegawai/${p.id}/restore`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || "Gagal memulihkan pegawai");
      }

      toast.success(`Pegawai ${p.nama} berhasil dipulihkan ke status aktif`);
      fetchData(pagination.page);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat memulihkan data");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Permanent Delete Pegawai
  const handlePermanentDelete = async () => {
    if (!deleteConfirmPegawai) return;

    const p = deleteConfirmPegawai;
    setActionLoadingId(p.id);
    try {
      const res = await fetch(`/api/pegawai/${p.id}?permanent=true`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || "Gagal menghapus pegawai secara permanen");
      }

      toast.success(`Pegawai ${p.nama} (${p.nip}) telah dihapus secara permanen`);
      setDeleteConfirmPegawai(null);
      fetchData(pagination.page);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat menghapus permanen");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (status === "loading") {
    return <div className="p-8 text-center text-slate-500">Memeriksa izin Administrator...</div>;
  }

  // Access check: only admin can view this page
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border-2 border-rose-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-rose-100 text-rose-700 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Akses Dibatasi — Administrator Only</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto">
          Halaman Tong Sampah Pegawai hanya dapat diakses oleh Administrator Sistem untuk memulihkan atau menghapus arsip pegawai secara permanen.
        </p>
        <div className="pt-2">
          <Button
            onClick={() => router.push("/pegawai")}
            className="bg-[#003399] hover:bg-[#002266] text-white font-bold text-sm px-6 h-10 shadow-md"
          >
            &larr; Kembali ke Data Pegawai
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-rose-800 tracking-tight flex items-center gap-2.5">
              <Trash2 className="w-7 h-7 text-rose-700" />
              Tong Sampah Pegawai (Khusus Administrator)
            </h1>
            <span className="px-2.5 py-0.5 bg-rose-100 text-rose-900 font-extrabold text-xs rounded-full border border-rose-300">
              {pagination.total} Nonaktif
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Kelola arsip pegawai yang telah dinonaktifkan: pulihkan kembali ke operasional aktif atau hapus permanen dari sistem.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/pegawai")}
          className="text-xs h-10 px-4 font-bold border-2 border-slate-300 self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Kembali ke Data Pegawai
        </Button>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-950">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-bold text-sm text-amber-900">Perhatian Hak Akses Administrator:</p>
          <p>
            Data di tong sampah tidak aktif di seluruh operasional, tidak dapat login SSO, dan disembunyikan dari daftar utama pegawai.
            Klik <strong>"Pulihkan Data"</strong> untuk mengaktifkan kembali pegawai, atau <strong>"Hapus Permanen"</strong> untuk menghapus tuntas beserta seluruh riwayat pangkat &amp; jabatan.
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-5 rounded-xl border-2 border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Cari Nama / NIP
            </label>
            <div className="relative">
              <Input
                placeholder="Ketik nama atau NIP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-xs border-2 border-slate-300"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Filter Unit Kerja
            </label>
            <SearchableSelect
              options={unitKerjaList.map((u) => ({ value: u.id, label: u.label }))}
              value={unitKerja}
              onChange={(val) => setUnitKerja(val)}
              placeholder="Semua Unit Kerja..."
              searchPlaceholder="Cari unit kerja..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Filter Status Pegawai
            </label>
            <SearchableSelect
              options={statusPegawaiList.map((s) => ({ value: s.id, label: s.label }))}
              value={statusPegawai}
              onChange={(val) => setStatusPegawai(val)}
              placeholder="Semua Status (PNS/PPPK/PPNPN)..."
              searchPlaceholder="Cari status pegawai..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setUnitKerja("");
              setStatusPegawai("");
            }}
            className="text-xs h-9 border-2 border-slate-300 font-bold"
          >
            Reset Filter
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => fetchData(1)}
            className="bg-[#003399] hover:bg-[#002266] text-white text-xs h-9 px-4 font-bold border border-[#002266]"
          >
            Terapkan Filter
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border-2 border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Memuat data tong sampah...
          </div>
        ) : pegawais.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Trash2 className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-base text-slate-700">Tong Sampah Bersih</p>
            <p className="text-xs text-slate-500">
              Tidak ada arsip pegawai nonaktif yang tersimpan di dalam tong sampah.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="px-4 py-3 w-12">No</th>
                  <th className="px-4 py-3">Pegawai / ASN</th>
                  <th className="px-4 py-3">Penempatan Organisasi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi Administrator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pegawais.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-rose-50/20 transition">
                    <td className="px-4 py-3.5 font-mono text-slate-500">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {p.fotoUrl ? (
                          <img
                            src={p.fotoUrl}
                            className="w-10 h-10 rounded-full object-cover border-2 border-rose-300 shrink-0"
                            alt=""
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-sm shrink-0 border border-rose-200">
                            {p.nama.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-snug line-through text-slate-500">
                            {p.nama}
                          </p>
                          <p className="font-mono text-slate-500 text-[11px]">{p.nip}</p>
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold">
                            Dinonaktifkan
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 space-y-0.5">
                      <p className="font-bold text-slate-800">{p.unitKerja.label}</p>
                      {p.subUnitKerja && (
                        <p className="text-slate-600 text-[11px]">{p.subUnitKerja.label}</p>
                      )}
                      {p.eselon && (
                        <p className="text-amber-800 font-semibold text-[10px]">{p.eselon.label}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-md border border-slate-300">
                        {p.statusPegawai.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={actionLoadingId === p.id}
                          onClick={() => handleRestore(p)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs border border-emerald-900 shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Pulihkan Data
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === p.id}
                          onClick={() => setDeleteConfirmPegawai(p)}
                          className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs border border-rose-950 shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus Permanen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              Halaman <strong>{pagination.page}</strong> dari <strong>{pagination.totalPages}</strong> (Total {pagination.total} data)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => fetchData(pagination.page - 1)}
                className="text-xs h-8 border-2 border-slate-300 font-bold"
              >
                &larr; Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => fetchData(pagination.page + 1)}
                className="text-xs h-8 border-2 border-slate-300 font-bold"
              >
                Selanjutnya &rarr;
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog Konfirmasi Hapus Permanen */}
      {deleteConfirmPegawai && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-rose-300 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="p-3 bg-rose-100 rounded-full border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Hapus Permanen</h3>
                <p className="text-xs text-rose-700 font-bold uppercase tracking-wider">Aksi ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs text-slate-800 space-y-2 leading-relaxed">
              <p>
                Anda akan menghapus data pegawai berikut secara permanen dari basis data sistem:
              </p>
              <div className="p-2.5 bg-white rounded-lg border border-rose-200 font-mono text-[11px] space-y-1">
                <p><span className="text-slate-500">Nama :</span> <strong>{deleteConfirmPegawai.nama}</strong></p>
                <p><span className="text-slate-500">NIP  :</span> <strong>{deleteConfirmPegawai.nip}</strong></p>
                <p><span className="text-slate-500">Unit :</span> {deleteConfirmPegawai.unitKerja.label}</p>
              </div>
              <p className="text-rose-900 font-semibold">
                Seluruh data demografi, riwayat kepangkatan, dan riwayat jabatan yang terhubung akan ikut dihapus tuntas.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirmPegawai(null)}
                disabled={actionLoadingId === deleteConfirmPegawai.id}
                className="text-xs h-9 px-4 font-bold border-2 border-slate-300"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handlePermanentDelete}
                disabled={actionLoadingId === deleteConfirmPegawai.id}
                className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs h-9 px-5 border border-rose-950 shadow-md"
              >
                {actionLoadingId === deleteConfirmPegawai.id ? "Menghapus..." : "Ya, Hapus Permanen"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
