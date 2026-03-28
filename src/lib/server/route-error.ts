import { NextResponse } from "next/server";

export function handleRouteError(error: unknown, fallbackMessage: string, badRequestStatus = 400) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallbackMessage },
    { status: badRequestStatus }
  );
}
