import { NextRequest, NextResponse } from "next/server";
import { createExpense, getRequestUser } from "@/lib/server/app-service";
import { handleRouteError } from "@/lib/server/route-error";
import { ExpenseDraftSchema, parseBody } from "@/lib/server/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getRequestUser();
    const body = parseBody(ExpenseDraftSchema, await request.json());
    const expense = await createExpense(userId, body);
    return NextResponse.json({ expense });
  } catch (error) {
    return handleRouteError(error, "Gagal menyimpan pengeluaran.");
  }
}
