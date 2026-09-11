import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSsoToken, BPVP_ECOSYSTEM_APPS } from "@/lib/sso";

export const dynamic = "force-dynamic";

/**
 * Endpoint untuk mendapatkan Cross-App SSO Token dari sesi aktif saat ini.
 * Digunakan oleh App Switcher untuk lompat ke aplikasi lain dalam ekosistem BPVP tanpa login lagi.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Sesi tidak ditemukan. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const email = session.user.email.toLowerCase().trim();

    // Ambil data user database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.aktif) {
      return NextResponse.json(
        { error: "Pengguna tidak aktif atau tidak ditemukan." },
        { status: 403 }
      );
    }

    // Ambil data pegawai jika ada
    const pegawai = await prisma.pegawai.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
        ],
      },
      include: {
        unitKerja: true,
        subUnitKerja: true,
        statusPegawai: true,
      },
    });

    // Jika pegawai nonaktif (di tong sampah), tolak
    if (pegawai && !pegawai.aktif) {
      return NextResponse.json(
        { error: "Pegawai berstatus nonaktif (berada di tong sampah)." },
        { status: 403 }
      );
    }

    // Generate token SSO
    const token = generateSsoToken(user, pegawai);

    // Siapkan daftar aplikasi ekosistem BPVP dengan token terlampir
    const appsWithToken = BPVP_ECOSYSTEM_APPS.map((app) => ({
      ...app,
      launchUrl: app.isCurrent ? "/" : `${app.url}${app.url.includes("?") ? "&" : "?"}sso_token=${encodeURIComponent(token)}`,
    }));

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        nip: pegawai?.nip || "-",
        unitKerja: pegawai?.unitKerja?.label || "BPVP Banda Aceh",
      },
      apps: appsWithToken,
    });
  } catch (error: any) {
    console.error("Error GET /api/sso/token:", error);
    return NextResponse.json(
      { error: "Gagal membuat token SSO." },
      { status: 500 }
    );
  }
}
