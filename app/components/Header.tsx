"use client";

import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: "Beranda", href: "/" },
    { label: "Events", href: "/events" },
    { label: "Cara Kerja", href: "#cara-kerja" },
    { label: "Fitur", href: "/fitur" },
    { label: "Komunitas", href: "/komunitas" },
    { label: "Tentang", href: "/tentang" },
    { label: "Kontak", href: "/kontak" },
  ];

  return (
    <header className="fixed left-0 top-0 z-[9999] w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-[78px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:h-[96px] lg:px-[88px]">
        <Link href="/" className="flex min-w-[120px] items-center" aria-label="AMOST Beranda">
          <img
            src="/amost_logo_wide_.png"
            alt=""
            className="block h-[38px] w-auto object-contain sm:h-[46px] lg:h-[58px]"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </Link>

        <nav className="hidden items-center gap-8 text-[15px] font-medium text-slate-800 xl:flex">
          {navItems.map((item, index) => (
            <Link
              key={item.label}
              className={index === 0 ? "font-bold text-purple-700" : "transition hover:text-purple-700"}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-950 transition hover:bg-slate-100"
            aria-label="Cari"
          >
            <Search size={24} strokeWidth={2.3} />
          </button>

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
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-900 xl:hidden"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-5 shadow-xl xl:hidden">
          <nav className="flex flex-col gap-4 text-[15px] font-bold text-slate-800">
            {navItems.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={index === 0 ? "text-purple-700" : "transition hover:text-purple-700"}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 grid grid-cols-2 gap-3">
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
        </div>
      )}
    </header>
  );
}
