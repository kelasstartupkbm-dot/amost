"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ElementType } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
  LogOut,
  Medal,
  Navigation,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  Trophy,
  UserRound,
  Wifi,
} from "lucide-react";

type CurrentUser = {
  id: number;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  role?: string | null;
};

type OfficialAccess = {
  id: number;
  event_id: number | string;
  user_id: number | string;
  permission_level?: string | null;
  status?: string | null;
  notes?: string | null;
  event_title?: string | null;
  event_name?: string | null;
};

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

export default function AccountProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [officialAccess, setOfficialAccess] = useState<OfficialAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const roleLabel = formatRole(user?.role);
  const hasOfficialAccess = officialAccess.length > 0;

  async function loadAccount(silent = false) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok || !data?.user) {
        router.replace("/login");
        return;
      }

      setUser(data.user);

      try {
        const officialResponse = await fetch("/api/account/event-officials", {
          method: "GET",
          cache: "no-store",
        });

        const officialData = await officialResponse.json().catch(() => null);

        if (officialResponse.ok && officialData?.ok) {
          const rows = Array.isArray(officialData.data)
            ? officialData.data
            : Array.isArray(officialData.items)
              ? officialData.items
              : [];

          setOfficialAccess(rows);
        } else {
          setOfficialAccess([]);
        }
      } catch (officialError) {
        console.error(officialError);
        setOfficialAccess([]);
      }
    } catch (error) {
      console.error(error);
      router.replace("/login");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    setLogoutLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
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

  const accountStats = useMemo(
    () => [
      { label: "Role", value: roleLabel, icon: ShieldCheck },
      { label: "Status", value: user?.status || "Aktif", icon: CheckCircle2 },
      {
        label: "Official",
        value: hasOfficialAccess ? `${officialAccess.length} Event` : "-",
        icon: Trophy,
      },
    ],
    [roleLabel, user?.status, hasOfficialAccess, officialAccess.length],
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-purple-700" />
          <p className="mt-4 text-lg font-black">Memuat profile...</p>
          <p className="mt-2 text-sm text-slate-500">Mengambil data akun.</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <AccountSidebar hasOfficialAccess={hasOfficialAccess} />

      <section className="min-h-screen lg:pl-[260px]">
        <AccountTopbar
          title="Profile"
          subtitle={`Halo, ${displayName}`}
          displayName={displayName}
          initials={initials}
          roleLabel={roleLabel}
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
                    Account Settings
                  </p>
                  <h1 className="mt-2 text-3xl font-black text-slate-950">
                    Profile & Biodata
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Halaman ini khusus untuk data akun, role, dan akses official.
                    Dashboard utama sekarang berada di /home.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/home"
                    className="flex h-11 items-center justify-center rounded-xl bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800"
                  >
                    Buka Home
                  </Link>
                  <Link
                    href="/account/tracking"
                    className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    Tracking
                  </Link>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {accountStats.map((item) => (
                <StatCard
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                Informasi Akun
              </h2>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoRow label="Nama" value={user.fullName || "-"} />
                <InfoRow label="Email" value={user.email || "-"} />
                <InfoRow label="No. HP" value={user.phone || "-"} />
                <InfoRow label="Role" value={roleLabel} />
                <InfoRow label="Status Akun" value={user.status || "-"} />
                <InfoRow
                  label="Official Event"
                  value={hasOfficialAccess ? `${officialAccess.length} event` : "-"}
                />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Official Access
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Event yang dapat dikelola oleh akun ini.
                  </p>
                </div>

                {hasOfficialAccess ? (
                  <Link
                    href="/official"
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-green-700 px-4 text-xs font-black text-white hover:bg-green-800"
                  >
                    Panel Official
                  </Link>
                ) : null}
              </div>

              {hasOfficialAccess ? (
                <div className="mt-5 space-y-3">
                  {officialAccess.map((item) => (
                    <Link
                      key={String(item.id)}
                      href={`/official/events/${item.event_id}`}
                      className="block rounded-2xl bg-green-50 p-4 hover:bg-green-100"
                    >
                      <p className="font-black text-slate-950">
                        {item.event_title ||
                          item.event_name ||
                          `Event #${item.event_id}`}
                      </p>
                      <p className="mt-1 text-xs font-black uppercase text-green-700">
                        {item.permission_level || "Official"} •{" "}
                        {item.status || "active"}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                  Belum ada akses Official Event.
                </div>
              )}
            </section>
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
                {user.email || "-"}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">
                  {roleLabel}
                </span>

                {hasOfficialAccess ? (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase text-green-700">
                    Official Event
                  </span>
                ) : null}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Quick Access</h3>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <QuickAccess href="/home" icon={Home} label="Home" />
                <QuickAccess
                  href="/account/tracking"
                  icon={Activity}
                  label="Tracking"
                />
                <QuickAccess href="/my-events" icon={CalendarDays} label="Events" />
                <QuickAccess href="/download" icon={Download} label="Download" />
              </div>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}

function AccountSidebar({ hasOfficialAccess }: { hasOfficialAccess: boolean }) {
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
        <SidebarLink href="/home" icon={Home} label="Dashboard" />
        <SidebarLink href="/account/tracking" icon={Navigation} label="Tracking" />
        <SidebarLink href="/my-activities" icon={History} label="My Activities" />
        <SidebarLink href="/my-events" icon={CalendarDays} label="My Events" />
        <SidebarLink href="/my-tickets" icon={Ticket} label="My Tickets" />
        <SidebarLink href="/achievement" icon={Medal} label="Achievement" />
        <SidebarLink href="/statistics" icon={Activity} label="Statistics" />
        <SidebarLink href="/notification" icon={Bell} label="Notification" />
        <SidebarLink href="/account" icon={UserRound} label="Profile" active />
        <SidebarLink href="/settings" icon={Settings} label="Settings" active />
        {hasOfficialAccess ? (
          <SidebarLink href="/official" icon={ShieldCheck} label="Panel Official" />
        ) : null}
      </nav>

      <div className="m-5 rounded-3xl border border-purple-100 bg-purple-50 p-5">
        <p className="text-sm font-black text-purple-700">
          Tracking lebih seru
        </p>

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
          href="/my-events"
          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          <HelpCircle size={19} />
          Pusat Bantuan
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

function AccountTopbar({
  title,
  subtitle,
  displayName,
  initials,
  roleLabel,
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
          <TopStatusCard
            icon={Wifi}
            title="GPS Signal"
            value="Standby"
            accent="green"
          />

          <TopStatusCard
            icon={CloudSun}
            title="26°C"
            value="Cerah"
            accent="slate"
          />

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

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-70"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

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
        <p className="mt-1 text-xs font-bold leading-none text-slate-500">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
        <Icon size={22} />
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-base font-black text-slate-950">
        {value}
      </p>
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
      className="flex min-h-[82px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs font-black text-slate-950 hover:bg-purple-700 hover:text-white"
    >
      <Icon size={23} />
      <span className="mt-2">{label}</span>
    </Link>
  );
}
