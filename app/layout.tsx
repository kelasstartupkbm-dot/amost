import type { Metadata } from "next";
import "./globals.css";
import PublicShell from "./components/PublicShell";

export const metadata: Metadata = {
  title: "AMOST",
  description: "Amikom Mobile Outdoor Sport Tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  );
}
