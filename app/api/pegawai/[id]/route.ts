import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { catatLog } from "@/lib/log-aktivitas";
import { z } from "zod";

const updateSchema = z.object({
  nip: z.string().min(1).optional(),
  nama: z.string().min(1).optional(),
  jenisKelaminId: z.string().min(1).optional(),
  tempatLahir: z.string().min(1).optional(),
  tanggalLahir: z.string().min(1).optional(),
  agamaId: z.string().min(1).optional(),
  statusPerkawinanId: z.string().min(1).optional(),
  alamat: z.string().min(1).optional(),
  noHp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")).optional(),
  pendidikanTerakhirId: z.string().min(1).optional(),
  unitKerjaId: z.string().min(1).optional(),
  statusPegawaiId: z.string().min(1).optional(),
  fotoUrl: z.string().optional(),
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
        pendidikanTerakhir: true,
        unitKerja: true,
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

    const { id } = await params;
    const body = await request.json();
    const validated = updateSchema.parse(body);

    const existing = await prisma.pegawai.findUnique({
      where: { id },
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
    if (validated.tanggalLahir) updateData.tanggalLahir = new Date(validated.tanggalLahir);
    if (validated.agamaId) updateData.agamaId = validated.agamaId;
    if (validated.statusPerkawinanId) updateData.statusPerkawinanId = validated.statusPerkawinanId;
    if (validated.alamat) updateData.alamat = validated.alamat;
    if (validated.noHp !== undefined) updateData.noHp = validated.noHp || null;
    if (validated.email !== undefined) updateData.email = validated.email || null;
    if (validated.pendidikanTerakhirId) updateData.pendidikanTerakhirId = validated.pendidikanTerakhirId;
    if (validated.unitKerjaId) updateData.unitKerjaId = validated.unitKerjaId;
    if (validated.statusPegawaiId) updateData.statusPegawaiId = validated.statusPegawaiId;
    if (validated.fotoUrl !== undefined) updateData.fotoUrl = validated.fotoUrl || null;
    if (validated.aktif !== undefined) updateData.aktif = validated.aktif;

    const updated = await prisma.pegawai.update({
      where: { id },
      data: updateData,
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

    const { id } = await params;
    const existing = await prisma.pegawai.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pegawai tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await prisma.pegawai.update({
      where: { id },
      data: { aktif: false },
    });

    await catatLog({
      userId: (session.user as any).id,
      aksi: "DELETE",
      entitas: "Pegawai",
      entitasId: updated.id,
      deskripsi: `Menonaktifkan pegawai: ${existing.nama} (${existing.nip})`,
      dataSebelum: existing,
      dataSesudah: updated,
      request,
    });

    return NextResponse.json({ message: "Pegawai berhasil dinonaktifkan" });
  } catch (error) {
    console.error("Error DELETE pegawai:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
