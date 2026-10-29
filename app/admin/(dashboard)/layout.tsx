import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "../actions";
import { ghostButton } from "@/components/ui/buttons";

// Ask search engines not to list admin pages.
export const metadata: Metadata = {
  title: "Admin · Interrogation Room",
  robots: { index: false, follow: false },
};

// No login check here: layouts don't re-run on navigation. proxy.ts and each
// page check instead.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="desk min-h-screen">
      <div className="bg-tape-400 px-4 py-1.5 text-center font-type text-xs uppercase tracking-widest text-walnut-950">
        Records Office · Shows full solutions · Never share this screen with players
      </div>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <nav className="flex flex-wrap items-center gap-5 font-type text-sm uppercase tracking-wider">
          <Link href="/admin" className="text-brass-300 hover:text-lamp-300">Records Office</Link>
          <Link href="/cases" className="text-paper-300 hover:text-lamp-300">Player case list</Link>
          {/* A form, so logging out works through the logout Server Action. */}
          <form action={logout} className="ml-auto">
            <button type="submit" className={ghostButton}>
              Log out
            </button>
          </form>
        </nav>
        {children}
      </div>
    </div>
  );
}
