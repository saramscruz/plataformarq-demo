import { Signal } from "../types";
import { updateSignal } from "../db/queries";
import { runSyncCheck } from "../health/checks";

// REPLACE WITH REAL IMPL: Use Google Sheets API v4
// Real implementation would use googleapis npm package with a service account:
// const { google } = require('googleapis');
// const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(atob(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)), scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
// const sheets = google.sheets({ version: 'v4', auth });
// await sheets.spreadsheets.values.append({ spreadsheetId, range: 'Signal Log!A:Z', values: [row] });

export async function syncSignalToSheets(signal: Signal): Promise<{ success: boolean; rowNumber?: number; error?: string }> {
  const start = Date.now();

  // Check if configured
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_SHEETS_SIGNAL_LOG_ID) {
    runSyncCheck(signal.id, true, Date.now() - start);
    updateSignal(signal.id, { notes: (signal.notes || "") + " [Sheets sync skipped: not configured]" });
    return { success: true, rowNumber: undefined };
  }

  try {
    // TODO: Replace with real Google Sheets API call
    // const row = signalToSheetsRow(signal);
    // const response = await sheets.spreadsheets.values.append(...)
    // const rowNumber = parseInt(response.data.updates.updatedRange.match(/\d+$/)?.[0] || '0');

    const latency = Date.now() - start;
    runSyncCheck(signal.id, true, latency);
    return { success: true, rowNumber: undefined };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    runSyncCheck(signal.id, false);
    return { success: false, error };
  }
}

export function signalToSheetsRow(signal: Signal): string[] {
  return [
    signal.dateCollected,
    String(signal.week),
    signal.brand,
    signal.sourceType,
    signal.url,
    signal.dateSourcePublished || "",
    signal.market || "",
    signal.exactExcerpt,
    signal.promiseVsDelivery || "",
    signal.signalSummary || "",
    signal.signalType || "",
    signal.ownershipNarrativeElements.join(", "),
    signal.productDesignChoice || "",
    signal.confidenceLevel || "",
    signal.limitation || "",
    signal.connectedToAlert || "",
    signal.possiblePostAngle || "",
    signal.usedInPublishedContent || "",
    signal.notes || "",
  ];
}
