import Link from "next/link";
import PaperCard from "@/components/ui/PaperCard";
import Stamp from "@/components/ui/Stamp";
import { brassButton } from "@/components/ui/buttons";

// Shown for unknown addresses, and when notFound() is called (e.g. a case that doesn't exist).
export default function NotFound() {
  return (
    <main className="desk flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center">
      <PaperCard fastener="pin" tilt={1} className="w-full max-w-lg px-8 pb-8 pt-10">
        <Stamp tone="ink" rotate={-5}>File not found · 404</Stamp>
        <h1 className="mt-5 font-display text-3xl font-bold text-ink-900">This file is missing from the archive</h1>
        <p className="mt-4 font-type text-sm leading-7 text-ink-700">
          The case you&apos;re looking for was never filed, or it has been taken off the shelves.
        </p>
        <Link href="/cases" className={`${brassButton} mt-8`}>
          Back to the case files
        </Link>
      </PaperCard>
    </main>
  );
}
