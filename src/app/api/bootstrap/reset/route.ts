import { NextResponse } from "next/server";
import { getRequestUser, resetWorkspace } from "@/lib/server/app-service";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

export async function POST() {
  try {
    const { userId } = await getRequestUser();
    const appState = await resetWorkspace(userId);
    return NextResponse.json({ appState });
  } catch (error) {
    return handleRouteError(error, "Gagal mereset workspace.", 500);
  }
}
