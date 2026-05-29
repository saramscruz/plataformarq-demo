import { NextRequest, NextResponse } from "next/server";
import { updateSignal } from "@/lib/db/queries";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: string };
    if (!id) return NextResponse.json({ error: "Signal ID required" }, { status: 400 });
    const updated = updateSignal(id, { status: "skipped" });
    if (!updated) return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    return NextResponse.json({ signal: updated });
  } catch (err) {
    console.error("POST /api/signals/skip error:", err);
    return NextResponse.json({ error: "Failed to skip signal" }, { status: 500 });
  }
}
