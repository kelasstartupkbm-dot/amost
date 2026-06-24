"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ElementType, type ReactNode } from "react";
import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  CloudSun,
  Download,
  HelpCircle,
  History,
  Home,
  LogOut,
  Medal,
  Navigation,
  RefreshCw,
  Search,
  Settings,
  Ticket,
  UserRound,
  Wifi,
} from "lucide-react";

type CurrentUser = {
  id: number;
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
};

type AppMenuKey =
  | "home"
  | "tracking"
  | "activities"
  | "events"
  | "tickets"
  | "achievement"
  | "statistics"
  | "notification"
  | "profile"
  | "settings";

type AccountAppShellPageProps = {
  active: AppMenuKey;
  title: string;
  eyebrow: string;
  description: string;
  icon?: ElementType;
  children: ReactNode;
  rightPanel?: ReactNode;
};


type PanelAction = {
  label: string;
  href: string;
};

function getPanelAction(
  user: CurrentUser | null,
  hasOfficialAccess = false,
): PanelAction | null {
  const role = String(user?.role || "").toLowerCase().replace(/\s+/g, "_");

  if (role.includes("super_admin") || role.includes("super")) {
    return {
      label: "Control Panel",
      href: "/api/admin-entry",
    };
  }

  if (role.includes("staff_amost") || role.includes("staff")) {
    return {
      label: "Staff AMOST",
      href: "/api/admin-entry",
    };
  }

  if (hasOfficialAccess) {
    return {
      label: "Official Event",
      href: "/official",
    };
  }

  return null;
}

function getDisplayName(user: CurrentUser | null) {
  const clean = user?.fullName?.trim();

  if (clean) return clean;

  const emailName = user?.email?.split("@")[0]?.trim();

  if (emailName) return emailName;

  return "AMOST User";
}

