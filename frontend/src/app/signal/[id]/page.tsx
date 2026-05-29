import { notFound } from "next/navigation";
import { getSignalById, findSimilarSignals } from "@/lib/db/queries";
import { NavBar } from "@/components/ui/NavBar";
import { SignalReviewForm } from "@/components/signals/SignalReviewForm";
import Link from "next/link";

export default function SignalReviewPage({ params }: { params: { id: string } }) {
  const signal = getSignalById(params.id);
  if (!signal) notFound();

  const similarSignals = findSimilarSignals(signal.brand, signal.exactExcerpt, signal.id);
  const possibleDuplicates = similarSignals.slice(0, 3);

  return (
    <>
      <NavBar />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/inbox" className="hover:text-brand-600">← Inbox</Link>
          <span>/</span>
          <span>Review Signal</span>
        </div>

        {signal.status !== "pending" && (
          <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${
            signal.status === "approved"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-gray-50 text-gray-600 border border-gray-200"
          }`}>
            This signal has already been {signal.status}.
          </div>
        )}

        <SignalReviewForm
          signal={signal}
          possibleDuplicates={possibleDuplicates}
        />
      </main>
    </>
  );
}
