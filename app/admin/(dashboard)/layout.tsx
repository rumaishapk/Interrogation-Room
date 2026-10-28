import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "../actions";

// Ask search engines not to list admin pages.
export const metadata: Metadata = {
  title: "Admin · Interrogation Room",
  robots: { index: false, follow: false },
};

// No login check here: layouts don't re-run on navigation. proxy.ts and each
// page check instead.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-amber-900/60 px-6 py-2 text-center text-xs text-amber-200">
        Admin area: shows full solutions. Never share this screen with players.
      </div>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <nav className="flex flex-wrap items-center gap-4 text-sm text-red-400">
          <Link href="/admin">Admin home</Link>
          <Link href="/cases">Player case list</Link>
          {/* A form, so logging out works through the logout Server Action. */}
          <form action={logout} className="ml-auto">
            <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700">
              Log out
            </button>
          </form>
        </nav>
        {children}
      </div>
    </div>
  );
}
