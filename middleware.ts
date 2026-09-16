import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { ADMIN_ROLES, STAFF_ROLES, REPORT_ROLES } from "@/lib/constants";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string | undefined;

    // /admin root path: redirect ke /admin/master-data jika admin/superadmin, atau / jika user biasa
    if (path === "/admin") {
      if (STAFF_ROLES.includes(role as any)) {
        return NextResponse.redirect(new URL("/admin/master-data", req.url));
      }
      return NextResponse.redirect(new URL("/", req.url));
    }

    // /admin/users & /admin/log-aktivitas & /admin/tong-sampah — hanya superadmin
    if (
      (path.startsWith("/admin/users") ||
        path.startsWith("/admin/log-aktivitas") ||
        path.startsWith("/admin/tong-sampah")) &&
      !ADMIN_ROLES.includes(role as any)
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // /admin/* umum (master-data dll.) — superadmin & admin
    if (path.startsWith("/admin/") && !STAFF_ROLES.includes(role as any)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/pegawai/:path*",
    "/admin/:path*",
    "/api/master-data/:path*",
    "/api/pegawai/:path*",
    "/api/log-aktivitas/:path*",
    "/api/riwayat-pangkat/:path*",
    "/api/riwayat-jabatan/:path*",
  ],
};
