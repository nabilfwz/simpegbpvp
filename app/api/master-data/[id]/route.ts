import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { catatLog } from "@/lib/log-aktivitas";
import { invalidateMasterDataCache } from "@/lib/master-data-cache";
import { hasAdminAccess } from "@/lib/constants";
import { z } from "zod";

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  kode: z.string().optional().nullable(),
  urutan: z.number().int().optional(),
  aktif: z.boolean().optional(),
  parentId: z.string().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasAdminAccess((session.user as any).role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateSchema.parse(body);

    const existing = await prisma.masterData.findUnique({
      where: { id },
      include: { parent: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Data tidak ditemukan" },
        { status: 404 }
      );
    }

    if (validated.label) {
      const parentIdToCheck =
        validated.parentId !== undefined ? validated.parentId : existing.parentId;
      const duplicate = await prisma.masterData.findFirst({
        where: {
          kategori: existing.kategori,
          label: validated.label,
          parentId: parentIdToCheck || null,
          id: { not: id },
          aktif: true,
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Label sudah digunakan dalam kategori dan parent ini" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.masterData.update({
      where: { id },
      data: validated,
      include: { parent: true },
    });

    invalidateMasterDataCache(existing.kategori);

    await catatLog({
      userId: (session.user as any).id,
      aksi: "UPDATE",
      entitas: "MasterData",
      entitasId: updated.id,
      deskripsi: `Mengubah master data ${existing.kategori}: ${existing.label}`,
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
    console.error("Error PATCH master-data:", error);
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
    if (!session?.user || !hasAdminAccess((session.user as any).role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.masterData.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Data tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await prisma.masterData.update({
      where: { id },
      data: { aktif: false },
    });

    invalidateMasterDataCache(existing.kategori);

    await catatLog({
      userId: (session.user as any).id,
      aksi: "DELETE",
      entitas: "MasterData",
      entitasId: updated.id,
      deskripsi: `Menonaktifkan master data ${existing.kategori}: ${existing.label}`,
      dataSebelum: existing,
      dataSesudah: updated,
      request,
    });

    return NextResponse.json({ message: "Data berhasil dinonaktifkan" });
  } catch (error) {
    console.error("Error DELETE master-data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
