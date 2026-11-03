"use client";

import { useActionState } from "react";
import { chooseGoogleUsername } from "@/app/account/actions";
import { brassButton, paperInput } from "@/components/ui/buttons";

// The one-field form shown after a first-time Google sign-in.
export default function GoogleNameForm() {
  const [state, formAction, isPending] = useActionState(chooseGoogleUsername, {});

  return (
    <form action={formAction} className="space-y-4 text-left">
      <p className="font-body text-sm text-ink-700">
        Google confirmed who you are. Now choose the name other detectives will know you by.
      </p>
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
        <span className="mt-1 block font-type text-xs text-ink-500">3–20 letters, numbers or _</span>
      </label>

      {state.error && (
        <p role="alert" className="border-l-4 border-evidence-600 bg-evidence-600/10 px-3 py-2 font-type text-sm text-evidence-800">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={isPending} className={`${brassButton} w-full`}>
        {isPending ? "Please wait…" : "Start investigating"}
      </button>
    </form>
  );
}
