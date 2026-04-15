import { NextRequest, NextResponse } from "next/server";
import { createDebt, getRequestUser } from "@/lib/server/app-service";
import { handleRouteError } from "@/lib/server/route-error";
import { DebtDraftSchema, parseBody } from "@/lib/server/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getRequestUser();
    const draft = parseBody(DebtDraftSchema, await request.json());
    const debt = await createDebt(userId, draft);
    return NextResponse.json({ debt });
  } catch (error) {
    return handleRouteError(error, "Gagal menyimpan kasbon.");
  }
}
