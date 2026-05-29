import { NextResponse } from "next/server";
import { getAllHealthChecks } from "@/lib/db/queries";
import { initializeHealthChecks } from "@/lib/health/checks";

export async function GET() {
  try {
    let checks = getAllHealthChecks();
    if (checks.length === 0) {
      initializeHealthChecks();
      checks = getAllHealthChecks();
    }
    return NextResponse.json({ checks });
  } catch (err) {
    console.error("GET /api/health/checks error:", err);
    return NextResponse.json({ error: "Failed to fetch health checks" }, { status: 500 });
  }
}
