"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

interface RiwayatJabatan {
  id: string;
  pegawaiId: string;
  jabatanId: string;
  jabatan: { label: string };
  unitKerjaId: string;
  unitKerja: { label: string };
  tmt: string;
  noSk: string | null;
  tanggalSk: string | null;
  keterangan: string | null;
  createdAt: string;
}

export default function RiwayatJabatanTab({ pegawaiId }: { pegawaiId: string }) {
  const [riwayat, setRiwayat] = useState<RiwayatJabatan[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RiwayatJabatan | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pegawai/${pegawaiId}/riwayat-jabatan`);
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
    if (!confirm("Hapus riwayat jabatan ini?")) return;

    try {
      const res = await fetch(`/api/riwayat-jabatan/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Riwayat jabatan berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800 text-base">Riwayat Jabatan</h3>
        <button
          onClick={() => {
            setEditingItem(null);
            setDialogOpen(true);
          }}
          className="bg-[#003399] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#002266] shadow-sm border border-[#002266] transition flex items-center gap-1"
        >
          + Tambah Riwayat
        </button>
      </div>

      {loading ? (
        <div className="text-center py-6 text-slate-500 text-sm">Memuat data...</div>
      ) : riwayat.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-300">
          Belum ada riwayat jabatan tercatat
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-slate-200 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-2.5 text-left font-bold text-slate-700 uppercase">TMT</th>
                <th className="px-3.5 py-2.5 text-left font-bold text-slate-700 uppercase">Jabatan</th>
                <th className="px-3.5 py-2.5 text-left font-bold text-slate-700 uppercase">Unit Kerja</th>
                <th className="px-3.5 py-2.5 text-left font-bold text-slate-700 uppercase">No. SK</th>
                <th className="px-3.5 py-2.5 text-left font-bold text-slate-700 uppercase">Tgl. SK</th>
                <th className="px-3.5 py-2.5 text-left font-bold text-slate-700 uppercase">Keterangan</th>
                <th className="px-3.5 py-2.5 text-right font-bold text-slate-700 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {riwayat.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 font-mono font-medium text-slate-800">
                    {new Date(item.tmt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{item.jabatan.label}</td>
                  <td className="px-3.5 py-2.5 text-slate-800 font-medium">{item.unitKerja.label}</td>
                  <td className="px-3.5 py-2.5 text-slate-700 font-mono">{item.noSk || "-"}</td>
                  <td className="px-3.5 py-2.5 text-slate-700">
                    {item.tanggalSk ? new Date(item.tanggalSk).toLocaleDateString("id-ID") : "-"}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600">{item.keterangan || "-"}</td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setDialogOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-50 text-[#003399] border-2 border-blue-200 hover:bg-[#003399] hover:text-white transition mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-2.5 py-1 text-xs font-bold rounded-md bg-rose-50 text-rose-800 border-2 border-rose-300 hover:bg-rose-700 hover:text-white transition"
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
        <RiwayatJabatanForm
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

interface RiwayatJabatanFormProps {
  pegawaiId: string;
  initialData: RiwayatJabatan | null;
  onClose: () => void;
  onSave: () => void;
}

function RiwayatJabatanForm({
  pegawaiId,
  initialData,
  onClose,
  onSave,
}: RiwayatJabatanFormProps) {
  const [loading, setLoading] = useState(false);
  const [jabatanList, setJabatanList] = useState<{ id: string; label: string }[]>([]);
  const [unitKerjaList, setUnitKerjaList] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [jabRes, unitRes] = await Promise.all([
          fetch("/api/master-data?kategori=JABATAN"),
          fetch("/api/master-data?kategori=UNIT_KERJA"),
        ]);
        setJabatanList(await jabRes.json());
        setUnitKerjaList(await unitRes.json());
      } catch (error) {
        console.error("Error fetching master data:", error);
      }
    };
    fetchMasterData();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      jabatanId: initialData?.jabatanId || "",
      unitKerjaId: initialData?.unitKerjaId || "",
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
        ? `/api/riwayat-jabatan/${initialData.id}`
        : `/api/pegawai/${pegawaiId}/riwayat-jabatan`;
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
            {initialData ? "Edit Riwayat Jabatan" : "Tambah Riwayat Jabatan"}
          </h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Jabatan *</label>
            <select
              {...register("jabatanId", { required: true })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
            >
              <option value="">Pilih</option>
              {jabatanList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Unit Kerja *</label>
            <select
              {...register("unitKerjaId", { required: true })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
            >
              <option value="">Pilih</option>
              {unitKerjaList.map((item) => (
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

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#003399] text-white rounded-lg hover:bg-[#002266] font-bold text-xs shadow-sm border border-[#002266] transition disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Riwayat Jabatan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
