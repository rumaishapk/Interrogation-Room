import type { Metadata } from "next";
import AccountPage from "@/components/account/AccountPage";

export const metadata: Metadata = { title: "Choose your name · Interrogation Room" };

export default function GoogleNamePage({ searchParams }: PageProps<"/signup/google">) {
  return <AccountPage mode="google-name" searchParams={searchParams} />;
}
