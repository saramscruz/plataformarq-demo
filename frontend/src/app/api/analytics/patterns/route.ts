import { NextResponse } from "next/server";
import { getWeeklyAnalytics } from "@/lib/db/queries";

export async function GET() {
  try {
    const analytics = getWeeklyAnalytics();
    if (!analytics) return NextResponse.json({ patterns: [], angles: [] });
    return NextResponse.json({
      patterns: analytics.patternsDetected,
      angles: analytics.contentAngleSuggestions,
    });
  } catch (err) {
    console.error("GET /api/analytics/patterns error:", err);
    return NextResponse.json({ error: "Failed to fetch patterns" }, { status: 500 });
  }
}
