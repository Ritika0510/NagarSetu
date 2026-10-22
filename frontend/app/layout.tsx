import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CivicMapBackground } from "@/components/site/CivicMapBackground";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NagarSetu — One app. Every civic need.",
  description:
    "Conversational AI that turns government procedures into personalized, tracked checklists.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#e9f9fc] text-foreground antialiased`}>
        <CivicMapBackground />
        <div className="relative z-10 min-h-screen">{children}</div>
      </body>
    </html>
  );
}