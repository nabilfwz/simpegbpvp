"use client";

import { useState, useEffect, useCallback, Suspense, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search, Plus, Filter, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

interface CategoryDef {
  value: string;
  label: string;
  shortLabel: string;
}

interface SubmenuGroup {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  categories: CategoryDef[];
}

const SUBMENU_GROUPS: SubmenuGroup[] = [
  {
    id: "kepegawaian",
    label: "Pangkat & Status Pegawai",
    shortLabel: "Kepegawaian",
    description: "Kelola jenjang kepangkatan, golongan ruang, jabatan, dan status ASN/Non-ASN",
    icon: "🎖️",
    categories: [
      { value: "PANGKAT_GOLONGAN", label: "Pangkat / Golongan (PNS)", shortLabel: "Golongan PNS" },
      { value: "GOLONGAN_PPPK", label: "Golongan PPPK", shortLabel: "Golongan PPPK" },
      { value: "STATUS_PEGAWAI", label: "Status Pegawai", shortLabel: "Status Pegawai" },
      { value: "JABATAN", label: "Jabatan", shortLabel: "Jabatan" },
    ],
  },
  {
    id: "organisasi",
    label: "Unit Kerja, Balai & Eselon",
    shortLabel: "Organisasi",
    description: "Kelola struktur organisasi balai kerja, sub unit kerja, eselon, dan dirjen",
    icon: "🏢",
    categories: [
      { value: "UNIT_KERJA", label: "Unit Kerja / Balai", shortLabel: "Unit Kerja / Balai" },
      { value: "SUB_UNIT_KERJA", label: "Sub Unit Kerja / Subbagian", shortLabel: "Sub Unit Kerja" },
      { value: "ESELON", label: "Eselon / Tingkat Jabatan", shortLabel: "Eselon" },
      { value: "DIRJEN", label: "Direktorat Jenderal (Dirjen)", shortLabel: "Dirjen" },
    ],
  },
  {
    id: "wilayah",
    label: "Wilayah Administratif",
    shortLabel: "Wilayah",
    description: "Hierarki data spasial administratif (Provinsi → Kab/Kota → Kecamatan → Desa/Kelurahan)",
    icon: "🗺️",
    categories: [
      { value: "PROVINSI", label: "Provinsi", shortLabel: "Provinsi" },
      { value: "KABUPATEN_KOTA", label: "Kabupaten / Kota", shortLabel: "Kabupaten / Kota" },
      { value: "KECAMATAN", label: "Kecamatan", shortLabel: "Kecamatan" },
      { value: "DESA_KELURAHAN", label: "Desa / Gampong / Kelurahan", shortLabel: "Desa / Gampong" },
    ],
  },
  {
    id: "demografi",
    label: "Demografi Pegawai",
    shortLabel: "Demografi",
    description: "Data referensi personal (Pendidikan, Agama, Status Perkawinan, Jenis Kelamin)",
    icon: "👤",
    categories: [
      { value: "PENDIDIKAN", label: "Pendidikan", shortLabel: "Pendidikan" },
      { value: "AGAMA", label: "Agama", shortLabel: "Agama" },
      { value: "STATUS_PERKAWINAN", label: "Status Perkawinan", shortLabel: "Status Perkawinan" },
      { value: "JENIS_KELAMIN", label: "Jenis Kelamin", shortLabel: "Jenis Kelamin" },
    ],
  },
];

// All flat categories map for lookup
const allCategories: CategoryDef[] = SUBMENU_GROUPS.flatMap((g) => g.categories);

const masterDataSchema = z.object({
  label: z.string().min(1, "Label wajib diisi"),
  kode: z.string().optional(),
  urutan: z.number().int().default(0),
  parentId: z.string().optional().nullable(),
});

type MasterDataForm = z.infer<typeof masterDataSchema>;

interface MasterDataItem {
  id: string;
  kategori: string;
  label: string;
  kode: string | null;
  urutan: number;
  aktif: boolean;
  parentId?: string | null;
  parent?: { id: string; label: string; kategori: string } | null;
}

function MasterDataContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Resolve initial group and tab from URL
  const queryGroup = searchParams.get("group");
  const queryTab = searchParams.get("tab");

  const initialGroup = useMemo(() => {
    if (queryGroup && SUBMENU_GROUPS.some((g) => g.id === queryGroup)) {
      return queryGroup;
    }
    if (queryTab) {
      const foundGroup = SUBMENU_GROUPS.find((g) =>
        g.categories.some((c) => c.value === queryTab)
      );
      if (foundGroup) return foundGroup.id;
    }
    return "kepegawaian";
  }, [queryGroup, queryTab]);

  const [activeGroup, setActiveGroup] = useState<string>(initialGroup);

  // Determine current active group definition
  const currentGroupDef = useMemo(() => {
    return SUBMENU_GROUPS.find((g) => g.id === activeGroup) || SUBMENU_GROUPS[0];
  }, [activeGroup]);

  // Initial tab inside active group
  const initialTab = useMemo(() => {
    if (queryTab && currentGroupDef.categories.some((c) => c.value === queryTab)) {
      return queryTab;
    }
    return currentGroupDef.categories[0].value;
  }, [queryTab, currentGroupDef]);

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Sync state when URL query params change (e.g. from sidebar navigation)
  useEffect(() => {
    if (queryGroup && SUBMENU_GROUPS.some((g) => g.id === queryGroup)) {
      setActiveGroup(queryGroup);
      const targetGroup = SUBMENU_GROUPS.find((g) => g.id === queryGroup);
      if (targetGroup) {
        if (queryTab && targetGroup.categories.some((c) => c.value === queryTab)) {
          setActiveTab(queryTab);
        } else {
          setActiveTab(targetGroup.categories[0].value);
        }
      }
    } else if (queryTab) {
      const foundGroup = SUBMENU_GROUPS.find((g) =>
        g.categories.some((c) => c.value === queryTab)
      );
      if (foundGroup) {
        setActiveGroup(foundGroup.id);
        setActiveTab(queryTab);
      }
    }
  }, [queryGroup, queryTab]);

  const [data, setData] = useState<MasterDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);

  // Search & Parent filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterParentId, setFilterParentId] = useState<string>("");
  const [parentOptions, setParentOptions] = useState<MasterDataItem[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MasterDataForm>({
    resolver: zodResolver(masterDataSchema),
    defaultValues: { label: "", kode: "", urutan: 0, parentId: null },
  });

  // In-memory client cache for instantaneous tab switching (0ms lag)
  const clientCacheRef = useRef<Record<string, MasterDataItem[]>>({});

  const fetchData = useCallback(async (kategori: string, parentFilter?: string, forceRefresh = false) => {
    const cacheKey = `${kategori}:${parentFilter || "all"}`;

    if (!forceRefresh && clientCacheRef.current[cacheKey]) {
      setData(clientCacheRef.current[cacheKey]);
      setLoading(false);
      // Silently revalidate in background
      fetch(`/api/master-data?kategori=${kategori}${parentFilter ? `&parentId=${parentFilter}` : ""}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((result) => {
          if (result) {
            clientCacheRef.current[cacheKey] = result;
            setData(result);
          }
        })
        .catch(() => {});
      return;
    }

    setLoading(true);
    try {
      let url = `/api/master-data?kategori=${kategori}`;
      if (parentFilter) {
        url += `&parentId=${parentFilter}`;
      }
      const res = await fetch(url);
      if (res.status === 401) {
        toast.error("Sesi telah berakhir. Mengalihkan ke login...");
        router.push("/login");
        return;
      }
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Gagal mengambil data");
      }
      const result = await res.json();
      clientCacheRef.current[cacheKey] = result;
      setData(result);
    } catch (error: any) {
      console.error("fetchData error:", error);
      toast.error(error?.message || "Gagal memuat data master");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch parent category options for hierarchical categories
  const fetchParentOptions = useCallback(async (kategori: string) => {
    let parentCategory = "";
    if (kategori === "KABUPATEN_KOTA") parentCategory = "PROVINSI";
    else if (kategori === "KECAMATAN") parentCategory = "KABUPATEN_KOTA";
    else if (kategori === "DESA_KELURAHAN") parentCategory = "KECAMATAN";
    else if (kategori === "UNIT_KERJA") parentCategory = "DIRJEN";
    else if (kategori === "SUB_UNIT_KERJA") parentCategory = "UNIT_KERJA";

    if (!parentCategory) {
      setParentOptions([]);
      return;
    }

    setLoadingParents(true);
    try {
      const res = await fetch(`/api/master-data?kategori=${parentCategory}`);
      if (res.ok) {
        const result = await res.json();
        setParentOptions(result);
      }
    } catch (err) {
      console.error("Error fetching parent options:", err);
    } finally {
      setLoadingParents(false);
    }
  }, []);

  useEffect(() => {
    setFilterParentId("");
    setSearchQuery("");
    fetchData(activeTab);
    fetchParentOptions(activeTab);
  }, [activeTab, fetchData, fetchParentOptions]);

  const handleGroupSelect = (groupId: string) => {
    const group = SUBMENU_GROUPS.find((g) => g.id === groupId);
    if (!group) return;
    setActiveGroup(groupId);
    const firstCat = group.categories[0].value;
    setActiveTab(firstCat);
    router.replace(`/admin/master-data?group=${groupId}&tab=${firstCat}`, { scroll: false });
  };

  const handleTabSelect = (tabValue: string) => {
    setActiveTab(tabValue);
    router.replace(`/admin/master-data?group=${activeGroup}&tab=${tabValue}`, { scroll: false });
  };

  const handleFilterParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const parentId = e.target.value;
    setFilterParentId(parentId);
    fetchData(activeTab, parentId);
  };

  const onSubmit = async (formData: MasterDataForm) => {
    try {
      const url = editingItem
        ? `/api/master-data/${editingItem.id}`
        : "/api/master-data";
      const method = editingItem ? "PATCH" : "POST";

      const payload: any = {
        ...formData,
        kategori: activeTab,
        parentId: formData.parentId || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan data");
      }

      toast.success(editingItem ? "Data berhasil diperbarui" : "Data berhasil ditambahkan");
      setDialogOpen(false);
      setEditingItem(null);
      reset();
      clientCacheRef.current = {};
      fetchData(activeTab, filterParentId, true);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  const handleEdit = (item: MasterDataItem) => {
    setEditingItem(item);
    reset({
      label: item.label,
      kode: item.kode || "",
      urutan: item.urutan,
      parentId: item.parentId || null,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (item: MasterDataItem) => {
    const actionText = item.aktif ? "Nonaktifkan" : "Aktifkan";
    if (!confirm(`${actionText} "${item.label}"?`)) return;

    try {
      const res = await fetch(`/api/master-data/${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal mengubah status data");

      toast.success(`Data berhasil di${item.aktif ? "nonaktifkan" : "aktifkan"}`);
      clientCacheRef.current = {};
      fetchData(activeTab, filterParentId, true);
    } catch (error) {
      toast.error("Gagal mengubah status data");
    }
  };

  const isHierarchical =
    activeTab === "KABUPATEN_KOTA" ||
    activeTab === "KECAMATAN" ||
    activeTab === "DESA_KELURAHAN" ||
    activeTab === "UNIT_KERJA" ||
    activeTab === "SUB_UNIT_KERJA";

  const parentLabel =
    activeTab === "KABUPATEN_KOTA"
      ? "Provinsi"
      : activeTab === "KECAMATAN"
      ? "Kabupaten / Kota"
      : activeTab === "DESA_KELURAHAN"
      ? "Kecamatan"
      : activeTab === "UNIT_KERJA"
      ? "Direktorat Jenderal (Dirjen)"
      : "Unit Kerja / Balai";

  const activeCategoryLabel = allCategories.find((k) => k.value === activeTab)?.label || activeTab;

  // Filtered list by search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        (item.kode && item.kode.toLowerCase().includes(query)) ||
        (item.parent?.label && item.parent.label.toLowerCase().includes(query))
    );
  }, [data, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">⚙️</span>
            <h1 className="text-xl font-black text-[#003399] tracking-tight">
              Master Data BPVP Banda Aceh
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Kelola referensi kepegawaian, struktur balai kerja, wilayah administratif, dan demografi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              clientCacheRef.current = {};
              fetchData(activeTab, filterParentId, true);
            }}
            className="p-2 text-slate-500 hover:text-[#003399] hover:bg-blue-50 rounded-lg transition border border-slate-200 text-xs flex items-center gap-1.5 font-medium"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#003399]" : ""}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* 4 Main Submenu Group Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SUBMENU_GROUPS.map((group) => {
          const isGroupActive = activeGroup === group.id;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => handleGroupSelect(group.id)}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isGroupActive
                  ? "bg-gradient-to-br from-blue-50/90 to-indigo-50/50 border-[#003399] shadow-sm ring-2 ring-[#003399]/15"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-2xl">{group.icon}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isGroupActive
                        ? "bg-[#003399] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {group.categories.length} Kategori
                  </span>
                </div>
                <h3
                  className={`text-sm font-bold leading-snug ${
                    isGroupActive ? "text-[#003399]" : "text-slate-800"
                  }`}
                >
                  {group.label}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                {group.description}
              </p>
              {isGroupActive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#003399]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Category Pills Header */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-3 md:px-5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-700">{currentGroupDef.icon} {currentGroupDef.label}:</span>
            <span>Pilih kategori untuk dikelola</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {currentGroupDef.categories.map((cat) => {
              const isCatActive = activeTab === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleTabSelect(cat.value)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    isCatActive
                      ? "bg-[#003399] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                  }`}
                >
                  <span>{cat.label}</span>
                  {isCatActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="p-4 md:p-5">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4">
            {/* Left Controls: Quick Search & Hierarchy Filter */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Quick Search */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Cari ${activeCategoryLabel}...`}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#003399] bg-white transition"
                />
              </div>

              {/* Hierarchical Parent Filter */}
              {isHierarchical && (
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={filterParentId}
                    onChange={handleFilterParentChange}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-[#003399] text-slate-700"
                  >
                    <option value="">Semua {parentLabel}</option>
                    {parentOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Total Count Badge */}
              <div className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-100 rounded-md border border-slate-200">
                Total: <span className="font-bold text-slate-800">{filteredData.length}</span>
                {searchQuery && ` (dari ${data.length})`}
              </div>
            </div>

            {/* Right Control: Add Button */}
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                reset({
                  label: "",
                  kode: "",
                  urutan: data.length + 1,
                  parentId: filterParentId || (parentOptions[0]?.id ?? null),
                });
                setDialogOpen(true);
              }}
              className="bg-[#003399] text-white px-3.5 py-2 rounded-lg hover:bg-[#002266] font-bold text-xs transition shadow-xs border border-[#002266] flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah {activeCategoryLabel}</span>
            </button>
          </div>

          {/* Table Container — Formatted to maintain clean proportions on wide monitors */}
          {loading ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              <div className="inline-block w-6 h-6 border-2 border-[#003399] border-t-transparent rounded-full animate-spin mb-2" />
              <p>Memuat data master...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-14 text-slate-500 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
              <p className="font-semibold text-slate-700 text-sm mb-1">
                {searchQuery ? "Data tidak ditemukan" : "Belum ada data"}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? `Tidak ada data dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                  : `Kategori ${activeCategoryLabel} belum memiliki data. Silakan klik tombol Tambah untuk membuat.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/90 border-b border-slate-200">
                  <tr>
                    <th className="w-16 px-3.5 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Urutan
                    </th>
                    <th className="w-32 px-3.5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Kode
                    </th>
                    <th className="px-3.5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Label / Nama
                    </th>
                    {isHierarchical && (
                      <th className="w-48 px-3.5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Induk ({parentLabel})
                      </th>
                    )}
                    <th className="w-24 px-3.5 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-32 px-3.5 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition">
                      <td className="px-3.5 py-2.5 text-center font-mono text-slate-500">
                        {item.urutan}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono font-medium text-slate-700">
                        {item.kode ? (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 border border-slate-200">
                            {item.kode}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                        {item.label}
                      </td>
                      {isHierarchical && (
                        <td className="px-3.5 py-2.5 text-slate-600">
                          {item.parent ? (
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 text-[11px] font-medium border border-slate-200 inline-block max-w-[180px] truncate">
                              {item.parent.label}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            item.aktif
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {item.aktif ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="px-2.5 py-1 font-bold rounded-md bg-blue-50 text-[#003399] border border-blue-200 hover:bg-[#003399] hover:text-white transition shadow-2xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className={`px-2.5 py-1 font-bold rounded-md transition shadow-2xs ${
                            item.aktif
                              ? "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-600 hover:text-white"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-600 hover:text-white"
                          }`}
                        >
                          {item.aktif ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Dialog Modal */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {editingItem ? "Edit Data Master" : `Tambah ${activeCategoryLabel}`}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {currentGroupDef.label} &bull; {activeCategoryLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-200/70 flex items-center justify-center text-slate-400 hover:text-slate-600 font-bold transition"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 text-xs">
              {isHierarchical && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Induk {parentLabel} *
                  </label>
                  <select
                    {...register("parentId")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-xs bg-white"
                  >
                    <option value="">Pilih {parentLabel}</option>
                    {parentOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label} ({opt.kode || "-"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Label / Nama *
                </label>
                <input
                  {...register("label")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-xs"
                  placeholder="Contoh: Pembina Utama Muda atau Subbagian TU"
                />
                {errors.label && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium">
                    {errors.label.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kode (Opsional)
                </label>
                <input
                  {...register("kode")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-xs font-mono"
                  placeholder="Contoh: IV/c atau TU-BPVP"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Urutan Tampil
                </label>
                <input
                  type="number"
                  {...register("urutan", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingItem(null);
                    reset();
                  }}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#003399] text-white font-bold rounded-lg hover:bg-[#002266] text-xs shadow-xs border border-[#002266] transition"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MasterDataPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-8 text-center text-slate-400 text-sm">
          <div className="inline-block w-8 h-8 border-3 border-[#003399] border-t-transparent rounded-full animate-spin mb-3" />
          <p>Memuat Master Data...</p>
        </div>
      }
    >
      <MasterDataContent />
    </Suspense>
  );
}
