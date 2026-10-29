import type { Metadata } from "next";
import AccountPage from "@/components/account/AccountPage";

export const metadata: Metadata = { title: "Sign up · Interrogation Room" };

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return <AccountPage mode="signup" searchParams={searchParams} />;
}
