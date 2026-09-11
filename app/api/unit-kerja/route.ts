import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { catatLog } from "@/lib/log-aktivitas";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unitKerjaId = searchParams.get("unitKerjaId");

    const masterData = await prisma.masterData.findMany({
      where: {
        kategori: "UNIT_KERJA",
        aktif: true,
      },
      orderBy: { urutan: "asc" },
    });

    return NextResponse.json(masterData);
  } catch (error) {
    console.error("Error GET unit-kerja:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
