"use client"; // Error boundaries must be Client Components

import PaperCard from "@/components/ui/PaperCard";
import Stamp from "@/components/ui/Stamp";
import { brassButton } from "@/components/ui/buttons";

// Shown instead of any page under app/ that throws, e.g. when PostgreSQL is down.
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="desk flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center">
      <PaperCard fastener="pin" tilt={-1} className="w-full max-w-lg px-8 pb-8 pt-10">
        <Stamp tone="red" rotate={-6}>Records unavailable</Stamp>
        <h1 className="mt-5 font-display text-3xl font-bold text-ink-900">The case files are locked away</h1>
        <p className="mt-4 font-type text-sm leading-7 text-ink-700">
          We couldn&apos;t open this page. This is usually temporary, so please try again.
        </p>
        <button onClick={() => retry()} className={`${brassButton} mt-8`}>
          Try again
        </button>
      </PaperCard>
    </main>
  );
}
