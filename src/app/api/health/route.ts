import { NextResponse } from "next/server";
import { pool } from "@/db/client";

export const runtime = "nodejs";

export async function GET() {
  const start = Date.now();
  try {
    await pool.query("SELECT 1");
    return NextResponse.json({
      status: "ok",
      dbLatencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        dbLatencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
