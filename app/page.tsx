import Link from "next/link";
import PlayerNav from "@/components/account/PlayerNav";
import PaperCard from "@/components/ui/PaperCard";
import Plaque from "@/components/ui/Plaque";
import PoliceTape from "@/components/ui/PoliceTape";
import Stamp from "@/components/ui/Stamp";
import { brassButton } from "@/components/ui/buttons";

export default function HomePage() {
  return (
    <main className="desk relative flex min-h-screen flex-col overflow-hidden px-4 py-6 sm:px-6">
      {/* The lamp's pool of light, gently flickering. */}
      <div
        aria-hidden="true"
        className="animate-lamp pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgb(242_196_109/0.20),transparent_65%)]"
      />
      {/* A moonlit window in the corner. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-24 hidden h-44 w-36 border-4 border-walnut-700 bg-[radial-gradient(circle_at_70%_25%,#f3e7cc_0_10px,rgb(242_196_109/0.25)_11px,transparent_40px),linear-gradient(#0e1726,#1a2438)] shadow-[0_0_30px_rgb(0_0_0/0.6)] lg:block"
      >
        <div className="absolute inset-x-0 top-1/2 h-1 bg-walnut-700" />
        <div className="absolute inset-y-0 left-1/2 w-1 bg-walnut-700" />
      </div>

      <div className="relative z-10">
        <PlayerNav />
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center py-12 text-center">
        <p className="font-type text-xs uppercase tracking-[0.45em] text-brass-300">
          Homicide Division · Case Files
        </p>

        <Plaque className="mt-6">
          <h1 className="font-display text-4xl font-black uppercase tracking-wide text-ink-900 sm:text-6xl md:text-7xl">
            Interrogation <span className="text-brass-700">Room</span>
          </h1>
        </Plaque>

        <PaperCard tilt={-1.5} fastener="pin" className="mt-10 max-w-lg px-8 pb-7 pt-8">
          <p className="font-type text-base leading-7 text-ink-900 sm:text-lg">
            Every suspect has a secret.
            <br />
            Every clue tells a story.
            <br />
            Can you discover the truth?
          </p>
          <div className="mt-5 text-right">
            <Stamp tone="red" rotate={-8}>
              Confidential
            </Stamp>
          </div>
        </PaperCard>

        <Link href="/cases" className={`${brassButton} mt-12 px-10 py-4 text-xl`}>
          Start Investigation
        </Link>
        <p className="mt-4 font-type text-xs text-paper-300/70">
          Question suspects · Examine evidence · Name the killer
        </p>
      </section>

      {/* Police tape across the bottom corner. */}
      <PoliceTape className="absolute -bottom-1 -left-[10%] w-[130%] -rotate-3 sm:-rotate-2" />
    </main>
  );
}
