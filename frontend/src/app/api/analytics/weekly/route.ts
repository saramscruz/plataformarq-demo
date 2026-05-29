import { NextRequest, NextResponse } from "next/server";
import { getWeeklyAnalytics, getCurrentWeek } from "@/lib/db/queries";
import { generateWeeklyAnalytics } from "@/lib/ai/patterns";
import { upsertAnalytics } from "@/lib/db/queries";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const week = searchParams.get("week") ? parseInt(searchParams.get("week")!) : undefined;
    const regenerate = searchParams.get("regenerate") === "true";

    let analytics = getWeeklyAnalytics(week);

    if (!analytics || regenerate) {
      analytics = await generateWeeklyAnalytics(week || getCurrentWeek());
      upsertAnalytics(analytics);
    }

    return NextResponse.json({ analytics });
  } catch (err) {
    console.error("GET /api/analytics/weekly error:", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
