import { Suspense } from "react";
import Link from "next/link";
import { getCurrentPlayer } from "@/lib/auth/player-session";
import { logout } from "@/app/account/actions";

// "Logged in as … · Log out", or "Log in · Sign up" for guests.
// Wrapped in Suspense because it reads a cookie: the rest of the page doesn't wait for it.
export default function PlayerNav() {
  return (
    <div className="flex min-h-9 items-center justify-end gap-4 text-sm">
      <Suspense fallback={null}>
        <PlayerStatus />
      </Suspense>
    </div>
  );
}

async function PlayerStatus() {
  const player = await getCurrentPlayer();

  if (!player) {
    return (
      <>
        <Link href="/login" className="text-slate-300 hover:text-white">Log in</Link>
        <Link href="/signup" className="rounded-lg bg-red-600 px-4 py-2 font-semibold hover:bg-red-500">
          Sign up
        </Link>
      </>
    );
  }

  return (
    <>
      <span className="text-slate-400">
        Logged in as <span className="font-semibold text-white">{player.username}</span>
      </span>
      <form action={logout}>
        <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700">
          Log out
        </button>
      </form>
    </>
  );
}
