import { redirect } from "next/navigation";

// /game no longer means one fixed case. Send old links to the case list.
export default function GameIndexPage() {
  redirect("/cases");
}
