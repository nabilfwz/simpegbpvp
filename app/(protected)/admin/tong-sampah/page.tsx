"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  Users,
  Database,
  UserCheck,
  Layers,
  Clock,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { hasAdminAccess } from "@/lib/constants";

interface UnifiedTrashItem {
  id: string;
  modul: "PEGAWAI" | "MASTER_DATA" | "USER";
  modulLabel: string;
  subModul: string;
  identitas: string;
  detail: string;
  tanggalDihapus: string;
}

interface Counts {
  all: number;
  pegawai: number;
  masterData: number;
  user: number;
}

export default function AdminTongSampahPage() {
  const { data: session, status } = useSession();
  const canAccess = hasAdminAccess((session?.user as any)?.role);

  const [items, setItems] = useState<UnifiedTrashItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filters & State
  const [activeModul, setActiveModul] = useState<"ALL" | "PEGAWAI" | "MASTER_DATA" | "USER">("ALL");
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState<Counts>({ all: 0, pegawai: 0, masterData: 0, user: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Confirmation Modals
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<UnifiedTrashItem | null>(null);
  const [restoreConfirmItem, setRestoreConfirmItem] = useState<UnifiedTrashItem | null>(null);

  const fetchData = useCallback(
    async (page = 1, currentModul = activeModul, currentSearch = search) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          modul: currentModul,
        });

        if (currentSearch) params.append("search", currentSearch);

        const res = await fetch(`/api/tong-sampah?${params.toString()}`);
        if (!res.ok) throw new Error("Gagal mengambil data tong sampah");
        const json = await res.json();

        setItems(json.data || []);
        if (json.counts) setCounts(json.counts);
        if (json.pagination) setPagination(json.pagination);
      } catch (error: any) {
        toast.error(error.message || "Gagal memuat data tong sampah");
      } finally {
        setLoading(false);
      }
    },
    [activeModul, search, pagination.limit]
  );

  useEffect(() => {
    if (status === "authenticated" && canAccess) {
      fetchData(1);
    }
  }, [status, canAccess, activeModul]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, activeModul, search);
  };

  const handleRestore = async (item: UnifiedTrashItem) => {
    setActionLoadingId(item.id);
    try {
      const res = await fetch("/api/tong-sampah/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, modul: item.modul }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memulihkan data");

      toast.success(data.message || `Data ${item.identitas} berhasil dipulihkan!`);
      setRestoreConfirmItem(null);
      fetchData(pagination.page);
    } catch (error: any) {
      toast.error(error.message || "Gagal memulihkan data");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePermanentDelete = async (item: UnifiedTrashItem) => {
    setActionLoadingId(item.id);
    try {
      const res = await fetch("/api/tong-sampah/permanent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, modul: item.modul }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus permanen");

      toast.success(data.message || `Data ${item.identitas} berhasil dihapus permanen!`);
      setDeleteConfirmItem(null);
      fetchData(pagination.page);
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus data permanen");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getModulBadge = (modul: string, subModul: string) => {
    switch (modul) {
      case "PEGAWAI":
        return (
          <div className="flex flex-col items-start gap-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-[#003399] border border-blue-200">
              <Users className="w-3 h-3 text-[#003399]" />
              Pegawai
            </span>
            <span className="text-[11px] text-slate-500 font-medium truncate max-w-[150px]">
              {subModul}
            </span>
          </div>
        );
      case "MASTER_DATA":
        return (
          <div className="flex flex-col items-start gap-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
              <Database className="w-3 h-3 text-amber-700" />
              Master Data
            </span>
            <span className="text-[11px] text-amber-800 font-medium truncate max-w-[150px]">
              {subModul}
            </span>
          </div>
        );
      case "USER":
        return (
          <div className="flex flex-col items-start gap-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <UserCheck className="w-3 h-3 text-emerald-700" />
              Pengguna
            </span>
            <span className="text-[11px] text-emerald-800 font-medium">
              {subModul}
            </span>
          </div>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {modul}
          </span>
        );
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";
    } catch {
      return isoString;
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003399]" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Akses Terbatas</h2>
        <p className="text-sm text-slate-500 mt-1">
          Halaman Tong Sampah hanya dapat diakses oleh Administrator & Super Administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Tong Sampah Sistem
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Daftar semua data yang dinonaktifkan / dihapus pada modul Pegawai, Master Data, dan Akun Pengguna.
              </p>
            </div>
          </div>
        </div>

        {/* Global Stats Badge */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl self-start md:self-auto">
          <Clock className="w-4 h-4 text-slate-400" />
          <div className="text-xs">
            <span className="text-slate-500">Total Item Terhapus: </span>
            <strong className="text-slate-900 font-bold">{counts.all} data</strong>
          </div>
        </div>
      </div>

      {/* Module Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveModul("ALL")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeModul === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Semua Modul
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeModul === "ALL" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"}`}>
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setActiveModul("PEGAWAI")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeModul === "PEGAWAI"
                  ? "bg-white text-[#003399] shadow-2xs"
                  : "text-slate-600 hover:text-[#003399]"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Pegawai
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeModul === "PEGAWAI" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"}`}>
                {counts.pegawai}
              </span>
            </button>

            <button
              onClick={() => setActiveModul("MASTER_DATA")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeModul === "MASTER_DATA"
                  ? "bg-white text-amber-800 shadow-2xs"
                  : "text-slate-600 hover:text-amber-800"
              }`}
            >
              <Database className="w-3.5 h-3.5 text-amber-600" />
              Master Data
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeModul === "MASTER_DATA" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-900"}`}>
                {counts.masterData}
              </span>
            </button>

            <button
              onClick={() => setActiveModul("USER")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeModul === "USER"
                  ? "bg-white text-emerald-800 shadow-2xs"
                  : "text-slate-600 hover:text-emerald-800"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Pengguna
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeModul === "USER" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-900"}`}>
                {counts.user}
              </span>
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Cari nama, NIP, label, email, kode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9 bg-slate-50 border-slate-200"
              />
            </div>
            <Button type="submit" size="sm" className="h-9 px-3 text-xs bg-[#003399] hover:bg-blue-800">
              Cari
            </Button>
            {search && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-2.5 text-xs"
                onClick={() => {
                  setSearch("");
                  fetchData(1, activeModul, "");
                }}
              >
                Reset
              </Button>
            )}
          </form>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-12 text-center">No.</th>
                <th className="py-3.5 px-4 w-44">Modul & Kategori</th>
                <th className="py-3.5 px-4">Data / Identitas</th>
                <th className="py-3.5 px-4 w-48">Waktu Dihapus</th>
                <th className="py-3.5 px-4 w-44 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#003399] border-t-transparent rounded-full animate-spin" />
                      <span>Memuat data tong sampah...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      <p className="font-bold text-slate-700 text-sm">Tong Sampah Bersih</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Tidak ada data yang dihapus pada modul ini. Data yang dihapus dari aplikasi akan muncul di sini.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={`${item.modul}-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      {getModulBadge(item.modul, item.subModul)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-sm">{item.identitas}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{item.detail}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(item.tanggalDihapus)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRestoreConfirmItem(item)}
                          disabled={actionLoadingId === item.id}
                          className="h-8 px-2.5 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200 cursor-pointer"
                          title="Pulihkan data kembali ke aplikasi"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Pulihkan
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirmItem(item)}
                          disabled={actionLoadingId === item.id}
                          className="h-8 px-2.5 text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200 cursor-pointer"
                          title="Hapus permanen dari database"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!loading && pagination.total > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
            <div>
              Menampilkan <strong>{items.length}</strong> dari <strong>{pagination.total}</strong> data terhapus
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchData(pagination.page - 1)}
                className="h-8 px-3 text-xs"
              >
                Sebelumnya
              </Button>
              <span className="font-semibold text-slate-700 px-2">
                Hal {pagination.page} dari {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchData(pagination.page + 1)}
                className="h-8 px-3 text-xs"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL KONFIRMASI RESTORE / PULIHKAN */}
      {restoreConfirmItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-emerald-600 mb-3">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Pulihkan Data?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan memulihkan data berikut kembali ke status aktif:
            </p>
            <div className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <p className="font-bold text-slate-900">{restoreConfirmItem.identitas}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">{restoreConfirmItem.detail}</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#003399]">
                Modul: {restoreConfirmItem.modulLabel} ({restoreConfirmItem.subModul})
              </span>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRestoreConfirmItem(null)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={() => handleRestore(restoreConfirmItem)}
                disabled={actionLoadingId === restoreConfirmItem.id}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {actionLoadingId === restoreConfirmItem.id ? "Memulihkan..." : "Ya, Pulihkan Data"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PERMANEN */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-rose-900">Hapus Permanen?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini <strong className="text-rose-600 font-bold">TIDAK DAPAT DIBATALKAN</strong>. Seluruh riwayat yang terhubung dengan data ini akan dihapus permanen dari sistem database.
            </p>
            <div className="my-3 p-3 rounded-xl bg-rose-50/50 border border-rose-200 text-xs">
              <p className="font-bold text-slate-900">{deleteConfirmItem.identitas}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">{deleteConfirmItem.detail}</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900">
                Modul: {deleteConfirmItem.modulLabel} ({deleteConfirmItem.subModul})
              </span>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmItem(null)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={() => handlePermanentDelete(deleteConfirmItem)}
                disabled={actionLoadingId === deleteConfirmItem.id}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                {actionLoadingId === deleteConfirmItem.id ? "Menghapus..." : "Ya, Hapus Permanen"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
