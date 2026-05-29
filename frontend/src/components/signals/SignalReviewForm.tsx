"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Signal, NarrativeElement, SignalType, ConfidenceLevel } from "@/lib/types";
import { NARRATIVE_ELEMENTS, SIGNAL_TYPE_DESCRIPTIONS, BRANDS, SOURCE_TYPES } from "@/lib/types";

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  HIGH: "text-emerald-700 bg-emerald-50 border-emerald-200",
  MEDIUM: "text-amber-700 bg-amber-50 border-amber-200",
  LOW: "text-gray-600 bg-gray-50 border-gray-200",
};

interface SignalReviewFormProps {
  signal: Signal;
  possibleDuplicates: Signal[];
}

export function SignalReviewForm({ signal, possibleDuplicates }: SignalReviewFormProps) {
  const router = useRouter();
  const ai = signal.aiSuggestions;

  const [form, setForm] = useState({
    brand: signal.brand,
    sourceType: signal.sourceType,
    url: signal.url,
    exactExcerpt: signal.exactExcerpt,
    signalSummary: signal.signalSummary || ai?.signalSummary || "",
    signalType: signal.signalType || ai?.signalType || "A",
    ownershipNarrativeElements: signal.ownershipNarrativeElements.length > 0
      ? signal.ownershipNarrativeElements
      : ai ? [ai.primaryNarrativeElement] : [],
    productDesignChoice: signal.productDesignChoice || ai?.productDesignChoice || "",
    confidenceLevel: signal.confidenceLevel || ai?.confidenceLevel || "HIGH",
    limitation: signal.limitation || ai?.limitation || "",
    connectedToAlert: signal.connectedToAlert || "",
    possiblePostAngle: signal.possiblePostAngle || ai?.possiblePostAngle || "",
    notes: signal.notes || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleApprove() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/signals/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: signal.id, updates: form }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve");
      }
      setSuccess(true);
      setTimeout(() => router.push("/inbox"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve signal");
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    setLoading(true);
    try {
      await fetch("/api/signals/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: signal.id }),
      });
      router.push("/inbox");
    } catch {
      setError("Failed to skip");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkDuplicate(duplicateOfId?: string) {
    setLoading(true);
    try {
      await fetch("/api/signals/mark-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: signal.id, duplicateOfId }),
      });
      router.push("/inbox");
    } catch {
      setError("Failed to mark duplicate");
    } finally {
      setLoading(false);
    }
  }

  function toggleNarrativeElement(el: NarrativeElement) {
    setForm((prev) => ({
      ...prev,
      ownershipNarrativeElements: prev.ownershipNarrativeElements.includes(el)
        ? prev.ownershipNarrativeElements.filter((e) => e !== el)
        : [...prev.ownershipNarrativeElements, el],
    }));
  }

  if (success) {
    return (
      <div className="card p-12 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-lg font-semibold text-gray-900">Signal approved!</h3>
        <p className="text-gray-500 text-sm mt-1">Syncing to Google Sheets…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">✏️ Review & Edit Signal</h2>

        {/* Possible duplicates warning */}
        {possibleDuplicates.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-800">⚠️ Possible duplicates found:</p>
            {possibleDuplicates.map((d) => (
              <div key={d.id} className="mt-2 text-sm text-amber-700 flex items-center justify-between">
                <span className="truncate mr-2">{d.brand} · {d.sourceType} — {d.exactExcerpt.slice(0, 60)}…</span>
                <button
                  onClick={() => handleMarkDuplicate(d.id)}
                  className="flex-shrink-0 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded hover:bg-amber-200"
                >
                  Mark Duplicate
                </button>
              </div>
            ))}
            <button
              onClick={() => handleMarkDuplicate()}
              className="mt-2 text-xs text-amber-600 underline"
            >
              Mark as duplicate (no reference)
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {/* Brand */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Brand *</label>
            <select
              value={form.brand}
              onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value as Signal["brand"] }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {BRANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>

          {/* Source Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Source Type *</label>
            <select
              value={form.sourceType}
              onChange={(e) => setForm((p) => ({ ...p, sourceType: e.target.value as Signal["sourceType"] }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {SOURCE_TYPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date Collected</label>
            <input
              type="date"
              value={signal.dateCollected}
              readOnly
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
            />
          </div>
        </div>

        {/* URL */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">URL *</label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
          />
          <a href={form.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline mt-0.5 inline-block">
            Open source ↗
          </a>
        </div>

        {/* Exact Excerpt */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-700">Exact Excerpt *</label>
            <span className="text-xs text-gray-400">Exact copy-paste — no paraphrasing</span>
          </div>
          <textarea
            value={form.exactExcerpt}
            onChange={(e) => setForm((p) => ({ ...p, exactExcerpt: e.target.value }))}
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono bg-gray-50"
          />
        </div>

        {/* Divider: AI Suggestions */}
        <div className="border-t border-gray-100 pt-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            🤖 AI Suggestions — review and edit
          </p>
        </div>

        {/* Signal Summary */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Signal Summary</label>
          <input
            type="text"
            value={form.signalSummary}
            onChange={(e) => setForm((p) => ({ ...p, signalSummary: e.target.value }))}
            placeholder="One-liner summary (max 15 words)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Signal Type */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Signal Type *</label>
          {ai && (
            <p className="text-xs text-brand-600 mb-1.5">
              ⭐ AI suggests: <strong>Type {ai.signalType}</strong> ({Math.round(ai.signalTypeConfidence * 100)}% confidence) — {ai.signalTypeReasoning}
            </p>
          )}
          <div className="grid grid-cols-5 gap-2">
            {(["A", "B", "C", "D", "E"] as SignalType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm((p) => ({ ...p, signalType: type }))}
                className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                  form.signalType === type
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="font-bold">Type {type}</div>
                <div className="text-xs mt-0.5 text-left hidden sm:block">
                  {SIGNAL_TYPE_DESCRIPTIONS[type].split("—")[0].trim()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Narrative Elements */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Ownership Narrative Element(s) *</label>
          {ai && (
            <p className="text-xs text-brand-600 mb-1.5">
              ⭐ AI suggests: <strong>{ai.primaryNarrativeElement}</strong>
              {ai.secondaryNarrativeElement && ` + ${ai.secondaryNarrativeElement}`} — {ai.narrativeReasoning}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {NARRATIVE_ELEMENTS.map((el) => (
              <button
                key={el}
                type="button"
                onClick={() => toggleNarrativeElement(el)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  form.ownershipNarrativeElements.includes(el)
                    ? "border-brand-500 bg-brand-100 text-brand-800"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {form.ownershipNarrativeElements.includes(el) ? "☑" : "☐"} {el}
              </button>
            ))}
          </div>
        </div>

        {/* Product Design Choice */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Product Design Choice</label>
          <textarea
            value={form.productDesignChoice}
            onChange={(e) => setForm((p) => ({ ...p, productDesignChoice: e.target.value }))}
            rows={2}
            placeholder="What does this signal reveal about the brand's product strategy?"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Confidence Level */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Confidence Level *</label>
          {ai && (
            <p className="text-xs text-brand-600 mb-1.5">
              ⭐ AI suggests: <strong>{ai.confidenceLevel}</strong> — {ai.confidenceReasoning}
            </p>
          )}
          <div className="flex gap-2">
            {(["HIGH", "MEDIUM", "LOW"] as ConfidenceLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setForm((p) => ({ ...p, confidenceLevel: level }))}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  form.confidenceLevel === level
                    ? CONFIDENCE_COLORS[level] + " border"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Limitation */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Limitation *</label>
          <textarea
            value={form.limitation}
            onChange={(e) => setForm((p) => ({ ...p, limitation: e.target.value }))}
            rows={2}
            placeholder="What does this signal NOT prove? What context is missing?"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Connected to Alert */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Connected to Alert</label>
          <input
            type="text"
            value={form.connectedToAlert}
            onChange={(e) => setForm((p) => ({ ...p, connectedToAlert: e.target.value }))}
            placeholder="e.g. Stellantis-Snapdragon partnership (optional)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Post Angle */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Possible Post Angle</label>
          <input
            type="text"
            value={form.possiblePostAngle}
            onChange={(e) => setForm((p) => ({ ...p, possiblePostAngle: e.target.value }))}
            placeholder="Blog post angle suggestion"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            rows={2}
            placeholder="Any additional notes (optional)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
          <button
            onClick={handleApprove}
            disabled={loading || signal.status !== "pending"}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving…" : "✅ Approve & Add to Signal Log"}
          </button>
          <button
            onClick={handleSkip}
            disabled={loading}
            className="btn-secondary"
          >
            Skip
          </button>
          <button
            onClick={() => handleMarkDuplicate()}
            disabled={loading}
            className="btn-danger"
          >
            Mark Duplicate
          </button>
        </div>
      </div>
    </div>
  );
}
