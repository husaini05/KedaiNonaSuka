import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, restockProduct } from "@/lib/server/app-service";
import { handleRouteError } from "@/lib/server/route-error";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getRequestUser();
    const { id } = await context.params;
    const body = (await request.json()) as { quantity: number };
    const product = await restockProduct(userId, id, Number(body.quantity));
    return NextResponse.json({ product });
  } catch (error) {
    return handleRouteError(error, "Gagal menambah stok.");
  }
}
