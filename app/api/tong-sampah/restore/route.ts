import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { catatLog } from "@/lib/log-aktivitas";
import { hasAdminAccess } from "@/lib/constants";
import { invalidateMasterDataCache } from "@/lib/master-data-cache";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || !hasAdminAccess(role)) {
      return NextResponse.json({ error: "Forbidden: Akses ditolak" }, { status: 403 });
    }

    const body = await request.json();
    const { id, modul } = body;

    if (!id || !modul) {
      return NextResponse.json(
        { error: "Parameter id dan modul wajib diisi" },
        { status: 400 }
      );
    }

    if (modul === "PEGAWAI") {
      const existing = await prisma.pegawai.findUnique({
        where: { id },
        include: { unitKerja: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "Data pegawai tidak ditemukan" }, { status: 404 });
      }

      const restored = await prisma.pegawai.update({
        where: { id },
        data: { aktif: true },
      });

      await catatLog({
        userId: (session.user as any).id,
        aksi: "RESTORE",
        entitas: "Pegawai",
        entitasId: id,
        deskripsi: `Memulihkan pegawai dari tong sampah: ${existing.nama} (${existing.nip})`,
        dataSebelum: existing,
        dataSesudah: restored,
        request,
      });

      return NextResponse.json({
        message: `Pegawai ${existing.nama} berhasil dipulihkan`,
      });
    }

    if (modul === "MASTER_DATA") {
      const existing = await prisma.masterData.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json({ error: "Data master data tidak ditemukan" }, { status: 404 });
      }

      const restored = await prisma.masterData.update({
        where: { id },
        data: { aktif: true },
      });

      invalidateMasterDataCache(existing.kategori);

      await catatLog({
        userId: (session.user as any).id,
        aksi: "RESTORE",
        entitas: "MasterData",
        entitasId: id,
        deskripsi: `Memulihkan master data ${existing.kategori}: ${existing.label}`,
        dataSebelum: existing,
        dataSesudah: restored,
        request,
      });

      return NextResponse.json({
        message: `Master Data ${existing.label} berhasil dipulihkan`,
      });
    }

    if (modul === "USER") {
      const existing = await prisma.user.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json({ error: "Data pengguna tidak ditemukan" }, { status: 404 });
      }

      const restored = await prisma.user.update({
        where: { id },
        data: { aktif: true },
      });

      await catatLog({
        userId: (session.user as any).id,
        aksi: "RESTORE",
        entitas: "User",
        entitasId: id,
        deskripsi: `Memulihkan pengguna: ${existing.nama} (${existing.email})`,
        dataSebelum: existing,
        dataSesudah: restored,
        request,
      });

      return NextResponse.json({
        message: `Pengguna ${existing.nama} berhasil dipulihkan`,
      });
    }

    return NextResponse.json({ error: "Modul tidak dikenal" }, { status: 400 });
  } catch (error) {
    console.error("Error POST /api/tong-sampah/restore:", error);
    return NextResponse.json({ error: "Gagal memulihkan data" }, { status: 500 });
  }
}
