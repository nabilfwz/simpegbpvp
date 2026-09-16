import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { catatLog } from "@/lib/log-aktivitas";
import { isAdminRole } from "@/lib/constants";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdminRole((session.user as any).role)) {
      return NextResponse.json({ error: "Forbidden: Hanya Super Administrator yang berhak memulihkan pegawai." }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.pegawai.findUnique({
      where: { id },
      include: {
        jenisKelamin: true,
        unitKerja: true,
        subUnitKerja: true,
        dirjen: true,
        eselon: true,
        statusPegawai: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pegawai tidak ditemukan" },
        { status: 404 }
      );
    }

    if (existing.aktif) {
      return NextResponse.json(
        { message: "Pegawai sudah dalam status aktif" },
        { status: 200 }
      );
    }

    const restored = await prisma.pegawai.update({
      where: { id },
      data: { aktif: true },
      include: {
        jenisKelamin: true,
        unitKerja: true,
        subUnitKerja: true,
        dirjen: true,
        eselon: true,
        statusPegawai: true,
      },
    });

    await catatLog({
      userId: (session.user as any).id,
      aksi: "RESTORE",
      entitas: "Pegawai",
      entitasId: restored.id,
      deskripsi: `Memulihkan pegawai dari tong sampah: ${existing.nama} (${existing.nip})`,
      dataSebelum: existing,
      dataSesudah: restored,
      request,
    });

    return NextResponse.json({
      message: `Pegawai ${restored.nama} berhasil dipulihkan`,
      data: restored,
    });
  } catch (error) {
    console.error("Error RESTORE pegawai:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
