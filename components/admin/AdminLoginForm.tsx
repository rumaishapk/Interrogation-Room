"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";
import { brassButton, paperInput } from "@/components/ui/buttons";

export default function AdminLoginForm() {
  // useActionState runs the Server Action on submit and gives back its result
  // (here, an error message) plus `isPending` while it runs.
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <label className="block">
        <span className="font-type text-xs uppercase tracking-widest text-ink-500">Admin username</span>
        <input
          name="username"
          required
          autoFocus
          autoComplete="username"
          defaultValue={state.username}
          className={`mt-1 ${paperInput}`}
        />
      </label>
      <label className="block">
        <span className="font-type text-xs uppercase tracking-widest text-ink-500">Password</span>
        <input type="password" name="password" required autoComplete="current-password" className={`mt-1 ${paperInput}`} />
      </label>
      {state.error && (
        <p role="alert" className="border-l-4 border-evidence-600 bg-evidence-600/10 px-3 py-2 font-type text-sm text-evidence-800">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={isPending} className={`${brassButton} w-full`}>
        {isPending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
