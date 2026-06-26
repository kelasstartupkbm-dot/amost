"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import AccountMobileNav from "./AccountMobileNav";

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  if (shouldHidePublicLayout(pathname)) {
    return (
      <>
        {children}
        <AccountMobileNav />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen pt-[78px] lg:pt-[96px]">
        {children}
      </main>

      <Footer />
    </>
  );
}

function shouldHidePublicLayout(pathname: string) {
  const hiddenPrefixes = [
    "/home",
    "/account",
    "/my-events",
    "/settings",
    "/notification",
    "/statistics",
    "/achievement",
    "/my-tickets",
    "/my-activities",
    "/official",
    "/admin",
    "/event",
    "/login",
    "/register",
    "/api",
  ];

  return hiddenPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
