"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ElementType } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  Bike,
  CalendarDays,
  CheckCircle2,
  CloudSun,
  Download,
  Gift,
  HelpCircle,
  History,
  Home,
  Loader2,
  LogOut,
  Map,
  Medal,
  Navigation,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  Trophy,
  UserRound,
  Users,
  Wifi,
} from "lucide-react";

type CurrentUser = {
  id: number;
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
};

type EventItem = {
  id: number | string;
  title?: string | null;
  event_title?: string | null;
  name?: string | null;
  event_date?: string | null;
  location?: string | null;
  status?: string | null;
  participant_count?: number | string | null;
  quota?: number | string | null;
  doorprize_count?: number | string | null;
  distance_km?: number | string | null;
  image_url?: string | null;
  description?: string | null;
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

function getEventTitle(event: EventItem | null | undefined) {
  return event?.title || event?.event_title || event?.name || "Event AMOST";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Tanggal menyusul";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeStatus(status: string | null | undefined) {
  const raw = String(status || "published").toLowerCase();

  if (["published", "open", "active", "buka", "live"].includes(raw)) return "Aktif";
  if (["upcoming", "draft", "soon", "segera"].includes(raw)) return "Segera";
  if (["closed", "selesai", "finish", "finished"].includes(raw)) return "Selesai";

  return status || "Aktif";
}

function statusClass(status: string | null | undefined) {
  const label = normalizeStatus(status).toLowerCase();

  if (label === "aktif") return "bg-green-50 text-green-700";
  if (label === "segera") return "bg-yellow-50 text-yellow-700";
  if (label === "selesai") return "bg-slate-100 text-slate-700";

  return "bg-purple-50 text-purple-700";
}

export default function MyEventsPage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [officialAccessCount, setOfficialAccessCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "upcoming" | "finished">("all");

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const roleLabel = formatRole(user?.role);

  async function loadData(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const meResponse = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      const meData = await meResponse.json().catch(() => null);

      if (!meResponse.ok || !meData?.ok || !meData?.user) {
        router.replace("/login?next=/my-events");
        return;
      }

      setUser(meData.user);

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

      const eventsResponse = await fetch("/api/events", {
        method: "GET",
        cache: "no-store",
      });

      const eventsData = await eventsResponse.json().catch(() => null);

      if (eventsResponse.ok && eventsData?.ok !== false) {
        const rows = Array.isArray(eventsData?.events)
          ? eventsData.events
          : Array.isArray(eventsData?.data)
            ? eventsData.data
            : Array.isArray(eventsData?.items)
              ? eventsData.items
              : [];

        setEvents(rows);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error(error);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    setLogoutLoading(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
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
    loadData();
  }, []);

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;

    return events.filter((event) => {
      const status = normalizeStatus(event.status).toLowerCase();

      if (filter === "active") return status === "aktif";
      if (filter === "upcoming") return status === "segera";
      if (filter === "finished") return status === "selesai";

      return true;
    });
  }, [events, filter]);

  const activeCount = events.filter((event) => normalizeStatus(event.status).toLowerCase() === "aktif").length;
  const upcomingCount = events.filter((event) => normalizeStatus(event.status).toLowerCase() === "segera").length;
  const finishedCount = events.filter((event) => normalizeStatus(event.status).toLowerCase() === "selesai").length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-purple-700" />
          <p className="mt-4 text-lg font-black">Memuat My Events...</p>
          <p className="mt-2 text-sm text-slate-500">Mengambil data event.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <AppSidebar active="events" />

      <section className="min-h-screen lg:pl-[260px]">
        <AppTopbar
          title="My Events"
          subtitle={`Halo, ${displayName}`}
          displayName={displayName}
          initials={initials}
          roleLabel={roleLabel}
          panelAction={getPanelAction(user, officialAccessCount > 0)}
          refreshing={refreshing}
          logoutLoading={logoutLoading}
          onRefresh={() => loadData(true)}
          onLogout={handleLogout}
        />

        <section className="grid min-h-[calc(100vh-88px)] grid-cols-1 gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-5">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-700">
                    AMOST APP AREA
                  </p>
                  <h1 className="mt-2 text-3xl font-black text-slate-950">
                    Event Saya
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Halaman event versi aplikasi setelah login. Dari sini peserta membuka detail event, Live View Tracking, Results, dan Doorprize.
                  </p>
                </div>

                <Link
                  href="/events"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Lihat Event Publik
                </Link>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={CalendarDays} label="Total Event" value={String(events.length)} />
              <StatCard icon={Activity} label="Aktif" value={String(activeCount)} />
              <StatCard icon={Ticket} label="Segera" value={String(upcomingCount)} />
              <StatCard icon={Trophy} label="Selesai" value={String(finishedCount)} />
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <FilterButton active={filter === "all"} label="Semua" onClick={() => setFilter("all")} />
                <FilterButton active={filter === "active"} label="Aktif" onClick={() => setFilter("active")} />
                <FilterButton active={filter === "upcoming"} label="Segera" onClick={() => setFilter("upcoming")} />
                <FilterButton active={filter === "finished"} label="Selesai" onClick={() => setFilter("finished")} />
              </div>
            </section>

            {filteredEvents.length === 0 ? (
              <section className="rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
                <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />
                <h2 className="mt-4 text-2xl font-black text-slate-950">
                  Belum Ada Event
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Belum ada event pada filter ini.
                </p>
              </section>
            ) : (
              <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {filteredEvents.map((event) => (
                  <EventCard key={String(event.id)} event={event} />
                ))}
              </section>
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-700 text-2xl font-black text-white">
                {initials}
              </div>
              <h2 className="mt-4 text-xl font-black text-slate-950">{displayName}</h2>
              <p className="mt-1 break-all text-sm font-semibold text-slate-500">
                {user?.email || "-"}
              </p>
              <span className="mt-4 inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">
                {roleLabel}
              </span>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Quick Access</h3>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <QuickAccess href="/home" icon={Home} label="Home" />
                <QuickAccess href="/account/tracking" icon={Navigation} label="Tracking" />
                <QuickAccess href="/account" icon={UserRound} label="Profile" />
                <QuickAccess href="/download" icon={Download} label="Download" />
              </div>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const title = getEventTitle(event);

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      {event.image_url ? (
        <img src={event.image_url} alt={title} className="h-48 w-full object-cover" />
      ) : (
        <div className="flex h-44 items-center justify-center bg-gradient-to-br from-purple-50 to-slate-100">
          <Bike className="h-14 w-14 text-purple-700" />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusClass(event.status)}`}>
              {normalizeStatus(event.status)}
            </span>

            <h2 className="mt-3 text-2xl font-black text-slate-950">{title}</h2>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              {formatDate(event.event_date)} • {event.location || "Lokasi menyusul"}
            </p>
          </div>

          <CalendarDays className="text-purple-700" size={24} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <SmallInfo label="Peserta" value={`${event.participant_count || 0}/${event.quota || 0}`} />
          <SmallInfo label="Jarak" value={`${Number(event.distance_km || 0).toFixed(2)} KM`} />
          <SmallInfo label="Hadiah" value={String(event.doorprize_count || 0)} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href={`/my-events/${event.id}`}
            className="flex h-11 items-center justify-center rounded-xl bg-purple-700 px-4 text-sm font-black text-white hover:bg-purple-800"
          >
            Kelola Event
          </Link>

          <Link
            href={`/event/${event.id}/view`}
            className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Live View
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link
            href={`/events/${event.id}/results`}
            className="flex h-10 items-center justify-center rounded-xl bg-slate-50 px-4 text-xs font-black text-slate-700 hover:bg-slate-100"
          >
            Results
          </Link>
          <Link
            href={`/events/${event.id}/doorprize`}
            className="flex h-10 items-center justify-center rounded-xl bg-slate-50 px-4 text-xs font-black text-slate-700 hover:bg-slate-100"
          >
            Doorprize
          </Link>
        </div>
      </div>
    </article>
  );
}

function SmallInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${
        active
          ? "bg-purple-700 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function AppSidebar({ active }: { active: "home" | "tracking" | "events" | "profile" }) {
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
        <SidebarLink href="/home" icon={History} label="My Activities" />
        <SidebarLink href="/my-events" icon={CalendarDays} label="My Events" active={active === "events"} />
        <SidebarLink href="/my-events" icon={Ticket} label="My Tickets" />
        <SidebarLink href="/home" icon={Medal} label="Achievement" />
        <SidebarLink href="/home" icon={Activity} label="Statistics" />
        <SidebarLink href="/home" icon={Bell} label="Notification" />
        <SidebarLink href="/account" icon={UserRound} label="Profile" active={active === "profile"} />
        <SidebarLink href="/account" icon={Settings} label="Settings" />
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
