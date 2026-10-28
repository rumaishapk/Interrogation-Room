"use client"; // Error boundaries must be Client Components

// Shown instead of any page under app/ that throws, e.g. when PostgreSQL is down.
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
      <p className="text-sm uppercase tracking-[0.35em] text-red-400">Something went wrong</p>
      <h1 className="mt-4 text-3xl font-bold">The case files are locked away</h1>
      <p className="mt-4 max-w-md text-slate-400">
        We couldn&apos;t load this page. This is usually temporary, so please try again.
      </p>
      <button
        onClick={() => retry()}
        className="mt-8 rounded-lg bg-red-600 px-6 py-3 font-semibold hover:bg-red-500"
      >
        Try again
      </button>
    </main>
  );
}
