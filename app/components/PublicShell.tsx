"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

const noPublicShellPrefixes = [
  "/admin",
  "/account",
  "/login",
  "/register",
  "/api",
];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export default function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";

  const shouldHidePublicHeaderFooter = noPublicShellPrefixes.some((prefix) =>
    matchesPrefix(pathname, prefix),
  );

  if (shouldHidePublicHeaderFooter) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />

      <main className="min-h-screen pt-[78px] lg:pt-[96px]">{children}</main>

      <Footer />
    </>
  );
}
