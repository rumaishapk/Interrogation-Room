import type { Metadata } from "next";
import AccountPage from "@/components/account/AccountPage";

export const metadata: Metadata = { title: "Log in · Interrogation Room" };

export default function LoginPage() {
  return <AccountPage mode="login" />;
}
