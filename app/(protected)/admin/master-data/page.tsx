"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const kategoriList = [
  { value: "PANGKAT_GOLONGAN", label: "Pangkat / Golongan" },
  { value: "JABATAN", label: "Jabatan" },
  { value: "UNIT_KERJA", label: "Unit Kerja / Penempatan" },
  { value: "PENDIDIKAN", label: "Pendidikan" },
  { value: "AGAMA", label: "Agama" },
  { value: "STATUS_PEGAWAI", label: "Status Pegawai" },
  { value: "STATUS_PERKAWINAN", label: "Status Perkawinan" },
  { value: "JENIS_KELAMIN", label: "Jenis Kelamin" },
];

const masterDataSchema = z.object({
  label: z.string().min(1, "Label wajib diisi"),
  kode: z.string().optional(),
  urutan: z.number().int().default(0),
});

type MasterDataForm = z.infer<typeof masterDataSchema>;

interface MasterDataItem {
  id: string;
  kategori: string;
  label: string;
  kode: string | null;
  urutan: number;
  aktif: boolean;
}

export default function MasterDataPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("PANGKAT_GOLONGAN");
  const [data, setData] = useState<MasterDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MasterDataForm>({
    resolver: zodResolver(masterDataSchema),
    defaultValues: { label: "", kode: "", urutan: 0 },
  });

  const fetchData = async (kategori: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/master-data?kategori=${kategori}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const result = await res.json();
      setData(result);
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const onSubmit = async (formData: MasterDataForm) => {
    try {
      const url = editingItem
        ? `/api/master-data/${editingItem.id}`
        : "/api/master-data";
      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          kategori: activeTab,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan data");
      }

      toast.success(editingItem ? "Data berhasil diperbarui" : "Data berhasil ditambahkan");
      setDialogOpen(false);
      setEditingItem(null);
      reset();
      fetchData(activeTab);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  const handleEdit = (item: MasterDataItem) => {
    setEditingItem(item);
    reset({ label: item.label, kode: item.kode || "", urutan: item.urutan });
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
      fetchData(activeTab);
    } catch (error) {
      toast.error("Gagal menonaktifkan data");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003399]">Master Data</h1>
        <p className="text-gray-600 mt-1">
          Kelola data master untuk dropdown di seluruh sistem
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px">
            {kategoriList.map((kat) => (
              <button
                key={kat.value}
                onClick={() => setActiveTab(kat.value)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  activeTab === kat.value
                    ? "border-[#003399] text-[#003399]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {kat.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setEditingItem(null);
                reset({ label: "", kode: "", urutan: 0 });
                setDialogOpen(true);
              }}
              className="bg-[#003399] text-white px-4 py-2 rounded-lg hover:bg-[#002266] transition"
            >
              + Tambah Data
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Memuat data...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada data
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Urutan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Kode
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Label
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{item.urutan}</td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {item.kode || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {item.label}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            item.aktif
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.aktif ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-[#003399] hover:underline text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Nonaktifkan
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

      {dialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editingItem ? "Edit Data" : "Tambah Data Baru"}
              </h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Label *</label>
                <input
                  {...register("label")}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
                  placeholder="Masukkan label"
                />
                {errors.label && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.label.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Kode</label>
                <input
                  {...register("kode")}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
                  placeholder="Kode (opsional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Urutan</label>
                <input
                  type="number"
                  {...register("urutan", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingItem(null);
                    reset();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#003399] text-white rounded-lg hover:bg-[#002266]"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
