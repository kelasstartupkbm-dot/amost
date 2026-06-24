"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ElementType } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
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
  Layers,
  Loader2,
  Menu,
  MapPin,
  Maximize2,
  Navigation,
  RefreshCw,
  Satellite,
  Search,
  Settings,
  Ticket,
  Trophy,
  UserRound,
  UsersRound,
  Wifi,
  X,
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
  category?: string | null;
  event_date?: string | null;
  location?: string | null;
  participant_count?: number | string | null;
  quota?: number | string | null;
  doorprize_count?: number | string | null;
  status?: string | null;
  description?: string | null;
  distance_km?: number | string | null;
  route_file?: string | null;
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
      href: "/admin",
    };
  }

  if (role.includes("staff_amost") || role.includes("staff")) {
    return {
      label: "Staff AMOST",
      href: "/admin",
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
  if (!user) return "AMOST User";

  const fullName = user.fullName?.trim();
  if (fullName) return fullName;

  const emailName = user.email?.split("@")[0]?.trim();
  if (emailName) return emailName;

  return "AMOST User";
}

function getEventTitle(event: EventItem | null) {
  return event?.title || event?.event_title || event?.name || "Belum Ada Event Aktif";
}

function normalizeStatus(status: string | null | undefined) {
  const raw = String(status || "published").toLowerCase();

  if (["published", "open", "active", "buka", "live"].includes(raw)) {
    return "Aktif";
  }

  if (["upcoming", "draft", "soon", "segera"].includes(raw)) {
    return "Segera";
  }

  if (["closed", "selesai", "finish", "finished"].includes(raw)) {
    return "Selesai";
  }

  return status || "Aktif";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Tanggal menyusul";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDistance(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return "0.00";
  }

  return numberValue.toFixed(2);
}

function formatSpeed(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return "0.0";
  }

  return numberValue.toFixed(1);
}


function calculatePercent(value: number, total: number) {
  if (!total || total <= 0) return 0;

  const result = Math.round((value / total) * 100);

  if (result < 0) return 0;
  if (result > 100) return 100;

  return result;
}

export default function AccountTrackingPage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [officialAccessCount, setOfficialAccessCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const panelAction = getPanelAction(user, officialAccessCount > 0);

  const activeEvent = useMemo(() => {
    if (events.length === 0) return null;

    const liveEvent = events.find((event) => {
      const status = String(event.status || "").toLowerCase();
      return ["live", "active", "published", "open"].includes(status);
    });

    return liveEvent || events[0];
  }, [events]);

  async function loadData(silent = false) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage("");

    try {
      const meResponse = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const meData = await meResponse.json().catch(() => null);

      if (!meResponse.ok || !meData?.ok || !meData?.user) {
        router.replace("/login");
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
        credentials: "include",
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
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-purple-700" />
          <p className="mt-4 text-lg font-black">Memuat Tracking Account...</p>
          <p className="mt-2 text-sm text-slate-500">
            Mengambil data akun dan event.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <TrackingSidebar activeEventId={activeEvent?.id} />
      <TrackingMobileSidebar
        open={mobileSidebarOpen}
        activeEventId={activeEvent?.id}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <section className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <div className="flex min-h-[88px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 lg:hidden"
                aria-label="Buka menu tracking"
              >
                <Menu size={22} />
              </button>

              <div>
                <h1 className="text-2xl font-black text-slate-950">
                  Tracking Dashboard
                </h1>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Halo, {getDisplayName(user)}
                </p>
              </div>
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
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-70"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw size={17} />
                  )}
                  Refresh
                </button>
              )}

              <Link
                href="/account"
                className="flex h-11 items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50 px-4 text-sm font-black text-purple-700"
              >
                <UserRound size={18} />
                Akun Saya
              </Link>
            </div>
          </div>
        </header>

        {errorMessage ? (
          <section className="p-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          </section>
        ) : null}

        <section className="grid min-h-[calc(100vh-88px)] grid-cols-1 gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="relative min-h-[720px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <MapMockup />

            <ActiveEventCard event={activeEvent} />

            <NearbyParticipants events={events} />

            <TrackingControlCard activeEvent={activeEvent} />

            <div className="absolute right-5 top-5 z-10 flex flex-col gap-3">
              <MapToolButton icon={Satellite} label="Satelit" />
              <MapToolButton icon={Layers} label="Layer" />
              <MapToolButton icon={Maximize2} label="Full Map" />
            </div>
          </section>

          <aside className="space-y-5">
            <RealtimeStats activeEvent={activeEvent} eventCount={events.length} />

            <RouteProgress activeEvent={activeEvent} />

            <MyEventsMiniPanel events={events} />

            <ShortcutPanel activeEventId={activeEvent?.id} />
          </aside>
        </section>
      </section>
    </main>
  );
}

