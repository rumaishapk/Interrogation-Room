import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth/player-session";
import { safeNextPath } from "@/lib/auth/next-path";
import { login, signup } from "@/app/account/actions";
import AccountForm from "./AccountForm";

type Props = {
  mode: "login" | "signup";
  // From the URL, e.g. /login?next=/game/blackwood-001
  searchParams: Promise<{ next?: string | string[] }>;
};

// The shared page layout for /login and /signup.
export default function AccountPage({ mode, searchParams }: Props) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
      <p className="text-sm uppercase tracking-[0.35em] text-red-400">Interrogation Room</p>
      <h1 className="mt-4 text-3xl font-bold">{mode === "signup" ? "Create your detective account" : "Log in"}</h1>
      <Suspense fallback={<p className="mt-8 text-slate-500">Loading…</p>}>
        <FormOrRedirect mode={mode} searchParams={searchParams} />
      </Suspense>
      <Link href="/" className="mt-8 text-sm text-slate-500 hover:text-slate-300">
        ← Back to the game
      </Link>
    </main>
  );
}

async function FormOrRedirect({ mode, searchParams }: Props) {
  const next = safeNextPath((await searchParams).next);
  // Already logged in? Skip the form.
  if (await getCurrentPlayer()) redirect(next);
  return (
    <>
      {next.startsWith("/game/") && (
        <p className="mt-4 text-sm text-slate-400">Log in or sign up to start this investigation.</p>
      )}
      <AccountForm mode={mode} action={mode === "signup" ? signup : login} next={next} />
    </>
  );
}