function getInitials(name: string) {
  const words = name
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);

  if (words.length === 0) return "A";

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function formatRole(role: string | null | undefined) {
  const clean = String(role || "umum").toLowerCase();

  if (clean === "super_admin") return "Super Admin";
  if (clean === "staff_amost") return "Staff AMOST";
  if (clean === "umum") return "Umum";

  return clean
    .split("_")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AccountAppShellPage({
  active,
  title,
  eyebrow,
  description,
  icon: Icon = Activity,
  children,
  rightPanel,
}: AccountAppShellPageProps) {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [officialAccessCount, setOfficialAccessCount] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const roleLabel = formatRole(user?.role);
  const panelAction = getPanelAction(user, officialAccessCount > 0);

  async function loadAccount(silent = false) {
    if (silent) {
      setRefreshing(true);
    }

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401 || !data?.ok || !data?.user) {
        const nextPath =
          typeof window !== "undefined" ? window.location.pathname : "/home";

        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      setUser(data.user);

      try {
        const officialResponse = await fetch("/api/account/event-officials", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const officialData = await officialResponse.json().catch(() => null);

        if (officialResponse.ok && officialData?.ok) {
          const rows = Array.isArray(officialData.data)
            ? officialData.data
            : Array.isArray(officialData.items)
              ? officialData.items
              : [];

          setOfficialAccessCount(rows.length);
        } else {
          setOfficialAccessCount(0);
        }
      } catch (officialError) {
        console.error(officialError);
        setOfficialAccessCount(0);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setAuthChecked(true);
      setRefreshing(false);
    }
  }

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

  useEffect(() => {
    loadAccount();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <AppSidebar active={active} />

      <section className="min-h-screen lg:pl-[260px]">
        <AppTopbar
          title={title}
          subtitle={authChecked ? `Halo, ${displayName}` : "Memuat akun..."}
          displayName={displayName}
          initials={initials}
          roleLabel={roleLabel}
          panelAction={panelAction}
          refreshing={refreshing}
          logoutLoading={logoutLoading}
          onRefresh={() => loadAccount(true)}
          onLogout={handleLogout}
        />

        <section className="grid min-h-[calc(100vh-88px)] grid-cols-1 gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-5">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-700">
                    {eyebrow}
                  </p>
                  <h1 className="mt-2 text-3xl font-black text-slate-950">
                    {title}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    {description}
                  </p>
                </div>

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                  <Icon size={32} />
                </div>
              </div>
            </section>

            {children}
          </section>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-700 text-2xl font-black text-white">
                {initials}
              </div>
              <h2 className="mt-4 text-xl font-black text-slate-950">
                {displayName}
              </h2>
              <p className="mt-1 break-all text-sm font-semibold text-slate-500">
                {user?.email || (authChecked ? "-" : "Memuat akun...")}
              </p>
              <span className="mt-4 inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">
                {roleLabel}
              </span>
            </section>

            {rightPanel}

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Quick Access</h3>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <QuickAccess href="/home" icon={Home} label="Home" />
                <QuickAccess href="/account/tracking" icon={Navigation} label="Tracking" />
                <QuickAccess href="/my-events" icon={CalendarDays} label="Events" />
                <QuickAccess href="/account" icon={UserRound} label="Profile" />
              </div>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}

function AppSidebar({ active }: { active: AppMenuKey }) {
  return (
    <aside className="hidden fixed inset-y-0 left-0 z-[60] w-[260px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-[88px] items-center px-8">
        <Link href="/">
          <img
            src="/amost_logo_wide_.png"
            alt="AMOST"
            className="h-[62px] w-auto object-contain"
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-2 px-5 py-5">
        <SidebarLink href="/home" icon={Home} label="Dashboard" active={active === "home"} />
        <SidebarLink href="/account/tracking" icon={Navigation} label="Tracking" active={active === "tracking"} />
        <SidebarLink href="/my-activities" icon={History} label="My Activities" active={active === "activities"} />
        <SidebarLink href="/my-events" icon={CalendarDays} label="My Events" active={active === "events"} />
        <SidebarLink href="/my-tickets" icon={Ticket} label="My Tickets" active={active === "tickets"} />
        <SidebarLink href="/achievement" icon={Medal} label="Achievement" active={active === "achievement"} />
        <SidebarLink href="/statistics" icon={Activity} label="Statistics" active={active === "statistics"} />
        <SidebarLink href="/notification" icon={Bell} label="Notification" active={active === "notification"} />
        <SidebarLink href="/account" icon={UserRound} label="Profile" active={active === "profile"} />
        <SidebarLink href="/settings" icon={Settings} label="Settings" active={active === "settings"} />
      </nav>

      <div className="m-5 rounded-3xl border border-purple-100 bg-purple-50 p-5">
        <p className="text-sm font-black text-purple-700">Tracking lebih seru</p>

        <ul className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-600" />
            Community Feed
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-600" />
            Tracking Dashboard
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-600" />
            Results & Doorprize
          </li>
        </ul>

        <Link
          href="/download"
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 text-sm font-black text-white"
        >
          <Download size={16} />
          Download App
        </Link>
      </div>

      <div className="border-t border-slate-200 p-5">
        <Link
          href="/events"
          prefetch
          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          <HelpCircle size={19} />
          Event Publik
        </Link>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active = false,
}: {
  href: string;
  icon: ElementType;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch
      className={`flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-black transition ${
        active
          ? "bg-purple-50 text-purple-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <Icon size={20} />
      {label}
    </Link>
  );
}

function AppTopbar({
  title,
  subtitle,
  displayName,
  initials,
  roleLabel,
  panelAction,
  refreshing,
  logoutLoading,
  onRefresh,
  onLogout,
}: {
  title: string;
  subtitle: string;
  displayName: string;
  initials: string;
  roleLabel: string;
  panelAction?: PanelAction | null;
  refreshing: boolean;
  logoutLoading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="flex min-h-[88px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <h1 className="text-2xl font-black text-slate-950">{title}</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <TopStatusCard icon={Wifi} title="GPS Signal" value="Standby" accent="green" />
          <TopStatusCard icon={CloudSun} title="26°C" value="Cerah" accent="slate" />

          <button
            type="button"
            className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 md:flex"
            title="Cari"
          >
            <Search size={20} />
          </button>

          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700"
            title="Notifikasi"
          >
            <Bell size={20} />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-700 text-[10px] font-black text-white">
              3
            </span>
          </button>

          {panelAction ? (
            <Link
              href={panelAction.href}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-purple-700 px-4 text-sm font-black text-white hover:bg-purple-800"
            >
              {panelAction.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-70"
            >
              <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          )}

          <div className="hidden items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50 px-4 py-2 md:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-700 text-xs font-black text-white">
              {initials}
            </div>
            <div>
              <p className="text-sm font-black leading-none text-slate-950">
                {displayName}
              </p>
              <p className="mt-1 text-xs font-bold leading-none text-purple-700">
                {roleLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={logoutLoading}
            onClick={onLogout}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-70"
          >
            <LogOut size={17} />
            {logoutLoading ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </div>
    </header>
  );
}

function TopStatusCard({
  icon: Icon,
  title,
  value,
  accent,
}: {
  icon: ElementType;
  title: string;
  value: string;
  accent: "green" | "slate";
}) {
  const color =
    accent === "green"
      ? "bg-green-50 text-green-700"
      : "bg-slate-50 text-slate-700";

  return (
    <div className="hidden h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 md:flex">
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
        <Icon size={17} />
      </div>

      <div>
        <p className="text-xs font-black leading-none text-slate-950">{title}</p>
        <p className="mt-1 text-xs font-bold leading-none text-slate-500">{value}</p>
      </div>
    </div>
  );
}

function QuickAccess({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      className="flex min-h-[82px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs font-black text-slate-950 hover:bg-purple-700 hover:text-white"
    >
      <Icon size={23} />
      <span className="mt-2">{label}</span>
    </Link>
  );
}
