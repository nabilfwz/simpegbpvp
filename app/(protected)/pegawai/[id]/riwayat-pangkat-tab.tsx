"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

interface RiwayatPangkat {
  id: string;
  pegawaiId: string;
  pangkatGolonganId: string;
  pangkatGolongan: { label: string };
  tmt: string;
  noSk: string | null;
  tanggalSk: string | null;
  keterangan: string | null;
  createdAt: string;
}

export default function RiwayatPangkatTab({ pegawaiId }: { pegawaiId: string }) {
  const [riwayat, setRiwayat] = useState<RiwayatPangkat[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RiwayatPangkat | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pegawai/${pegawaiId}/riwayat-pangkat`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const data = await res.json();
      setRiwayat(data);
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pegawaiId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus riwayat pangkat ini?")) return;

    try {
      const res = await fetch(`/api/riwayat-pangkat/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Riwayat pangkat berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Riwayat Pangkat / Golongan</h3>
        <button
          onClick={() => {
            setEditingItem(null);
            setDialogOpen(true);
          }}
          className="bg-[#003399] text-white px-3 py-1 rounded-lg text-sm hover:bg-[#002266]"
        >
          + Tambah
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-500">Memuat data...</div>
      ) : riwayat.length === 0 ? (
        <div className="text-center py-4 text-gray-500">Belum ada riwayat pangkat</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">TMT</th>
                <th className="px-3 py-2 text-left">Pangkat/Golongan</th>
                <th className="px-3 py-2 text-left">No. SK</th>
                <th className="px-3 py-2 text-left">Tgl. SK</th>
                <th className="px-3 py-2 text-left">Keterangan</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {riwayat.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{new Date(item.tmt).toLocaleDateString("id-ID")}</td>
                  <td className="px-3 py-2 font-medium">{item.pangkatGolongan.label}</td>
                  <td className="px-3 py-2">{item.noSk || "-"}</td>
                  <td className="px-3 py-2">
                    {item.tanggalSk ? new Date(item.tanggalSk).toLocaleDateString("id-ID") : "-"}
                  </td>
                  <td className="px-3 py-2">{item.keterangan || "-"}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setDialogOpen(true);
                      }}
                      className="text-[#003399] hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialogOpen && (
        <RiwayatPangkatForm
          pegawaiId={pegawaiId}
          initialData={editingItem}
          onClose={() => {
            setDialogOpen(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setDialogOpen(false);
            setEditingItem(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

interface RiwayatPangkatFormProps {
  pegawaiId: string;
  initialData: RiwayatPangkat | null;
  onClose: () => void;
  onSave: () => void;
}

function RiwayatPangkatForm({
  pegawaiId,
  initialData,
  onClose,
  onSave,
}: RiwayatPangkatFormProps) {
  const [loading, setLoading] = useState(false);
  const [pangkatGolonganList, setPangkatGolonganList] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/master-data?kategori=PANGKAT_GOLONGAN")
      .then((res) => res.json())
      .then(setPangkatGolonganList);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      pangkatGolonganId: initialData?.pangkatGolonganId || "",
      tmt: initialData?.tmt ? new Date(initialData.tmt).toISOString().split("T")[0] : "",
      noSk: initialData?.noSk || "",
      tanggalSk: initialData?.tanggalSk ? new Date(initialData.tanggalSk).toISOString().split("T")[0] : "",
      keterangan: initialData?.keterangan || "",
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const url = initialData
        ? `/api/riwayat-pangkat/${initialData.id}`
        : `/api/pegawai/${pegawaiId}/riwayat-pangkat`;
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      toast.success(initialData ? "Berhasil diupdate" : "Berhasil ditambahkan");
      onSave();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">
            {initialData ? "Edit Riwayat Pangkat" : "Tambah Riwayat Pangkat"}
          </h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Pangkat / Golongan *</label>
            <select
              {...register("pangkatGolonganId", { required: true })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
            >
              <option value="">Pilih</option>
              {pangkatGolonganList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">TMT *</label>
            <input
              type="date"
              {...register("tmt", { required: true })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">No. SK</label>
            <input
              {...register("noSk")}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tanggal SK</label>
            <input
              type="date"
              {...register("tanggalSk")}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Keterangan</label>
            <textarea
              {...register("keterangan")}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#003399] text-white rounded-lg hover:bg-[#002266] disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
