import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DATABASE_FILE || path.join(process.cwd(), "data", "signals.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      date_collected TEXT NOT NULL,
      week INTEGER NOT NULL DEFAULT 1,
      brand TEXT NOT NULL,
      source_type TEXT NOT NULL,
      url TEXT NOT NULL,
      date_source_published TEXT,
      market TEXT,
      exact_excerpt TEXT NOT NULL,
      promise_vs_delivery TEXT,
      signal_summary TEXT,
      signal_type TEXT,
      signal_type_confidence REAL,
      ownership_narrative_elements TEXT NOT NULL DEFAULT '[]',
      product_design_choice TEXT,
      confidence_level TEXT,
      limitation TEXT,
      connected_to_alert TEXT,
      possible_post_angle TEXT,
      used_in_published_content TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      is_duplicate INTEGER NOT NULL DEFAULT 0,
      duplicate_of_signal_id TEXT,
      ai_suggestions TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_to_sheets INTEGER NOT NULL DEFAULT 0,
      sheets_row_number INTEGER
    );

    CREATE TABLE IF NOT EXISTS analytics (
      id TEXT PRIMARY KEY,
      week INTEGER NOT NULL UNIQUE,
      signal_count INTEGER NOT NULL DEFAULT 0,
      by_source TEXT NOT NULL DEFAULT '{}',
      by_brand TEXT NOT NULL DEFAULT '{}',
      by_ownership_element TEXT NOT NULL DEFAULT '{}',
      patterns_detected TEXT NOT NULL DEFAULT '[]',
      duplicate_rate REAL NOT NULL DEFAULT 0,
      content_angle_suggestions TEXT NOT NULL DEFAULT '[]',
      generated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_config (
      user_id TEXT PRIMARY KEY,
      google_sheets_id TEXT,
      google_drive_folder_id TEXT,
      email_alerts_address TEXT,
      brands_to_monitor TEXT NOT NULL DEFAULT '["Mercedes-Benz","BMW","Audi","Volvo","Porsche"]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS health_checks (
      id TEXT PRIMARY KEY,
      check_name TEXT NOT NULL UNIQUE,
      check_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unknown',
      last_run TEXT,
      next_run TEXT,
      error_message TEXT,
      metrics TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
    CREATE INDEX IF NOT EXISTS idx_signals_brand ON signals(brand);
    CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at);
    CREATE INDEX IF NOT EXISTS idx_signals_week ON signals(week);
  `);
}
