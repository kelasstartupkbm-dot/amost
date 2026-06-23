"use client";

import Link from "next/link";
import { LogOut, Plus, ShieldCheck, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminHeaderProps = {
  active?: "dashboard" | "events" | "officials";
};

export default function AdminHeader({ active = "dashboard" }: AdminHeaderProps) {
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);

  async function handleLogout() {
    setLogoutLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Logout gagal. Coba lagi.");
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex min-h-[96px] max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-[88px]">
        <Link href="/admin" className="inline-flex items-center">
          <img
            src="/amost_logo_wide_.png"
            alt="AMOST Event Management"
            className="h-[58px] w-auto object-contain lg:h-[72px]"
          />
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin"
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-black transition ${
              active === "dashboard"
                ? "border-purple-700 bg-purple-700 text-white shadow-md shadow-purple-100"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <LayoutDashboard size={17} />
            Dashboard
          </Link>

          <Link
            href="/admin/event-officials"
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-black transition ${
              active === "officials"
                ? "border-purple-700 bg-purple-700 text-white shadow-md shadow-purple-100"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ShieldCheck size={17} />
            Official Event
          </Link>

          <Link
            href="/admin/events/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-black text-white shadow-md shadow-purple-100 transition hover:bg-purple-800"
          >
            <Plus size={18} />
            Tambah Event
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={17} />
            {logoutLoading ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </div>
    </header>
  );
}