function TrackingMobileSidebar({
  open,
  activeEventId,
  onClose,
}: {
  open: boolean;
  activeEventId?: number | string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] lg:hidden">
      <button
        type="button"
        aria-label="Tutup menu"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="relative flex h-full w-[84vw] max-w-[320px] flex-col border-r border-slate-200 bg-white shadow-2xl">
        <div className="flex h-[88px] items-center justify-between border-b border-slate-100 px-6">
          <Link href="/" onClick={onClose}>
            <img
              src="/amost_logo_wide_.png"
              alt="AMOST"
              className="h-[58px] w-auto object-contain"
            />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-5 py-5">
          <MobileTrackingLink href="/home" icon={Home} label="Dashboard" onClick={onClose} />
          <MobileTrackingLink href="/account/tracking" icon={Navigation} label="Tracking" active onClick={onClose} />
          <MobileTrackingLink href="/account#history" icon={History} label="My Activities" onClick={onClose} />
          <MobileTrackingLink href="/my-events" icon={CalendarDays} label="My Events" onClick={onClose} />
          <MobileTrackingLink href="/account#results" icon={Ticket} label="My Tickets" onClick={onClose} />
          <MobileTrackingLink href="/account#results" icon={Trophy} label="Achievement" onClick={onClose} />
          <MobileTrackingLink href="/account#results" icon={BarChart3} label="Statistics" onClick={onClose} />
          <MobileTrackingLink href="/account" icon={Bell} label="Notification" onClick={onClose} />
          <MobileTrackingLink href="/account" icon={UserRound} label="Profile" onClick={onClose} />
          <MobileTrackingLink href="/account" icon={Settings} label="Settings" onClick={onClose} />
        </nav>

        <div className="border-t border-slate-200 p-5">
          <Link
            href={activeEventId ? `/event/${activeEventId}/view` : "/my-events"}
            onClick={onClose}
            className="flex h-12 items-center justify-center rounded-2xl bg-purple-700 text-sm font-black text-white"
          >
            Live View Event
          </Link>
        </div>
      </aside>
    </div>
  );
}

