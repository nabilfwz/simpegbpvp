"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Camera, Upload, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { SearchableSelect } from "@/app/components/ui/searchable-select";

const pegawaiSchema = z.object({
  nip: z.string().min(1, "NIP wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  jenisKelaminId: z.string().min(1, "Jenis kelamin wajib dipilih"),
  tempatLahir: z.string().min(1, "Tempat lahir wajib dipilih"),
  tempatLahirId: z.string().optional().nullable(),
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  agamaId: z.string().min(1, "Agama wajib dipilih"),
  statusPerkawinanId: z.string().min(1, "Status perkawinan wajib dipilih"),
  provinsiId: z.string().min(1, "Provinsi wajib dipilih"),
  kabupatenKotaId: z.string().min(1, "Kabupaten/Kota wajib dipilih"),
  kecamatanId: z.string().min(1, "Kecamatan wajib dipilih"),
  desaId: z.string().optional().nullable(),
  alamat: z.string().min(1, "Detail alamat wajib diisi"),
  noHp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  pendidikanTerakhirId: z.string().min(1, "Pendidikan terakhir wajib dipilih"),
  dirjenId: z.string().optional().nullable(),
  unitKerjaId: z.string().min(1, "Unit kerja wajib dipilih"),
  subUnitKerjaId: z.string().optional().nullable(),
  eselonId: z.string().optional().nullable(),
  statusPegawaiId: z.string().min(1, "Status pegawai wajib dipilih"),
  fotoUrl: z.string().optional().nullable(),
});

type PegawaiForm = z.infer<typeof pegawaiSchema>;

interface MasterItem {
  id: string;
  label: string;
  kode?: string | null;
  parentId?: string | null;
}

export default function TambahPegawaiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Master Data Lists
  const [jenisKelaminList, setJenisKelaminList] = useState<MasterItem[]>([]);
  const [agamaList, setAgamaList] = useState<MasterItem[]>([]);
  const [statusPerkawinanList, setStatusPerkawinanList] = useState<MasterItem[]>([]);
  const [pendidikanList, setPendidikanList] = useState<MasterItem[]>([]);
  const [statusPegawaiList, setStatusPegawaiList] = useState<MasterItem[]>([]);
  const [eselonList, setEselonList] = useState<MasterItem[]>([]);

  // Penempatan Lists (Ditjen -> Unit Kerja -> Sub Unit Kerja)
  const [dirjenList, setDirjenList] = useState<MasterItem[]>([]);
  const [unitKerjaList, setUnitKerjaList] = useState<MasterItem[]>([]);
  const [subUnitKerjaList, setSubUnitKerjaList] = useState<MasterItem[]>([]);
  const [loadingUnitKerja, setLoadingUnitKerja] = useState(false);
  const [loadingSubUnit, setLoadingSubUnit] = useState(false);

  // Regional Lists (Shared Province List)
  const [provinsiList, setProvinsiList] = useState<MasterItem[]>([]);

  // Tempat Lahir Territory States
  const [tempatLahirProvinsiId, setTempatLahirProvinsiId] = useState<string>("");
  const [kabupatenLahirList, setKabupatenLahirList] = useState<MasterItem[]>([]);
  const [loadingKabLahir, setLoadingKabLahir] = useState(false);

  // Alamat Cascading Lists (Provinsi -> Kab/Kota -> Kecamatan -> Desa/Kelurahan)
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
  } = useForm<PegawaiForm>({
    resolver: zodResolver(pegawaiSchema),
    defaultValues: {
      nip: "",
      nama: "",
      jenisKelaminId: "",
      tempatLahir: "",
      tempatLahirId: null,
      tanggalLahir: "",
      agamaId: "",
      statusPerkawinanId: "",
      provinsiId: "",
      kabupatenKotaId: "",
      kecamatanId: "",
      desaId: null,
      alamat: "",
      noHp: "",
      email: "",
      pendidikanTerakhirId: "",
      dirjenId: null,
      unitKerjaId: "",
      subUnitKerjaId: null,
      eselonId: null,
      statusPegawaiId: "",
      fotoUrl: null,
    },
  });

  const selectedProvinsiId = watch("provinsiId");
  const selectedKabupatenKotaId = watch("kabupatenKotaId");
  const selectedKecamatanId = watch("kecamatanId");
  const selectedDesaId = watch("desaId");
  const selectedTempatLahirId = watch("tempatLahirId");
  const selectedDirjenId = watch("dirjenId");
  const selectedUnitKerjaId = watch("unitKerjaId");
  const selectedSubUnitKerjaId = watch("subUnitKerjaId");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  // Kompresi foto via HTML Canvas ke JPEG ringan (maksimal 500x500 px, ~40-60KB)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 500;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(e.target?.result as string);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, atau WEBP)");
      return;
    }

    try {
      const compressed = await compressImage(file);
      setFotoPreview(compressed);
      setValue("fotoUrl", compressed);
      toast.success("Foto profil berhasil dipilih!");
    } catch (err: any) {
      toast.error("Gagal memproses gambar");
    }
  };

  const handleRemovePhoto = () => {
    setFotoPreview(null);
    setValue("fotoUrl", null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
      toast.error("Gagal memuat master data");
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Handler for Tempat Lahir: Fetch Kab/Kota when Provinsi Lahir changes
  const handleTempatLahirProvinsiChange = async (provId: string) => {
    setTempatLahirProvinsiId(provId);
    setValue("tempatLahir", "", { shouldValidate: true });
    setValue("tempatLahirId", null);
    setKabupatenLahirList([]);

    if (!provId) return;

    setLoadingKabLahir(true);
    try {
      const res = await fetch(`/api/master-data?kategori=KABUPATEN_KOTA&parentId=${provId}`);
      if (res.ok) {
        setKabupatenLahirList(await res.json());
      }
    } catch (err) {
      toast.error("Gagal memuat kabupaten tempat lahir");
    } finally {
      setLoadingKabLahir(false);
    }
  };

  // Handler for Alamat: Fetch Kab/Kota when Provinsi changes
  useEffect(() => {
    if (!selectedProvinsiId) {
      setKabupatenKotaList([]);
      setKecamatanList([]);
      setDesaList([]);
      return;
    }

    const fetchKabKota = async () => {
      setLoadingKabKota(true);
      try {
        const res = await fetch(`/api/master-data?kategori=KABUPATEN_KOTA&parentId=${selectedProvinsiId}`);
        if (res.ok) {
          setKabupatenKotaList(await res.json());
        }
      } catch (err) {
        toast.error("Gagal memuat kabupaten/kota");
      } finally {
        setLoadingKabKota(false);
      }
    };

    fetchKabKota();
  }, [selectedProvinsiId]);

  // Handler for Alamat: Fetch Kecamatan when Kab/Kota changes
  useEffect(() => {
    if (!selectedKabupatenKotaId) {
      setKecamatanList([]);
      setDesaList([]);
      return;
    }

    const fetchKecamatan = async () => {
      setLoadingKecamatan(true);
      try {
        const res = await fetch(`/api/master-data?kategori=KECAMATAN&parentId=${selectedKabupatenKotaId}`);
        if (res.ok) {
          setKecamatanList(await res.json());
        }
      } catch (err) {
        toast.error("Gagal memuat kecamatan");
      } finally {
        setLoadingKecamatan(false);
      }
    };

    fetchKecamatan();
  }, [selectedKabupatenKotaId]);

  // Handler for Alamat: Fetch Desa/Gampong when Kecamatan changes
  useEffect(() => {
    if (!selectedKecamatanId) {
      setDesaList([]);
      return;
    }

    const fetchDesa = async () => {
      setLoadingDesa(true);
      try {
        const res = await fetch(`/api/master-data?kategori=DESA_KELURAHAN&parentId=${selectedKecamatanId}`);
        if (res.ok) {
          setDesaList(await res.json());
        }
      } catch (err) {
        toast.error("Gagal memuat gampong/desa");
      } finally {
        setLoadingDesa(false);
      }
    };

    fetchDesa();
  }, [selectedKecamatanId]);

  // Handler for Penempatan: Filter Unit Kerja when Ditjen changes
  const handleDirjenChange = async (dId: string) => {
    setValue("dirjenId", dId || null);
    setValue("unitKerjaId", "", { shouldValidate: true });
    setValue("subUnitKerjaId", null);

    if (!dId) {
      // If cleared, fetch all unit kerja
      try {
        const res = await fetch("/api/master-data?kategori=UNIT_KERJA");
        if (res.ok) setUnitKerjaList(await res.json());
      } catch (e) {}
      return;
    }

    setLoadingUnitKerja(true);
    try {
      const res = await fetch(`/api/master-data?kategori=UNIT_KERJA&parentId=${dId}`);
      if (res.ok) {
        const data = await res.json();
        setUnitKerjaList(data);
      }
    } catch (err) {
      toast.error("Gagal memuat unit kerja");
    } finally {
      setLoadingUnitKerja(false);
    }
  };

  // Handler for Penempatan: Filter Sub Unit when Unit Kerja changes
  const handleUnitKerjaChange = async (uId: string) => {
    setValue("unitKerjaId", uId, { shouldValidate: true });
    setValue("subUnitKerjaId", null);

    if (!uId) {
      setSubUnitKerjaList([]);
      return;
    }

    setLoadingSubUnit(true);
    try {
      const res = await fetch(`/api/master-data?kategori=SUB_UNIT_KERJA&parentId=${uId}`);
      if (res.ok) {
        const data = await res.json();
        setSubUnitKerjaList(data);
      }
    } catch (err) {
      toast.error("Gagal memuat sub unit kerja");
    } finally {
      setLoadingSubUnit(false);
    }
  };

  const onSubmit = async (data: PegawaiForm) => {
    setLoading(true);
    try {
      const res = await fetch("/api/pegawai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menambah pegawai");
      }

      const result = await res.json();
      toast.success("Pegawai berhasil ditambahkan!");
      router.push(`/pegawai/${result.id}`);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Tambah Data Pegawai
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Lengkapi data demografi, wilayah, penempatan organisasi, dan status kepegawaian
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card 1: Data Identitas & Demografi */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-[#003399] flex items-center gap-2">
              <span>👤</span> Data Identitas &amp; Demografi
            </h2>
          </div>

          {/* Upload Foto Profil Pegawai */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="relative w-20 h-20 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Preview Foto" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="flex-1 text-center sm:text-left text-xs space-y-1">
              <p className="font-bold text-slate-800 text-sm">Foto Profil Pegawai (Opsional)</p>
              <p className="text-slate-500 text-[11px]">
                Format: JPG, PNG, atau WEBP. Gambar otomatis dikompresi ringan tanpa mengurangi kualitas.
              </p>
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 text-xs cursor-pointer bg-white"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5 text-[#003399]" />
                  {fotoPreview ? "Ganti Foto" : "Pilih Foto"}
                </Button>
                {fotoPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemovePhoto}
                    className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer bg-white"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Hapus
                  </Button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* NIP */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                NIP / Nomor Induk *
              </label>
              <Input
                {...register("nip")}
                placeholder="Contoh: 199401012022031002"
                className="font-mono text-sm"
              />
              {errors.nip && <p className="text-red-500 text-xs mt-1 font-medium">{errors.nip.message}</p>}
            </div>

            {/* Nama */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Nama Lengkap &amp; Gelar *
              </label>
              <Input {...register("nama")} placeholder="Masukkan nama lengkap beserta gelar" className="text-sm" />
              {errors.nama && <p className="text-red-500 text-xs mt-1 font-medium">{errors.nama.message}</p>}
            </div>

            {/* Jenis Kelamin (Searchable) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Jenis Kelamin *
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
              {errors.jenisKelaminId && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.jenisKelaminId.message}</p>
              )}
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Tanggal Lahir *
              </label>
              <Input type="date" {...register("tanggalLahir")} className="text-sm" />
              {errors.tanggalLahir && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.tanggalLahir.message}</p>
              )}
            </div>
          </div>

          {/* Tempat Lahir (Searchable Cascading) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase">
              Tempat Lahir (Sesuai SK / Ijazah) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  1. Pilih Provinsi Lahir
                </label>
                <SearchableSelect
                  options={provinsiList.map((p) => ({ value: p.id, label: p.label, kode: p.kode }))}
                  value={tempatLahirProvinsiId}
                  onChange={handleTempatLahirProvinsiChange}
                  placeholder="Pilih Provinsi Lahir"
                  searchPlaceholder="Cari provinsi..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  2. Pilih Kabupaten / Kota Lahir *
                </label>
                <SearchableSelect
                  options={kabupatenLahirList.map((k) => ({ value: k.id, label: k.label, kode: k.kode }))}
                  value={selectedTempatLahirId || ""}
                  disabled={!tempatLahirProvinsiId || loadingKabLahir}
                  onChange={(kId) => {
                    const found = kabupatenLahirList.find((k) => k.id === kId);
                    if (found) {
                      setValue("tempatLahir", found.label, { shouldValidate: true });
                      setValue("tempatLahirId", found.id);
                    } else {
                      setValue("tempatLahir", "", { shouldValidate: true });
                      setValue("tempatLahirId", null);
                    }
                  }}
                  placeholder={
                    !tempatLahirProvinsiId
                      ? "Pilih provinsi lahir dahulu"
                      : loadingKabLahir
                      ? "Memuat kab/kota..."
                      : "Pilih Kab/Kota Tempat Lahir"
                  }
                  searchPlaceholder="Cari kab/kota..."
                />
                {errors.tempatLahir && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.tempatLahir.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Agama (Searchable) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Agama *
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
              {errors.agamaId && <p className="text-red-500 text-xs mt-1 font-medium">{errors.agamaId.message}</p>}
            </div>

            {/* Status Perkawinan (Searchable) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Status Perkawinan *
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
              {errors.statusPerkawinanId && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.statusPerkawinanId.message}</p>
              )}
            </div>

            {/* Pendidikan Terakhir (Searchable) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Pendidikan Terakhir *
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
              {errors.pendidikanTerakhirId && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.pendidikanTerakhirId.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Alamat Domisili 4 Tingkat (Searchable) */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-[#003399] flex items-center gap-2">
              <span>📍</span> Alamat Domisili (4 Tingkat Wilayah)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih wilayah secara berjenjang dari Provinsi hingga Desa/Gampong/Kelurahan
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Provinsi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                1. Provinsi *
              </label>
              <Controller
                control={control}
                name="provinsiId"
                render={({ field }) => (
                  <SearchableSelect
                    options={provinsiList.map((p) => ({ value: p.id, label: p.label, kode: p.kode }))}
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      setValue("kabupatenKotaId", "");
                      setValue("kecamatanId", "");
                      setValue("desaId", null);
                    }}
                    placeholder="Pilih Provinsi"
                    searchPlaceholder="Cari provinsi..."
                  />
                )}
              />
              {errors.provinsiId && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.provinsiId.message}</p>
              )}
            </div>

            {/* Kabupaten / Kota */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                2. Kab / Kota *
              </label>
              <Controller
                control={control}
                name="kabupatenKotaId"
                render={({ field }) => (
                  <SearchableSelect
                    options={kabupatenKotaList.map((k) => ({ value: k.id, label: k.label, kode: k.kode }))}
                    value={field.value}
                    disabled={!selectedProvinsiId || loadingKabKota}
                    onChange={(val) => {
                      field.onChange(val);
                      setValue("kecamatanId", "");
                      setValue("desaId", null);
                    }}
                    placeholder={
                      !selectedProvinsiId
                        ? "Pilih provinsi dahulu"
                        : loadingKabKota
                        ? "Memuat kab/kota..."
                        : "Pilih Kab/Kota"
                    }
                    searchPlaceholder="Cari kab/kota..."
                  />
                )}
              />
              {errors.kabupatenKotaId && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.kabupatenKotaId.message}</p>
              )}
            </div>

            {/* Kecamatan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                3. Kecamatan *
              </label>
              <Controller
                control={control}
                name="kecamatanId"
                render={({ field }) => (
                  <SearchableSelect
                    options={kecamatanList.map((kc) => ({ value: kc.id, label: kc.label, kode: kc.kode }))}
                    value={field.value}
                    disabled={!selectedKabupatenKotaId || loadingKecamatan}
                    onChange={(val) => {
                      field.onChange(val);
                      setValue("desaId", null);
                    }}
                    placeholder={
                      !selectedKabupatenKotaId
                        ? "Pilih kab/kota dahulu"
                        : loadingKecamatan
                        ? "Memuat kecamatan..."
                        : "Pilih Kecamatan"
                    }
                    searchPlaceholder="Cari kecamatan..."
                  />
                )}
              />
              {errors.kecamatanId && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.kecamatanId.message}</p>
              )}
            </div>

            {/* Desa / Gampong / Kelurahan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
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
                        ? "Memuat desa..."
                        : "Pilih Gampong/Desa"
                    }
                    searchPlaceholder="Cari gampong/desa..."
                    allowClear={true}
                  />
                )}
              />
            </div>
          </div>

          {/* Detail Alamat (Jalan, RT/RW, Dusun) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Detail Alamat (Jalan, No. Rumah, Dusun/Lorong, RT/RW) *
            </label>
            <textarea
              {...register("alamat")}
              rows={3}
              placeholder="Contoh: Jl. Teuku Umar No. 45, Dusun Melati RT 02/RW 01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003399] outline-none text-sm"
            />
            {errors.alamat && <p className="text-red-500 text-xs mt-1 font-medium">{errors.alamat.message}</p>}
          </div>

          {/* Kontak: No HP & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Nomor Handphone / WhatsApp
              </label>
              <Input {...register("noHp")} placeholder="08xxxxxxxxxx" className="font-mono text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Email
              </label>
              <Input type="email" {...register("email")} placeholder="nama@bpvp.go.id" className="text-sm" />
            </div>
          </div>
        </div>

        {/* Card 3: Penempatan Organisasi Detail & Eselon */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-[#003399] flex items-center gap-2">
              <span>🏢</span> Penempatan Organisasi &amp; Status Kepegawaian
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan unit kerja, sub bagian kerja (termasuk Subbagian Umum), eselon, dan status kepegawaian
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Ditjen */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                1. Direktorat Jenderal (Dirjen)
              </label>
              <SearchableSelect
                options={dirjenList.map((d) => ({ value: d.id, label: d.label, kode: d.kode }))}
                value={selectedDirjenId || ""}
                onChange={handleDirjenChange}
                placeholder="Pilih Ditjen..."
                searchPlaceholder="Cari Ditjen Kemnaker..."
                allowClear={true}
              />
            </div>

            {/* Unit Kerja (Balai / Direktorat) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                2. Unit Kerja / Balai *
              </label>
              <SearchableSelect
                options={unitKerjaList.map((u) => ({ value: u.id, label: u.label, kode: u.kode }))}
                value={selectedUnitKerjaId}
                disabled={loadingUnitKerja}
                onChange={handleUnitKerjaChange}
                placeholder={loadingUnitKerja ? "Memuat..." : "Pilih Unit Kerja..."}
                searchPlaceholder="Cari unit kerja / balai..."
              />
              {errors.unitKerjaId && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.unitKerjaId.message}</p>
              )}
            </div>

            {/* Sub Unit Kerja (Subbagian Umum, Seksi, Kejuruan) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                3. Sub Unit / Subbagian
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
                        : loadingSubUnit
                        ? "Memuat..."
                        : "Pilih Sub Unit (Subbagian Umum...)"
                    }
                    searchPlaceholder="Cari Subbagian Umum, Seksi, Kejuruan..."
                    allowClear={true}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
            {/* Eselon / Tingkat Jabatan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
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
                    placeholder="Pilih Tingkat Eselon / JF..."
                    searchPlaceholder="Cari eselon (III.a, IV.a, JF, Non-ASN)..."
                    allowClear={true}
                  />
                )}
              />
            </div>

            {/* Status Kepegawaian (PNS, PPPK, PPNPN, Kontrak) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Status Kepegawaian *
              </label>
              <Controller
                control={control}
                name="statusPegawaiId"
                render={({ field }) => (
                  <SearchableSelect
                    options={statusPegawaiList.map((s) => ({ value: s.id, label: s.label, kode: s.kode }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pilih Status Pegawai..."
                    searchPlaceholder="Cari status (PNS, PPPK, Honorer...)..."
                  />
                )}
              />
              {errors.statusPegawaiId && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.statusPegawaiId.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="h-11 px-6 text-sm"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#003399] hover:bg-[#002266] text-white font-semibold h-11 px-8 shadow-sm text-sm"
          >
            {loading ? "Menyimpan Data..." : "Simpan Pegawai"}
          </Button>
        </div>
      </form>
    </div>
  );
}
