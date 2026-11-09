import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flood Monitor Kenya",
  description: "Live map of flood reports and warnings across Kenya.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
