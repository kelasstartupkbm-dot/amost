"use client";

import Link from "next/link";
import { Bell, ChevronDown, History, LogOut, Menu, Trophy, User, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

type AccountHeaderProps = {
  active?: "biodata" | "history" | "results";
};

const navItems = [
  {
    label: "Biodata",
    href: "/account#biodata",
    key: "biodata",
    icon: User,
  },
  {
    label: "History",
    href: "/account#history",
    key: "history",
    icon: History,
  },
  {
    label: "Results",
    href: "/account#results",
    key: "results",
    icon: Trophy,
  },
] as const;

export default function AccountHeader({ active = "biodata" }: AccountHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/account";

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore optional logout endpoint
    }

    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // ignore optional logout endpoint
    }

    try {
      localStorage.removeItem("amost_token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.clear();
    } catch {
      // ignore storage errors
    }

    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-[9999] border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-[84px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:h-[96px] lg:px-[88px]">
        <Link href="/account" className="flex items-center gap-3" aria-label="AMOST User Account">
          <img
            src="/amost_logo_wide_.png"
            alt="AMOST"
            className="h-[46px] w-auto object-contain sm:h-[56px] lg:h-[64px]"
          />
        </Link>

        <nav className="hidden items-center gap-2 rounded-2xl bg-slate-50 p-1 xl:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = active === item.key || pathname === item.href;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black transition ${
                  selected
                    ? "bg-purple-700 text-white shadow-md shadow-purple-100"
                    : "text-slate-700 hover:bg-white hover:text-purple-700"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-700 transition hover:bg-purple-50 hover:text-purple-700"
            aria-label="Notifikasi"
          >
            <Bell size={21} />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-900 xl:hidden"
          aria-label="Buka menu akun"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-5 shadow-xl xl:hidden">
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-purple-50 px-4 py-3 text-sm font-black text-purple-700">
            Menu Akun
            <ChevronDown size={18} />
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = active === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-black transition ${
                    selected
                      ? "bg-purple-700 text-white"
                      : "bg-slate-50 text-slate-700 hover:bg-purple-50 hover:text-purple-700"
                  }`}
                >
                  <Icon size={19} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-50 text-sm font-black text-slate-700"
            >
              <Bell size={18} />
              Notifikasi
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-black text-red-700"
            >
              <LogOut size={18} />
              Keluar
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
