import { NextRequest, NextResponse } from "next/server";
import { createExpense, getRequestUser } from "@/lib/server/app-service";
import { ExpenseDraft } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getRequestUser();
    const body = (await request.json()) as ExpenseDraft;
    const expense = await createExpense(userId, body);
    return NextResponse.json({ expense });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menyimpan pengeluaran." },
      { status: 400 }
    );
  }
}
