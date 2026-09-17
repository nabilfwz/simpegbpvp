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
      });

      if (!existing) {
        return NextResponse.json({ error: "Data pegawai tidak ditemukan" }, { status: 404 });
      }

      await prisma.$transaction([
        prisma.riwayatPangkat.deleteMany({ where: { pegawaiId: id } }),
        prisma.riwayatJabatan.deleteMany({ where: { pegawaiId: id } }),
        prisma.pegawai.delete({ where: { id } }),
      ]);

      await catatLog({
        userId: (session.user as any).id,
        aksi: "DELETE_PERMANEN",
        entitas: "Pegawai",
        entitasId: id,
        deskripsi: `Menghapus permanen pegawai: ${existing.nama} (${existing.nip})`,
        dataSebelum: existing,
        request,
      });

      return NextResponse.json({
        message: `Pegawai ${existing.nama} berhasil dihapus secara permanen`,
      });
    }

    if (modul === "MASTER_DATA") {
      const existing = await prisma.masterData.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json({ error: "Data master data tidak ditemukan" }, { status: 404 });
      }

      try {
        await prisma.masterData.delete({
          where: { id },
        });
      } catch (err: any) {
        // Jika ada foreign key constraint (relasi ke pegawai atau riwayat)
        return NextResponse.json(
          {
            error:
              "Data ini masih dirujuk oleh rekaman historis atau pegawai lain dan tidak dapat dihapus permanen. Data tetap tersimpan non-aktif di tong sampah.",
          },
          { status: 400 }
        );
      }

      invalidateMasterDataCache(existing.kategori);

      await catatLog({
        userId: (session.user as any).id,
        aksi: "DELETE_PERMANEN",
        entitas: "MasterData",
        entitasId: id,
        deskripsi: `Menghapus permanen master data ${existing.kategori}: ${existing.label}`,
        dataSebelum: existing,
        request,
      });

      return NextResponse.json({
        message: `Master Data ${existing.label} berhasil dihapus permanen`,
      });
    }

    if (modul === "USER") {
      const existing = await prisma.user.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json({ error: "Data pengguna tidak ditemukan" }, { status: 404 });
      }

      if (existing.email === "admin@bpvp.local") {
        return NextResponse.json(
          { error: "Akun Super Administrator default tidak dapat dihapus permanen" },
          { status: 400 }
        );
      }

      await prisma.user.delete({
        where: { id },
      });

      await catatLog({
        userId: (session.user as any).id,
        aksi: "DELETE_PERMANEN",
        entitas: "User",
        entitasId: id,
        deskripsi: `Menghapus permanen pengguna: ${existing.nama} (${existing.email})`,
        dataSebelum: existing,
        request,
      });

      return NextResponse.json({
        message: `Pengguna ${existing.nama} berhasil dihapus permanen`,
      });
    }

    return NextResponse.json({ error: "Modul tidak dikenal" }, { status: 400 });
  } catch (error) {
    console.error("Error POST /api/tong-sampah/permanent:", error);
    return NextResponse.json({ error: "Gagal menghapus data secara permanen" }, { status: 500 });
  }
}
