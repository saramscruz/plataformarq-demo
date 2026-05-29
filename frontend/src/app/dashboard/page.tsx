import { getSystemHealth } from "@/lib/health/checks";
import { getSignalStats, getCurrentWeek, getAllHealthChecks, getWeeklyAnalytics } from "@/lib/db/queries";
import { initializeHealthChecks } from "@/lib/health/checks";
import { NavBar } from "@/components/ui/NavBar";
import { StatusEmoji } from "@/components/ui/StatusDot";
import Link from "next/link";
import type { HealthCheck } from "@/lib/types";

function formatTimeSince(isoString?: string): string {
  if (!isoString) return "Never";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function CheckRow({ check }: { check: HealthCheck }) {
  const m = check.metrics as Record<string, unknown>;
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <StatusEmoji status={check.status} />
        <span className="text-sm text-gray-700">{check.checkName}</span>
      </div>
      <div className="text-right">
        <span className="text-sm text-gray-500">{getDisplayValue(check)}</span>
        {check.lastRun && (
          <span className="text-xs text-gray-400 ml-2">({formatTimeSince(check.lastRun)})</span>
        )}
      </div>
    </div>
  );
}

function getDisplayValue(check: HealthCheck): string {
  const m = check.metrics as Record<string, unknown>;
  switch (check.checkName) {
    case "Google Alerts Arrival":
      return m.lastAlertMinutesAgo !== undefined ? `Last: ${m.lastAlertMinutesAgo} min ago` : check.status === "unknown" ? "Not yet monitored" : "OK";
    case "App Store Monitoring":
    case "LinkedIn Monitoring":
    case "Official Pages Scraping":
      return m.lastChecked ? `Last: ${m.lastChecked}` : "Not yet run";
    case "Scraper Health":
      return m.successRate !== undefined ? `${m.successRate}% success rate` : "No data";
    case "Signal Type Accuracy":
    case "Narrative Element Accuracy":
      return m.accuracy !== undefined ? `${Math.round(m.accuracy as number)}% accurate` : "No data";
    case "Limitation Quality":
      return m.usedAsIs !== undefined ? `${Math.round(m.usedAsIs as number)}% used as-is` : "No data";
    case "Confidence Calibration":
      return m.accuracy !== undefined ? `${Math.round(m.accuracy as number)}% calibrated` : "No data";
    case "Excerpt Accuracy Sampler":
      return m.accuracy !== undefined ? `${Math.round(m.accuracy as number)}% accurate` : "No data";
    case "URL Validity":
      return m.validRate !== undefined ? `${Math.round(m.validRate as number)}% valid` : "Not yet run";
    case "Duplication Rate Monitor":
      return m.duplicateRate !== undefined ? `${(Number(m.duplicateRate) * 100).toFixed(1)}% dedup rate` : "No data";
    case "Google Sheets Sync":
      return m.successRate !== undefined ? `${Math.round(m.successRate as number)}% success` : "No syncs yet";
    case "Analytics Accuracy Validator":
      return m.accurate !== undefined ? (m.accurate ? "Numbers match ✓" : "Mismatch detected") : "Not yet run";
    case "Pattern Verification":
      return m.verified !== undefined ? `${m.verified}/${m.total} patterns verified` : "Not yet run";
    default:
      return check.status;
  }
}

const CHECK_TYPE_LABELS: Record<string, string> = {
  data_collection: "📡 Data Collection",
  ai_quality: "🤖 AI Quality",
  data_quality: "✓ Data Quality",
  sync: "🔄 Google Sheets Sync",
  analytics: "📈 Analytics",
};

