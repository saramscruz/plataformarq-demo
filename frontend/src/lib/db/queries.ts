import { getDb } from "./schema";
import { Signal, HealthCheck, WeeklyAnalytics, UserConfig } from "../types";
import { v4 as uuidv4 } from "uuid";

// ──────────────── Signals ────────────────

function rowToSignal(row: Record<string, unknown>): Signal {
  return {
    id: row.id as string,
    dateCollected: row.date_collected as string,
    week: row.week as number,
    brand: row.brand as Signal["brand"],
    sourceType: row.source_type as Signal["sourceType"],
    url: row.url as string,
    dateSourcePublished: row.date_source_published as string | undefined,
    market: row.market as string | undefined,
    exactExcerpt: row.exact_excerpt as string,
    promiseVsDelivery: row.promise_vs_delivery as string | undefined,
    signalSummary: row.signal_summary as string | undefined,
    signalType: row.signal_type as Signal["signalType"],
    signalTypeConfidence: row.signal_type_confidence as number | undefined,
    ownershipNarrativeElements: JSON.parse((row.ownership_narrative_elements as string) || "[]"),
    productDesignChoice: row.product_design_choice as string | undefined,
    confidenceLevel: row.confidence_level as Signal["confidenceLevel"],
    limitation: row.limitation as string | undefined,
    connectedToAlert: row.connected_to_alert as string | undefined,
    possiblePostAngle: row.possible_post_angle as string | undefined,
    usedInPublishedContent: row.used_in_published_content as string | undefined,
    notes: row.notes as string | undefined,
    status: row.status as Signal["status"],
    isDuplicate: Boolean(row.is_duplicate),
    duplicateOfSignalId: row.duplicate_of_signal_id as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    syncedToSheets: Boolean(row.synced_to_sheets),
    sheetsRowNumber: row.sheets_row_number as number | undefined,
    aiSuggestions: row.ai_suggestions
      ? JSON.parse(row.ai_suggestions as string)
      : undefined,
  };
}

export function getPendingSignals(): Signal[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM signals WHERE status = 'pending' ORDER BY created_at DESC")
    .all() as Record<string, unknown>[];
  return rows.map(rowToSignal);
}

export function getAllSignals(limit = 200): Signal[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM signals ORDER BY created_at DESC LIMIT ?")
    .all(limit) as Record<string, unknown>[];
  return rows.map(rowToSignal);
}

export function getSignalById(id: string): Signal | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM signals WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? rowToSignal(row) : null;
}

export function createSignal(data: Partial<Signal> & { brand: Signal["brand"]; sourceType: Signal["sourceType"]; url: string; exactExcerpt: string }): Signal {
  const db = getDb();
  const now = new Date().toISOString();
  const id = data.id || uuidv4();
  const week = data.week || getCurrentWeek();

  db.prepare(`
    INSERT INTO signals (
      id, date_collected, week, brand, source_type, url, date_source_published, market,
      exact_excerpt, promise_vs_delivery, signal_summary, signal_type, signal_type_confidence,
      ownership_narrative_elements, product_design_choice, confidence_level, limitation,
      connected_to_alert, possible_post_angle, used_in_published_content, notes,
      status, is_duplicate, duplicate_of_signal_id, ai_suggestions,
      created_at, updated_at, synced_to_sheets, sheets_row_number
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `).run(
    id, data.dateCollected || now.slice(0, 10), week, data.brand, data.sourceType, data.url,
    data.dateSourcePublished || null, data.market || null,
    data.exactExcerpt, data.promiseVsDelivery || null, data.signalSummary || null,
    data.signalType || null, data.signalTypeConfidence || null,
    JSON.stringify(data.ownershipNarrativeElements || []),
    data.productDesignChoice || null, data.confidenceLevel || null, data.limitation || null,
    data.connectedToAlert || null, data.possiblePostAngle || null,
    data.usedInPublishedContent || null, data.notes || null,
    data.status || "pending", data.isDuplicate ? 1 : 0,
    data.duplicateOfSignalId || null,
    data.aiSuggestions ? JSON.stringify(data.aiSuggestions) : null,
    now, now, 0, null
  );

  return getSignalById(id)!;
}

