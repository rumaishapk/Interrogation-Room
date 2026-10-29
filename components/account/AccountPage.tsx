import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth/player-session";
import { safeNextPath } from "@/lib/auth/next-path";
import { login, signup } from "@/app/account/actions";
import PaperCard from "@/components/ui/PaperCard";
import Silhouette from "@/components/ui/Silhouette";
import Stamp from "@/components/ui/Stamp";
import AccountForm from "./AccountForm";

type Props = {
  mode: "login" | "signup";
  // From the URL, e.g. /login?next=/game/blackwood-001
  searchParams: Promise<{ next?: string | string[] }>;
};

// The shared page for /login and /signup: a detective's ID card on the desk.
export default function AccountPage({ mode, searchParams }: Props) {
  const isSignup = mode === "signup";
  return (
    <main className="desk flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <p className="font-type text-xs uppercase tracking-[0.45em] text-brass-300">Homicide Division</p>
      <h1 className="mt-3 text-center font-display text-3xl font-bold text-paper-100 sm:text-4xl">
        {isSignup ? "Register as a Detective" : "Detective Sign-In"}
      </h1>

      <PaperCard tilt={-0.8} fastener="tape" className="mt-8 w-full max-w-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between border-b-2 border-ink-900/70 pb-3">
          <span className="font-display text-lg font-black uppercase tracking-widest text-ink-900">Detective Bureau</span>
          <span className="font-type text-xs uppercase tracking-widest text-ink-500">
            {isSignup ? "Application form" : "Identification card"}
          </span>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-[150px_1fr]">
          {/* The ID photo */}
          <div className="mx-auto w-[130px] sm:mx-0 sm:w-full">
            <div className="border-4 border-paper-50 shadow-md">
              <Silhouette className="aspect-[5/6] w-full" />
            </div>
            <div className="mt-3 text-center">
              <Stamp tone={isSignup ? "ink" : "red"} rotate={-8}>
                {isSignup ? "Pending" : "Authorised"}
              </Stamp>
            </div>
          </div>

          <Suspense fallback={<p className="font-type text-ink-500">Checking the files…</p>}>
            <FormOrRedirect mode={mode} searchParams={searchParams} />
          </Suspense>
        </div>
      </PaperCard>

      <Link href="/" className="mt-8 font-type text-sm uppercase tracking-wider text-paper-300 hover:text-lamp-300">
        ← Back to the office
      </Link>
    </main>
  );
}

async function FormOrRedirect({ mode, searchParams }: Props) {
  const next = safeNextPath((await searchParams).next);
  // Already logged in? Skip the form.
  if (await getCurrentPlayer()) redirect(next);
  return (
    <div>
      {next.startsWith("/game/") && (
        <p className="mb-4 border-l-4 border-evidence-600 bg-evidence-600/10 px-3 py-2 font-type text-sm text-ink-900">
          Log in or sign up to start this investigation.
        </p>
      )}
      <AccountForm mode={mode} action={mode === "signup" ? signup : login} next={next} />
    </div>
  );
}
