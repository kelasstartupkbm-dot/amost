import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AMOST - Outdoor Sport Tracking",
  description: "Amikom Mobile Outdoor Sport Tracking Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
