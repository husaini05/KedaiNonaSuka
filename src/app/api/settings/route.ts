import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, updateStoreSettings } from "@/lib/server/app-service";
import { handleRouteError } from "@/lib/server/route-error";
import { parseBody, SettingsSchema } from "@/lib/server/validators";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await getRequestUser();
    const settings = parseBody(SettingsSchema, await request.json());
    const nextSettings = await updateStoreSettings(userId, settings);
    return NextResponse.json({ settings: nextSettings });
  } catch (error) {
    return handleRouteError(error, "Gagal menyimpan pengaturan.");
  }
}
