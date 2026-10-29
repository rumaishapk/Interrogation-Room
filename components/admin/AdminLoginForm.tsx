"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";

export default function AdminLoginForm() {
  // useActionState runs the Server Action on submit and gives back its result
  // (here, an error message) plus `isPending` while it runs.
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="mt-8 w-full max-w-sm space-y-4">
      <label className="block text-left text-sm">
        <span className="text-slate-400">Admin username</span>
        <input
          name="username"
          required
          autoFocus
          autoComplete="username"
          defaultValue={state.username}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-red-500"
        />
      </label>
      <label className="block text-left text-sm">
        <span className="text-slate-400">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-red-500"
        />
      </label>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-red-600 px-5 py-3 font-semibold hover:bg-red-500 disabled:opacity-40"
      >
        {isPending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
