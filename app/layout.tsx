import type { Metadata } from "next";
import { Lora, Playfair_Display, Special_Elite } from "next/font/google";
import "./globals.css";

// next/font downloads these at build time and serves them from our own site,
// so there are no requests to Google when a page loads.
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] }); // headings
const specialElite = Special_Elite({ variable: "--font-special-elite", subsets: ["latin"], weight: "400" }); // typed notes
const lora = Lora({ variable: "--font-lora", subsets: ["latin"] }); // body text

export const metadata: Metadata = {
  title: "Interrogation Room",
  description: "A murder mystery game: question the suspects, examine the evidence, name the killer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${specialElite.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
