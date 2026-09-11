"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { SearchableSelect } from "@/app/components/ui/searchable-select";
import RiwayatPangkatTab from "./riwayat-pangkat-tab";
import RiwayatJabatanTab from "./riwayat-jabatan-tab";

const updateSchema = z.object({
  nip: z.string().min(1).optional(),
  nama: z.string().min(1).optional(),
  jenisKelaminId: z.string().min(1).optional(),
  tempatLahir: z.string().min(1).optional(),
  tempatLahirId: z.string().optional().nullable(),
  tanggalLahir: z.string().min(1).optional(),
  agamaId: z.string().min(1).optional(),
  statusPerkawinanId: z.string().min(1).optional(),
  provinsiId: z.string().optional().nullable(),
  kabupatenKotaId: z.string().optional().nullable(),
  kecamatanId: z.string().optional().nullable(),
  desaId: z.string().optional().nullable(),
  alamat: z.string().min(1).optional(),
  noHp: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  pendidikanTerakhirId: z.string().min(1).optional(),
  dirjenId: z.string().optional().nullable(),
  unitKerjaId: z.string().min(1).optional(),
  subUnitKerjaId: z.string().optional().nullable(),
  eselonId: z.string().optional().nullable(),
  statusPegawaiId: z.string().min(1).optional(),
  fotoUrl: z.string().optional().nullable(),
  aktif: z.boolean().optional(),
});

type PegawaiForm = z.infer<typeof updateSchema>;

interface MasterItem {
  id: string;
  label: string;
  kode?: string | null;
  parentId?: string | null;
}

interface Pegawai {
  id: string;
  nip: string;
  nama: string;
  aktif: boolean;
  jenisKelaminId: string;
  jenisKelamin: { label: string };
  agamaId: string;
  agama: { label: string };
  statusPerkawinanId: string;
  statusPerkawinan: { label: string };
  pendidikanTerakhirId: string;
  pendidikanTerakhir: { label: string };
  dirjenId: string | null;
  dirjen: { label: string } | null;
  unitKerjaId: string;
  unitKerja: { label: string };
  subUnitKerjaId: string | null;
  subUnitKerja: { label: string } | null;
  eselonId: string | null;
  eselon: { label: string } | null;
  statusPegawaiId: string;
  statusPegawai: { label: string };
  provinsiId: string | null;
  provinsi: { label: string } | null;
  kabupatenKotaId: string | null;
  kabupatenKota: { label: string } | null;
  kecamatanId: string | null;
  kecamatan: { label: string } | null;
  desaId: string | null;
  desa: { label: string } | null;
  tempatLahir: string;
  tempatLahirId: string | null;
  tempatLahirRelasi: { label: string } | null;
  tanggalLahir: string;
  alamat: string;
  noHp: string | null;
  email: string | null;
  fotoUrl: string | null;
}

