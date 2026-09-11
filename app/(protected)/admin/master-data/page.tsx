"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const kategoriList = [
  { value: "PANGKAT_GOLONGAN", label: "Pangkat / Golongan" },
  { value: "JABATAN", label: "Jabatan" },
  { value: "DIRJEN", label: "Direktorat Jenderal (Dirjen)" },
  { value: "UNIT_KERJA", label: "Unit Kerja / Balai" },
  { value: "SUB_UNIT_KERJA", label: "Sub Unit Kerja / Subbagian" },
  { value: "ESELON", label: "Eselon / Tingkat Jabatan" },
  { value: "STATUS_PEGAWAI", label: "Status Pegawai" },
  { value: "PROVINSI", label: "Provinsi" },
  { value: "KABUPATEN_KOTA", label: "Kabupaten / Kota" },
  { value: "KECAMATAN", label: "Kecamatan" },
  { value: "DESA_KELURAHAN", label: "Desa / Gampong / Kelurahan" },
  { value: "PENDIDIKAN", label: "Pendidikan" },
  { value: "AGAMA", label: "Agama" },
  { value: "STATUS_PERKAWINAN", label: "Status Perkawinan" },
  { value: "JENIS_KELAMIN", label: "Jenis Kelamin" },
];

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

export default function MasterDataPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("PANGKAT_GOLONGAN");
  const [data, setData] = useState<MasterDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);

  // Parent options list for hierarchical data
  const [parentOptions, setParentOptions] = useState<MasterDataItem[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  // Optional filter by parent on the table
  const [filterParentId, setFilterParentId] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MasterDataForm>({
    resolver: zodResolver(masterDataSchema),
    defaultValues: { label: "", kode: "", urutan: 0, parentId: null },
  });

  const fetchData = useCallback(async (kategori: string, parentFilter?: string) => {
    setLoading(true);
    try {
      let url = `/api/master-data?kategori=${kategori}`;
      if (parentFilter) {
        url += `&parentId=${parentFilter}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const result = await res.json();
      setData(result);
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch parent category options when needed (e.g. Provinsi for Kab/Kota, Kab/Kota for Kecamatan)
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
    fetchData(activeTab);
    fetchParentOptions(activeTab);
  }, [activeTab, fetchData, fetchParentOptions]);

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
      fetchData(activeTab, filterParentId);
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
    if (!confirm(`Nonaktifkan "${item.label}"?`)) return;

    try {
      const res = await fetch(`/api/master-data/${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus");

      toast.success("Data berhasil dinonaktifkan");
      fetchData(activeTab, filterParentId);
    } catch (error) {
      toast.error("Gagal menonaktifkan data");
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#003399]">Master Data BPVP Banda Aceh</h1>
        <p className="text-gray-600 mt-1">
          Kelola data master referensi, hierarki wilayah (Provinsi &rarr; Kab/Kota &rarr; Kecamatan &rarr; Desa/Gampong), dan struktur pegawai PNS & Non-PNS
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Category Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto bg-slate-50/50">
          <nav className="flex -mb-px">
            {kategoriList.map((kat) => (
              <button
                key={kat.value}
                onClick={() => setActiveTab(kat.value)}
                className={`px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                  activeTab === kat.value
                    ? "border-[#003399] text-[#003399] bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {kat.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Top Actions: Filter by Parent & Add Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isHierarchical && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                    Filter {parentLabel}:
                  </label>
                  <select
                    value={filterParentId}
                    onChange={handleFilterParentChange}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-[#003399]"
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
              <span className="text-xs text-slate-500">
                Total: <span className="font-bold text-slate-800">{data.length}</span> data
              </span>
            </div>

            <button
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
              className="bg-[#003399] text-white px-4 py-2 rounded-lg hover:bg-[#002266] font-bold text-sm transition shadow-sm border border-[#002266] flex items-center gap-2"
            >
              <span>+</span> Tambah {kategoriList.find((k) => k.value === activeTab)?.label}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">Memuat data master...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              Belum ada data untuk kategori ini.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Urutan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Kode
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Label
                    </th>
                    {isHierarchical && (
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Induk ({parentLabel})
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-sm font-mono text-slate-500">{item.urutan}</td>
                      <td className="px-4 py-3 text-sm font-mono font-medium text-slate-700">
                        {item.kode || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {item.label}
                      </td>
                      {isHierarchical && (
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {item.parent ? (
                            <span className="px-2.5 py-0.5 bg-slate-100 rounded text-slate-700 text-xs font-medium border border-slate-200">
                              {item.parent.label}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            item.aktif
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.aktif ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-2 text-xs">
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-2.5 py-1 font-bold rounded-md bg-blue-50 text-[#003399] border-2 border-blue-200 hover:bg-[#003399] hover:text-white transition shadow-2xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className={`px-2.5 py-1 font-bold rounded-md transition shadow-2xs ${
                            item.aktif
                              ? "bg-rose-50 text-rose-800 border-2 border-rose-300 hover:bg-rose-700 hover:text-white"
                              : "bg-emerald-50 text-emerald-800 border-2 border-emerald-300 hover:bg-emerald-700 hover:text-white"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingItem ? "Edit Data Master" : `Tambah ${kategoriList.find((k) => k.value === activeTab)?.label}`}
              </h2>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {isHierarchical && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Induk {parentLabel} *
                  </label>
                  <select
                    {...register("parentId")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm bg-white"
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Label *
                </label>
                <input
                  {...register("label")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                  placeholder="Masukkan nama / label"
                />
                {errors.label && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {errors.label.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kode (Opsional)
                </label>
                <input
                  {...register("kode")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm font-mono"
                  placeholder="Contoh: 11.71 atau KASUBAG-TU"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Urutan Tampil
                </label>
                <input
                  type="number"
                  {...register("urutan", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingItem(null);
                    reset();
                  }}
                  className="px-4 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#003399] text-white font-bold rounded-lg hover:bg-[#002266] text-xs shadow-sm border border-[#002266] transition"
                >
                  Simpan Data Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
