import { NextRequest, NextResponse } from "next/server";
import { getPendingSignals, getAllSignals } from "@/lib/db/queries";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";
    const signals = all ? getAllSignals() : getPendingSignals();
    return NextResponse.json({ signals });
  } catch (err) {
    console.error("GET /api/signals error:", err);
    return NextResponse.json({ error: "Failed to fetch signals" }, { status: 500 });
  }
}
