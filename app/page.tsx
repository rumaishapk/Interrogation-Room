import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-white">
      <p className="mb-4 text-sm uppercase tracking-[0.35em] text-red-400">
        A murder mystery game
      </p>

      <h1 className="text-center text-5xl font-bold md:text-7xl">
        Interrogation Room
      </h1>

      <p className="mt-6 max-w-xl text-center text-slate-300">
        Every suspect has a secret. Every clue tells a story.
        Can you discover the truth?
      </p>

      <Link
        href="/game"
        className="mt-10 rounded-lg bg-red-600 px-8 py-4 font-semibold transition hover:bg-red-500"
      >
        Start Investigation
      </Link>
    </main>
  );
}
