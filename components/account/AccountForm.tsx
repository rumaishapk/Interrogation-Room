"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AccountFormState } from "@/app/account/actions";
import { brassButton, paperInput } from "@/components/ui/buttons";

type Props = {
  mode: "login" | "signup";
  action: (state: AccountFormState, formData: FormData) => Promise<AccountFormState>;
  // Where to go after success, e.g. back to the case the player clicked.
  next: string;
};

// One form for both login and signup; only the wording and the action differ.
export default function AccountForm({ mode, action, next }: Props) {
  const [state, formAction, isPending] = useActionState(action, {});
  const isSignup = mode === "signup";
  // Keep ?next= when switching between login and signup.
  const query = next === "/cases" ? "" : `?next=${encodeURIComponent(next)}`;

  return (
    <form action={formAction} className="space-y-4 text-left">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="font-type text-xs uppercase tracking-widest text-ink-500">Detective name (username)</span>
        <input
          name="username"
          required
          autoFocus
          autoComplete="username"
          defaultValue={state.username}
          className={`mt-1 ${paperInput}`}
        />
        {isSignup && <span className="mt-1 block font-type text-xs text-ink-500">3–20 letters, numbers or _</span>}
      </label>
      <label className="block">
        <span className="font-type text-xs uppercase tracking-widest text-ink-500">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete={isSignup ? "new-password" : "current-password"}
          className={`mt-1 ${paperInput}`}
        />
        {isSignup && <span className="mt-1 block font-type text-xs text-ink-500">At least 8 characters</span>}
      </label>

      {state.error && (
        <p role="alert" className="border-l-4 border-evidence-600 bg-evidence-600/10 px-3 py-2 font-type text-sm text-evidence-800">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={isPending} className={`${brassButton} w-full`}>
        {isPending ? "Please wait…" : isSignup ? "Create account" : "Log in"}
      </button>

      <p className="text-center font-body text-sm text-ink-700">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link
          href={`${isSignup ? "/login" : "/signup"}${query}`}
          className="font-semibold text-evidence-600 underline decoration-evidence-600/40 underline-offset-4 hover:decoration-evidence-600"
        >
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
