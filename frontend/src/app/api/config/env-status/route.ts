import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
    GOOGLE_SERVICE_ACCOUNT_KEY: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
    GOOGLE_SHEETS_SIGNAL_LOG_ID: Boolean(process.env.GOOGLE_SHEETS_SIGNAL_LOG_ID),
    GMAIL_APP_PASSWORD: Boolean(process.env.GMAIL_APP_PASSWORD),
  });
}
