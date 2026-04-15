import { NextRequest, NextResponse } from "next/server";
import { createExpense, getRequestUser } from "@/lib/server/app-service";
import { handleRouteError } from "@/lib/server/route-error";
import { ExpenseDraft } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getRequestUser();
    const body = (await request.json()) as ExpenseDraft;
    const expense = await createExpense(userId, body);
    return NextResponse.json({ expense });
  } catch (error) {
    return handleRouteError(error, "Gagal menyimpan pengeluaran.");
  }
}
