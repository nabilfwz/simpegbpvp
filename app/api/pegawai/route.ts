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
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  agamaId: z.string().min(1),
  statusPerkawinanId: z.string().min(1),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  noHp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  pendidikanTerakhirId: z.string().min(1),
  unitKerjaId: z.string().min(1),
  statusPegawaiId: z.string().min(1),
  fotoUrl: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const unitKerja = searchParams.get("unitKerja");
    const statusPegawai = searchParams.get("statusPegawai");
    const jenisKelamin = searchParams.get("jenisKelamin");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = { aktif: true };

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { nip: { contains: search, mode: "insensitive" } },
      ];
    }

    if (unitKerja) where.unitKerjaId = unitKerja;
    if (statusPegawai) where.statusPegawaiId = statusPegawai;
    if (jenisKelamin) where.jenisKelaminId = jenisKelamin;

    const [pegawai, total] = await Promise.all([
      prisma.pegawai.findMany({
        where,
        include: {
          jenisKelamin: true,
          unitKerja: true,
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
    ]);

    return NextResponse.json({
      data: pegawai,
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
        tanggalLahir: new Date(validated.tanggalLahir),
        agamaId: validated.agamaId,
        statusPerkawinanId: validated.statusPerkawinanId,
        alamat: validated.alamat,
        noHp: validated.noHp || null,
        email: validated.email || null,
        pendidikanTerakhirId: validated.pendidikanTerakhirId,
        unitKerjaId: validated.unitKerjaId,
        statusPegawaiId: validated.statusPegawaiId,
        fotoUrl: validated.fotoUrl || null,
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