export default function PegawaiDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [pegawai, setPegawai] = useState<Pegawai | null>(null);
  const [activeTab, setActiveTab] = useState("edit");

  // Master Data Lists
  const [jenisKelaminList, setJenisKelaminList] = useState<MasterItem[]>([]);
  const [agamaList, setAgamaList] = useState<MasterItem[]>([]);
  const [statusPerkawinanList, setStatusPerkawinanList] = useState<MasterItem[]>([]);
  const [pendidikanList, setPendidikanList] = useState<MasterItem[]>([]);
  const [statusPegawaiList, setStatusPegawaiList] = useState<MasterItem[]>([]);
  const [eselonList, setEselonList] = useState<MasterItem[]>([]);

  // Penempatan Lists
  const [dirjenList, setDirjenList] = useState<MasterItem[]>([]);
  const [unitKerjaList, setUnitKerjaList] = useState<MasterItem[]>([]);
  const [subUnitKerjaList, setSubUnitKerjaList] = useState<MasterItem[]>([]);
  const [loadingUnitKerja, setLoadingUnitKerja] = useState(false);
  const [loadingSubUnit, setLoadingSubUnit] = useState(false);

  // Regional Lists
  const [provinsiList, setProvinsiList] = useState<MasterItem[]>([]);

  // Tempat Lahir States
  const [tempatLahirProvId, setTempatLahirProvId] = useState<string>("");
  const [kabupatenLahirList, setKabupatenLahirList] = useState<MasterItem[]>([]);
  const [loadingKabLahir, setLoadingKabLahir] = useState(false);

  // Alamat Cascading Lists (Prov -> Kab -> Kec -> Desa)
  const [kabupatenKotaList, setKabupatenKotaList] = useState<MasterItem[]>([]);
  const [kecamatanList, setKecamatanList] = useState<MasterItem[]>([]);
  const [desaList, setDesaList] = useState<MasterItem[]>([]);

  const [loadingKabKota, setLoadingKabKota] = useState(false);
  const [loadingKecamatan, setLoadingKecamatan] = useState(false);
  const [loadingDesa, setLoadingDesa] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
    reset,
  } = useForm<PegawaiForm>({
    resolver: zodResolver(updateSchema),
  });

  const selectedProvinsiId = watch("provinsiId");
  const selectedKabupatenKotaId = watch("kabupatenKotaId");
  const selectedKecamatanId = watch("kecamatanId");
  const selectedTempatLahir = watch("tempatLahir");
  const selectedTempatLahirId = watch("tempatLahirId");
  const selectedDirjenId = watch("dirjenId");
  const selectedUnitKerjaId = watch("unitKerjaId");
  const selectedSubUnitKerjaId = watch("subUnitKerjaId");

  const fetchPegawai = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pegawai/${id}`);
      if (!res.ok) throw new Error("Gagal mengambil data pegawai");
      const data: Pegawai = await res.json();
      setPegawai(data);

      reset({
        nip: data.nip,
        nama: data.nama,
        jenisKelaminId: data.jenisKelaminId,
        tempatLahir: data.tempatLahir,
        tempatLahirId: data.tempatLahirId || null,
        tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir).toISOString().split("T")[0] : "",
        agamaId: data.agamaId,
        statusPerkawinanId: data.statusPerkawinanId,
        provinsiId: data.provinsiId || "",
        kabupatenKotaId: data.kabupatenKotaId || "",
        kecamatanId: data.kecamatanId || "",
        desaId: data.desaId || null,
        alamat: data.alamat,
        noHp: data.noHp || "",
        email: data.email || "",
        pendidikanTerakhirId: data.pendidikanTerakhirId,
        dirjenId: data.dirjenId || null,
        unitKerjaId: data.unitKerjaId,
        subUnitKerjaId: data.subUnitKerjaId || null,
        eselonId: data.eselonId || null,
        statusPegawaiId: data.statusPegawaiId,
        fotoUrl: data.fotoUrl || "",
        aktif: data.aktif,
      });

      // Load cascading lists for Alamat
      if (data.provinsiId) {
        const kabRes = await fetch(`/api/master-data?kategori=KABUPATEN_KOTA&parentId=${data.provinsiId}`);
        if (kabRes.ok) setKabupatenKotaList(await kabRes.json());
      }
      if (data.kabupatenKotaId) {
        const kecRes = await fetch(`/api/master-data?kategori=KECAMATAN&parentId=${data.kabupatenKotaId}`);
        if (kecRes.ok) setKecamatanList(await kecRes.json());
      }
      if (data.kecamatanId) {
        const desaRes = await fetch(`/api/master-data?kategori=DESA_KELURAHAN&parentId=${data.kecamatanId}`);
        if (desaRes.ok) setDesaList(await desaRes.json());
      }

      // Load cascading lists for Penempatan
      if (data.unitKerjaId) {
        const subRes = await fetch(`/api/master-data?kategori=SUB_UNIT_KERJA&parentId=${data.unitKerjaId}`);
        if (subRes.ok) setSubUnitKerjaList(await subRes.json());
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  const fetchMasterData = async () => {
    try {
      const [
        jkRes,
        agamaRes,
        perkawinanRes,
        pendidikanRes,
        dirjenRes,
        unitRes,
        subUnitRes,
        eselonRes,
        statusRes,
        provRes,
      ] = await Promise.all([
        fetch("/api/master-data?kategori=JENIS_KELAMIN"),
        fetch("/api/master-data?kategori=AGAMA"),
        fetch("/api/master-data?kategori=STATUS_PERKAWINAN"),
        fetch("/api/master-data?kategori=PENDIDIKAN"),
        fetch("/api/master-data?kategori=DIRJEN"),
        fetch("/api/master-data?kategori=UNIT_KERJA"),
        fetch("/api/master-data?kategori=SUB_UNIT_KERJA"),
        fetch("/api/master-data?kategori=ESELON"),
        fetch("/api/master-data?kategori=STATUS_PEGAWAI"),
        fetch("/api/master-data?kategori=PROVINSI"),
      ]);

      if (jkRes.ok) setJenisKelaminList(await jkRes.json());
      if (agamaRes.ok) setAgamaList(await agamaRes.json());
      if (perkawinanRes.ok) setStatusPerkawinanList(await perkawinanRes.json());
      if (pendidikanRes.ok) setPendidikanList(await pendidikanRes.json());
      if (dirjenRes.ok) setDirjenList(await dirjenRes.json());
      if (unitRes.ok) setUnitKerjaList(await unitRes.json());
      if (subUnitRes.ok) setSubUnitKerjaList(await subUnitRes.json());
      if (eselonRes.ok) setEselonList(await eselonRes.json());
      if (statusRes.ok) setStatusPegawaiList(await statusRes.json());
      if (provRes.ok) setProvinsiList(await provRes.json());
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchPegawai();
  }, [fetchPegawai]);

  // Tempat Lahir: change province
  const handleTempatLahirProvChange = async (provId: string) => {
    setTempatLahirProvId(provId);
    setKabupatenLahirList([]);

    if (provId) {
      setLoadingKabLahir(true);
      try {
        const res = await fetch(`/api/master-data?kategori=KABUPATEN_KOTA&parentId=${provId}`);
        if (res.ok) setKabupatenLahirList(await res.json());
      } catch (err) {
        console.error("Error fetching kab lahir:", err);
      } finally {
        setLoadingKabLahir(false);
      }
    }
  };

  // Alamat: change province
  const handleProvinsiChange = async (provId: string) => {
    setValue("provinsiId", provId);
    setValue("kabupatenKotaId", "");
    setValue("kecamatanId", "");
    setValue("desaId", null);
    setKabupatenKotaList([]);
    setKecamatanList([]);
    setDesaList([]);

    if (provId) {
      setLoadingKabKota(true);
      try {
        const res = await fetch(`/api/master-data?kategori=KABUPATEN_KOTA&parentId=${provId}`);
        if (res.ok) setKabupatenKotaList(await res.json());
      } catch (err) {
        console.error("Error fetching kab kota:", err);
      } finally {
        setLoadingKabKota(false);
      }
    }
  };

  // Alamat: change kab/kota
  const handleKabKotaChange = async (kabId: string) => {
    setValue("kabupatenKotaId", kabId);
    setValue("kecamatanId", "");
    setValue("desaId", null);
    setKecamatanList([]);
    setDesaList([]);

    if (kabId) {
      setLoadingKecamatan(true);
      try {
        const res = await fetch(`/api/master-data?kategori=KECAMATAN&parentId=${kabId}`);
        if (res.ok) setKecamatanList(await res.json());
      } catch (err) {
        console.error("Error fetching kecamatan:", err);
      } finally {
        setLoadingKecamatan(false);
      }
    }
  };

  // Alamat: change kecamatan
  const handleKecamatanChange = async (kecId: string) => {
    setValue("kecamatanId", kecId);
    setValue("desaId", null);
    setDesaList([]);

    if (kecId) {
      setLoadingDesa(true);
      try {
        const res = await fetch(`/api/master-data?kategori=DESA_KELURAHAN&parentId=${kecId}`);
        if (res.ok) setDesaList(await res.json());
      } catch (err) {
        console.error("Error fetching desa:", err);
      } finally {
        setLoadingDesa(false);
      }
    }
  };

  // Penempatan: change Ditjen
  const handleDirjenChange = async (dId: string) => {
    setValue("dirjenId", dId || null);
    setValue("unitKerjaId", "");
    setValue("subUnitKerjaId", null);

    if (!dId) {
      try {
        const res = await fetch("/api/master-data?kategori=UNIT_KERJA");
        if (res.ok) setUnitKerjaList(await res.json());
      } catch (e) {}
      return;
    }

    setLoadingUnitKerja(true);
    try {
      const res = await fetch(`/api/master-data?kategori=UNIT_KERJA&parentId=${dId}`);
      if (res.ok) setUnitKerjaList(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUnitKerja(false);
    }
  };

  // Penempatan: change Unit Kerja
  const handleUnitKerjaChange = async (uId: string) => {
    setValue("unitKerjaId", uId);
    setValue("subUnitKerjaId", null);
    setSubUnitKerjaList([]);

    if (!uId) return;

    setLoadingSubUnit(true);
    try {
      const res = await fetch(`/api/master-data?kategori=SUB_UNIT_KERJA&parentId=${uId}`);
      if (res.ok) setSubUnitKerjaList(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubUnit(false);
    }
  };

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
    return <div className="p-6 text-slate-500">Memuat data pegawai...</div>;
  }

  if (!pegawai) return null;

  // Format full address including Desa
  const fullAddress = [
    pegawai.alamat,
    pegawai.desa ? pegawai.desa.label : null,
    pegawai.kecamatan ? `Kec. ${pegawai.kecamatan.label.replace(/^Kecamatan\s+/i, "")}` : null,
    pegawai.kabupatenKota ? pegawai.kabupatenKota.label : null,
    pegawai.provinsi ? `Prov. ${pegawai.provinsi.label}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Detail Pegawai BPVP</h1>
          <p className="text-slate-600 text-sm mt-0.5">
            {pegawai.nama} &bull; <span className="font-mono">{pegawai.nip}</span>
          </p>
        </div>
        <button
          onClick={() => router.push("/pegawai")}
          className="px-4 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-100 text-slate-800 font-bold text-sm shadow-xs transition self-start sm:self-auto"
        >
          &larr; Kembali ke Daftar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Summary Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-5">
            <div className="flex flex-col items-center text-center">
              {pegawai.fotoUrl ? (
                <img
                  src={pegawai.fotoUrl}
                  className="w-28 h-28 rounded-full object-cover mb-3 border-2 border-[#003399] shadow-sm"
                  alt=""
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#003399] to-[#0055cc] flex items-center justify-center text-white text-3xl font-bold mb-3 shadow-sm">
                  {pegawai.nama.charAt(0)}
                </div>
              )}
              <h2 className="text-lg font-bold text-slate-900 leading-snug">{pegawai.nama}</h2>
              <p className="text-slate-500 font-mono text-xs mt-0.5">{pegawai.nip}</p>
              <div className="mt-2 flex items-center gap-1.5 flex-wrap justify-center">
                <span className="px-2.5 py-0.5 bg-blue-50 text-[#003399] font-semibold text-xs rounded-full border border-blue-200">
                  {pegawai.statusPegawai?.label || "Status"}
                </span>
                {pegawai.aktif ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-full">
                    Aktif
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-semibold text-xs rounded-full">
                    Tong Sampah
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3.5 border-t border-slate-100 pt-4 text-xs">
              {/* Penempatan Detail */}
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider mb-1">
                  Penempatan Organisasi
                </p>
                {pegawai.dirjen && (
                  <p className="text-slate-500 font-medium truncate" title={pegawai.dirjen.label}>
                    {pegawai.dirjen.label}
                  </p>
                )}
                <p className="font-bold text-slate-900 text-sm">{pegawai.unitKerja?.label || "-"}</p>
                {pegawai.subUnitKerja && (
                  <p className="font-semibold text-[#003399] mt-0.5 bg-blue-50/60 px-2 py-1 rounded border border-blue-100">
                    {pegawai.subUnitKerja.label}
                  </p>
                )}
              </div>

              {/* Eselon */}
              {pegawai.eselon && (
                <div>
                  <p className="text-gray-400 font-semibold uppercase tracking-wider mb-0.5">
                    Tingkat Jabatan / Eselon
                  </p>
                  <span className="inline-block px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded">
                    {pegawai.eselon.label}
                  </span>
                </div>
              )}

              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider">Jenis Kelamin</p>
                <p className="font-medium text-slate-800">{pegawai.jenisKelamin?.label || "-"}</p>
              </div>

              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider">Tempat, Tanggal Lahir</p>
                <p className="font-medium text-slate-800">
                  {pegawai.tempatLahir}, {new Date(pegawai.tanggalLahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>

              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider">Alamat &amp; Domisili</p>
                <p className="font-medium text-slate-800 leading-relaxed">
                  {fullAddress || pegawai.alamat || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider">Agama &amp; Perkawinan</p>
                <p className="font-medium text-slate-800">
                  {pegawai.agama?.label || "-"} &bull; {pegawai.statusPerkawinan?.label || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider">Pendidikan Terakhir</p>
                <p className="font-medium text-slate-800">{pegawai.pendidikanTerakhir?.label || "-"}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-gray-400 font-semibold uppercase">No. HP</p>
                  <p className="font-mono text-slate-800">{pegawai.noHp || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold uppercase">Email</p>
                  <p className="font-medium text-slate-800 truncate" title={pegawai.email || ""}>
                    {pegawai.email || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50">
              <nav className="flex overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                    activeTab === "edit"
                      ? "border-[#003399] text-[#003399] bg-white"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  📝 Edit Data Pegawai
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("pangkat")}
                  className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                    activeTab === "pangkat"
                      ? "border-[#003399] text-[#003399] bg-white"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🎖️ Riwayat Pangkat
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("jabatan")}
                  className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                    activeTab === "jabatan"
                      ? "border-[#003399] text-[#003399] bg-white"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  💼 Riwayat Jabatan
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "edit" && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Identity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        NIP / Nomor Identitas
                      </label>
                      <input
                        {...register("nip")}
                        disabled
                        className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-sm font-mono text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Nama Lengkap
                      </label>
                      <input
                        {...register("nama")}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Jenis Kelamin
                      </label>
                      <Controller
                        control={control}
                        name="jenisKelaminId"
                        render={({ field }) => (
                          <SearchableSelect
                            options={jenisKelaminList.map((j) => ({ value: j.id, label: j.label }))}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Pilih Jenis Kelamin"
                            searchPlaceholder="Cari jenis kelamin..."
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        {...register("tanggalLahir")}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Tempat Lahir Dropdown Searchable */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        📍 Tempat Lahir (Dropdown Wilayah)
                      </span>
                      {selectedTempatLahir && (
                        <span className="text-xs bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-medium border border-emerald-200">
                          Saat Ini: {selectedTempatLahir}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Ubah Provinsi Lahir
                        </label>
                        <SearchableSelect
                          options={provinsiList.map((p) => ({ value: p.id, label: p.label, kode: p.kode }))}
                          value={tempatLahirProvId}
                          onChange={handleTempatLahirProvChange}
                          placeholder="Pilih Provinsi Lahir"
                          searchPlaceholder="Cari provinsi..."
                          allowClear={true}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Pilih Kab / Kota Lahir {loadingKabLahir && "(Memuat...)"}
                        </label>
                        <SearchableSelect
                          options={kabupatenLahirList.map((k) => ({ value: k.id, label: k.label, kode: k.kode }))}
                          value={selectedTempatLahirId || ""}
                          disabled={!tempatLahirProvId || loadingKabLahir}
                          onChange={(kId) => {
                            const found = kabupatenLahirList.find((k) => k.id === kId);
                            if (found) {
                              setValue("tempatLahir", found.label);
                              setValue("tempatLahirId", found.id);
                            }
                          }}
                          placeholder={
                            !tempatLahirProvId
                              ? "Pilih provinsi dahulu"
                              : loadingKabLahir
                              ? "Memuat kab/kota..."
                              : "Pilih Kab/Kota Lahir"
                          }
                          searchPlaceholder="Cari kab/kota..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Wilayah Domisili 4 Tingkat Searchable */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        📍 Wilayah Domisili (4 Tingkat Wilayah)
                      </span>
                      <span className="text-xs text-[#003399] font-medium">
                        Provinsi &rarr; Kab/Kota &rarr; Kecamatan &rarr; Desa
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          1. Provinsi
                        </label>
                        <Controller
                          control={control}
                          name="provinsiId"
                          render={({ field }) => (
                            <SearchableSelect
                              options={provinsiList.map((p) => ({ value: p.id, label: p.label, kode: p.kode }))}
                              value={field.value || ""}
                              onChange={handleProvinsiChange}
                              placeholder="Pilih Provinsi"
                              searchPlaceholder="Cari provinsi..."
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          2. Kab / Kota
                        </label>
                        <Controller
                          control={control}
                          name="kabupatenKotaId"
                          render={({ field }) => (
                            <SearchableSelect
                              options={kabupatenKotaList.map((k) => ({ value: k.id, label: k.label, kode: k.kode }))}
                              value={field.value || ""}
                              disabled={!selectedProvinsiId || loadingKabKota}
                              onChange={handleKabKotaChange}
                              placeholder={
                                !selectedProvinsiId
                                  ? "Pilih provinsi dahulu"
                                  : loadingKabKota
                                  ? "Memuat..."
                                  : "Pilih Kab/Kota"
                              }
                              searchPlaceholder="Cari kab/kota..."
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          3. Kecamatan
                        </label>
                        <Controller
                          control={control}
                          name="kecamatanId"
                          render={({ field }) => (
                            <SearchableSelect
                              options={kecamatanList.map((kc) => ({ value: kc.id, label: kc.label, kode: kc.kode }))}
                              value={field.value || ""}
                              disabled={!selectedKabupatenKotaId || loadingKecamatan}
                              onChange={handleKecamatanChange}
                              placeholder={
                                !selectedKabupatenKotaId
                                  ? "Pilih kab/kota dahulu"
                                  : loadingKecamatan
                                  ? "Memuat..."
                                  : "Pilih Kecamatan"
                              }
                              searchPlaceholder="Cari kecamatan..."
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          4. Desa / Gampong
                        </label>
                        <Controller
                          control={control}
                          name="desaId"
                          render={({ field }) => (
                            <SearchableSelect
                              options={desaList.map((d) => ({ value: d.id, label: d.label, kode: d.kode }))}
                              value={field.value || ""}
                              disabled={!selectedKecamatanId || loadingDesa}
                              onChange={(val) => field.onChange(val || null)}
                              placeholder={
                                !selectedKecamatanId
                                  ? "Pilih kecamatan dahulu"
                                  : loadingDesa
                                  ? "Memuat..."
                                  : "Pilih Desa / Gampong"
                              }
                              searchPlaceholder="Cari desa/gampong..."
                              allowClear={true}
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Detail Alamat (Jalan, No. Rumah, RT/RW, Dusun)
                      </label>
                      <textarea
                        {...register("alamat")}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm resize-none bg-white"
                      />
                    </div>
                  </div>

                  {/* Penempatan Organisasi Detail & Eselon */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <div className="border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        🏢 Penempatan Organisasi &amp; Eselon
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          1. Ditjen
                        </label>
                        <SearchableSelect
                          options={dirjenList.map((d) => ({ value: d.id, label: d.label, kode: d.kode }))}
                          value={selectedDirjenId || ""}
                          onChange={handleDirjenChange}
                          placeholder="Pilih Ditjen..."
                          searchPlaceholder="Cari Ditjen..."
                          allowClear={true}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          2. Unit Kerja / Balai *
                        </label>
                        <Controller
                          control={control}
                          name="unitKerjaId"
                          render={({ field }) => (
                            <SearchableSelect
                              options={unitKerjaList.map((u) => ({ value: u.id, label: u.label, kode: u.kode }))}
                              value={field.value}
                              disabled={loadingUnitKerja}
                              onChange={handleUnitKerjaChange}
                              placeholder="Pilih Unit Kerja..."
                              searchPlaceholder="Cari unit kerja..."
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          3. Sub Unit (Subbagian Umum...)
                        </label>
                        <Controller
                          control={control}
                          name="subUnitKerjaId"
                          render={({ field }) => (
                            <SearchableSelect
                              options={subUnitKerjaList.map((s) => ({ value: s.id, label: s.label, kode: s.kode }))}
                              value={field.value || ""}
                              disabled={loadingSubUnit || subUnitKerjaList.length === 0}
                              onChange={(val) => field.onChange(val || null)}
                              placeholder={
                                subUnitKerjaList.length === 0
                                  ? "Pilih unit kerja dahulu"
                                  : "Pilih Sub Unit (Subbagian Umum...)"
                              }
                              searchPlaceholder="Cari Sub Unit (Subbagian Umum...)"
                              allowClear={true}
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Tingkat Jabatan / Eselon
                        </label>
                        <Controller
                          control={control}
                          name="eselonId"
                          render={({ field }) => (
                            <SearchableSelect
                              options={eselonList.map((e) => ({ value: e.id, label: e.label, kode: e.kode }))}
                              value={field.value || ""}
                              onChange={(val) => field.onChange(val || null)}
                              placeholder="Pilih Eselon / JF..."
                              searchPlaceholder="Cari eselon (III.a, IV.a, JF)..."
                              allowClear={true}
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Status Kepegawaian
                        </label>
                        <Controller
                          control={control}
                          name="statusPegawaiId"
                          render={({ field }) => (
                            <SearchableSelect
                              options={statusPegawaiList.map((s) => ({ value: s.id, label: s.label, kode: s.kode }))}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Pilih Status..."
                              searchPlaceholder="Cari status pegawai..."
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Demografi Tambahan */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Agama
                      </label>
                      <Controller
                        control={control}
                        name="agamaId"
                        render={({ field }) => (
                          <SearchableSelect
                            options={agamaList.map((a) => ({ value: a.id, label: a.label }))}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Pilih Agama"
                            searchPlaceholder="Cari agama..."
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Status Perkawinan
                      </label>
                      <Controller
                        control={control}
                        name="statusPerkawinanId"
                        render={({ field }) => (
                          <SearchableSelect
                            options={statusPerkawinanList.map((s) => ({ value: s.id, label: s.label }))}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Pilih Status Perkawinan"
                            searchPlaceholder="Cari status perkawinan..."
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Pendidikan Terakhir
                      </label>
                      <Controller
                        control={control}
                        name="pendidikanTerakhirId"
                        render={({ field }) => (
                          <SearchableSelect
                            options={pendidikanList.map((p) => ({ value: p.id, label: p.label }))}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Pilih Pendidikan"
                            searchPlaceholder="Cari pendidikan..."
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Kontak */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Nomor Handphone / WhatsApp
                      </label>
                      <input
                        {...register("noHp")}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Email
                      </label>
                      <input
                        {...register("email")}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-[#003399] text-white font-bold rounded-lg hover:bg-[#002266] transition shadow-md border border-[#002266] text-sm disabled:opacity-50"
                    >
                      {loading ? "Menyimpan Perubahan..." : "Simpan Perubahan Data Pegawai"}
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
