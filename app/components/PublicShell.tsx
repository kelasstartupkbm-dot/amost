"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  const hidePublicLayout = isPrivateOrAuthPage(pathname);

  if (hidePublicLayout) {
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

function isPrivateOrAuthPage(pathname: string) {
  const hiddenPrefixes = [
    "/admin",
    "/login",
    "/register",
    "/api",
  ];

  return hiddenPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
