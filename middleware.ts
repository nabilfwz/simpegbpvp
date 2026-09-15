import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Protect /admin/* subpaths (not /admin itself — that's the login page)
    if (path.startsWith("/admin/") && token?.role !== "admin") {
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
    // /admin (exact) is the admin login page — NOT protected
    // /admin/:path+ covers all subpaths like /admin/users, /admin/tong-sampah
    "/admin/:path+",
    "/api/master-data/:path*",
    "/api/pegawai/:path*",
    "/api/log-aktivitas/:path*",
    "/api/riwayat-pangkat/:path*",
    "/api/riwayat-jabatan/:path*",
  ],
};
