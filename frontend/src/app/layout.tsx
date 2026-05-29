import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Premium Auto Analysis | Signal Intelligence Platform",
  description: "Automated signal collection and analysis for premium automotive digital ownership research",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
