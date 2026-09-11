import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const totalPegawai = await prisma.pegawai.count({
      where: { aktif: true },
    });

    const pegawaiPerUnitKerja = await prisma.pegawai.groupBy({
      by: ["unitKerjaId"],
      where: { aktif: true },
      _count: true,
    });

    const unitKerjaIds = pegawaiPerUnitKerja.map((p: any) => p.unitKerjaId);
    const unitKerjaLabels = await prisma.masterData.findMany({
      where: { id: { in: unitKerjaIds } },
    });

    const pegawaiPerUnitKerjaWithLabels = pegawaiPerUnitKerja.map((p: any) => {
      const label = unitKerjaLabels.find((u: any) => u.id === p.unitKerjaId)?.label || "Unknown";
      return { label, count: p._count };
    });

    const pegawaiPerStatus = await prisma.pegawai.groupBy({
      by: ["statusPegawaiId"],
      where: { aktif: true },
      _count: true,
    });

    const statusIds = pegawaiPerStatus.map((p: any) => p.statusPegawaiId);
    const statusLabels = await prisma.masterData.findMany({
      where: { id: { in: statusIds } },
    });

    const pegawaiPerStatusWithLabels = pegawaiPerStatus.map((p: any) => {
      const label = statusLabels.find((s: any) => s.id === p.statusPegawaiId)?.label || "Unknown";
      return { label, count: p._count };
    });

    const aktivitasTerbaru = await prisma.logAktivitas.findMany({
      include: { user: { select: { nama: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      totalPegawai,
      pegawaiPerUnitKerja: pegawaiPerUnitKerjaWithLabels,
      pegawaiPerStatus: pegawaiPerStatusWithLabels,
      aktivitasTerbaru,
    });
  } catch (error) {
    console.error("Error GET dashboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
