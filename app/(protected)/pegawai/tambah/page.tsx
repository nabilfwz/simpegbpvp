"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

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

  const FormField = ({
    label,
    error,
    children,
    required,
  }: {
    label: string;
    error?: string;
    children: React.ReactNode;
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tambah Pegawai Baru</h1>
        <p className="text-slate-600 mt-1">Isi data demografi dan informasi kepegawaian</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Data Identitas */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b pb-3">
            📋 Data Identitas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="NIP" error={errors.nip?.message} required>
              <Input
                {...register("nip")}
                placeholder="198001012010011001"
                className="h-11"
              />
            </FormField>
            <FormField label="Nama Lengkap" error={errors.nama?.message} required>
              <Input
                {...register("nama")}
                placeholder="Nama pegawai"
                className="h-11"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField label="Jenis Kelamin" error={errors.jenisKelaminId?.message} required>
              <select
                {...register("jenisKelaminId")}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
              >
                <option value="">Pilih jenis kelamin</option>
                {jenisKelaminList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Tempat Lahir" error={errors.tempatLahir?.message} required>
              <Input
                {...register("tempatLahir")}
                placeholder="Jakarta"
                className="h-11"
              />
            </FormField>
            <FormField label="Tanggal Lahir" error={errors.tanggalLahir?.message} required>
              <Input
                type="date"
                {...register("tanggalLahir")}
                className="h-11"
              />
            </FormField>
          </div>
        </div>

        {/* Data Pribadi */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b pb-3">
            👤 Data Pribadi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Agama" error={errors.agamaId?.message} required>
              <select
                {...register("agamaId")}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
              >
                <option value="">Pilih agama</option>
                {agamaList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Status Perkawinan" error={errors.statusPerkawinanId?.message} required>
              <select
                {...register("statusPerkawinanId")}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
              >
                <option value="">Pilih status perkawinan</option>
                {statusPerkawinanList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="No. HP" error={errors.noHp?.message}>
              <Input
                {...register("noHp")}
                placeholder="081234567890"
                className="h-11"
              />
            </FormField>
            <FormField label="Email" error={errors.email?.message}>
              <Input
                {...register("email")}
                type="email"
                placeholder="email@example.com"
                className="h-11"
              />
            </FormField>
          </div>

          <FormField label="Alamat" error={errors.alamat?.message} required>
            <textarea
              {...register("alamat")}
              placeholder="Alamat lengkap"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none resize-none"
            />
          </FormField>
        </div>

        {/* Data Kepegawaian */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b pb-3">
            💼 Data Kepegawaian
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Pendidikan Terakhir" error={errors.pendidikanTerakhirId?.message} required>
              <select
                {...register("pendidikanTerakhirId")}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
              >
                <option value="">Pilih pendidikan</option>
                {pendidikanList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Unit Kerja" error={errors.unitKerjaId?.message} required>
              <select
                {...register("unitKerjaId")}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
              >
                <option value="">Pilih unit kerja</option>
                {unitKerjaList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Status Pegawai" error={errors.statusPegawaiId?.message} required>
            <select
              {...register("statusPegawaiId")}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none"
            >
              <option value="">Pilih status pegawai</option>
              {statusPegawaiList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#003399] hover:bg-[#002266] text-white font-semibold h-12"
          >
            {loading ? "Menyimpan..." : "💾 Simpan Pegawai"}
          </Button>
          <Button
            type="button"
            onClick={() => router.push("/pegawai")}
            variant="outline"
            className="flex-1 h-12 font-semibold"
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
