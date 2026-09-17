import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

const SSO_SECRET = process.env.NEXTAUTH_SECRET || "bpvp-kemnaker-sso-secret-key-2026-secure";

export interface SsoTokenPayload {
  tokenId: string;
  userId: string;
  pegawaiId?: string;
  nip: string;
  nama: string;
  email: string;
  role: string;
  unitKerja?: string;
  subUnitKerja?: string;
  statusPegawai?: string;
  iat: number;
  exp: number;
}

export interface BpvpApp {
  id: string;
  nama: string;
  deskripsi: string;
  kategori: string;
  url: string;
  icon: string;
  color: string;
  badge?: string;
  isCurrent?: boolean;
}

const SSO_BASE_URL = process.env.NEXT_PUBLIC_SSO_URL || "https://sso-bpvp.vercel.app";

export const BPVP_ECOSYSTEM_APPS: BpvpApp[] = [
  {
    id: "simpeg",
    nama: "SIMPEG BPVP Banda Aceh",
    deskripsi: "Sistem Informasi Manajemen Pegawai & Layanan Kepegawaian ASN",
    kategori: "Kepegawaian & SDM",
    url: "/",
    icon: "👥",
    color: "from-blue-600 to-[#003399]",
    badge: "Aplikasi Saat Ini",
    isCurrent: true,
  },
  {
    id: "skillhub",
    nama: "Skillhub BPVP",
    deskripsi: "Portal Pelatihan Vokasi, Kurikulum, & Peningkatan Produktivitas",
    kategori: "Pelatihan Vokasi",
    url: `${SSO_BASE_URL}/demo/skillhub`,
    icon: "🎓",
    color: "from-emerald-600 to-teal-800",
  },
  {
    id: "maganghub",
    nama: "Maganghub BPVP",
    deskripsi: "Sistem Manajemen Pemagangan Dalam & Luar Negeri Mitra Industri",
    kategori: "Pemagangan",
    url: `${SSO_BASE_URL}/demo/maganghub`,
    icon: "🏢",
    color: "from-amber-600 to-orange-800",
  },
  {
    id: "lsp",
    nama: "LSP-P1 BPVP",
    deskripsi: "Lembaga Sertifikasi Profesi BNSP, Asesmen & Uji Kompetensi",
    kategori: "Sertifikasi",
    url: `${SSO_BASE_URL}/demo/lsp`,
    icon: "🏅",
    color: "from-indigo-600 to-purple-800",
  },
  {
    id: "keuangan",
    nama: "Keuangan & BMN",
    deskripsi: "Pengelolaan Anggaran DIPA, Perbendaharaan, & Aset Milik Negara",
    kategori: "Keuangan & Sarana",
    url: `${SSO_BASE_URL}/demo/keuangan`,
    icon: "💰",
    color: "from-cyan-600 to-blue-800",
  },
  {
    id: "ptsp",
    nama: "Kios Siap Kerja / PTSP",
    deskripsi: "Pelayanan Terpadu Satu Pintu Informasi Pasar Kerja & Konseling Vokasi",
    kategori: "Pelayanan Publik",
    url: `${SSO_BASE_URL}/demo/ptsp`,
    icon: "🏛️",
    color: "from-rose-600 to-pink-800",
  },
];

/**
 * Validates whether an email or NIP belongs to an ACTIVE registered BPVP employee or administrator.
 * External users / inactive employees are strictly rejected.
 */
