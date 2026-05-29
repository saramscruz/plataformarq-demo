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

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function SignalCard({ signal }: { signal: Signal }) {
  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5 flex-shrink-0">{SOURCE_ICONS[signal.sourceType] || "📌"}</span>
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BRAND_COLORS[signal.brand] || "bg-gray-100 text-gray-700"}`}>
              {signal.brand}
            </span>
            <span className="text-xs text-gray-500">{signal.sourceType}</span>
            <span className="text-xs text-gray-400">{timeAgo(signal.createdAt)}</span>
            {signal.aiSuggestions && (
              <span className="text-xs text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                AI: Type {signal.aiSuggestions.signalType} · {signal.aiSuggestions.primaryNarrativeElement}
              </span>
            )}
          </div>

          {/* Excerpt preview */}
          <p className="text-sm text-gray-700 mt-1.5 line-clamp-2">
            {signal.signalSummary || signal.exactExcerpt}
          </p>

          {/* Confidence */}
          {signal.aiSuggestions && (
            <p className="text-xs text-gray-400 mt-1">
              Confidence: {signal.aiSuggestions.confidenceLevel} ·{" "}
              {Math.round(signal.aiSuggestions.signalTypeConfidence * 100)}% type confidence
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <Link
            href={`/signal/${signal.id}`}
            className="btn-primary text-xs"
          >
            Review →
          </Link>
        </div>
      </div>
    </div>
  );
}
