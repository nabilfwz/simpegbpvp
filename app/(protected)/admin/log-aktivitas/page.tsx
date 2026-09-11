"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Eye, X, ArrowRight, History, Calendar, User, FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface LogAktivitas {
  id: string;
  userId: string;
  aksi: string;
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
  const [logs, setLogs] = useState<LogAktivitas[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogAktivitas | null>(null);
  const [filters, setFilters] = useState<FilterParams>({
    startDate: "",
    endDate: "",
    aksi: "",
    entitas: "",
    userId: "",
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [userList, setUserList] = useState<{ id: string; nama: string }[]>([]);
  const [diffViewMode, setDiffViewMode] = useState<"table" | "raw">("table");

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

      setLogs(data.data || []);
      setPagination(data.pagination);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data log");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const userRes = await fetch("/api/users?limit=100");
      if (userRes.ok) {
        const users = await userRes.json();
        setUserList(users.data || users);
      }
    } catch (error) {
      console.error("Error fetching users for filter:", error);
    }
  };

  useEffect(() => {
    fetchFilters();
    fetchData();
  }, []);

  const getAksiBadge = (aksi: string) => {
    switch (aksi) {
      case "CREATE":
        return "bg-emerald-100 text-emerald-900 border border-emerald-300";
      case "UPDATE":
        return "bg-blue-100 text-[#003399] border border-blue-300";
      case "DELETE":
        return "bg-amber-100 text-amber-900 border border-amber-300";
      case "DELETE_PERMANEN":
        return "bg-rose-100 text-rose-900 border border-rose-300";
      case "RESTORE":
        return "bg-teal-100 text-teal-900 border border-teal-300";
      case "LOGIN":
        return "bg-purple-100 text-purple-900 border border-purple-300";
      default:
        return "bg-slate-100 text-slate-800 border border-slate-300";
    }
  };

  const getEntitasLabel = (entitas: string) => {
    const labels: Record<string, string> = {
      MasterData: "Master Data",
      Pegawai: "Pegawai",
      RiwayatPangkat: "Riwayat Pangkat",
      RiwayatJabatan: "Riwayat Jabatan",
      User: "User Pengguna",
      Login: "Autentikasi Login",
    };
    return labels[entitas] || entitas;
  };

  const FIELD_LABELS: Record<string, string> = {
    nama: "Nama Lengkap",
    nip: "NIP",
    tempatLahir: "Tempat Lahir (Teks)",
    tempatLahirRelasi: "Tempat Lahir (Wilayah)",
    tanggalLahir: "Tanggal Lahir",
    alamat: "Alamat Tinggal",
    noHp: "Nomor HP / WhatsApp",
    email: "Alamat Email",
    unitKerja: "Unit Kerja",
    subUnitKerja: "Sub Unit Kerja / Bagian",
    dirjen: "Direktorat Jenderal (Eselon I)",
    eselon: "Tingkat Eselon",
    statusPegawai: "Status Pegawai",
    pendidikanTerakhir: "Pendidikan Terakhir",
    jenisKelamin: "Jenis Kelamin",
    agama: "Agama",
    statusPerkawinan: "Status Perkawinan",
    provinsi: "Provinsi",
    kabupatenKota: "Kabupaten / Kota",
    kecamatan: "Kecamatan",
    desa: "Kelurahan / Desa",
    fotoUrl: "Foto Profil",
    aktif: "Status Keaktifan",
    pangkatGolongan: "Pangkat / Golongan",
    jabatan: "Jabatan",
    tmt: "TMT (Terhitung Mulai Tanggal)",
    noSk: "Nomor SK",
    tanggalSk: "Tanggal SK",
    keterangan: "Keterangan",
    label: "Nama / Label Data",
    kode: "Kode Referensi",
    urutan: "Nomor Urut",
    kategori: "Kategori Data",
    parent: "Data Induk (Parent)",
    role: "Peran / Hak Akses",
  };

  // Compute diff between before and after objects
  const computeDiff = (before: any, after: any) => {
    if (!before && !after) return [];
    const b = before || {};
    const a = after || {};

    const allKeys = Array.from(new Set([...Object.keys(b), ...Object.keys(a)]));
    const ignoredKeys = new Set(["id", "createdAt", "updatedAt", "password", "riwayatPangkat", "riwayatJabatan"]);

    const diffs: { key: string; label: string; oldVal: any; newVal: any }[] = [];

    // Suppress raw foreign keys when the readable relation object is available
    const relationKeys = new Set([
      "unitKerja",
      "subUnitKerja",
      "dirjen",
      "eselon",
      "statusPegawai",
      "pendidikanTerakhir",
      "jenisKelamin",
      "agama",
      "statusPerkawinan",
      "provinsi",
      "kabupatenKota",
      "kecamatan",
      "desa",
      "tempatLahirRelasi",
      "pangkatGolongan",
      "jabatan",
      "parent",
    ]);

    for (const key of allKeys) {
      if (ignoredKeys.has(key)) continue;

      if (key.endsWith("Id")) {
        const baseKey = key.slice(0, -2);
        if (relationKeys.has(baseKey) && (b[baseKey] !== undefined || a[baseKey] !== undefined)) {
          continue;
        }
      }

      const oldVal = b[key];
      const newVal = a[key];

      // Deep stringify comparison for objects / dates / primitives
      const strOld = JSON.stringify(oldVal);
      const strNew = JSON.stringify(newVal);

      if (strOld !== strNew) {
        // Tolerant date check (ignore timezone representation diffs if timestamp identical)
        if (typeof oldVal === "string" && typeof newVal === "string" && !isNaN(Date.parse(oldVal)) && !isNaN(Date.parse(newVal))) {
          if (new Date(oldVal).getTime() === new Date(newVal).getTime()) {
            continue;
          }
        }
        diffs.push({
          key,
          label: FIELD_LABELS[key] || key.replace(/([A-Z])/g, " $1").trim(),
          oldVal,
          newVal,
        });
      }
    }

    return diffs;
  };

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return "- (Kosong)";
    if (typeof val === "boolean") return val ? "Aktif" : "Non-Aktif";
    if (typeof val === "object") {
      if (val.label) return val.label;
      if (val.nama && val.email) return `${val.nama} (${val.email})`;
      if (val.nama) return val.nama;
      return JSON.stringify(val);
    }
    if (typeof val === "string" && val.length >= 10 && !isNaN(Date.parse(val)) && (val.includes("T") || val.includes("-"))) {
      try {
        return new Date(val).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      } catch {
        return val;
      }
    }
    return String(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003399] tracking-tight">
          Log Aktivitas &amp; Audit Trail Sistem
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Rekam jejak seluruh perubahan data: simpan data lama dan data baru secara transparan
        </p>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-xl shadow-xs border-2 border-slate-200 p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setFilters({ ...filters, startDate: e.target.value });
              }}
              className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:border-[#003399] outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setFilters({ ...filters, endDate: e.target.value });
              }}
              className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:border-[#003399] outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Jenis Aksi
            </label>
            <select
              value={filters.aksi}
              onChange={(e) => {
                setFilters({ ...filters, aksi: e.target.value });
              }}
              className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:border-[#003399] outline-none font-medium bg-white"
            >
              <option value="">Semua Aksi</option>
              <option value="UPDATE">UPDATE (Perubahan Data)</option>
              <option value="CREATE">CREATE (Tambah Data)</option>
              <option value="DELETE">DELETE (Pindah ke Tong Sampah)</option>
              <option value="RESTORE">RESTORE (Pemulihan Data)</option>
              <option value="DELETE_PERMANEN">DELETE PERMANEN</option>
              <option value="LOGIN">LOGIN (Masuk Sistem)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Entitas Data
            </label>
            <select
              value={filters.entitas}
              onChange={(e) => {
                setFilters({ ...filters, entitas: e.target.value });
              }}
              className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:border-[#003399] outline-none font-medium bg-white"
            >
              <option value="">Semua Entitas</option>
              <option value="Pegawai">Pegawai</option>
              <option value="MasterData">Master Data</option>
              <option value="RiwayatPangkat">Riwayat Pangkat</option>
              <option value="RiwayatJabatan">Riwayat Jabatan</option>
              <option value="User">User Pengguna</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pelaksana (User)
            </label>
            <select
              value={filters.userId}
              onChange={(e) => {
                setFilters({ ...filters, userId: e.target.value });
              }}
              className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:border-[#003399] outline-none font-medium bg-white"
            >
              <option value="">Semua Pelaksana</option>
              {userList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nama}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFilters({ startDate: "", endDate: "", aksi: "", entitas: "", userId: "" });
              fetchData(1);
            }}
            className="text-xs h-9 px-3"
          >
            ↺ Reset Filter
          </Button>
          <Button
            type="button"
            onClick={() => fetchData(1)}
            className="text-xs h-9 px-4"
          >
            🔍 Terapkan Filter
          </Button>
        </div>
      </div>

      {/* Table Container */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-xs border-2 border-slate-200 p-12 text-center text-slate-500 font-semibold">
          Memuat data log aktivitas...
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs border-2 border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 border-b-2 border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Waktu
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    User Pelaksana
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Aksi
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Entitas
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Deskripsi Aktivitas
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">
                    Detail Perubahan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500 font-medium">
                      Belum ada aktivitas yang tercatat sesuai kriteria filter.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const hasPayload = Boolean(log.dataSebelum || log.dataSesudah);
                    const isUpdate = log.aksi === "UPDATE";

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap font-medium">
                          {new Date(log.createdAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-800">
                          {log.user?.nama || "Sistem"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wide uppercase ${getAksiBadge(log.aksi)}`}>
                            {log.aksi}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap">
                          {getEntitasLabel(log.entitas)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-800 max-w-xs sm:max-w-md break-words">
                          {log.deskripsi}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {hasPayload ? (
                            <button
                              type="button"
                              onClick={() => setSelectedLog(log)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition inline-flex items-center gap-1.5 shadow-2xs ${
                                isUpdate
                                  ? "bg-blue-50 text-[#003399] border-blue-300 hover:bg-[#003399] hover:text-white"
                                  : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-800 hover:text-white"
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {isUpdate ? "Lihat Data Lama vs Baru" : "Lihat Snapshot Data"}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Tidak ada snapshot
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t-2 border-slate-200">
              <span className="text-xs text-slate-600 font-medium">
                Halaman <strong className="text-slate-900">{pagination.page}</strong> dari{" "}
                <strong className="text-slate-900">{pagination.totalPages}</strong> ({pagination.total} log total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="text-xs"
                >
                  &larr; Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="text-xs"
                >
                  Selanjutnya &rarr;
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Detail Perubahan Data (Data Sebelum vs Data Sesudah) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-300 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#003399] to-[#002266] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl border border-white/20">
                  <History className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold tracking-tight">
                      Detail Perubahan Data (Audit Trail)
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${getAksiBadge(selectedLog.aksi)}`}>
                      {selectedLog.aksi}
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 mt-0.5">
                    {selectedLog.deskripsi}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Metadata */}
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">Waktu Pencatatan:</span>
                <span className="font-mono font-bold text-slate-800">
                  {new Date(selectedLog.createdAt).toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block">User Pelaksana:</span>
                <span className="font-bold text-slate-800">{selectedLog.user?.nama}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block">Entitas / Objek:</span>
                <span className="font-bold text-slate-800">{getEntitasLabel(selectedLog.entitas)}</span>
              </div>
            </div>

            {/* Modal Body: Comparison Table or Raw JSON */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {selectedLog.aksi === "UPDATE" ? (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#003399]" />
                      Perbandingan Data Sebelum &amp; Sesudah Perubahan
                    </h4>
                    <div className="inline-flex rounded-lg border-2 border-slate-300 p-0.5 bg-slate-100 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setDiffViewMode("table")}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                          diffViewMode === "table"
                            ? "bg-[#003399] text-white shadow-xs"
                            : "text-slate-700 hover:text-slate-900"
                        }`}
                      >
                        Tabel Kolom
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiffViewMode("raw")}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                          diffViewMode === "raw"
                            ? "bg-[#003399] text-white shadow-xs"
                            : "text-slate-700 hover:text-slate-900"
                        }`}
                      >
                        JSON Mentah (Raw)
                      </button>
                    </div>
                  </div>

                  {diffViewMode === "table" ? (
                    (() => {
                      const diffs = computeDiff(selectedLog.dataSebelum, selectedLog.dataSesudah);
                      if (diffs.length === 0) {
                        return (
                          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                            Tidak ada perbedaan nilai terdeteksi pada atribut utama.
                          </div>
                        );
                      }

                      return (
                        <div className="border-2 border-slate-200 rounded-xl overflow-hidden shadow-xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 border-b border-slate-200">
                              <tr>
                                <th className="px-3.5 py-2.5 font-bold text-slate-700 uppercase w-1/3">
                                  Kolom / Data yang Diubah
                                </th>
                                <th className="px-3.5 py-2.5 font-bold text-rose-800 uppercase w-1/3 bg-rose-50/70 border-l border-r border-rose-100">
                                  ✕ Data Lama (Sebelum)
                                </th>
                                <th className="px-3.5 py-2.5 font-bold text-emerald-800 uppercase w-1/3 bg-emerald-50/70">
                                  ✓ Data Baru (Sesudah)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {diffs.map((d) => (
                                <tr key={d.key} className="hover:bg-slate-50/50">
                                  <td className="px-3.5 py-2.5 bg-slate-50/50">
                                    <span className="font-bold text-slate-900 block">{d.label}</span>
                                    <span className="font-mono text-[10px] text-slate-500">{d.key}</span>
                                  </td>
                                  <td className="px-3.5 py-2.5 bg-rose-50/30 text-rose-900 border-l border-r border-rose-100 line-through break-words font-medium">
                                    {formatValue(d.oldVal)}
                                  </td>
                                  <td className="px-3.5 py-2.5 bg-emerald-50/30 text-emerald-950 font-bold break-words">
                                    {formatValue(d.newVal)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between px-3 py-1.5 bg-rose-100 rounded-t-lg border-2 border-b-0 border-rose-300">
                          <span className="text-xs font-bold text-rose-900 uppercase">✕ Data Lama (Sebelum)</span>
                        </div>
                        <pre className="p-3 bg-slate-900 text-rose-300 rounded-b-lg text-xs font-mono overflow-x-auto max-h-72 border-2 border-rose-300">
                          {JSON.stringify(selectedLog.dataSebelum, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-100 rounded-t-lg border-2 border-b-0 border-emerald-300">
                          <span className="text-xs font-bold text-emerald-900 uppercase">✓ Data Baru (Sesudah)</span>
                        </div>
                        <pre className="p-3 bg-slate-900 text-emerald-300 rounded-b-lg text-xs font-mono overflow-x-auto max-h-72 border-2 border-emerald-300">
                          {JSON.stringify(selectedLog.dataSesudah, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedLog.aksi === "CREATE" ? (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
                    Snapshot Data yang Dibuat (Data Baru):
                  </h4>
                  <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.dataSesudah, null, 2)}
                  </pre>
                </div>
              ) : (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-2">
                    Snapshot Data Sebelum Dihapus:
                  </h4>
                  <pre className="p-4 bg-slate-900 text-rose-300 rounded-xl text-xs font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.dataSebelum, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedLog(null)}
                className="text-xs px-5 h-9"
              >
                Tutup Jendela
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
