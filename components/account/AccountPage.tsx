import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth/player-session";
import { login, signup } from "@/app/account/actions";
import AccountForm from "./AccountForm";

// The shared page layout for /login and /signup.
export default function AccountPage({ mode }: { mode: "login" | "signup" }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
      <p className="text-sm uppercase tracking-[0.35em] text-red-400">Interrogation Room</p>
      <h1 className="mt-4 text-3xl font-bold">{mode === "signup" ? "Create your detective account" : "Log in"}</h1>
      <Suspense fallback={<p className="mt-8 text-slate-500">Loading…</p>}>
        <FormOrRedirect mode={mode} />
      </Suspense>
      <Link href="/" className="mt-8 text-sm text-slate-500 hover:text-slate-300">
        ← Back to the game
      </Link>
    </main>
  );
}

// Already logged in? Skip the form.
async function FormOrRedirect({ mode }: { mode: "login" | "signup" }) {
  if (await getCurrentPlayer()) redirect("/cases");
  return <AccountForm mode={mode} action={mode === "signup" ? signup : login} />;
}
