import type { Metadata } from "next";
import Link from "next/link";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin login · Interrogation Room",
  robots: { index: false, follow: false },
};

// Outside the (dashboard) group, so it doesn't get the admin layout or its checks.
export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
      <p className="text-sm uppercase tracking-[0.35em] text-red-400">Restricted</p>
      <h1 className="mt-4 text-3xl font-bold">Admin login</h1>
      <AdminLoginForm />
      <Link href="/" className="mt-8 text-sm text-slate-500 hover:text-slate-300">
        ← Back to the game
      </Link>
    </main>
  );
}
