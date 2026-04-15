import { NextRequest, NextResponse } from "next/server";
import { deleteProduct, getRequestUser, updateProduct } from "@/lib/server/app-service";
import { handleRouteError } from "@/lib/server/route-error";
import { parseBody, ProductDraftSchema } from "@/lib/server/validators";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getRequestUser();
    const { id } = await context.params;
    const draft = parseBody(ProductDraftSchema, await request.json());
    const product = await updateProduct(userId, id, draft);
    return NextResponse.json({ product });
  } catch (error) {
    return handleRouteError(error, "Gagal memperbarui produk.");
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getRequestUser();
    const { id } = await context.params;
    await deleteProduct(userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "Gagal menghapus produk.");
  }
}
