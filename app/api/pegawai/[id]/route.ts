import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { catatLog } from "@/lib/log-aktivitas";
import { z } from "zod";
import { isAdminRole, isStaffRole } from "@/lib/constants";

const updateSchema = z.object({
  nip: z.string().min(1).optional(),
  nama: z.string().min(1).optional(),
  jenisKelaminId: z.string().min(1).optional(),
  tempatLahir: z.string().min(1).optional(),
  tempatLahirId: z.string().optional().nullable(),
  tanggalLahir: z.string().min(1).optional(),
  agamaId: z.string().min(1).optional(),
  statusPerkawinanId: z.string().min(1).optional(),
  provinsiId: z.string().optional().nullable(),
  kabupatenKotaId: z.string().optional().nullable(),
  kecamatanId: z.string().optional().nullable(),
  desaId: z.string().optional().nullable(),
  alamat: z.string().min(1).optional(),
  noHp: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  pendidikanTerakhirId: z.string().min(1).optional(),
  dirjenId: z.string().optional().nullable(),
  unitKerjaId: z.string().min(1).optional(),
  subUnitKerjaId: z.string().optional().nullable(),
  eselonId: z.string().optional().nullable(),
  statusPegawaiId: z.string().min(1).optional(),
  fotoUrl: z.string().optional().nullable(),
  aktif: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const pegawai = await prisma.pegawai.findUnique({
      where: { id },
      include: {
        jenisKelamin: true,
        agama: true,
        statusPerkawinan: true,
        provinsi: true,
        kabupatenKota: true,
        kecamatan: true,
        desa: true,
        tempatLahirRelasi: true,
        pendidikanTerakhir: true,
        dirjen: true,
        unitKerja: true,
        subUnitKerja: true,
        eselon: true,
        statusPegawai: true,
        riwayatPangkat: {
          include: { pangkatGolongan: true },
          orderBy: { tmt: "desc" },
        },
        riwayatJabatan: {
          include: { jabatan: true, unitKerja: true },
          orderBy: { tmt: "desc" },
        },
      },
    });

    if (!pegawai) {
      return NextResponse.json(
        { error: "Pegawai tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(pegawai);
  } catch (error) {
    console.error("Error GET pegawai by id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isStaffRole((session.user as any).role)) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Administrator yang berhak mengubah data pegawai." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateSchema.parse(body);

    const existing = await prisma.pegawai.findUnique({
      where: { id },
      include: {
        jenisKelamin: true,
        agama: true,
        statusPerkawinan: true,
        provinsi: true,
        kabupatenKota: true,
        kecamatan: true,
        desa: true,
        tempatLahirRelasi: true,
        pendidikanTerakhir: true,
        dirjen: true,
        unitKerja: true,
        subUnitKerja: true,
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

    if (validated.nip && validated.nip !== existing.nip) {
      const duplicate = await prisma.pegawai.findUnique({
        where: { nip: validated.nip },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "NIP sudah digunakan" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (validated.nip) updateData.nip = validated.nip;
    if (validated.nama) updateData.nama = validated.nama;
    if (validated.jenisKelaminId) updateData.jenisKelaminId = validated.jenisKelaminId;
    if (validated.tempatLahir) updateData.tempatLahir = validated.tempatLahir;
    if (validated.tempatLahirId !== undefined) updateData.tempatLahirId = validated.tempatLahirId || null;
    if (validated.tanggalLahir) updateData.tanggalLahir = new Date(validated.tanggalLahir);
    if (validated.agamaId) updateData.agamaId = validated.agamaId;
    if (validated.statusPerkawinanId) updateData.statusPerkawinanId = validated.statusPerkawinanId;
    if (validated.provinsiId !== undefined) updateData.provinsiId = validated.provinsiId || null;
    if (validated.kabupatenKotaId !== undefined) updateData.kabupatenKotaId = validated.kabupatenKotaId || null;
    if (validated.kecamatanId !== undefined) updateData.kecamatanId = validated.kecamatanId || null;
    if (validated.desaId !== undefined) updateData.desaId = validated.desaId || null;
    if (validated.alamat) updateData.alamat = validated.alamat;
    if (validated.noHp !== undefined) updateData.noHp = validated.noHp || null;
    if (validated.email !== undefined) updateData.email = validated.email || null;
    if (validated.pendidikanTerakhirId) updateData.pendidikanTerakhirId = validated.pendidikanTerakhirId;
    if (validated.dirjenId !== undefined) updateData.dirjenId = validated.dirjenId || null;
    if (validated.unitKerjaId) updateData.unitKerjaId = validated.unitKerjaId;
    if (validated.subUnitKerjaId !== undefined) updateData.subUnitKerjaId = validated.subUnitKerjaId || null;
    if (validated.eselonId !== undefined) updateData.eselonId = validated.eselonId || null;
    if (validated.statusPegawaiId) updateData.statusPegawaiId = validated.statusPegawaiId;
    if (validated.fotoUrl !== undefined) updateData.fotoUrl = validated.fotoUrl || null;
    if (validated.aktif !== undefined) updateData.aktif = validated.aktif;

    const updated = await prisma.pegawai.update({
      where: { id },
      data: updateData,
      include: {
        jenisKelamin: true,
        agama: true,
        statusPerkawinan: true,
        provinsi: true,
        kabupatenKota: true,
        kecamatan: true,
        desa: true,
        tempatLahirRelasi: true,
        pendidikanTerakhir: true,
        dirjen: true,
        unitKerja: true,
        subUnitKerja: true,
        eselon: true,
        statusPegawai: true,
      },
    });

    await catatLog({
      userId: (session.user as any).id,
      aksi: "UPDATE",
      entitas: "Pegawai",
      entitasId: updated.id,
      deskripsi: `Mengubah data pegawai: ${updated.nama} (${updated.nip})`,
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
    console.error("Error PATCH pegawai:", error);
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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isStaffRole((session.user as any).role)) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Administrator yang berhak menghapus data pegawai." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.pegawai.findUnique({
      where: { id },
      include: {
        jenisKelamin: true,
        agama: true,
        statusPerkawinan: true,
        provinsi: true,
        kabupatenKota: true,
        kecamatan: true,
        desa: true,
        tempatLahirRelasi: true,
        pendidikanTerakhir: true,
        dirjen: true,
        unitKerja: true,
        subUnitKerja: true,
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

    const { searchParams } = new URL(request.url);
    const isPermanent = searchParams.get("permanent") === "true";

    if (isPermanent) {
      // Permanent delete can ONLY be performed by superadmin
      if (!isAdminRole((session.user as any).role)) {
        return NextResponse.json(
          { error: "Hanya Super Administrator yang memiliki izin untuk menghapus pegawai secara permanen" },
          { status: 403 }
        );
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

      return NextResponse.json({ message: "Pegawai berhasil dihapus secara permanen" });
    } else {
      // Soft delete: move to trash
      const updated = await prisma.pegawai.update({
        where: { id },
        data: { aktif: false },
      });

      await catatLog({
        userId: (session.user as any).id,
        aksi: "DELETE",
        entitas: "Pegawai",
        entitasId: updated.id,
        deskripsi: `Memindahkan pegawai ke tong sampah: ${existing.nama} (${existing.nip})`,
        dataSebelum: existing,
        dataSesudah: updated,
        request,
      });

      return NextResponse.json({ message: "Pegawai berhasil dipindahkan ke tong sampah" });
    }
  } catch (error) {
    console.error("Error DELETE pegawai:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
