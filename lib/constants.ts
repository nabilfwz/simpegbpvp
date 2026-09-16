/**
 * Konstanta Role Pengguna — Ekosistem BPVP Kemnaker RI
 *
 * Role berbasis hierarki akses yang berlaku lintas aplikasi:
 * SIMPEG, Skillhub, Maganghub, LSP-P1, PTSP, Keuangan & BMN
 */

export const ROLES = {
  /** IT / Pengelola Sistem — full access semua fitur & manajemen user */
  SUPERADMIN: "superadmin",
  /** Staff Admin / TU — CRUD pegawai, master data & manajemen user */
  ADMIN: "admin",
  /** Pengguna Biasa / Instruktur — view data pegawai (read-only) */
  USER: "user",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/** Label tampilan untuk setiap role */
export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Super Administrator",
  admin: "Administrator",
  user: "Pengguna",
};

/** Warna badge untuk setiap role (Tailwind classes) */
export const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  superadmin: "bg-red-100 text-red-800 border-red-200",
  admin: "bg-blue-100 text-blue-800 border-blue-200",
  user: "bg-slate-100 text-slate-700 border-slate-200",
};

/**
 * Role yang punya akses ke /admin/users (manajemen user)
 * Hanya superadmin yang bisa buka halaman ini.
 */
export const ADMIN_ROLES: UserRole[] = ["superadmin"];

/**
 * Role yang punya akses ke /admin/* umum
 * (master-data, manajemen user — superadmin; master-data — admin)
 */
export const STAFF_ROLES: UserRole[] = ["superadmin", "admin"];

/**
 * Role yang bisa akses /admin/log-aktivitas & /admin/tong-sampah
 * Hanya superadmin saja.
 */
export const REPORT_ROLES: UserRole[] = ["superadmin"];

/** Helper: apakah role bisa akses /admin/users (hanya superadmin) */
export function isAdminRole(role?: string | null): boolean {
  return ADMIN_ROLES.includes(role as UserRole);
}

/** Helper: apakah role bisa CRUD data pegawai & master data */
export function isStaffRole(role?: string | null): boolean {
  return STAFF_ROLES.includes(role as UserRole);
}

/** Helper: apakah role bisa akses halaman admin (superadmin + admin) */
export function hasAdminAccess(role?: string | null): boolean {
  return STAFF_ROLES.includes(role as UserRole);
}

/** Helper: apakah role bisa akses log & tong sampah (hanya superadmin) */
export function isReportRole(role?: string | null): boolean {
  return REPORT_ROLES.includes(role as UserRole);
}

/** Helper: dapatkan label role, fallback ke role string jika tidak dikenal */
export function getRoleLabel(role?: string | null): string {
  if (!role) return "Pengguna";
  return ROLE_LABELS[role as UserRole] ?? role;
}

/** Semua role dalam urutan hierarki untuk dropdown */
export const ALL_ROLES: UserRole[] = [
  "superadmin",
  "admin",
  "user",
];
