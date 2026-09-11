import { NextRequest, NextResponse } from "next/server";
import { verifySsoToken } from "@/lib/sso";

export const dynamic = "force-dynamic";

/**
 * Endpoint verifikasi Cross-App Token SSO untuk aplikasi satelit BPVP (Skillhub, Maganghub, LSP, dll).
 * Menerima token via GET query (?token=...) atau POST body ({ token: "..." }).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { valid: false, error: "Parameter 'token' wajib disertakan." },
      { status: 400 }
    );
  }

  try {
    const payload = await verifySsoToken(token);
    return NextResponse.json({
      valid: true,
      message: "Token SSO terverifikasi dan pegawai berstatus aktif.",
      data: payload,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        valid: false,
        error: error?.message || "Token SSO tidak valid atau telah kadaluarsa.",
      },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body?.token;

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Field 'token' wajib disertakan dalam request body." },
        { status: 400 }
      );
    }

    const payload = await verifySsoToken(token);
    return NextResponse.json({
      valid: true,
      message: "Token SSO terverifikasi dan pegawai berstatus aktif.",
      data: payload,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        valid: false,
        error: error?.message || "Token SSO tidak valid atau telah kadaluarsa.",
      },
      { status: 401 }
    );
  }
}
