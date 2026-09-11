import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { catatLog } from "@/lib/log-aktivitas";
import { z } from "zod";

const pegawaiSchema = z.object({
  nip: z.string().min(1, "NIP wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  jenisKelaminId: z.string().min(1),
  tempatLahir: z.string().min(1, "Tempat lahir wajib diisi"),
  tempatLahirId: z.string().optional().nullable(),
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  agamaId: z.string().min(1),
  statusPerkawinanId: z.string().min(1),
  provinsiId: z.string().optional().nullable(),
  kabupatenKotaId: z.string().optional().nullable(),
  kecamatanId: z.string().optional().nullable(),
  desaId: z.string().optional().nullable(),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  noHp: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  pendidikanTerakhirId: z.string().min(1),
  dirjenId: z.string().optional().nullable(),
  unitKerjaId: z.string().min(1),
  subUnitKerjaId: z.string().optional().nullable(),
  eselonId: z.string().optional().nullable(),
  statusPegawaiId: z.string().min(1),
  fotoUrl: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const isTrash = searchParams.get("trash") === "true" || searchParams.get("aktif") === "false";
    const dirjen = searchParams.get("dirjen");
    const unitKerja = searchParams.get("unitKerja");
    const subUnitKerja = searchParams.get("subUnitKerja");
    const eselon = searchParams.get("eselon");
    const statusPegawai = searchParams.get("statusPegawai");
    const jenisKelamin = searchParams.get("jenisKelamin");
    const provinsi = searchParams.get("provinsi");
    const kabupatenKota = searchParams.get("kabupatenKota");
    const kecamatan = searchParams.get("kecamatan");
    const desa = searchParams.get("desa");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = { aktif: !isTrash };

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { nip: { contains: search, mode: "insensitive" } },
      ];
    }

    if (dirjen) where.dirjenId = dirjen;
    if (unitKerja) where.unitKerjaId = unitKerja;
    if (subUnitKerja) where.subUnitKerjaId = subUnitKerja;
    if (eselon) where.eselonId = eselon;
    if (statusPegawai) where.statusPegawaiId = statusPegawai;
    if (jenisKelamin) where.jenisKelaminId = jenisKelamin;
    if (provinsi) where.provinsiId = provinsi;
    if (kabupatenKota) where.kabupatenKotaId = kabupatenKota;
    if (kecamatan) where.kecamatanId = kecamatan;
    if (desa) where.desaId = desa;

    const [pegawai, total, totalActive, totalTrash] = await Promise.all([
      prisma.pegawai.findMany({
        where,
        include: {
          jenisKelamin: true,
          provinsi: true,
          kabupatenKota: true,
          kecamatan: true,
          desa: true,
          tempatLahirRelasi: true,
          dirjen: true,
          unitKerja: true,
          subUnitKerja: true,
          eselon: true,
          statusPegawai: true,
          riwayatPangkat: {
            include: { pangkatGolongan: true },
            orderBy: { tmt: "desc" },
            take: 1,
          },
          riwayatJabatan: {
            include: { jabatan: true, unitKerja: true },
            orderBy: { tmt: "desc" },
            take: 1,
          },
        },
        orderBy: { nama: "asc" },
        skip,
        take: limit,
      }),
      prisma.pegawai.count({ where }),
      prisma.pegawai.count({ where: { aktif: true } }),
      prisma.pegawai.count({ where: { aktif: false } }),
    ]);

    return NextResponse.json({
      data: pegawai,
      counts: {
        active: totalActive,
        trash: totalTrash,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error GET pegawai:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = pegawaiSchema.parse(body);

    const existing = await prisma.pegawai.findUnique({
      where: { nip: validated.nip },
    });

    if (existing) {
      return NextResponse.json(
        { error: "NIP sudah terdaftar" },
        { status: 400 }
      );
    }

    const created = await prisma.pegawai.create({
      data: {
        nip: validated.nip,
        nama: validated.nama,
        jenisKelaminId: validated.jenisKelaminId,
        tempatLahir: validated.tempatLahir,
        tempatLahirId: validated.tempatLahirId || null,
        tanggalLahir: new Date(validated.tanggalLahir),
        agamaId: validated.agamaId,
        statusPerkawinanId: validated.statusPerkawinanId,
        provinsiId: validated.provinsiId || null,
        kabupatenKotaId: validated.kabupatenKotaId || null,
        kecamatanId: validated.kecamatanId || null,
        desaId: validated.desaId || null,
        alamat: validated.alamat,
        noHp: validated.noHp || null,
        email: validated.email || null,
        pendidikanTerakhirId: validated.pendidikanTerakhirId,
        dirjenId: validated.dirjenId || null,
        unitKerjaId: validated.unitKerjaId,
        subUnitKerjaId: validated.subUnitKerjaId || null,
        eselonId: validated.eselonId || null,
        statusPegawaiId: validated.statusPegawaiId,
        fotoUrl: validated.fotoUrl || null,
      },
      include: {
        jenisKelamin: true,
        agama: true,
        statusPerkawinan: true,
        provinsi: true,
        kabupatenKota: true,
        kecamatan: true,
        desa: true,
        tempatLahirRelasi: true,
        pendidikanTerakhir: true,
        dirjen: true,
        unitKerja: true,
        subUnitKerja: true,
        eselon: true,
        statusPegawai: true,
      },
    });

    await catatLog({
      userId: (session.user as any).id,
      aksi: "CREATE",
      entitas: "Pegawai",
      entitasId: created.id,
      deskripsi: `Menambah pegawai: ${created.nama} (${created.nip})`,
      dataSesudah: created,
      request,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasi gagal", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error POST pegawai:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
