import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { catatLog } from "@/lib/log-aktivitas";
import { hasAdminAccess } from "@/lib/constants";
import {
  getCachedMasterData,
  setCachedMasterData,
  invalidateMasterDataCache,
} from "@/lib/master-data-cache";
import { z } from "zod";

const masterDataSchema = z.object({
  kategori: z.string().min(1),
  label: z.string().min(1),
  kode: z.string().optional().nullable(),
  urutan: z.number().int().default(0),
  aktif: z.boolean().default(true),
  parentId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get("kategori");
    const parentId = searchParams.get("parentId");

    if (!kategori) {
      return NextResponse.json(
        { error: "Parameter kategori diperlukan" },
        { status: 400 }
      );
    }

    const cacheKey = `${kategori}:${parentId ?? "all"}`;
    const cached = getCachedMasterData(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "X-Cache": "HIT",
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      });
    }

    const where: any = { kategori, aktif: true };
    if (parentId !== null) {
      if (parentId === "null" || parentId === "") {
        where.parentId = null;
      } else {
        where.parentId = parentId;
      }
    }

    const data = await prisma.masterData.findMany({
      where,
      include: {
        parent: {
          select: { id: true, label: true, kategori: true },
        },
      },
      orderBy: [{ urutan: "asc" }, { label: "asc" }],
    });

    setCachedMasterData(cacheKey, data);

    return NextResponse.json(data, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
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
    const role = (session?.user as any)?.role;
    if (!session?.user || !hasAdminAccess(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = masterDataSchema.parse(body);

    invalidateMasterDataCache(validated.kategori);

    const existing = await prisma.masterData.findFirst({
      where: {
        kategori: validated.kategori,
        label: validated.label,
        parentId: validated.parentId || null,
        aktif: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Data dengan kategori, parent, dan label yang sama sudah ada" },
        { status: 400 }
      );
    }

    const created = await prisma.masterData.create({
      data: {
        kategori: validated.kategori,
        label: validated.label,
        kode: validated.kode || null,
        urutan: validated.urutan,
        aktif: validated.aktif,
        parentId: validated.parentId || null,
      },
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
