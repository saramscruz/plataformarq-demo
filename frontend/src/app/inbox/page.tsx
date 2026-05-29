import { getPendingSignals, getAllSignals } from "@/lib/db/queries";
import { NavBar } from "@/components/ui/NavBar";
import { SignalCard } from "@/components/signals/SignalCard";
import Link from "next/link";
import type { Signal } from "@/lib/types";

const SOURCE_ICONS: Record<string, string> = {
  "Google Alert": "🔔",
  "Official App Page": "📄",
  "Sales/Marketing Page": "🛒",
  "App Store": "📱",
  "Changelog": "📝",
  "LinkedIn": "💼",
};

const BRAND_COLORS: Record<string, string> = {
  "Mercedes-Benz": "bg-gray-100 text-gray-800",
  BMW: "bg-blue-100 text-blue-800",
  Audi: "bg-gray-100 text-gray-700",
  Volvo: "bg-blue-50 text-blue-700",
  Porsche: "bg-red-50 text-red-800",
};

export default function InboxPage() {
  const pending = getPendingSignals();
  const allSignals = getAllSignals();
  const approved = allSignals.filter((s) => s.status === "approved");
  const skipped = allSignals.filter((s) => s.status === "skipped" || s.status === "duplicate");

  return (
    <>
      <NavBar pendingCount={pending.length} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Signal Inbox</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {pending.length} pending · {approved.length} approved · {skipped.length} skipped/duplicates
            </p>
          </div>
          {pending.length === 0 && (
            <span className="text-sm text-emerald-600 font-medium">✅ All clear!</span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">📬</div>
            <h3 className="text-lg font-semibold text-gray-900">Inbox is empty</h3>
            <p className="text-gray-500 text-sm mt-1">
              No pending signals to review. The system will notify you when new signals arrive.
            </p>
            <div className="mt-4 flex gap-2 justify-center">
              <Link href="/dashboard" className="btn-secondary">
                View Dashboard
              </Link>
              <Link href="/analytics" className="btn-secondary">
                View Analytics
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        )}

        {/* Approved signals list */}
        {approved.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Recently Approved ({approved.length})
            </h2>
            <div className="card divide-y divide-gray-50">
              {approved.slice(0, 10).map((signal) => (
                <Link
                  key={signal.id}
                  href={`/signal/${signal.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg">{SOURCE_ICONS[signal.sourceType] || "📌"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${BRAND_COLORS[signal.brand] || "bg-gray-100 text-gray-700"}`}>
                        {signal.brand}
                      </span>
                      <span className="text-xs text-gray-400">{signal.sourceType}</span>
                    </div>
                    <p className="text-sm text-gray-700 truncate mt-0.5">
                      {signal.signalSummary || signal.exactExcerpt}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{signal.dateCollected}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
