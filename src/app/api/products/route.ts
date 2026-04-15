import { NextRequest, NextResponse } from "next/server";
import { createProduct, getRequestUser } from "@/lib/server/app-service";
import { handleRouteError } from "@/lib/server/route-error";
import { parseBody, ProductDraftSchema } from "@/lib/server/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getRequestUser();
    const draft = parseBody(ProductDraftSchema, await request.json());
    const product = await createProduct(userId, draft);
    return NextResponse.json({ product });
  } catch (error) {
    return handleRouteError(error, "Gagal menambah produk.");
  }
}
