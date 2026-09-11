import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { catatLog } from "@/lib/log-aktivitas";
import { z } from "zod";

const updateSchema = z.object({
  pangkatGolonganId: z.string().min(1).optional(),
  tmt: z.string().min(1).optional(),
  noSk: z.string().optional(),
  tanggalSk: z.string().optional(),
  keterangan: z.string().optional(),
});

export async function PATCH(
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
    const validated = updateSchema.parse(body);

    const existing = await prisma.riwayatPangkat.findUnique({
      where: { id },
      include: { pangkatGolongan: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Riwayat pangkat tidak ditemukan" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validated.pangkatGolonganId) updateData.pangkatGolonganId = validated.pangkatGolonganId;
    if (validated.tmt) updateData.tmt = new Date(validated.tmt);
    if (validated.noSk !== undefined) updateData.noSk = validated.noSk || null;
    if (validated.tanggalSk !== undefined) updateData.tanggalSk = validated.tanggalSk ? new Date(validated.tanggalSk) : null;
    if (validated.keterangan !== undefined) updateData.keterangan = validated.keterangan || null;

    const updated = await prisma.riwayatPangkat.update({
      where: { id },
      data: updateData,
      include: { pangkatGolongan: true },
    });

    await catatLog({
      userId: (session.user as any).id,
      aksi: "UPDATE",
      entitas: "RiwayatPangkat",
      entitasId: updated.id,
      deskripsi: `Mengubah riwayat pangkat: ${updated.pangkatGolongan.label}`,
      dataSebelum: existing,
      dataSesudah: updated,
      request,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasi gagal", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error PATCH riwayat-pangkat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.riwayatPangkat.findUnique({
      where: { id },
      include: { pangkatGolongan: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Riwayat pangkat tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.riwayatPangkat.delete({
      where: { id },
    });

    await catatLog({
      userId: (session.user as any).id,
      aksi: "DELETE",
      entitas: "RiwayatPangkat",
      entitasId: id,
      deskripsi: `Menghapus riwayat pangkat: ${existing.pangkatGolongan.label}`,
      dataSebelum: existing,
      request,
    });

    return NextResponse.json({ message: "Riwayat pangkat berhasil dihapus" });
  } catch (error) {
    console.error("Error DELETE riwayat-pangkat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
