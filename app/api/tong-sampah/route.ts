import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAdminAccess } from "@/lib/constants";

export const dynamic = "force-dynamic";

export interface UnifiedTrashItem {
  id: string;
  modul: "PEGAWAI" | "MASTER_DATA" | "USER";
  modulLabel: string;
  subModul: string;
  identitas: string;
  detail: string;
  tanggalDihapus: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || !hasAdminAccess(role)) {
      return NextResponse.json({ error: "Forbidden: Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get("countOnly") === "true";
    const modul = searchParams.get("modul") || "ALL"; // ALL, PEGAWAI, MASTER_DATA, USER
    const search = searchParams.get("search")?.trim() || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Hitung total items di tong sampah untuk setiap modul
    const [countPegawai, countMasterData, countUser] = await Promise.all([
      prisma.pegawai.count({ where: { aktif: false } }),
      prisma.masterData.count({ where: { aktif: false } }),
      prisma.user.count({ where: { aktif: false } }),
    ]);

    const totalTrash = countPegawai + countMasterData + countUser;

    if (countOnly) {
      return NextResponse.json({
        total: totalTrash,
        pegawai: countPegawai,
        masterData: countMasterData,
        user: countUser,
      });
    }

    const items: UnifiedTrashItem[] = [];

    // 1. Ambil Pegawai Terhapus
    if (modul === "ALL" || modul === "PEGAWAI") {
      const pegawaiWhere: any = { aktif: false };
      if (search) {
        pegawaiWhere.OR = [
          { nama: { contains: search, mode: "insensitive" } },
          { nip: { contains: search, mode: "insensitive" } },
          { unitKerja: { label: { contains: search, mode: "insensitive" } } },
        ];
      }

      const pegawais = await prisma.pegawai.findMany({
        where: pegawaiWhere,
        include: {
          unitKerja: true,
          subUnitKerja: true,
          statusPegawai: true,
        },
        orderBy: { updatedAt: "desc" },
      });

      for (const p of pegawais) {
        items.push({
          id: p.id,
          modul: "PEGAWAI",
          modulLabel: "Pegawai",
          subModul: p.unitKerja?.label || "Unit Kerja Tidak Ditentukan",
          identitas: p.nama,
          detail: `NIP: ${p.nip} • Status: ${p.statusPegawai?.label || "ASN"} • ${p.subUnitKerja?.label || ""}`,
          tanggalDihapus: p.updatedAt.toISOString(),
        });
      }
    }

    // 2. Ambil Master Data Terhapus
    if (modul === "ALL" || modul === "MASTER_DATA") {
      const mdWhere: any = { aktif: false };
      if (search) {
        mdWhere.OR = [
          { label: { contains: search, mode: "insensitive" } },
          { kode: { contains: search, mode: "insensitive" } },
          { kategori: { contains: search, mode: "insensitive" } },
        ];
      }

      const masterDatas = await prisma.masterData.findMany({
        where: mdWhere,
        orderBy: { updatedAt: "desc" },
      });

      for (const m of masterDatas) {
        // Format kategori agar ramah dibaca
        const kategoriClean = m.kategori.replace(/_/g, " ");
        items.push({
          id: m.id,
          modul: "MASTER_DATA",
          modulLabel: "Master Data",
          subModul: kategoriClean,
          identitas: m.label,
          detail: `Kategori: ${kategoriClean}${m.kode ? ` • Kode: ${m.kode}` : ""}${m.urutan ? ` • Urutan: ${m.urutan}` : ""}`,
          tanggalDihapus: m.updatedAt.toISOString(),
        });
      }
    }

    // 3. Ambil User Terhapus
    if (modul === "ALL" || modul === "USER") {
      const userWhere: any = { aktif: false };
      if (search) {
        userWhere.OR = [
          { nama: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { role: { contains: search, mode: "insensitive" } },
        ];
      }

      const users = await prisma.user.findMany({
        where: userWhere,
        orderBy: { createdAt: "desc" },
      });

      for (const u of users) {
        items.push({
          id: u.id,
          modul: "USER",
          modulLabel: "Pengguna / User",
          subModul: `Role: ${u.role.toUpperCase()}`,
          identitas: u.nama,
          detail: `Email: ${u.email} • Role: ${u.role}`,
          tanggalDihapus: u.createdAt.toISOString(),
        });
      }
    }

    // Urutkan gabungan data berdasarkan tanggal dihapus (terbaru dulu)
    items.sort(
      (a, b) => new Date(b.tanggalDihapus).getTime() - new Date(a.tanggalDihapus).getTime()
    );

    // Hitung pagination
    const totalFiltered = items.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      data: paginatedItems,
      counts: {
        all: totalTrash,
        pegawai: countPegawai,
        masterData: countMasterData,
        user: countUser,
      },
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Error GET tong-sampah:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data tong sampah" },
      { status: 500 }
    );
  }
}
