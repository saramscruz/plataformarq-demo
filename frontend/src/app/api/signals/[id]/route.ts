import { NextRequest, NextResponse } from "next/server";
import { getSignalById, updateSignal } from "@/lib/db/queries";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const signal = getSignalById(params.id);
    if (!signal) return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    return NextResponse.json({ signal });
  } catch (err) {
    console.error("GET /api/signals/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch signal" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = updateSignal(params.id, body);
    if (!updated) return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    return NextResponse.json({ signal: updated });
  } catch (err) {
    console.error("PATCH /api/signals/[id] error:", err);
    return NextResponse.json({ error: "Failed to update signal" }, { status: 500 });
  }
}