export function updateSignal(id: string, data: Partial<Signal>): Signal | null {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = getSignalById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  const fieldMap: Record<string, string> = {
    brand: "brand", sourceType: "source_type", url: "url",
    dateSourcePublished: "date_source_published", market: "market",
    exactExcerpt: "exact_excerpt", promiseVsDelivery: "promise_vs_delivery",
    signalSummary: "signal_summary", signalType: "signal_type",
    signalTypeConfidence: "signal_type_confidence",
    productDesignChoice: "product_design_choice",
    confidenceLevel: "confidence_level", limitation: "limitation",
    connectedToAlert: "connected_to_alert", possiblePostAngle: "possible_post_angle",
    usedInPublishedContent: "used_in_published_content", notes: "notes",
    status: "status", syncedToSheets: "synced_to_sheets",
    sheetsRowNumber: "sheets_row_number",
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in data) {
      fields.push(`${col} = ?`);
      let val = (data as Record<string, unknown>)[key];
      if (typeof val === "boolean") val = val ? 1 : 0;
      values.push(val);
    }
  }

  if ("ownershipNarrativeElements" in data) {
    fields.push("ownership_narrative_elements = ?");
    values.push(JSON.stringify(data.ownershipNarrativeElements));
  }

  if ("aiSuggestions" in data) {
    fields.push("ai_suggestions = ?");
    values.push(data.aiSuggestions ? JSON.stringify(data.aiSuggestions) : null);
  }

  fields.push("updated_at = ?");
  values.push(now);
  values.push(id);

  db.prepare(`UPDATE signals SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getSignalById(id);
}

export function findSimilarSignals(brand: string, excerpt: string, excludeId?: string): Signal[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM signals WHERE brand = ? AND status != 'skipped' AND id != ? ORDER BY created_at DESC LIMIT 20"
    )
    .all(brand, excludeId || "") as Record<string, unknown>[];
  const signals = rows.map(rowToSignal);
  const words = new Set(excerpt.toLowerCase().split(/\s+/).filter((w) => w.length > 4));
  return signals.filter((s) => {
    const sWords = new Set(s.exactExcerpt.toLowerCase().split(/\s+/).filter((w) => w.length > 4));
    const intersection = [...words].filter((w) => sWords.has(w));
    return intersection.length / Math.max(words.size, 1) > 0.4;
  });
}

// ──────────────── Health Checks ────────────────

function rowToHealthCheck(row: Record<string, unknown>): HealthCheck {
  return {
    id: row.id as string,
    checkName: row.check_name as string,
    checkType: row.check_type as HealthCheck["checkType"],
    status: row.status as HealthCheck["status"],
    lastRun: row.last_run as string | undefined,
    nextRun: row.next_run as string | undefined,
    errorMessage: row.error_message as string | undefined,
    metrics: JSON.parse((row.metrics as string) || "{}"),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function getAllHealthChecks(): HealthCheck[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM health_checks ORDER BY check_type, check_name").all() as Record<string, unknown>[];
  return rows.map(rowToHealthCheck);
}

export function upsertHealthCheck(data: Omit<HealthCheck, "id" | "createdAt" | "updatedAt">): HealthCheck {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = db.prepare("SELECT id FROM health_checks WHERE check_name = ?").get(data.checkName) as { id: string } | undefined;
  const id = existing?.id || uuidv4();

  db.prepare(`
    INSERT INTO health_checks (id, check_name, check_type, status, last_run, next_run, error_message, metrics, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(check_name) DO UPDATE SET
      check_type = excluded.check_type,
      status = excluded.status,
      last_run = excluded.last_run,
      next_run = excluded.next_run,
      error_message = excluded.error_message,
      metrics = excluded.metrics,
      updated_at = excluded.updated_at
  `).run(
    id, data.checkName, data.checkType, data.status,
    data.lastRun || null, data.nextRun || null, data.errorMessage || null,
    JSON.stringify(data.metrics), now, now
  );

  return rowToHealthCheck(
    db.prepare("SELECT * FROM health_checks WHERE check_name = ?").get(data.checkName) as Record<string, unknown>
  );
}

// ──────────────── Analytics ────────────────

export function getWeeklyAnalytics(week?: number): WeeklyAnalytics | null {
  const db = getDb();
  const row = week
    ? (db.prepare("SELECT * FROM analytics WHERE week = ?").get(week) as Record<string, unknown> | undefined)
    : (db.prepare("SELECT * FROM analytics ORDER BY week DESC LIMIT 1").get() as Record<string, unknown> | undefined);
  if (!row) return null;
  return {
    week: row.week as number,
    signalCount: row.signal_count as number,
    bySource: JSON.parse(row.by_source as string),
    byBrand: JSON.parse(row.by_brand as string),
    byOwnershipElement: JSON.parse(row.by_ownership_element as string),
    patternsDetected: JSON.parse(row.patterns_detected as string),
    duplicateRate: row.duplicate_rate as number,
    contentAngleSuggestions: JSON.parse(row.content_angle_suggestions as string),
    generatedAt: row.generated_at as string,
  };
}

export function upsertAnalytics(data: WeeklyAnalytics): void {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO analytics (id, week, signal_count, by_source, by_brand, by_ownership_element, patterns_detected, duplicate_rate, content_angle_suggestions, generated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(week) DO UPDATE SET
      signal_count = excluded.signal_count,
      by_source = excluded.by_source,
      by_brand = excluded.by_brand,
      by_ownership_element = excluded.by_ownership_element,
      patterns_detected = excluded.patterns_detected,
      duplicate_rate = excluded.duplicate_rate,
      content_angle_suggestions = excluded.content_angle_suggestions,
      generated_at = excluded.generated_at
  `).run(
    id, data.week, data.signalCount,
    JSON.stringify(data.bySource), JSON.stringify(data.byBrand),
    JSON.stringify(data.byOwnershipElement), JSON.stringify(data.patternsDetected),
    data.duplicateRate, JSON.stringify(data.contentAngleSuggestions), data.generatedAt
  );
}

