import { NextRequest, NextResponse } from "next/server";
import { getUserConfig, upsertUserConfig } from "@/lib/db/queries";

export async function GET() {
  try {
    const config = getUserConfig("demo-user");
    return NextResponse.json({ config });
  } catch (err) {
    console.error("GET /api/config error:", err);
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = getUserConfig("demo-user");
    upsertUserConfig({
      userId: "demo-user",
      brandsToMonitor: existing?.brandsToMonitor || ["Mercedes-Benz", "BMW", "Audi", "Volvo", "Porsche"],
      ...existing,
      ...body,
    });
    return NextResponse.json({ config: getUserConfig("demo-user") });
  } catch (err) {
    console.error("PATCH /api/config error:", err);
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
