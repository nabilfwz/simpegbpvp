import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { catatLog } from "@/lib/log-aktivitas";
import { z } from "zod";

const updateSchema = z.object({
  jabatanId: z.string().min(1).optional(),
  unitKerjaId: z.string().min(1).optional(),
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

    const existing = await prisma.riwayatJabatan.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Riwayat jabatan tidak ditemukan" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validated.jabatanId) updateData.jabatanId = validated.jabatanId;
    if (validated.unitKerjaId) updateData.unitKerjaId = validated.unitKerjaId;
    if (validated.tmt) updateData.tmt = new Date(validated.tmt);
    if (validated.noSk !== undefined) updateData.noSk = validated.noSk || null;
    if (validated.tanggalSk !== undefined) updateData.tanggalSk = validated.tanggalSk ? new Date(validated.tanggalSk) : null;
    if (validated.keterangan !== undefined) updateData.keterangan = validated.keterangan || null;

    const updated = await prisma.riwayatJabatan.update({
      where: { id },
      data: updateData,
      include: { jabatan: true, unitKerja: true },
    });

    await catatLog({
      userId: (session.user as any).id,
      aksi: "UPDATE",
      entitas: "RiwayatJabatan",
      entitasId: updated.id,
      deskripsi: `Mengubah riwayat jabatan: ${updated.jabatan.label}`,
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
    console.error("Error PATCH riwayat-jabatan:", error);
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
    const existing = await prisma.riwayatJabatan.findUnique({
      where: { id },
      include: { jabatan: true, unitKerja: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Riwayat jabatan tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.riwayatJabatan.delete({
      where: { id },
    });

    await catatLog({
      userId: (session.user as any).id,
      aksi: "DELETE",
      entitas: "RiwayatJabatan",
      entitasId: id,
      deskripsi: `Menghapus riwayat jabatan: ${existing.jabatan.label}`,
      dataSebelum: existing,
      request,
    });

    return NextResponse.json({ message: "Riwayat jabatan berhasil dihapus" });
  } catch (error) {
    console.error("Error DELETE riwayat-jabatan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