// ──────────────── User Config ────────────────

export function getUserConfig(userId: string): UserConfig | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM user_config WHERE user_id = ?").get(userId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    userId: row.user_id as string,
    googleSheetsId: row.google_sheets_id as string | undefined,
    googleDriveFolderId: row.google_drive_folder_id as string | undefined,
    emailAlertsAddress: row.email_alerts_address as string | undefined,
    brandsToMonitor: JSON.parse(row.brands_to_monitor as string),
  };
}

export function upsertUserConfig(data: UserConfig): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO user_config (user_id, google_sheets_id, google_drive_folder_id, email_alerts_address, brands_to_monitor, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      google_sheets_id = excluded.google_sheets_id,
      google_drive_folder_id = excluded.google_drive_folder_id,
      email_alerts_address = excluded.email_alerts_address,
      brands_to_monitor = excluded.brands_to_monitor,
      updated_at = excluded.updated_at
  `).run(
    data.userId, data.googleSheetsId || null, data.googleDriveFolderId || null,
    data.emailAlertsAddress || null, JSON.stringify(data.brandsToMonitor), now, now
  );
}

// ──────────────── Helpers ────────────────

export function getCurrentWeek(): number {
  const projectStart = new Date("2026-05-22");
  const now = new Date();
  const diffMs = now.getTime() - projectStart.getTime();
  return Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
}

export function getSignalStats() {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) as n FROM signals").get() as { n: number }).n;
  const pending = (db.prepare("SELECT COUNT(*) as n FROM signals WHERE status = 'pending'").get() as { n: number }).n;
  const approved = (db.prepare("SELECT COUNT(*) as n FROM signals WHERE status = 'approved'").get() as { n: number }).n;
  const thisWeek = (db.prepare("SELECT COUNT(*) as n FROM signals WHERE week = ? AND status = 'approved'").get(getCurrentWeek()) as { n: number }).n;
  return { total, pending, approved, thisWeek };
}
