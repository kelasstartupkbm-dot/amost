"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, User, LogOut, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CurrentUser = {
  id: number;
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const navItems = useMemo(
    () => [
      { label: "Beranda", href: "/" },
      { label: "Events", href: "/events" },
      { label: "Cara Kerja", href: "#cara-kerja" },
      { label: "Fitur", href: "/fitur" },
      { label: "Komunitas", href: "/komunitas" },
      { label: "Tentang", href: "/tentang" },
      { label: "Kontak", href: "/kontak" },
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function checkLogin() {
      try {
        setCheckingUser(true);

        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const data = await response.json().catch(() => null);

        if (cancelled) return;

        if (response.ok && data?.ok && data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setCheckingUser(false);
        }
      }
    }

    checkLogin();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function handleLogout() {
    setLogoutLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
      setAccountOpen(false);
      setOpen(false);

      if (
        pathname?.startsWith("/account") ||
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/official")
      ) {
        router.replace("/login");
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      alert("Logout gagal. Coba lagi.");
    } finally {
      setLogoutLoading(false);
    }
  }

  const displayName = getDisplayName(user);

  const hideHeaderRoutes = [
    "/account",
    "/admin",
    "/official",
    "/login",
    "/register",
  ];

  const shouldHideHeader = hideHeaderRoutes.some((route) => {
    return pathname === route || pathname?.startsWith(`${route}/`);
  });

  if (shouldHideHeader) {
    return null;
  }

  return (
    <header className="fixed left-0 top-0 z-[9999] w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-[78px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:h-[96px] lg:px-[88px]">
        <Link
          href="/"
          className="flex items-center"
          onClick={() => setOpen(false)}
        >
          <img
            src="/amost_logo_wide_.png"
            alt="AMOST"
            className="h-[44px] w-auto object-contain sm:h-[52px] lg:h-[60px]"
          />
        </Link>

        <nav className="hidden items-center gap-8 text-[15px] font-medium text-slate-800 xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              className={
                isActiveNav(pathname, item.href)
                  ? "font-bold text-purple-700"
                  : ""
              }
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <button
            type="button"
            aria-label="Cari"
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-950 transition hover:bg-slate-100"
          >
            <Search size={24} strokeWidth={2.3} />
          </button>

          {checkingUser ? (
            <div className="h-11 w-[180px] animate-pulse rounded-md bg-slate-100" />
          ) : user ? (
            <div
              className="relative"
              onMouseEnter={() => setAccountOpen(true)}
              onMouseLeave={() => setAccountOpen(false)}
            >
              <Link
                href="/account"
                onClick={() => setAccountOpen(false)}
                className="flex h-11 items-center justify-center gap-2 rounded-md border border-purple-200 bg-purple-50 px-5 text-[14px] font-black text-purple-700 transition hover:border-purple-700 hover:bg-purple-100"
              >
                <User size={18} />
                <span className="max-w-[160px] truncate">{displayName}</span>
              </Link>

              <div
                className={`absolute right-0 top-[calc(100%+10px)] w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl transition ${
                  accountOpen
                    ? "visible translate-y-0 opacity-100"
                    : "invisible -translate-y-1 opacity-0"
                }`}
              >
                <div className="rounded-xl bg-purple-50 p-3">
                  <p className="truncate text-sm font-black text-slate-950">
                    {displayName}
                  </p>

                  {user.email ? (
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                      {user.email}
                    </p>
                  ) : null}
                </div>

                <Link
                  href="/account"
                  onClick={() => setAccountOpen(false)}
                  className="mt-2 flex h-10 items-center rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  Buka Akun
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="mt-1 flex h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut size={17} />
                  {logoutLoading ? "Keluar..." : "Logout"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="flex h-11 items-center justify-center rounded-md border border-purple-700 px-6 text-[14px] font-bold text-purple-700 transition hover:bg-purple-50"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="flex h-11 items-center justify-center rounded-md bg-purple-700 px-6 text-[14px] font-bold text-white shadow-md shadow-purple-200 transition hover:bg-purple-800"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-900 xl:hidden"
          aria-label="Buka menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-5 shadow-xl xl:hidden">
          <nav className="flex flex-col gap-4 text-[15px] font-bold text-slate-800">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={
                  isActiveNav(pathname, item.href) ? "text-purple-700" : ""
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 border-t border-slate-200 pt-5">
            {checkingUser ? (
              <div className="h-11 w-full animate-pulse rounded-md bg-slate-100" />
            ) : user ? (
              <div className="space-y-3">
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center justify-center gap-2 rounded-md bg-purple-50 text-[14px] font-black text-purple-700"
                >
                  <User size={18} />
                  <span className="max-w-[220px] truncate">
                    {displayName}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 text-[14px] font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut size={17} />
                  {logoutLoading ? "Keluar..." : "Logout"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center justify-center rounded-md border border-purple-700 text-[14px] font-bold text-purple-700"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center justify-center rounded-md bg-purple-700 text-[14px] font-bold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function getDisplayName(user: CurrentUser | null) {
  if (!user) return "Akun";

  const fullName = user.fullName?.trim();
  if (fullName) return fullName;

  const emailName = user.email?.split("@")[0]?.trim();
  if (emailName) return emailName;

  return "Akun Saya";
}

function isActiveNav(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  if (href.startsWith("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
