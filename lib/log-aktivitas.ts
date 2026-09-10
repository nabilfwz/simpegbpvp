import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export interface CatatLogParams {
  userId: string;
  aksi: "CREATE" | "UPDATE" | "DELETE";
  entitas: "MasterData" | "Pegawai" | "RiwayatPangkat" | "RiwayatJabatan" | "User" | string;
  entitasId: string;
  deskripsi: string;
  dataSebelum?: Record<string, unknown> | Array<unknown> | null;
  dataSesudah?: Record<string, unknown> | Array<unknown> | null;
  ipAddress?: string;
  request?: NextRequest | Request;
}

/**
 * Helper terpusat untuk mencatat aktivitas ke tabel LogAktivitas.
 * Dilengkapi fallback aman (try-catch) agar kegagalan log tidak memutus flow utama.
 */
export async function catatLog(params: CatatLogParams): Promise<void> {
  try {
    let resolvedIp = params.ipAddress;

    if (!resolvedIp && params.request) {
      const headers = params.request.headers;
      resolvedIp =
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headers.get("x-real-ip") ||
        "127.0.0.1";
    }

    await prisma.logAktivitas.create({
      data: {
        userId: params.userId,
        aksi: params.aksi,
        entitas: params.entitas,
        entitasId: params.entitasId,
        deskripsi: params.deskripsi,
        dataSebelum: (params.dataSebelum ?? undefined) as any,
        dataSesudah: (params.dataSesudah ?? undefined) as any,
        ipAddress: resolvedIp || "127.0.0.1",
      },
    });
  } catch (error) {
    console.error("[catatLog] Gagal mencatat log aktivitas:", error);
  }
}
