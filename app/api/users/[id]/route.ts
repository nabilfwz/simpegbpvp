import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { z } from "zod";

const updateSchema = z.object({
  nama: z.string().min(1).optional(),
  email: z.string().email("Format email tidak valid").optional(),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  role: z.enum(["admin", "operator"]).optional(),
  aktif: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    if (validated.email && validated.email !== existing.email) {
      const duplicate = await prisma.user.findUnique({
        where: { email: validated.email },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Email sudah digunakan" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (validated.nama) updateData.nama = validated.nama;
    if (validated.email) updateData.email = validated.email;
    if (validated.password) {
      updateData.password = await bcrypt.hash(validated.password, 10);
    }
    if (validated.role) updateData.role = validated.role;
    if (validated.aktif !== undefined) updateData.aktif = validated.aktif;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasi gagal", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error PATCH users:", error);
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
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    if (existing.email === "admin@bpvp.local") {
      return NextResponse.json(
        { error: "Tidak dapat menghapus user admin default" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User berhasil dihapus" });
  } catch (error) {
    console.error("Error DELETE users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
