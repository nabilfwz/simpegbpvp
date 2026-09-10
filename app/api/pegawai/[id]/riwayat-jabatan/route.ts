import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { catatLog } from "@/lib/log-aktivitas";
import { z } from "zod";

const riwayatJabatanSchema = z.object({
  jabatanId: z.string().min(1, "Jabatan wajib dipilih"),
  unitKerjaId: z.string().min(1, "Unit kerja wajib dipilih"),
  tmt: z.string().min(1, "TMT wajib diisi"),
  noSk: z.string().optional(),
  tanggalSk: z.string().optional(),
  keterangan: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const riwayat = await prisma.riwayatJabatan.findMany({
      where: { pegawaiId: id },
      include: { jabatan: true, unitKerja: true },
      orderBy: { tmt: "desc" },
    });

    return NextResponse.json(riwayat);
  } catch (error) {
    console.error("Error GET riwayat-jabatan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = riwayatJabatanSchema.parse(body);

    const created = await prisma.riwayatJabatan.create({
      data: {
        pegawaiId: id,
        jabatanId: validated.jabatanId,
        unitKerjaId: validated.unitKerjaId,
        tmt: new Date(validated.tmt),
        noSk: validated.noSk || null,
        tanggalSk: validated.tanggalSk ? new Date(validated.tanggalSk) : null,
        keterangan: validated.keterangan || null,
      },
      include: { jabatan: true, unitKerja: true },
    });

    await catatLog({
      userId: (session.user as any).id,
      aksi: "CREATE",
      entitas: "RiwayatJabatan",
      entitasId: created.id,
      deskripsi: `Menambah riwayat jabatan: ${created.jabatan.label}`,
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
    console.error("Error POST riwayat-jabatan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
