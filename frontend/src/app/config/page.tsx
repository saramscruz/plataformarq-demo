"use client";

import { useState, useEffect } from "react";
import { NavBar } from "@/components/ui/NavBar";
import type { UserConfig } from "@/lib/types";

type EnvStatus = Record<string, boolean>;

export default function ConfigPage() {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [envStatus, setEnvStatus] = useState<EnvStatus>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setConfig(d.config));
    fetch("/api/config/env-status")
      .then((r) => r.json())
      .then((d) => setEnvStatus(d));
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setConfig(data.config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleSeedData() {
    setRunning(true);
    try {
      await fetch("/api/collect/seed", { method: "POST" });
      window.location.href = "/inbox";
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Google Sheets Integration</h2>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Signal Log Sheet ID</label>
            <input
              type="text"
              value={config?.googleSheetsId || ""}
              onChange={(e) => setConfig((c) => c ? { ...c, googleSheetsId: e.target.value } : c)}
              placeholder="From Google Sheets URL: /d/SHEET_ID/edit"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Alert Email Address</label>
            <input
              type="email"
              value={config?.emailAlertsAddress || ""}
              onChange={(e) => setConfig((c) => c ? { ...c, emailAlertsAddress: e.target.value } : c)}
              placeholder="saramscruz@gmail.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saved ? "✅ Saved!" : saving ? "Saving…" : "Save Configuration"}
          </button>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Environment Variables</h2>
          <p className="text-sm text-gray-600 mb-3">
            Copy <code className="bg-gray-100 px-1 rounded">.env.example</code> to <code className="bg-gray-100 px-1 rounded">.env.local</code> and fill in:
          </p>
          <div className="space-y-1.5 text-sm font-mono bg-gray-50 rounded-lg p-3">
            {[
              "ANTHROPIC_API_KEY",
              "GOOGLE_SERVICE_ACCOUNT_KEY",
              "GOOGLE_SHEETS_SIGNAL_LOG_ID",
              "GMAIL_APP_PASSWORD",
            ].map((key) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">{key}</span>
                <span>{envStatus[key] ? "✅ Set" : "❌ Missing"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Demo Data</h2>
          <p className="text-sm text-gray-600 mb-3">
            Load realistic sample signals (9 signals across all 5 brands) to explore the platform.
          </p>
          <button
            onClick={handleSeedData}
            disabled={running}
            className="btn-secondary"
          >
            {running ? "Loading…" : "Load Demo Data"}
          </button>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Monitored Brands</h2>
          <div className="flex flex-wrap gap-2">
            {["Mercedes-Benz", "BMW", "Audi", "Volvo", "Porsche"].map((brand) => (
              <span key={brand} className="text-xs bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-1 rounded-full font-medium">
                ✓ {brand}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Brands are fixed for this 12-week project.</p>
        </div>
      </main>
    </>
  );
}
