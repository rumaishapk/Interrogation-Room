import type { Metadata } from "next";
import AccountPage from "@/components/account/AccountPage";

export const metadata: Metadata = { title: "Log in · Interrogation Room" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return <AccountPage mode="login" searchParams={searchParams} />;
}