export default function DashboardPage() {
  // Ensure health checks exist
  let checks = getAllHealthChecks();
  if (checks.length === 0) {
    initializeHealthChecks();
    checks = getAllHealthChecks();
  }

  const health = getSystemHealth();
  const stats = getSignalStats();
  const analytics = getWeeklyAnalytics();
  const pendingCount = stats.pending;

  const overallColor = {
    excellent: "text-emerald-600 bg-emerald-50",
    warning: "text-amber-600 bg-amber-50",
    critical: "text-red-600 bg-red-50",
    unknown: "text-gray-600 bg-gray-50",
  }[health.overallStatus];

  const overallEmoji = {
    excellent: "🟢",
    warning: "🟡",
    critical: "🔴",
    unknown: "⚪",
  }[health.overallStatus];

  // Group checks by type
  const checksByType: Record<string, HealthCheck[]> = {};
  for (const check of checks) {
    if (!checksByType[check.checkType]) checksByType[check.checkType] = [];
    checksByType[check.checkType].push(check);
  }

  const typeOrder = ["data_collection", "ai_quality", "data_quality", "sync", "analytics"];

  return (
    <>
      <NavBar pendingCount={pendingCount} />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Health Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Week {getCurrentWeek()} · Last checked {formatTimeSince(health.lastChecked)}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm ${overallColor}`}>
            <span>{overallEmoji}</span>
            <span>SYSTEM {health.overallStatus.toUpperCase()}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Signals", value: stats.total, sub: "collected" },
            { label: "This Week", value: stats.thisWeek, sub: "approved" },
            { label: "Pending Review", value: stats.pending, sub: "in inbox", highlight: stats.pending > 0 },
            { label: "Target Progress", value: `${Math.round((stats.approved / 120) * 100)}%`, sub: `${stats.approved}/120` },
          ].map((s) => (
            <div key={s.label} className={`card p-4 ${s.highlight ? "border-brand-200 bg-brand-50" : ""}`}>
              <div className={`text-2xl font-bold ${s.highlight ? "text-brand-700" : "text-gray-900"}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              <div className="text-xs text-gray-400">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Pending signals call-to-action */}
        {pendingCount > 0 && (
          <div className="card border-brand-200 bg-brand-50 p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-brand-900">
                {pendingCount} signal{pendingCount !== 1 ? "s" : ""} waiting for review
              </p>
              <p className="text-sm text-brand-700 mt-0.5">Review and approve signals to sync to Google Sheets</p>
            </div>
            <Link href="/inbox" className="btn-primary">
              Open Inbox →
            </Link>
          </div>
        )}

        {/* Health Checks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {typeOrder.map((type) => {
            const typeChecks = checksByType[type] || [];
            if (typeChecks.length === 0) return null;
            const failedCount = typeChecks.filter((c) => c.status === "failed").length;
            const warnCount = typeChecks.filter((c) => c.status === "warning").length;
            const headerStatus = failedCount > 0 ? "failed" : warnCount > 0 ? "warning" : "success";

            return (
              <div key={type} className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <StatusEmoji status={headerStatus} />
                  <h2 className="font-semibold text-gray-900 text-sm">{CHECK_TYPE_LABELS[type]}</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {typeChecks.map((check) => (
                    <CheckRow key={check.id} check={check} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Alerts section */}
        {health.checks.filter((c) => c.status === "failed" || c.status === "warning").length > 0 ? (
          <div className="card border-red-200 bg-red-50 p-4">
            <h3 className="font-semibold text-red-800 mb-2">🚨 Active Alerts</h3>
            {health.checks
              .filter((c) => c.status === "failed" || c.status === "warning")
              .map((c) => (
                <div key={c.name} className="flex items-center gap-2 text-sm text-red-700 py-1">
                  <StatusEmoji status={c.status} />
                  <span>{c.name}: {c.displayValue}</span>
                </div>
              ))}
          </div>
        ) : (
          <div className="card border-emerald-200 bg-emerald-50 p-4">
            <p className="text-emerald-700 text-sm font-medium">
              🟢 No active alerts — all systems operating normally
            </p>
          </div>
        )}

        {/* Weekly summary preview */}
        {analytics && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">📈 Week {analytics.week} Summary</h2>
              <Link href="/analytics" className="text-sm text-brand-600 hover:text-brand-700">
                View full analytics →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-gray-900">{analytics.signalCount}</div>
                <div className="text-xs text-gray-500">signals this week</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">
                  {(analytics.duplicateRate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">dedup rate</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">
                  {analytics.contentAngleSuggestions.length}
                </div>
                <div className="text-xs text-gray-500">content angles</div>
              </div>
            </div>
            {analytics.patternsDetected.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-1">Top pattern:</p>
                <p className="text-sm text-gray-700 line-clamp-2">{analytics.patternsDetected[0]}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
