"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Box,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Gauge,
  Gift,
  Home,
  List,
  Loader2,
  LocateFixed,
  LogOut,
  MapPin,
  Maximize2,
  Menu,
  Navigation,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Signal,
  Star,
  Ticket,
  Trophy,
  User,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

type PublicEvent = {
  id: number | string;
  title?: string | null;
  event_title?: string | null;
  name?: string | null;
  event_date?: string | null;
  location?: string | null;
  participant_count?: number | string | null;
  quota?: number | string | null;
  status?: string | null;
};

type EventResult = {
  result_id?: number | string;
  event_id?: number | string;
  user_id?: number | string;
  full_name?: string | null;
  email?: string | null;
  participant_number?: string | null;
  distance?: number | string | null;
  duration?: number | string | null;
  avg_speed?: number | string | null;
  result_status?: string | null;
  submitted_at?: string | null;
};

type LiveMarker = {
  position_id?: string | null;
  event_id?: string | null;
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  participant_number?: string | null;
  lat: number;
  lng: number;
  speed_kmh?: number | null;
  distance_km?: number | null;
  updated_at?: string | null;
  status?: string | null;
  seconds_ago?: number | null;
  is_online?: boolean;
  projected?: { x: number; y: number };
};

type StandbyParticipant = {
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  participant_number?: string | null;
  registration_status?: string | null;
  registered_at?: string | null;
};

type RoutePoint = {
  lat: number;
  lng: number;
};

type CurrentUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

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

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDistance(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return "0.00 KM";
  return `${numberValue.toFixed(2)} KM`;
}

function formatSpeed(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return "-";
  return `${numberValue.toFixed(1)} km/jam`;
}

function formatSecondsAgo(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  if (value < 60) return `${value} dtk`;
  if (value < 3600) return `${Math.floor(value / 60)} mnt`;
  return `${Math.floor(value / 3600)} jam`;
}

function getEventTitle(event: PublicEvent | null, eventId: string) {
  return String(event?.title || event?.event_title || event?.name || "").trim() || `Event #${eventId}`;
}

