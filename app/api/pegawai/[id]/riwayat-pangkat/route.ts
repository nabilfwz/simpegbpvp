import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { catatLog } from "@/lib/log-aktivitas";
import { z } from "zod";

const riwayatPangkatSchema = z.object({
  pangkatGolonganId: z.string().min(1, "Pangkat/Golongan wajib dipilih"),
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
    const riwayat = await prisma.riwayatPangkat.findMany({
      where: { pegawaiId: id },
      include: { pangkatGolongan: true },
      orderBy: { tmt: "desc" },
    });

    return NextResponse.json(riwayat);
  } catch (error) {
    console.error("Error GET riwayat-pangkat:", error);
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
    const validated = riwayatPangkatSchema.parse(body);

    const created = await prisma.riwayatPangkat.create({
      data: {
        pegawaiId: id,
        pangkatGolonganId: validated.pangkatGolonganId,
        tmt: new Date(validated.tmt),
        noSk: validated.noSk || null,
        tanggalSk: validated.tanggalSk ? new Date(validated.tanggalSk) : null,
        keterangan: validated.keterangan || null,
      },
      include: { pangkatGolongan: true },
    });

    await catatLog({
      userId: (session.user as any).id,
      aksi: "CREATE",
      entitas: "RiwayatPangkat",
      entitasId: created.id,
      deskripsi: `Menambah riwayat pangkat: ${created.pangkatGolongan.label}`,
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
    console.error("Error POST riwayat-pangkat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
