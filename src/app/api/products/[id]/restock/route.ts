import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, restockProduct } from "@/lib/server/app-service";
import { handleRouteError } from "@/lib/server/route-error";
import { parseBody, RestockSchema } from "@/lib/server/validators";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getRequestUser();
    const { id } = await context.params;
    const { quantity } = parseBody(RestockSchema, await request.json());
    const product = await restockProduct(userId, id, quantity);
    return NextResponse.json({ product });
  } catch (error) {
    return handleRouteError(error, "Gagal menambah stok.");
  }
}
