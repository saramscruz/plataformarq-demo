import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/health/checks";

export async function GET() {
  try {
    const health = getSystemHealth();
    return NextResponse.json(health);
  } catch (err) {
    console.error("GET /api/health error:", err);
    return NextResponse.json({ error: "Failed to fetch health status" }, { status: 500 });
  }
}
