"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import RiwayatPangkatTab from "./riwayat-pangkat-tab";
import RiwayatJabatanTab from "./riwayat-jabatan-tab";

const updateSchema = z.object({
  nip: z.string().min(1).optional(),
  nama: z.string().min(1).optional(),
  jenisKelaminId: z.string().min(1).optional(),
  tempatLahir: z.string().min(1).optional(),
  tanggalLahir: z.string().min(1).optional(),
  agamaId: z.string().min(1).optional(),
  statusPerkawinanId: z.string().min(1).optional(),
  alamat: z.string().min(1).optional(),
  noHp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")).optional(),
  pendidikanTerakhirId: z.string().min(1).optional(),
  unitKerjaId: z.string().min(1).optional(),
  statusPegawaiId: z.string().min(1).optional(),
  fotoUrl: z.string().optional(),
  aktif: z.boolean().optional(),
});

type PegawaiForm = z.infer<typeof updateSchema>;

interface Pegawai {
  id: string;
  nip: string;
  nama: string;
  jenisKelamin: { label: string };
  agama: { label: string };
  statusPerkawinan: { label: string };
  pendidikanTerakhir: { label: string };
  unitKerja: { label: string };
  statusPegawai: { label: string };
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  noHp: string | null;
  email: string | null;
  fotoUrl: string | null;
}

interface MasterData {
  id: string;
  label: string;
}

export default function PegawaiDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [pegawai, setPegawai] = useState<Pegawai | null>(null);
  const [activeTab, setActiveTab] = useState("edit");
  const [jenisKelaminList, setJenisKelaminList] = useState<MasterData[]>([]);
  const [agamaList, setAgamaList] = useState<MasterData[]>([]);
  const [statusPerkawinanList, setStatusPerkawinanList] = useState<MasterData[]>([]);
  const [pendidikanList, setPendidikanList] = useState<MasterData[]>([]);
  const [unitKerjaList, setUnitKerjaList] = useState<MasterData[]>([]);
  const [statusPegawaiList, setStatusPegawaiList] = useState<MasterData[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PegawaiForm>({
    resolver: zodResolver(updateSchema),
  });

  const fetchPegawai = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pegawai/${id}`);
      if (!res.ok) throw new Error("Gagal mengambil data pegawai");
      const data = await res.json();
      setPegawai(data);
      reset({
        nip: data.nip,
        nama: data.nama,
        jenisKelaminId: data.jenisKelaminId,
        tempatLahir: data.tempatLahir,
        tanggalLahir: new Date(data.tanggalLahir).toISOString().split("T")[0],
        agamaId: data.agamaId,
        statusPerkawinanId: data.statusPerkawinanId,
        alamat: data.alamat,
        noHp: data.noHp || "",
        email: data.email || "",
        pendidikanTerakhirId: data.pendidikanTerakhirId,
        unitKerjaId: data.unitKerjaId,
        statusPegawaiId: data.statusPegawaiId,
        fotoUrl: data.fotoUrl || "",
      });
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

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
    fetchPegawai();
    fetchMasterData();
  }, [id]);

  const onSubmit = async (formData: PegawaiForm) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pegawai/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memperbarui data");
      }

      toast.success("Data pegawai berhasil diperbarui");
      fetchPegawai();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !pegawai) {
    return <div className="p-6">Memuat data...</div>;
  }

  if (!pegawai) return null;

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#003399]">Detail Pegawai</h1>
          <p className="text-gray-600 mt-1">{pegawai.nama} - {pegawai.nip}</p>
        </div>
        <button
          onClick={() => router.push("/pegawai")}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Kembali
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col items-center">
              {pegawai.fotoUrl ? (
                <img src={pegawai.fotoUrl} className="w-32 h-32 rounded-full object-cover mb-4" alt="" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl mb-4">
                  {pegawai.nama.charAt(0)}
                </div>
              )}
              <h2 className="text-xl font-semibold text-center">{pegawai.nama}</h2>
              <p className="text-gray-500 font-mono text-sm">{pegawai.nip}</p>
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase">Jenis Kelamin</p>
                <p className="font-medium text-sm">{pegawai.jenisKelamin.label}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Tempat, Tanggal Lahir</p>
                <p className="font-medium text-sm">
                  {pegawai.tempatLahir}, {new Date(pegawai.tanggalLahir).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Agama</p>
                <p className="font-medium text-sm">{pegawai.agama.label}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Status Perkawinan</p>
                <p className="font-medium text-sm">{pegawai.statusPerkawinan.label}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">No. HP</p>
                <p className="font-medium text-sm">{pegawai.noHp || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Email</p>
                <p className="font-medium text-sm">{pegawai.email || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Pendidikan Terakhir</p>
                <p className="font-medium text-sm">{pegawai.pendidikanTerakhir.label}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Unit Kerja</p>
                <p className="font-medium text-sm">{pegawai.unitKerja.label}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Status Pegawai</p>
                <p className="font-medium text-sm">{pegawai.statusPegawai.label}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab("edit")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                    activeTab === "edit"
                      ? "border-[#003399] text-[#003399]"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Edit Data
                </button>
                <button
                  onClick={() => setActiveTab("pangkat")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                    activeTab === "pangkat"
                      ? "border-[#003399] text-[#003399]"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Riwayat Pangkat
                </button>
                <button
                  onClick={() => setActiveTab("jabatan")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                    activeTab === "jabatan"
                      ? "border-[#003399] text-[#003399]"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Riwayat Jabatan
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "edit" && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">NIP</label>
                      <input
                        {...register("nip")}
                        disabled
                        className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
                      <input
                        {...register("nama")}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
                      <select
                        {...register("jenisKelaminId")}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                      >
                        {jenisKelaminList.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tempat Lahir</label>
                      <input
                        {...register("tempatLahir")}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tanggal Lahir</label>
                      <input
                        type="date"
                        {...register("tanggalLahir")}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Agama</label>
                      <select
                        {...register("agamaId")}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                      >
                        {agamaList.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status Perkawinan</label>
                      <select
                        {...register("statusPerkawinanId")}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                      >
                        {statusPerkawinanList.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">No. HP</label>
                      <input
                        {...register("noHp")}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        {...register("email")}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Alamat</label>
                    <textarea
                      {...register("alamat")}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Pendidikan Terakhir</label>
                      <select
                        {...register("pendidikanTerakhirId")}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                      >
                        {pendidikanList.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Unit Kerja</label>
                      <select
                        {...register("unitKerjaId")}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                      >
                        {unitKerjaList.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status Pegawai</label>
                      <select
                        {...register("statusPegawaiId")}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                      >
                        {statusPegawaiList.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-[#003399] text-white rounded-lg hover:bg-[#002266] transition disabled:opacity-50 text-sm"
                    >
                      {loading ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "pangkat" && <RiwayatPangkatTab pegawaiId={id} />}
              {activeTab === "jabatan" && <RiwayatJabatanTab pegawaiId={id} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
