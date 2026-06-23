"use client";

import Link from "next/link";
import { ArrowLeft, CalendarPlus, LogOut, RefreshCw, ShieldCheck, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";

type AdminHeaderProps = {
  active?: "dashboard" | "events" | "event-officials" | "other";
  title?: string;
  subtitle?: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
};

export default function AdminHeader({
  active = "dashboard",
  title,
  subtitle,
  showRefresh = false,
  onRefresh,
}: AdminHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error(error);
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[92px] max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-[88px]">
        <div className="flex items-center gap-5">
          {active !== "dashboard" && (
            <Link
              href="/admin"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              aria-label="Kembali ke dashboard admin"
            >
              <ArrowLeft size={22} />
            </Link>
          )}

          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center" aria-label="Ke beranda AMOST">
              <img
                src="/amost_logo_wide_.png"
                alt="AMOST"
                className="h-[52px] w-auto object-contain sm:h-[62px] lg:h-[70px]"
              />
            </Link>

            {(title || subtitle) && (
              <div className="hidden border-l border-slate-200 pl-5 md:block">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-700">
                  Admin AMOST
                </p>
                {title && (
                  <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-1 max-w-xl text-sm font-medium leading-6 text-slate-500">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin"
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition ${
              active === "dashboard"
                ? "border-purple-200 bg-purple-50 text-purple-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ArrowLeft size={17} />
            Dashboard
          </Link>

          <Link
            href="/admin/event-officials"
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition ${
              active === "event-officials"
                ? "border-purple-200 bg-purple-50 text-purple-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <UsersRound size={17} />
            Official Event
          </Link>

          <Link
            href="/admin/events/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-black text-white shadow-sm shadow-purple-200 transition hover:bg-purple-800"
          >
            <CalendarPlus size={17} />
            Tambah Event
          </Link>

          {showRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 transition hover:bg-red-100"
          >
            <LogOut size={17} />
            Keluar
          </button>
        </nav>
      </div>

      {(title || subtitle) && (
        <div className="border-t border-slate-100 px-4 py-3 md:hidden">
          <div className="mx-auto max-w-[1440px]">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-purple-700">
              <ShieldCheck size={14} />
              Admin AMOST
            </p>
            {title && (
              <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
