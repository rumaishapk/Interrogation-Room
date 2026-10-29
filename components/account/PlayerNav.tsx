import { Suspense } from "react";
import Link from "next/link";
import { getCurrentPlayer } from "@/lib/auth/player-session";
import { logout } from "@/app/account/actions";
import { ghostButton } from "@/components/ui/buttons";

// "Detective rishad · Log out", or "Log in · Sign up" for guests.
// Wrapped in Suspense because it reads a cookie: the rest of the page doesn't wait for it.
export default function PlayerNav() {
  return (
    <div className="flex min-h-10 flex-wrap items-center justify-end gap-3 text-sm">
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
        <Link href="/login" className="font-type uppercase tracking-wider text-paper-200 hover:text-lamp-300">
          Log in
        </Link>
        <Link href="/signup" className={ghostButton}>
          Sign up
        </Link>
      </>
    );
  }

  return (
    <>
      <span className="font-type text-paper-300">
        Detective <span className="text-lamp-300">{player.username}</span>
      </span>
      <form action={logout}>
        <button type="submit" className={ghostButton}>
          Log out
        </button>
      </form>
    </>
  );
}
