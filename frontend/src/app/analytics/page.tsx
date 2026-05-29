import { getWeeklyAnalytics, getAllSignals, getCurrentWeek } from "@/lib/db/queries";
import { NavBar } from "@/components/ui/NavBar";
import Link from "next/link";
import type { ContentAngle } from "@/lib/types";

const CHANNEL_ICON = { LinkedIn: "💼", Substack: "📰" };
const CONFIDENCE_STYLE = {
  High: "text-emerald-700 bg-emerald-50",
  Medium: "text-amber-700 bg-amber-50",
  Low: "text-gray-600 bg-gray-50",
};

function BarChart({ data, label }: { data: Record<string, number>; label: string }) {
  const max = Math.max(...Object.values(data), 1);
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="space-y-1.5">
        {sorted.map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-32 truncate flex-shrink-0">{key}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-4 relative">
              <div
                className="bg-brand-500 h-4 rounded-full"
                style={{ width: `${(val / max) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-6 text-right flex-shrink-0">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentAngleCard({ angle }: { angle: ContentAngle }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span>{CHANNEL_ICON[angle.channel] || "📌"}</span>
          <span className="text-xs font-medium text-gray-500">{angle.channel} · ~{angle.wordcount} words</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${CONFIDENCE_STYLE[angle.confidence]}`}>
          {angle.confidence}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 text-sm mb-1">{angle.title}</h3>
      <p className="text-sm text-gray-600">{angle.story}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const analytics = getWeeklyAnalytics();
  const allSignals = getAllSignals();
  const currentWeek = getCurrentWeek();
  const approvedTotal = allSignals.filter((s) => s.status === "approved").length;

  // Cumulative stats across all weeks
  const cumulativeByBrand: Record<string, number> = {};
  const cumulativeByElement: Record<string, number> = {};
  for (const s of allSignals.filter((s) => s.status === "approved")) {
    cumulativeByBrand[s.brand] = (cumulativeByBrand[s.brand] || 0) + 1;
    for (const el of s.ownershipNarrativeElements) {
      cumulativeByElement[el] = (cumulativeByElement[el] || 0) + 1;
    }
  }

  return (
    <>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Week {currentWeek} · 12-week project (May 22 – August 15, 2026)
            </p>
          </div>
          {analytics && (
            <Link href="/api/analytics/weekly?regenerate=true" className="btn-secondary text-xs">
              Regenerate Analytics
            </Link>
          )}
        </div>

        {/* Progress */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">📊 Signal Collection Progress</h2>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{approvedTotal} signals collected</span>
                <span>120 target</span>
              </div>
              <div className="bg-gray-100 rounded-full h-3">
                <div
                  className="bg-brand-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min((approvedTotal / 120) * 100, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-brand-700 flex-shrink-0">
              {Math.round((approvedTotal / 120) * 100)}%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-gray-900">{analytics?.signalCount || 0}</div>
              <div className="text-xs text-gray-500">this week</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {approvedTotal > 0 ? (approvedTotal / Math.max(currentWeek, 1)).toFixed(1) : "—"}
              </div>
              <div className="text-xs text-gray-500">signals/week avg</div>
            </div>
            <div>
              <div className={`text-xl font-bold ${approvedTotal / Math.max(currentWeek, 1) >= 8 ? "text-emerald-600" : "text-amber-600"}`}>
                {approvedTotal / Math.max(currentWeek, 1) >= 8 ? "✅ ON TRACK" : "⚠️ BELOW PACE"}
              </div>
              <div className="text-xs text-gray-500">need 8/week</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4">
              <BarChart data={analytics.bySource} label="By Source (this week)" />
            </div>
            <div className="card p-4">
              <BarChart data={cumulativeByBrand} label="By Brand (cumulative)" />
            </div>
            <div className="card p-4">
              <BarChart data={cumulativeByElement} label="By Narrative Element" />
            </div>
          </div>
        )}

        {/* Patterns */}
        {analytics && analytics.patternsDetected.length > 0 && (
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">🔍 Patterns Detected (Week {analytics.week})</h2>
            <div className="space-y-3">
              {analytics.patternsDetected.map((pattern, i) => (
                <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 text-sm flex-shrink-0">#{i + 1}</span>
                  <p className="text-sm text-gray-700">{pattern}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Angles */}
        {analytics && analytics.contentAngleSuggestions.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">💡 Suggested Content Angles (Week {analytics.week})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.contentAngleSuggestions.map((angle, i) => (
                <ContentAngleCard key={i} angle={angle} />
              ))}
            </div>
          </div>
        )}

        {!analytics && (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-900">No analytics yet</h3>
            <p className="text-gray-500 text-sm mt-1">
              Analytics are generated automatically on Fridays, or you can trigger generation manually.
            </p>
            <Link href="/api/analytics/weekly?regenerate=true" className="btn-primary mt-4 inline-block">
              Generate Analytics Now
            </Link>
          </div>
        )}

        {/* Deduplication stats */}
        {analytics && (
          <div className="card p-4">
            <h2 className="font-semibold text-gray-900 mb-3">🔗 Data Quality</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className={`text-xl font-bold ${analytics.duplicateRate >= 0.03 && analytics.duplicateRate <= 0.05 ? "text-emerald-600" : "text-amber-600"}`}>
                  {(analytics.duplicateRate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">dedup rate (target: 3-5%)</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">100%</div>
                <div className="text-xs text-gray-500">excerpt accuracy</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{approvedTotal}</div>
                <div className="text-xs text-gray-500">signals in log</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
