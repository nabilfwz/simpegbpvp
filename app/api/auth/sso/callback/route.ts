import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("sso_token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=TokenSSOTidakDitemukan", request.url));
  }

  // Redirect to the client-side callback page to establish NextAuth session
  const callbackUrl = new URL("/auth/sso-callback", request.url);
  callbackUrl.searchParams.set("sso_token", token);
  return NextResponse.redirect(callbackUrl);
}
