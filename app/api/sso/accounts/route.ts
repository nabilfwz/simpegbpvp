import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch system users
    const users = await prisma.user.findMany({
      where: { aktif: true },
      select: { id: true, nama: true, email: true, role: true },
      orderBy: { role: "asc" },
    });

    // 2. Fetch active Pegawai BPVP
    const pegawais = await prisma.pegawai.findMany({
      where: { aktif: true },
      select: {
        id: true,
        nip: true,
        nama: true,
        email: true,
        subUnitKerja: { select: { id: true, label: true } },
        eselon: { select: { id: true, label: true } },
        statusPegawai: { select: { id: true, label: true } },
      },
      orderBy: { nip: "asc" },
    });

    return NextResponse.json({
      users,
      pegawais,
    });
  } catch (error) {
    console.error("Error GET /api/sso/accounts:", error);
    return NextResponse.json(
      { error: "Gagal memuat akun SSO" },
      { status: 500 }
    );
  }
}
