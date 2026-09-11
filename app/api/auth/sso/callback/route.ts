import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("sso_token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=TokenSSOTidakDitemukan", request.nextUrl));
  }

  // Redirect to the client-side callback page to establish NextAuth session
  const callbackUrl = new URL("/auth/sso-callback", request.nextUrl);
  callbackUrl.searchParams.set("sso_token", token);
  return NextResponse.redirect(callbackUrl);
}
