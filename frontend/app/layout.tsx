import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lead Sender",
  description: "Live pipeline for cold outbound",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden">{children}</body>
    </html>
  );
}
