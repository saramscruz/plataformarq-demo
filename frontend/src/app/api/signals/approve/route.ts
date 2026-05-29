import { NextRequest, NextResponse } from "next/server";
import { getSignalById, updateSignal } from "@/lib/db/queries";
import { syncSignalToSheets } from "@/lib/sheets/sync";
import { runDataQualityChecks, runAIQualityChecks } from "@/lib/health/checks";

export async function POST(req: NextRequest) {
  try {
    const { id, updates } = await req.json() as { id: string; updates?: Record<string, unknown> };
    if (!id) return NextResponse.json({ error: "Signal ID required" }, { status: 400 });

    const signal = getSignalById(id);
    if (!signal) return NextResponse.json({ error: "Signal not found" }, { status: 404 });

    // Apply any user edits before approving
    if (updates) {
      updateSignal(id, updates);
    }

    // Mark as approved
    const approved = updateSignal(id, { status: "approved" });
    if (!approved) return NextResponse.json({ error: "Failed to approve signal" }, { status: 500 });

    // Sync to Google Sheets
    const syncResult = await syncSignalToSheets(approved);
    if (syncResult.success && syncResult.rowNumber) {
      updateSignal(id, { syncedToSheets: true, sheetsRowNumber: syncResult.rowNumber });
    }

    // Run background quality checks (non-blocking)
    try {
      runDataQualityChecks();
      runAIQualityChecks();
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      signal: getSignalById(id),
      syncResult,
    });
  } catch (err) {
    console.error("POST /api/signals/approve error:", err);
    return NextResponse.json({ error: "Failed to approve signal" }, { status: 500 });
  }
}