function calculatePercent(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

function initialsFrom(name?: string | null, email?: string | null) {
  const source = String(name || email || "AMOST").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function buildBounds(points: Array<{ lat: number; lng: number }>) {
  const valid = points.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
  if (valid.length === 0) return null;

  let minLat = valid[0].lat;
  let maxLat = valid[0].lat;
  let minLng = valid[0].lng;
  let maxLng = valid[0].lng;

  for (const point of valid) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }

  const latPadding = Math.max((maxLat - minLat) * 0.18, 0.0005);
  const lngPadding = Math.max((maxLng - minLng) * 0.18, 0.0005);

  return {
    minLat: minLat - latPadding,
    maxLat: maxLat + latPadding,
    minLng: minLng - lngPadding,
    maxLng: maxLng + lngPadding,
  };
}

function projectPoint(point: { lat: number; lng: number }, bounds: ReturnType<typeof buildBounds>) {
  if (!bounds) return { x: 50, y: 50 };
  const lngRange = bounds.maxLng - bounds.minLng || 1;
  const latRange = bounds.maxLat - bounds.minLat || 1;
  const x = ((point.lng - bounds.minLng) / lngRange) * 100;
  const y = (1 - (point.lat - bounds.minLat) / latRange) * 100;

  return {
    x: Math.min(96, Math.max(4, x)),
    y: Math.min(96, Math.max(4, y)),
  };
}

export default function AccountEventLiveFullscreenPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || "");

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [results, setResults] = useState<EventResult[]>([]);
  const [liveMarkers, setLiveMarkers] = useState<LiveMarker[]>([]);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [standbyParticipants, setStandbyParticipants] = useState<StandbyParticipant[]>([]);
  const [participantTotal, setParticipantTotal] = useState(0);
  const [liveMessage, setLiveMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<CurrentUser>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const title = getEventTitle(event, eventId);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const stats = useMemo(() => {
    const participantCount = Number(event?.participant_count || participantTotal || 0);
    const finishCount = results.filter((item) => String(item.result_status || "").toUpperCase() === "FINISH").length;
    const onlineCount = liveMarkers.filter((item) => item.is_online).length;

    return {
      participantCount,
      finishCount,
      liveCount: liveMarkers.length,
      onlineCount,
      standbyCount: standbyParticipants.length,
      progress: calculatePercent(finishCount, participantCount || 1),
    };
  }, [event, participantTotal, results, liveMarkers, standbyParticipants.length]);

  const projected = useMemo(() => {
    const allPoints = [
      ...routePoints.map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) })),
      ...liveMarkers.map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) })),
    ];

    const bounds = buildBounds(allPoints);
    const routePath = routePoints
      .map((point, index) => {
        const projectedPoint = projectPoint(point, bounds);
        return `${index === 0 ? "M" : "L"} ${projectedPoint.x.toFixed(2)} ${projectedPoint.y.toFixed(2)}`;
      })
      .join(" ");

    const markers = liveMarkers.map((marker) => ({
      ...marker,
      projected: projectPoint(marker, bounds),
    }));

    return { routePath, markers };
  }, [routePoints, liveMarkers]);

  async function loadData(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setErrorMessage("");
    setLiveMessage("");

    try {
      const [eventResponse, resultsResponse, liveResponse, accountResponse] = await Promise.all([
        fetch(`/api/events/${eventId}`, { method: "GET", cache: "no-store", credentials: "include" }),
        fetch(`/api/events/${eventId}/results`, { method: "GET", cache: "no-store", credentials: "include" }).catch(() => null),
        fetch(`/api/events/${eventId}/live`, { method: "GET", cache: "no-store", credentials: "include" }).catch(() => null),
        fetch("/api/account/tracking", { method: "GET", cache: "no-store", credentials: "include" }).catch(() => null),
      ]);

      const eventData = await eventResponse.json().catch(() => null);

      if (eventResponse.status === 401) {
        router.replace(`/login?next=/account/events/${eventId}/view`);
        return;
      }

      if (!eventResponse.ok || eventData?.ok === false) {
        setErrorMessage(eventData?.message || eventData?.error || "Event belum bisa dimuat.");
        return;
      }

      setEvent(eventData?.event || eventData?.data || null);

      if (resultsResponse) {
        const resultsData = await resultsResponse.json().catch(() => null);
        setResults(Array.isArray(resultsData?.data) ? resultsData.data : Array.isArray(resultsData?.items) ? resultsData.items : []);
      }

      if (liveResponse) {
        const liveData = await liveResponse.json().catch(() => null);
        setLiveMarkers(Array.isArray(liveData?.data) ? liveData.data : Array.isArray(liveData?.items) ? liveData.items : []);
        setRoutePoints(Array.isArray(liveData?.route_points) ? liveData.route_points : []);
        setStandbyParticipants(Array.isArray(liveData?.standby_participants) ? liveData.standby_participants : []);
        setParticipantTotal(Number(liveData?.participant_total || 0));
        setLiveMessage(liveData?.debug?.reason || liveData?.message || "");
      }

      if (accountResponse) {
        const accountData = await accountResponse.json().catch(() => null);
        setCurrentUser({
          name: accountData?.user?.name || accountData?.user?.username || accountData?.user?.email || null,
          email: accountData?.user?.email || null,
          role: accountData?.user?.role || null,
        });
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (eventId) void loadData();
  }, [eventId]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-slate-50 text-slate-950">
      <LeftDrawer open={leftOpen} onClose={() => setLeftOpen(false)} />
      <RightDrawer
        open={rightOpen}
        onClose={() => setRightOpen(false)}
        user={currentUser}
        stats={stats}
        eventId={eventId}
        results={results}
      />

      <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-7">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={() => setLeftOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-purple-50 hover:text-purple-700"
          >
            <Menu size={18} />
            Maximize Sidebar Kiri
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black tracking-tight text-slate-950">Tracking Live</h1>
            <p className="truncate text-sm font-semibold text-slate-500">Live tracking event {title}.</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <StatusPill icon={Signal} title="GPS Signal" subtitle="Standby" />
          <StatusPill icon={CloudSun} title="26°C" subtitle="Cerah" />
          <TopIcon icon={Search} />
          <TopIcon icon={Bell} badge="3" />
          <button
            type="button"
            onClick={() => loadData(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={refreshing ? "animate-spin" : ""} size={17} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setRightOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-purple-50 hover:text-purple-700"
          >
            Maximize Sidebar Kanan
            <Maximize2 size={17} />
          </button>

          <div className="hidden items-center gap-3 rounded-2xl bg-purple-50 px-3 py-2 lg:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-700 text-sm font-black text-white">
              {initialsFrom(currentUser.name, currentUser.email)}
            </div>
            <div className="leading-tight">
              <p className="max-w-[140px] truncate text-sm font-black text-slate-950">
                {currentUser.name || "AMOST User"}
              </p>
              <p className="text-xs font-black text-purple-700">{currentUser.role || "Umum"}</p>
            </div>
          </div>

          <Link
            href="/logout"
            className="hidden h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800 lg:inline-flex"
          >
            <LogOut size={17} />
            Keluar
          </Link>
        </div>
      </header>

      <section className="h-[calc(100vh-76px)] overflow-hidden p-4 lg:p-5">
        {loading ? (
          <section className="flex h-full flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white text-center shadow-sm">
            <Loader2 className="h-12 w-12 animate-spin text-purple-700" />
            <p className="mt-4 text-xl font-black text-slate-950">Memuat live tracking...</p>
            <p className="mt-2 text-sm text-slate-500">Mengambil data event, result, dan posisi live.</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm font-black text-red-700">
            {errorMessage}
          </section>
        ) : (
          <div className="flex h-full min-h-0 flex-col gap-4">
            <section className="flex-none rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-purple-700">Peta Live Tracking</p>
                <div className="flex items-center gap-2">
                  <CompactStat label="Peserta" value={stats.participantCount} />
                  <CompactStat label="Live" value={stats.liveCount} />
                  <CompactStat label="Standby" value={stats.standbyCount} />
                </div>
              </div>

              <section className="relative h-[310px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#eaf1f0]">
                <MapBackground />

                <div className="absolute left-4 top-1/2 z-10 flex -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <button className="flex h-10 w-10 items-center justify-center border-b border-slate-200 text-lg font-black text-slate-700">+</button>
                  <button className="flex h-10 w-10 items-center justify-center border-b border-slate-200 text-lg font-black text-slate-700">-</button>
                  <button className="flex h-10 w-10 items-center justify-center text-slate-700">
                    <LocateFixed size={17} />
                  </button>
                </div>

                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {projected.routePath ? (
                    <>
                      <path d={projected.routePath} fill="none" stroke="rgba(126, 34, 206, 0.95)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                      <path d={projected.routePath} fill="none" stroke="rgba(255, 255, 255, 0.9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.6" />
                    </>
                  ) : null}
                </svg>

                {projected.markers.map((marker) => (
                  <LiveMarkerBubble key={String(marker.position_id || marker.user_id || `${marker.lat}-${marker.lng}`)} marker={marker} />
                ))}

                {liveMarkers.length === 0 ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center px-8">
                    <div className="max-w-xl rounded-[1.5rem] bg-white/78 p-7 text-center backdrop-blur">
                      <MapPin className="mx-auto h-11 w-11 text-purple-700" />
                      <h2 className="mt-4 text-2xl font-black text-slate-950">Belum ada posisi live.</h2>
                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                        Peserta event sudah dapat muncul sebagai Standby, tetapi marker peta baru tampil setelah Android mengirim lat/lng ke live_tracking_positions.
                      </p>
                      <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500">
                        <Box size={15} />
                        {liveMessage || "Belum ada data live tracking untuk event ini."}
                      </p>
                    </div>
                  </div>
                ) : null}
              </section>
            </section>

            <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <Panel title="Daftar Posisi Live" badge={`${liveMarkers.length} data`}>
                {liveMarkers.length === 0 ? (
                  <EmptyState text="Belum ada data live tracking." />
                ) : (
                  <LiveTable rows={liveMarkers} />
                )}
              </Panel>

              <Panel title="Peserta Standby" badge={`${standbyParticipants.length} standby`} badgeClass="bg-yellow-50 text-yellow-700">
                {standbyParticipants.length === 0 ? (
                  <EmptyState text="Tidak ada peserta standby." />
                ) : (
                  <StandbyTable rows={standbyParticipants} />
                )}
              </Panel>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function MapBackground() {
  return (
    <div className="absolute inset-0 opacity-90">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.07)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(34,197,94,0.12),transparent_25%),radial-gradient(circle_at_82%_20%,rgba(59,130,246,0.12),transparent_22%),radial-gradient(circle_at_53%_70%,rgba(124,58,237,0.15),transparent_26%)]" />
      <div className="absolute left-0 top-[18%] h-8 w-full rotate-[-4deg] bg-white/45" />
      <div className="absolute left-[-10%] top-[55%] h-7 w-[120%] rotate-[8deg] bg-white/40" />
      <div className="absolute left-[12%] top-0 h-full w-8 rotate-[12deg] bg-white/35" />
    </div>
  );
}

function CompactStat({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
      {label}: {value}
    </span>
  );
}

function Panel({
  title,
  badge,
  badgeClass = "bg-slate-100 text-slate-600",
  children,
}: {
  title: string;
  badge: string;
  badgeClass?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-col rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${badgeClass}`}>{badge}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-[150px] flex-col items-center justify-center rounded-2xl bg-slate-50 text-center">
      <Box className="text-slate-300" size={30} />
      <p className="mt-3 text-sm font-bold text-slate-500">{text}</p>
    </div>
  );
}

function InfoBox({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: string;
  accent?: "slate" | "green";
}) {
  const cls = accent === "green" ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-950";

  return (
    <div className={`rounded-2xl p-3 ${cls}`}>
      <p className="text-[10px] font-black uppercase opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function StatusPill({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="hidden h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 lg:flex">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-700">
        <Icon size={16} />
      </div>
      <div className="leading-tight">
        <p className="text-xs font-black text-slate-950">{title}</p>
        <p className="text-[11px] font-bold text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function TopIcon({ icon: Icon, badge }: { icon: any; badge?: string }) {
  return (
    <button className="relative hidden h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:flex">
      <Icon size={18} />
      {badge ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-700 px-1 text-[10px] font-black text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function LeftDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = [
    { href: "/account", icon: Home, label: "Dashboard" },
    { href: "/account/tracking", icon: Navigation, label: "Tracking" },
    { href: "/account/activities", icon: Activity, label: "My Activities" },
    { href: "/account/events", icon: CalendarDays, label: "My Events" },
    { href: "/account/tickets", icon: Ticket, label: "My Tickets" },
    { href: "/account/achievement", icon: Star, label: "Achievement" },
    { href: "/account/statistics", icon: Gauge, label: "Statistics" },
    { href: "/account/notification", icon: Bell, label: "Notification" },
    { href: "/account/profile", icon: User, label: "Profile" },
    { href: "/account/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <>
      {open ? <button className="fixed inset-0 z-40 bg-slate-950/20" onClick={onClose} aria-label="Tutup sidebar kiri" /> : null}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[285px] border-r border-slate-200 bg-white p-6 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/account" className="text-3xl font-black tracking-tight text-purple-700">
            AMOST
          </Link>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700">
            <ChevronLeft size={20} />
          </button>
        </div>

        <nav className="mt-8 space-y-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-black text-slate-700 hover:bg-purple-50 hover:text-purple-700"
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-purple-50 p-4">
          <p className="text-sm font-black text-purple-800">Tracking lebih seru</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
            Undang teman dan ikuti lebih banyak event.
          </p>
        </div>
      </aside>
    </>
  );
}

function RightDrawer({
  open,
  onClose,
  user,
  stats,
  eventId,
  results,
}: {
  open: boolean;
  onClose: () => void;
  user: CurrentUser;
  stats: {
    participantCount: number;
    finishCount: number;
    liveCount: number;
    onlineCount: number;
    standbyCount: number;
    progress: number;
  };
  eventId: string;
  results: EventResult[];
}) {
  return (
    <>
      {open ? <button className="fixed inset-0 z-40 bg-slate-950/20" onClick={onClose} aria-label="Tutup sidebar kanan" /> : null}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-[360px] border-l border-slate-200 bg-white p-5 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-950">Sidebar Kanan</h2>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700">
            <ChevronRight size={20} />
          </button>
        </div>

        <section className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-5 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-700 text-2xl font-black text-white">
            {initialsFrom(user.name, user.email)}
          </div>
          <h3 className="mt-4 text-xl font-black text-slate-950">{user.name || "AMOST User"}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{user.email || "-"}</p>
          <span className="mt-3 inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">
            {user.role || "Umum"}
          </span>
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-950">Ringkasan Live</h3>
            <Zap className="text-purple-700" size={20} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <InfoBox label="Peserta" value={String(stats.participantCount)} />
            <InfoBox label="Live" value={String(stats.liveCount)} />
            <InfoBox label="Online" value={String(stats.onlineCount)} accent="green" />
            <InfoBox label="Standby" value={String(stats.standbyCount)} />
            <InfoBox label="Finish" value={String(stats.finishCount)} />
            <InfoBox label="Progress" value={`${stats.progress}%`} />
          </div>

          <Link
            href={`/account/events/${eventId}/results`}
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            <Trophy size={16} />
            Hasil Event
          </Link>
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-950">Live/Result Ringkas</h3>
            <List className="text-purple-700" size={20} />
          </div>

          {results.length === 0 ? (
            <div className="flex min-h-[130px] flex-col items-center justify-center text-center">
              <p className="text-sm font-black text-slate-950">Belum ada hasil.</p>
              <p className="mt-2 max-w-[220px] text-sm leading-6 text-slate-500">
                Hasil peserta tampil setelah event selesai dan data dikirim.
              </p>
            </div>
          ) : (
            <div className="mt-3 max-h-[180px] space-y-2 overflow-auto pr-1">
              {results.slice(0, 6).map((item) => (
                <div key={String(item.result_id || `${item.user_id}-${item.event_id}`)} className="rounded-2xl bg-slate-50 p-3">
                  <p className="truncate text-sm font-black text-slate-950">{item.full_name || "Peserta AMOST"}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {item.participant_number || "-"} · {formatDistance(item.distance)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </aside>
    </>
  );
}

function LiveMarkerBubble({ marker }: { marker: LiveMarker }) {
  const x = marker.projected?.x ?? 50;
  const y = marker.projected?.y ?? 50;

  const initials =
    String(marker.full_name || "A")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase())
      .join("") || "A";

  return (
    <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className={`relative flex h-12 w-12 items-center justify-center rounded-full border-4 border-white text-xs font-black text-white shadow-xl ${
        marker.is_online ? "bg-green-600" : "bg-slate-500"
      }`}>
        {initials}
      </div>
    </div>
  );
}

function LiveTable({ rows }: { rows: LiveMarker[] }) {
  return (
    <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
      <thead className="sticky top-0 z-10 bg-white">
        <tr className="text-[11px] font-black uppercase tracking-wide text-slate-400">
          <th className="px-3 py-2">No</th>
          <th className="px-3 py-2">Nomor</th>
          <th className="px-3 py-2">Nama</th>
          <th className="px-3 py-2">Status</th>
          <th className="px-3 py-2">Update</th>
          <th className="px-3 py-2">Koordinat</th>
          <th className="px-3 py-2">Jarak</th>
          <th className="px-3 py-2">Speed</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((item, index) => (
          <tr key={String(item.position_id || `${item.user_id}-${item.event_id}`)} className="bg-slate-50 text-sm">
            <td className="rounded-l-2xl px-3 py-3 font-black text-slate-500">{index + 1}</td>
            <td className="px-3 py-3 font-black text-purple-700">{item.participant_number || "-"}</td>
            <td className="px-3 py-3">
              <p className="font-black text-slate-950">{item.full_name || "Peserta AMOST"}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">{item.email || "-"}</p>
            </td>
            <td className="px-3 py-3">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${
                item.is_online ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-700"
              }`}>
                {item.is_online ? <Wifi size={12} /> : <WifiOff size={12} />}
                {item.is_online ? "ONLINE" : "OFFLINE"}
              </span>
            </td>
            <td className="px-3 py-3 text-xs font-semibold text-slate-600">
              {formatDateTime(item.updated_at)} · {formatSecondsAgo(item.seconds_ago)}
            </td>
            <td className="px-3 py-3 text-xs font-semibold text-slate-600">
              {Number(item.lat).toFixed(5)}, {Number(item.lng).toFixed(5)}
            </td>
            <td className="px-3 py-3 font-black text-slate-950">{formatDistance(item.distance_km)}</td>
            <td className="rounded-r-2xl px-3 py-3 text-xs font-semibold text-slate-600">{formatSpeed(item.speed_kmh)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StandbyTable({ rows }: { rows: StandbyParticipant[] }) {
  return (
    <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left">
      <thead className="sticky top-0 z-10 bg-white">
        <tr className="text-[11px] font-black uppercase tracking-wide text-slate-400">
          <th className="px-3 py-2">No</th>
          <th className="px-3 py-2">Nomor</th>
          <th className="px-3 py-2">Nama Peserta</th>
          <th className="px-3 py-2">Status</th>
          <th className="px-3 py-2">Terdaftar</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((item, index) => (
          <tr key={String(item.user_id || index)} className="bg-slate-50 text-sm">
            <td className="rounded-l-2xl px-3 py-3 font-black text-slate-500">{index + 1}</td>
            <td className="px-3 py-3 font-black text-purple-700">{item.participant_number || "-"}</td>
            <td className="px-3 py-3">
              <p className="font-black text-slate-950">{item.full_name || "Peserta AMOST"}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">{item.email || "-"}</p>
            </td>
            <td className="px-3 py-3">
              <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-[11px] font-black uppercase text-yellow-700">
                Standby
              </span>
            </td>
            <td className="rounded-r-2xl px-3 py-3 text-xs font-semibold text-slate-600">{formatDateTime(item.registered_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
