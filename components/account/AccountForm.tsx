"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AccountFormState } from "@/app/account/actions";

type Props = {
  mode: "login" | "signup";
  action: (state: AccountFormState, formData: FormData) => Promise<AccountFormState>;
};

// One form for both login and signup; only the wording and the action differ.
export default function AccountForm({ mode, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, {});
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="mt-8 w-full max-w-sm space-y-4 text-left">
      <label className="block text-sm">
        <span className="text-slate-400">Username</span>
        <input
          name="username"
          required
          autoFocus
          autoComplete="username"
          defaultValue={state.username}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-red-500"
        />
        {isSignup && <span className="mt-1 block text-xs text-slate-500">3–20 letters, numbers or _</span>}
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete={isSignup ? "new-password" : "current-password"}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-red-500"
        />
        {isSignup && <span className="mt-1 block text-xs text-slate-500">At least 8 characters</span>}
      </label>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-red-600 px-5 py-3 font-semibold hover:bg-red-500 disabled:opacity-40"
      >
        {isPending ? "Please wait…" : isSignup ? "Create account" : "Log in"}
      </button>

      <p className="text-center text-sm text-slate-400">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link href={isSignup ? "/login" : "/signup"} className="text-red-400">
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
