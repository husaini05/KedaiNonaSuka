import { NextRequest, NextResponse } from "next/server";
import { createTransaction, getRequestUser } from "@/lib/server/app-service";
import { handleRouteError } from "@/lib/server/route-error";
import { parseBody, TransactionSchema } from "@/lib/server/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getRequestUser();
    const body = parseBody(TransactionSchema, await request.json());
    const result = await createTransaction(userId, body);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error, "Gagal menyimpan transaksi.");
  }
}
