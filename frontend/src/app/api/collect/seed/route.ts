import { NextResponse } from "next/server";
import { getAllSignals } from "@/lib/db/queries";
import { initializeHealthChecks } from "@/lib/health/checks";

export async function POST() {
  try {
    // Only allow seeding if no signals exist yet
    const existing = getAllSignals(1);
    if (existing.length > 0) {
      return NextResponse.json({ message: "Database already has data, skipping seed" });
    }

    // Dynamic import to avoid loading seed on every request
    await import("@/lib/db/seed");
    initializeHealthChecks();

    return NextResponse.json({ message: "Seed complete" });
  } catch (err) {
    console.error("POST /api/collect/seed error:", err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
