import { NextResponse } from "next/server";
import { getBootstrapState, getRequestUser } from "@/lib/server/app-service";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await getRequestUser();
    const appState = await getBootstrapState(userId);
    return NextResponse.json({ appState });
  } catch (error) {
    return handleRouteError(error, "Gagal memuat data aplikasi.", 500);
  }
}