export async function validatePegawaiForSso(identifier: string): Promise<{
  user: { id: string; nama: string; email: string; role: string; aktif: boolean };
  pegawai?: any;
}> {
  const cleanId = identifier.trim();
  const cleanEmail = cleanId.toLowerCase();

  // 1. Search in Pegawai (Primary Source of Truth for BPVP employees)
  const pegawai = await prisma.pegawai.findFirst({
    where: {
      OR: [
        { email: { equals: cleanEmail, mode: "insensitive" } },
        { nip: cleanId },
      ],
    },
    include: {
      unitKerja: true,
      subUnitKerja: true,
      dirjen: true,
      statusPegawai: true,
      eselon: true,
    },
  });

  if (pegawai) {
    // Check active status
    if (!pegawai.aktif) {
      throw new Error(
        `Akses Ditolak: Pegawai "${pegawai.nama}" (${pegawai.nip}) berstatus nonaktif (berada di tong sampah). Hubungi Administrator BPVP.`
      );
    }

    const employeeEmail = pegawai.email?.toLowerCase().trim() || `${pegawai.nip}@bpvp.kemnaker.go.id`;

    // Determine system role: Subbagian Umum, Pimpinan, or designated admin titles become 'admin', others 'user'
    const subUnit = pegawai.subUnitKerja?.label?.toLowerCase() || "";
    const isElevated =
      subUnit.includes("umum") ||
      subUnit.includes("pimpinan") ||
      subUnit.includes("tata usaha") ||
      pegawai.nip === "198001012005011001";
    const assignedRole = isElevated ? "admin" : "user";

    // Find or synchronize internal User record
    let user = await prisma.user.findUnique({
      where: { email: employeeEmail },
    });

    if (user) {
      if (!user.aktif) {
        throw new Error(
          `Akses Ditolak: Akun login pengguna untuk "${pegawai.nama}" telah dinonaktifkan oleh administrator.`
        );
      }
    } else {
      // Provision internal user for the verified employee
      const randomPassword = await bcrypt.hash(
        crypto.randomBytes(16).toString("hex"),
        10
      );
      user = await prisma.user.create({
        data: {
          email: employeeEmail,
          nama: pegawai.nama,
          password: randomPassword,
          role: assignedRole,
          aktif: true,
        },
      });
    }

    return { user, pegawai };
  }

  // 2. Fallback check for System User (e.g. system administrators configured directly in User)
  const systemUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (systemUser) {
    if (!systemUser.aktif) {
      throw new Error(`Akses Ditolak: Akun login "${systemUser.email}" dinonaktifkan oleh administrator.`);
    }
    return { user: systemUser };
  }

  // 3. User is an outsider / not registered in Manajemen Pegawai
  throw new Error(
    `Akses Ditolak: Email atau NIP "${identifier}" tidak terdaftar dalam Data Manajemen Pegawai BPVP. Hanya ASN dan Pegawai BPVP aktif yang berhak mengakses Ekosistem SSO BPVP.`
  );
}

/**
 * Generates a signed, tamper-proof SSO Cross-App Token.
 */
export function generateSsoToken(user: { id: string; nama: string; email: string; role: string }, pegawai?: any): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 1 * 3600; // Berlaku 1 jam (3600 detik)

  const payload: SsoTokenPayload = {
    tokenId: crypto.randomBytes(12).toString("hex"),
    userId: user.id,
    pegawaiId: pegawai?.id,
    nip: pegawai?.nip || "-",
    nama: pegawai?.nama || user.nama,
    email: user.email,
    role: user.role,
    unitKerja: pegawai?.unitKerja?.label || "Balai Pelatihan Vokasi dan Produktivitas Banda Aceh",
    subUnitKerja: pegawai?.subUnitKerja?.label || (user.role === "superadmin" ? "Subbagian Umum" : "Operasional"),
    statusPegawai: pegawai?.statusPegawai?.label || "ASN Kemnaker",
    iat: now,
    exp,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SSO_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies an SSO Cross-App Token and ensures the employee is still active.
 */
export async function verifySsoToken(tokenString: string): Promise<SsoTokenPayload> {
  if (!tokenString || typeof tokenString !== "string" || !tokenString.includes(".")) {
    throw new Error("Format token SSO tidak valid.");
  }

  const [payloadBase64, signature] = tokenString.split(".");
  const expectedSig = crypto
    .createHmac("sha256", SSO_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  if (signature !== expectedSig) {
    throw new Error("Tanda tangan kriptografis token SSO tidak valid (kemungkinan telah diubah).");
  }

  let payload: SsoTokenPayload;
  try {
    const jsonStr = Buffer.from(payloadBase64, "base64url").toString("utf8");
    payload = JSON.parse(jsonStr);
  } catch {
    throw new Error("Isi token SSO rusak atau tidak dapat diuraikan.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error("Token SSO telah kadaluarsa. Silakan lakukan autentikasi ulang.");
  }

  // Verify in database that the user/pegawai is still active
  if (payload.pegawaiId) {
    const currentPegawai = await prisma.pegawai.findUnique({
      where: { id: payload.pegawaiId },
    });
    if (!currentPegawai || !currentPegawai.aktif) {
      throw new Error("Akses Ditolak: Pegawai ini telah dinonaktifkan dari sistem BPVP.");
    }
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: payload.userId },
  });
  if (!currentUser || !currentUser.aktif) {
    throw new Error("Akses Ditolak: Akun pengguna untuk sesi SSO ini telah dinonaktifkan.");
  }

  return payload;
}
