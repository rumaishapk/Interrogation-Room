import type { Metadata } from "next";
import Link from "next/link";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import PaperCard from "@/components/ui/PaperCard";
import PoliceTape from "@/components/ui/PoliceTape";
import Stamp from "@/components/ui/Stamp";

export const metadata: Metadata = {
  title: "Admin login · Interrogation Room",
  robots: { index: false, follow: false },
};

// Outside the (dashboard) group, so it doesn't get the admin layout or its checks.
export default function AdminLoginPage() {
  return (
    <main className="desk relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10 text-center">
      <PoliceTape className="absolute left-[-10%] top-10 w-[130%] rotate-2" />
      <p className="font-type text-xs uppercase tracking-[0.45em] text-brass-300">Records Office</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-paper-100 sm:text-4xl">Restricted Access</h1>

      <PaperCard fastener="pin" tilt={-0.6} className="mt-8 w-full max-w-sm px-6 pb-7 pt-8 text-left">
        <div className="flex items-center justify-between border-b-2 border-ink-900/70 pb-3">
          <span className="font-display font-black uppercase tracking-widest text-ink-900">Admin only</span>
          <Stamp tone="red" rotate={6}>Classified</Stamp>
        </div>
        <AdminLoginForm />
      </PaperCard>

      <Link href="/" className="mt-8 font-type text-sm uppercase tracking-wider text-paper-300 hover:text-lamp-300">
        ← Back to the office
      </Link>
    </main>
  );
}
