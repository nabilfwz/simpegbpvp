import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { catatLog } from "@/lib/log-aktivitas";
import { z } from "zod";

const masterDataSchema = z.object({
  kategori: z.string().min(1),
  label: z.string().min(1),
  kode: z.string().optional(),
  urutan: z.number().int().default(0),
  aktif: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get("kategori");

    if (!kategori) {
      return NextResponse.json(
        { error: "Parameter kategori diperlukan" },
        { status: 400 }
      );
    }

    const data = await prisma.masterData.findMany({
      where: { kategori, aktif: true },
      orderBy: [{ urutan: "asc" }, { label: "asc" }],
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error GET master-data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = masterDataSchema.parse(body);

    const existing = await prisma.masterData.findUnique({
      where: {
        kategori_label: {
          kategori: validated.kategori,
          label: validated.label,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Data dengan kategori dan label yang sama sudah ada" },
        { status: 400 }
      );
    }

    const created = await prisma.masterData.create({
      data: validated,
    });

    await catatLog({
      userId: (session.user as any).id,
      aksi: "CREATE",
      entitas: "MasterData",
      entitasId: created.id,
      deskripsi: `Menambah master data ${validated.kategori}: ${validated.label}`,
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
    console.error("Error POST master-data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