function MobileTrackingLink({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
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

function TrackingSidebar({ activeEventId }: { activeEventId?: number | string }) {
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
        <SidebarItem href="/home" icon={Home} label="Dashboard" />
        <SidebarItem href="/account/tracking" icon={Navigation} label="Tracking" active />
        <SidebarItem href="/account#history" icon={History} label="My Activities" />
        <SidebarItem href="/my-events" icon={CalendarDays} label="My Events" />
        <SidebarItem href="/account#results" icon={Ticket} label="My Tickets" />
        <SidebarItem href="/account#results" icon={Trophy} label="Achievement" />
        <SidebarItem href="/account#results" icon={BarChart3} label="Statistics" />
        <SidebarItem href="/account" icon={Bell} label="Notification" />
        <SidebarItem href="/account" icon={UserRound} label="Profile" />
        <SidebarItem href="/account" icon={Settings} label="Settings" />
      </nav>

      <div className="m-5 rounded-3xl border border-purple-100 bg-purple-50 p-5">
        <p className="text-sm font-black text-purple-700">
          Tracking lebih seru
        </p>

        <ul className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-600" />
            Event tracking
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-600" />
            Results & history
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-600" />
            Doorprize event
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
          href={activeEventId ? `/event/${activeEventId}/view` : "/my-events"}
          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          <HelpCircle size={19} />
          Live View Event
        </Link>
      </div>
    </aside>
  );
}

function SidebarItem({
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

function ActiveEventCard({ event }: { event: EventItem | null }) {
  return (
    <div className="absolute left-5 top-5 z-10 w-[calc(100%-40px)] max-w-[380px] rounded-[1.5rem] border border-slate-200 bg-white/95 p-5 shadow-xl backdrop-blur">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        Event Aktif
      </p>

      <div className="mt-3 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
          <Bike size={25} />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-black text-slate-950">
            {getEventTitle(event)}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {formatDate(event?.event_date)} • {event?.location || "Lokasi menyusul"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase text-green-700">
          {normalizeStatus(event?.status)}
        </span>

        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">
          {event?.participant_count || 0}/{event?.quota || 0} Peserta
        </span>
      </div>
    </div>
  );
}

function MapMockup() {
  const checkpointPoints = [
    { x: 155, y: 525, label: "S" },
    { x: 315, y: 465, label: "1" },
    { x: 455, y: 382, label: "2" },
    { x: 592, y: 302, label: "3" },
    { x: 720, y: 216, label: "4" },
    { x: 846, y: 130, label: "F" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#eef3f1]">
      <div className="absolute inset-0 opacity-[0.55]">
        <div className="h-full w-full bg-[linear-gradient(90deg,rgba(100,116,139,.14)_1px,transparent_1px),linear-gradient(0deg,rgba(100,116,139,.14)_1px,transparent_1px)] bg-[size:44px_44px]" />
      </div>

      <div className="absolute -left-24 top-4 h-[760px] w-[760px] rounded-full border border-slate-300/60" />
      <div className="absolute left-[28%] -top-28 h-[640px] w-[640px] rounded-full border border-slate-300/50" />
      <div className="absolute bottom-10 right-2 h-[520px] w-[520px] rounded-full border border-slate-300/50" />
      <div className="absolute left-[12%] top-[18%] h-[380px] w-[720px] rotate-[-13deg] rounded-[100%] border border-slate-300/40" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 700"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M155 525 C226 511 255 455 315 465 C390 478 381 372 455 382 C530 394 520 295 592 302 C650 310 650 210 720 216 C778 222 780 132 846 130"
          fill="none"
          stroke="#7e22ce"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M155 525 C226 511 255 455 315 465 C390 478 381 372 455 382 C530 394 520 295 592 302 C650 310 650 210 720 216 C778 222 780 132 846 130"
          fill="none"
          stroke="#a855f7"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {checkpointPoints.map((point) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r={19}
              fill="white"
              stroke="#7e22ce"
              strokeWidth="3"
            />
            <text
              x={point.x}
              y={point.y + 6}
              textAnchor="middle"
              fontSize="16"
              fontWeight="900"
              fill="#7e22ce"
            >
              {point.label}
            </text>
          </g>
        ))}

        <g>
          <circle cx="540" cy="335" r="42" fill="#2563eb" opacity="0.18" />
          <circle cx="540" cy="335" r="20" fill="#2563eb" />
          <path
            d="M540 313 L557 363 L540 351 L523 363 Z"
            fill="white"
            transform="rotate(35 540 335)"
          />
        </g>
      </svg>

      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/25" />
      <MapLabel className="left-[25%] top-[20%]" label="Karanglewas" />
      <MapLabel className="left-[63%] top-[24%]" label="Kalisari" />
      <MapLabel className="right-[18%] top-[31%]" label="Purwokerto" />
      <MapLabel className="bottom-[20%] left-[38%]" label="Baturraden" />
    </div>
  );
}

function MapLabel({ label, className }: { label: string; className: string }) {
  return (
    <div
      className={`absolute rounded-full bg-white/60 px-3 py-1 text-xs font-bold text-slate-400 ${className}`}
    >
      {label}
    </div>
  );
}

function MapToolButton({
  icon: Icon,
  label,
}: {
  icon: ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white/95 text-slate-700 shadow-sm backdrop-blur hover:bg-white"
      title={label}
    >
      <Icon size={20} />
    </button>
  );
}

function NearbyParticipants({ events }: { events: EventItem[] }) {
  return (
    <div className="absolute bottom-5 left-5 z-10 hidden w-[340px] rounded-[1.5rem] border border-slate-200 bg-white/95 p-5 shadow-xl backdrop-blur md:block">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-slate-950">
          My Events ({events.length})
        </p>

        <UsersRound size={18} className="text-purple-700" />
      </div>

      {events.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-center">
          <p className="text-sm font-black text-slate-950">
            Belum ada event
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Join event untuk membuka akses tracking.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {events.slice(0, 5).map((event, index) => (
            <Link
              key={String(event.id)}
              href={`/my-events/${event.id}`}
              className={`flex items-center justify-between rounded-2xl p-3 ${
                index === 0 ? "bg-purple-50" : "bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-purple-700 ring-1 ring-purple-100">
                  {index + 1}
                </div>

                <div>
                  <p className="line-clamp-1 text-sm font-black text-slate-950">
                    {getEventTitle(event)}
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    {formatDate(event.event_date)} • {event.location || "-"}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-black uppercase text-green-700">
                {normalizeStatus(event.status)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function TrackingControlCard({ activeEvent }: { activeEvent: EventItem | null }) {
  return (
    <div className="absolute bottom-5 left-1/2 z-20 hidden w-[520px] -translate-x-1/2 rounded-[1.5rem] border border-slate-200 bg-white/95 p-5 shadow-xl backdrop-blur xl:block">
      <p className="text-center text-xs font-black uppercase tracking-wide text-slate-500">
        Tracking Account
      </p>

      <div className="mt-3 flex items-center justify-center gap-6">
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700"
          >
            <Activity size={24} />
          </button>
          <span className="mt-2 text-xs font-bold text-slate-500">Status</span>
        </div>

        <div className="flex flex-col items-center">
          <Link
            href={activeEvent ? `/event/${activeEvent.id}/view` : "/events"}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-700 text-white"
          >
            <Navigation size={28} />
          </Link>
          <span className="mt-2 text-xs font-bold text-slate-500">Live</span>
        </div>

        <div className="flex flex-col items-center">
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700"
          >
            <MapPin size={24} />
          </button>
          <span className="mt-2 text-xs font-bold text-slate-500">Route</span>
        </div>
      </div>

      <p className="mt-3 text-center text-sm leading-6 text-slate-500">
        Dashboard tracking pribadi. Start/stop tracking tetap dari aplikasi Android.
      </p>
    </div>
  );
}

function RealtimeStats({
  activeEvent,
  eventCount,
}: {
  activeEvent: EventItem | null;
  eventCount: number;
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-950">
          Statistik Ringkas
        </h3>

        <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Standby
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200">
        <StatCell label="Event" value={String(eventCount)} unit="total" />
        <StatCell
          label="Jarak"
          value={formatDistance(activeEvent?.distance_km)}
          unit="km"
        />
        <StatCell label="Speed" value={formatSpeed(null)} unit="km/h" />
        <StatCell
          label="Peserta"
          value={String(activeEvent?.participant_count || 0)}
          unit="orang"
        />
      </div>
    </section>
  );
}

function StatCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="border-b border-r border-slate-200 p-5 last:border-r-0">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{unit}</p>
    </div>
  );
}

function RouteProgress({ activeEvent }: { activeEvent: EventItem | null }) {
  const participantCount = Number(activeEvent?.participant_count || 0);
  const quota = Number(activeEvent?.quota || 0);
  const progress = calculatePercent(participantCount, quota || 1);

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-950">Progress Event</h3>
        <p className="text-sm font-black text-slate-500">{progress}%</p>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-purple-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <MiniStat label="Peserta" value={String(participantCount)} />
        <MiniStat label="Kuota" value={quota ? String(quota) : "-"} />
        <MiniStat label="Hadiah" value={String(activeEvent?.doorprize_count || 0)} />
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-black text-slate-950">Check Point</p>
          <p className="text-sm font-bold text-slate-500">0 / 6</p>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="flex flex-1 items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                  item === 1
                    ? "bg-purple-700 text-white"
                    : "border border-slate-200 bg-white text-slate-400"
                }`}
              >
                {item}
              </div>
              {item < 6 ? <div className="h-px flex-1 bg-slate-200" /> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-center">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase text-slate-500">
        {label}
      </p>
    </div>
  );
}

function MyEventsMiniPanel({ events }: { events: EventItem[] }) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-950">My Events</h3>

        <Link
          href="/my-events"
          className="text-sm font-black text-purple-700 hover:text-purple-800"
        >
          Semua
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-black text-slate-950">
            Belum ada event
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {events.slice(0, 4).map((event) => (
            <Link
              key={String(event.id)}
              href={`/my-events/${event.id}`}
              className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 hover:bg-purple-50"
            >
              <div>
                <p className="line-clamp-1 text-sm font-black text-slate-950">
                  {getEventTitle(event)}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {formatDate(event.event_date)}
                </p>
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-black uppercase text-green-700">
                {normalizeStatus(event.status)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function ShortcutPanel({ activeEventId }: { activeEventId?: number | string }) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-slate-950">Pintasan</h3>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <ShortcutLink
          href={activeEventId ? `/event/${activeEventId}/view` : "/my-events"}
          icon={Navigation}
          label="Live"
        />
        <ShortcutLink
          href={activeEventId ? `/events/${activeEventId}/results` : "/events"}
          icon={Trophy}
          label="Results"
        />
        <ShortcutLink
          href={activeEventId ? `/events/${activeEventId}/doorprize` : "/events"}
          icon={Gift}
          label="Doorprize"
        />
      </div>
    </section>
  );
}

function ShortcutLink({
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
