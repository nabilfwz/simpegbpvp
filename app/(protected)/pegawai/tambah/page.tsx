"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const pegawaiSchema = z.object({
  nip: z.string().min(1, "NIP wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  jenisKelaminId: z.string().min(1, "Jenis kelamin wajib dipilih"),
  tempatLahir: z.string().min(1, "Tempat lahir wajib diisi"),
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  agamaId: z.string().min(1, "Agama wajib dipilih"),
  statusPerkawinanId: z.string().min(1, "Status perkawinan wajib dipilih"),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  noHp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  pendidikanTerakhirId: z.string().min(1, "Pendidikan terakhir wajib dipilih"),
  unitKerjaId: z.string().min(1, "Unit kerja wajib dipilih"),
  statusPegawaiId: z.string().min(1, "Status pegawai wajib dipilih"),
});

type PegawaiForm = z.infer<typeof pegawaiSchema>;

export default function TambahPegawaiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [jenisKelaminList, setJenisKelaminList] = useState<{ id: string; label: string }[]>([]);
  const [agamaList, setAgamaList] = useState<{ id: string; label: string }[]>([]);
  const [statusPerkawinanList, setStatusPerkawinanList] = useState<{ id: string; label: string }[]>([]);
  const [pendidikanList, setPendidikanList] = useState<{ id: string; label: string }[]>([]);
  const [unitKerjaList, setUnitKerjaList] = useState<{ id: string; label: string }[]>([]);
  const [statusPegawaiList, setStatusPegawaiList] = useState<{ id: string; label: string }[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PegawaiForm>({
    resolver: zodResolver(pegawaiSchema),
    defaultValues: {
      nip: "",
      nama: "",
      jenisKelaminId: "",
      tempatLahir: "",
      tanggalLahir: "",
      agamaId: "",
      statusPerkawinanId: "",
      alamat: "",
      noHp: "",
      email: "",
      pendidikanTerakhirId: "",
      unitKerjaId: "",
      statusPegawaiId: "",
    },
  });

  const fetchMasterData = async () => {
    try {
      const [jkRes, agamaRes, perkawinanRes, pendidikanRes, unitRes, statusRes] = await Promise.all([
        fetch("/api/master-data?kategori=JENIS_KELAMIN"),
        fetch("/api/master-data?kategori=AGAMA"),
        fetch("/api/master-data?kategori=STATUS_PERKAWINAN"),
        fetch("/api/master-data?kategori=PENDIDIKAN"),
        fetch("/api/master-data?kategori=UNIT_KERJA"),
        fetch("/api/master-data?kategori=STATUS_PEGAWAI"),
      ]);

      if (jkRes.ok) setJenisKelaminList(await jkRes.json());
      if (agamaRes.ok) setAgamaList(await agamaRes.json());
      if (perkawinanRes.ok) setStatusPerkawinanList(await perkawinanRes.json());
      if (pendidikanRes.ok) setPendidikanList(await pendidikanRes.json());
      if (unitRes.ok) setUnitKerjaList(await unitRes.json());
      if (statusRes.ok) setStatusPegawaiList(await statusRes.json());
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const onSubmit = async (formData: PegawaiForm) => {
    setLoading(true);
    try {
      const res = await fetch("/api/pegawai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan data");
      }

      const created = await res.json();
      toast.success("Pegawai berhasil ditambahkan");
      router.push(`/pegawai/${created.id}`);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003399]">Tambah Pegawai</h1>
        <p className="text-gray-600 mt-1">Isi data demografi dan informasi kepegawaian</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">Data Identitas</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">NIP *</label>
              <input
                {...register("nip")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
                placeholder="198001012010011001"
              />
              {errors.nip && (
                <p className="text-red-500 text-xs mt-1">{errors.nip.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nama Lengkap *</label>
              <input
                {...register("nama")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
                placeholder="Nama pegawai"
              />
              {errors.nama && (
                <p className="text-red-500 text-xs mt-1">{errors.nama.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Jenis Kelamin *</label>
              <select
                {...register("jenisKelaminId")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
              >
                <option value="">Pilih</option>
                {jenisKelaminList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.jenisKelaminId && (
                <p className="text-red-500 text-xs mt-1">{errors.jenisKelaminId.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tempat Lahir *</label>
              <input
                {...register("tempatLahir")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
                placeholder="Jakarta"
              />
              {errors.tempatLahir && (
                <p className="text-red-500 text-xs mt-1">{errors.tempatLahir.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tanggal Lahir *</label>
              <input
                type="date"
                {...register("tanggalLahir")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
              />
              {errors.tanggalLahir && (
                <p className="text-red-500 text-xs mt-1">{errors.tanggalLahir.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">Data Pribadi</h2>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Agama *</label>
              <select
                {...register("agamaId")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
              >
                <option value="">Pilih</option>
                {agamaList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.agamaId && (
                <p className="text-red-500 text-xs mt-1">{errors.agamaId.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status Perkawinan *</label>
              <select
                {...register("statusPerkawinanId")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
              >
                <option value="">Pilih</option>
                {statusPerkawinanList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.statusPerkawinanId && (
                <p className="text-red-500 text-xs mt-1">{errors.statusPerkawinanId.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">No. HP</label>
              <input
                {...register("noHp")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
                placeholder="081234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                {...register("email")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Alamat *</label>
            <textarea
              {...register("alamat")}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
              rows={3}
              placeholder="Alamat lengkap"
            />
            {errors.alamat && (
              <p className="text-red-500 text-xs mt-1">{errors.alamat.message}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">Data Kepegawaian</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Pendidikan Terakhir *</label>
              <select
                {...register("pendidikanTerakhirId")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
              >
                <option value="">Pilih</option>
                {pendidikanList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.pendidikanTerakhirId && (
                <p className="text-red-500 text-xs mt-1">{errors.pendidikanTerakhirId.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit Kerja / Penempatan *</label>
              <select
                {...register("unitKerjaId")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
              >
                <option value="">Pilih</option>
                {unitKerjaList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.unitKerjaId && (
                <p className="text-red-500 text-xs mt-1">{errors.unitKerjaId.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status Pegawai *</label>
              <select
                {...register("statusPegawaiId")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
              >
                <option value="">Pilih</option>
                {statusPegawaiList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.statusPegawaiId && (
                <p className="text-red-500 text-xs mt-1">{errors.statusPegawaiId.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#003399] text-white py-3 rounded-lg hover:bg-[#002266] transition disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Pegawai"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/pegawai")}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
