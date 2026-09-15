/**
 * Konstanta Role Pengguna — Ekosistem BPVP Kemnaker RI
 *
 * Role berbasis jabatan fungsional yang berlaku lintas aplikasi:
 * SIMPEG, Skillhub, Maganghub, LSP-P1, PTSP, Keuangan & BMN
 */

export const ROLES = {
  /** IT / Pengelola Sistem — full access semua fitur & manajemen user */
  SUPERADMIN: "superadmin",
  /** Staff TU pengelola data pegawai — CRUD pegawai & master data */
  ADMIN_KEPEGAWAIAN: "admin_kepegawaian",
  /** Kepala Subbagian Tata Usaha — view semua data & ekspor laporan */
  KASUBAG_TU: "kasubag_tu",
  /** Instruktur BPVP — view data pegawai & profil sendiri */
  INSTRUKTUR: "instruktur",
  /** Operator / Pelaksana — akses read-only terbatas */
  OPERATOR: "operator",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/** Label tampilan untuk setiap role */
export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Super Administrator",
  admin_kepegawaian: "Admin Kepegawaian",
  kasubag_tu: "Ka. Subbag Tata Usaha",
  instruktur: "Instruktur",
  operator: "Operator / Pelaksana",
};

/** Warna badge untuk setiap role (Tailwind classes) */
export const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  superadmin: "bg-red-100 text-red-800 border-red-200",
  admin_kepegawaian: "bg-blue-100 text-blue-800 border-blue-200",
  kasubag_tu: "bg-purple-100 text-purple-800 border-purple-200",
  instruktur: "bg-amber-100 text-amber-800 border-amber-200",
  operator: "bg-slate-100 text-slate-700 border-slate-200",
};

/**
 * Role yang punya akses ke /admin/* (manajemen user, tong sampah, log aktivitas)
 * Hanya superadmin yang bisa buka halaman ini.
 */
export const ADMIN_ROLES: UserRole[] = ["superadmin"];

/**
 * Role yang bisa CRUD data pegawai & master data
 */
export const STAFF_ROLES: UserRole[] = ["superadmin", "admin_kepegawaian"];

/**
 * Role yang bisa melihat laporan & log aktivitas
 */
export const REPORT_ROLES: UserRole[] = ["superadmin", "admin_kepegawaian", "kasubag_tu"];

/** Helper: apakah role termasuk admin (/admin/* access) */
export function isAdminRole(role?: string | null): boolean {
  return ADMIN_ROLES.includes(role as UserRole);
}

/** Helper: apakah role bisa CRUD data pegawai */
export function isStaffRole(role?: string | null): boolean {
  return STAFF_ROLES.includes(role as UserRole);
}

/** Helper: dapatkan label role, fallback ke role string jika tidak dikenal */
export function getRoleLabel(role?: string | null): string {
  if (!role) return "Pengguna";
  return ROLE_LABELS[role as UserRole] ?? role;
}

/** Semua role dalam urutan hierarki untuk dropdown */
export const ALL_ROLES: UserRole[] = [
  "superadmin",
  "admin_kepegawaian",
  "kasubag_tu",
  "instruktur",
  "operator",
];
