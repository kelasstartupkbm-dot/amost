"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ElementType } from "react";
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
  MapPin,
  Medal,
  MessageCircle,
  Navigation,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  Trophy,
  UserRound,
  UsersRound,
  Wifi,
} from "lucide-react";

type CurrentUser = {
  id?: number | string;
  fullName?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  role?: string | null;
  role_id?: number | string | null;
  roleId?: number | string | null;
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
};

type OfficialAccess = {
  id?: number | string;
  event_id?: number | string;
  event_title?: string | null;
  event_name?: string | null;
  permission_level?: string | null;
  status?: string | null;
};

type FeedPost = {
  id: string;
  author: string;
  roleLabel: string;
  avatarLabel: string;
  type: "activity" | "event" | "result" | "doorprize" | "official";
  title: string;
  body: string;
  meta: string;
  statA?: string;
  statB?: string;
  statC?: string;
  actionHref?: string;
  actionLabel?: string;
  likes: number;
  comments: number;
};

type AccountTab = "feed" | "tracking" | "events" | "results" | "doorprize";

const REQUEST_TIMEOUT_MS = 8000;

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      credentials: "include",
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    return { response, data };
  } finally {
    window.clearTimeout(timer);
  }
}

function getFetchErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Server terlalu lama merespons. Silakan refresh halaman.";
  }

  return "Koneksi ke server bermasalah. Silakan refresh halaman.";
}

function getDisplayName(user: CurrentUser | null) {
  const clean = String(user?.fullName || user?.name || user?.username || "").trim();

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

function normalizeRole(value: unknown) {
  return String(value || "umum").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function formatRole(role: string | null | undefined) {
  const clean = normalizeRole(role);

  if (clean === "super_admin") return "Super Admin";
  if (clean === "staff_amost") return "Staff AMOST";
  if (clean === "umum") return "Umum";

  return clean
    .split("_")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function isSuperAdmin(user: CurrentUser | null) {
  const role = normalizeRole(user?.role);
  const roleId = Number(user?.role_id || user?.roleId || 0);

  return role === "super_admin" || roleId === 1;
}

function isStaffAmost(user: CurrentUser | null) {
  const role = normalizeRole(user?.role);
  const roleId = Number(user?.role_id || user?.roleId || 0);

  return role === "staff_amost" || roleId === 2;
}

function getEventTitle(event: EventItem | null | undefined) {
  return String(event?.title || event?.event_title || event?.name || "Event AMOST").trim();
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

function getStatusClass(status: string | null | undefined) {
  const normalized = normalizeStatus(status).toLowerCase();

  if (normalized === "aktif" || normalized === "live") return "bg-green-50 text-green-700";
  if (normalized === "segera") return "bg-blue-50 text-blue-700";
  if (normalized === "selesai") return "bg-slate-100 text-slate-700";

  return "bg-purple-50 text-purple-700";
}

function buildFeedPosts(
  user: CurrentUser,
  events: EventItem[],
  officialAccess: OfficialAccess[],
): FeedPost[] {
  const displayName = getDisplayName(user);
  const roleLabel = formatRole(user.role);
  const initials = getInitials(displayName);
  const firstEvent = events[0] || null;
  const secondEvent = events[1] || null;
  const eventTitle = getEventTitle(firstEvent);
  const secondEventTitle = getEventTitle(secondEvent);

  const posts: FeedPost[] = [
    {
      id: "welcome-feed",
      author: "AMOST Official",
      roleLabel: "Official Update",
      avatarLabel: "A",
      type: "official",
      title: "Selamat datang di AMOST Community Feed",
      body:
        "Dashboard account menampilkan update tracking, event aktif, hasil, doorprize, dan shortcut ke Live View.",
      meta: "Baru saja",
      statA: "Community",
      statB: "Tracking",
      statC: "Event",
      actionHref: "/account/live-view",
      actionLabel: "Buka Live View",
      likes: 24,
      comments: 3,
    },
    {
      id: "user-tracking",
      author: displayName,
      roleLabel,
      avatarLabel: initials,
      type: "activity",
      title: "Tracking Dashboard sudah aktif",
      body:
        "Start dan stop tracking tetap dilakukan dari aplikasi Android AMOST. Website menampilkan ringkasan, event, live view, result, dan doorprize.",
      meta: "Hari ini",
      statA: `${events.length} Event`,
      statB: "Standby",
      statC: "Ready",
      actionHref: "/account/tracking",
      actionLabel: "Lihat Tracking",
      likes: 8,
      comments: 1,
    },
  ];

  if (firstEvent) {
    posts.push({
      id: `event-${firstEvent.id}`,
      author: "AMOST Event",
      roleLabel: "Event Update",
      avatarLabel: "E",
      type: "event",
      title: eventTitle,
      body: `${eventTitle} tersedia di AMOST. Peserta dapat membuka Detail Event, Live View Tracking, Results, dan Doorprize.`,
      meta: `${formatDate(firstEvent.event_date)} • ${firstEvent.location || "Lokasi menyusul"}`,
      statA: `${firstEvent.participant_count || 0}/${firstEvent.quota || 0} Peserta`,
      statB: normalizeStatus(firstEvent.status),
      statC: `${firstEvent.doorprize_count || 0} Hadiah`,
      actionHref: `/account/events/${firstEvent.id}/view`,
      actionLabel: "Live View Tracking",
      likes: 17,
      comments: 2,
    });
  }

  if (secondEvent) {
    posts.push({
      id: `event-${secondEvent.id}`,
      author: "AMOST Event",
      roleLabel: "Event Update",
      avatarLabel: "E",
      type: "event",
      title: secondEventTitle,
      body: `${secondEventTitle} masuk dalam daftar event AMOST. Timeline ini dapat menampilkan aktivitas peserta yang join atau finish event.`,
      meta: `${formatDate(secondEvent.event_date)} • ${secondEvent.location || "Lokasi menyusul"}`,
      statA: `${secondEvent.participant_count || 0}/${secondEvent.quota || 0} Peserta`,
      statB: normalizeStatus(secondEvent.status),
      statC: "Open",
      actionHref: `/events/${secondEvent.id}`,
      actionLabel: "Detail Event",
      likes: 12,
      comments: 1,
    });
  }

  if (officialAccess.length > 0) {
    const firstAccess = officialAccess[0];
    const officialEventTitle =
      firstAccess.event_title || firstAccess.event_name || `Event #${firstAccess.event_id}`;

    posts.push({
      id: `official-${firstAccess.id || firstAccess.event_id}`,
      author: displayName,
      roleLabel: "Official Event",
      avatarLabel: initials,
      type: "official",
      title: `Menjadi official untuk ${officialEventTitle}`,
      body:
        "Akun ini memiliki akses Official Event. Official dapat memantau peserta, results, dan doorprize untuk event yang ditugaskan.",
      meta: "Akses aktif",
      statA: "Official",
      statB: "Results",
      statC: "Doorprize",
      actionHref: `/official/events/${firstAccess.event_id}`,
      actionLabel: "Buka Panel",
      likes: 19,
      comments: 4,
    });
  }

  posts.push({
    id: "doorprize-demo",
    author: "AMOST Doorprize",
    roleLabel: "Doorprize Update",
    avatarLabel: "D",
    type: "doorprize",
    title: "Doorprize akan tampil di timeline",
    body:
      "Saat official menjalankan undian, pemenang doorprize dapat tampil sebagai update publik di dashboard account peserta.",
    meta: "Konsep fitur",
    statA: "Winner",
    statB: "Prize",
    statC: "Event",
    actionHref: firstEvent ? `/account/events/${firstEvent.id}/doorprize` : "/account/events",
    actionLabel: "Lihat Doorprize",
    likes: 15,
    comments: 2,
  });

  return posts;
}

export default function HomePage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [officialAccess, setOfficialAccess] = useState<OfficialAccess[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountTab>("feed");

  const hasOfficialAccess = officialAccess.length > 0;
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const roleLabel = formatRole(user?.role);
  const activeEvent = events[0] || null;

  const feedPosts = useMemo(() => {
    if (!user) return [];
    return buildFeedPosts(user, events, officialAccess);
  }, [user, events, officialAccess]);

  const filteredPosts = useMemo(() => {
    if (activeTab === "feed") return feedPosts;
    if (activeTab === "tracking") return feedPosts.filter((post) => post.type === "activity");
    if (activeTab === "events") return feedPosts.filter((post) => post.type === "event" || post.type === "official");
    if (activeTab === "results") return feedPosts.filter((post) => post.type === "result" || post.type === "activity");
    if (activeTab === "doorprize") return feedPosts.filter((post) => post.type === "doorprize");
    return feedPosts;
  }, [activeTab, feedPosts]);

  const stats = useMemo(() => {
    const participantTotal = events.reduce((sum, event) => {
      const value = Number(event.participant_count || 0);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    return {
      events: events.length,
      official: officialAccess.length,
      participantTotal,
      doorprize: events.reduce((sum, event) => {
        const value = Number(event.doorprize_count || 0);
        return Number.isFinite(value) ? sum + value : sum;
      }, 0),
    };
  }, [events, officialAccess]);

  async function loadOfficialAccess() {
    try {
      const { response, data } = await fetchJsonWithTimeout(
        "/api/account/event-officials",
        { method: "GET" },
        5000,
      );

      if (!response.ok || data?.ok === false) {
        setOfficialAccess([]);
        return;
      }

      const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
          ? data.items
          : [];

      setOfficialAccess(rows);
    } catch (error) {
      console.error(error);
      setOfficialAccess([]);
    }
  }

  async function loadEvents() {
    try {
      const { response, data } = await fetchJsonWithTimeout(
        "/api/events",
        { method: "GET" },
        6000,
      );

      if (!response.ok || data?.ok === false) {
        setEvents([]);
        return;
      }

      const rows = Array.isArray(data?.events)
        ? data.events
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.items)
            ? data.items
            : [];

      setEvents(rows);
    } catch (error) {
      console.error(error);
      setEvents([]);
    }
  }

  async function loadHome(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setLoadError("");

    try {
      const { response, data } = await fetchJsonWithTimeout(
        "/api/auth/me",
        { method: "GET" },
        6000,
      );

      if (response.status === 401 || !data?.ok || !data?.user) {
        router.replace("/login?next=/home");
        return;
      }

      setUser(data.user);

      await Promise.all([loadEvents(), loadOfficialAccess()]);
    } catch (error) {
      console.error(error);
      setLoadError(getFetchErrorMessage(error));
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
    loadHome();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-slate-950">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-700" />
          <p className="mt-4 text-xl font-black">Memuat Home AMOST...</p>
          <p className="mt-2 text-sm text-slate-500">Mengambil akun, event, dan feed.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <HomeSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <section className="min-h-screen lg:pl-[260px]">
        <HomeTopbar
          title="Home"
          subtitle={`Halo, ${displayName}`}
          initials={initials}
          displayName={displayName}
          roleLabel={roleLabel}
          refreshing={refreshing}
          logoutLoading={logoutLoading}
          onRefresh={() => loadHome(true)}
          onLogout={handleLogout}
          user={user}
          hasOfficialAccess={hasOfficialAccess}
        />

        <section className="grid min-h-[calc(100vh-88px)] grid-cols-1 gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-5">
            {loadError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {loadError}
              </div>
            ) : null}

            <ComposerCard initials={initials} />

            <section className="flex flex-wrap items-center gap-2">
              <FeedTab label="Semua" active={activeTab === "feed"} onClick={() => setActiveTab("feed")} />
              <FeedTab label="Tracking" active={activeTab === "tracking"} onClick={() => setActiveTab("tracking")} />
              <FeedTab label="Events" active={activeTab === "events"} onClick={() => setActiveTab("events")} />
              <FeedTab label="Results" active={activeTab === "results"} onClick={() => setActiveTab("results")} />
              <FeedTab label="Doorprize" active={activeTab === "doorprize"} onClick={() => setActiveTab("doorprize")} />

              <button
                type="button"
                onClick={() => loadHome(true)}
                disabled={refreshing}
                className="ml-auto inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-70"
              >
                <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
                Refresh Feed
              </button>
            </section>

            <section className="space-y-4">
              {filteredPosts.length === 0 ? (
                <section className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <Activity className="mx-auto h-12 w-12 text-slate-300" />
                  <h2 className="mt-4 text-2xl font-black">Belum ada feed.</h2>
                  <p className="mt-2 text-sm text-slate-500">Aktivitas akan muncul setelah ada tracking atau event.</p>
                </section>
              ) : (
                filteredPosts.map((post) => <FeedPostCard key={post.id} post={post} />)
              )}
            </section>
          </section>

          <aside className="space-y-5">
            <ProfileCard initials={initials} displayName={displayName} email={user?.email} roleLabel={roleLabel} />
            <ActiveEventCard activeEvent={activeEvent} />
            <QuickAccessCard activeEvent={activeEvent} />
            <StatsCard stats={stats} />
          </aside>
        </section>
      </section>
    </main>
  );
}

function HomeSidebar({
  activeTab,
  onTabChange,
}: {
  activeTab: AccountTab;
  onTabChange: (tab: AccountTab) => void;
}) {
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
        <SidebarButton
          icon={Home}
          label="Dashboard"
          active={activeTab === "feed"}
          onClick={() => onTabChange("feed")}
        />
        <SidebarLink href="/account/live-view" icon={Map} label="Live View" />
        <SidebarLink href="/account/tracking" icon={Navigation} label="Tracking" />
        <SidebarLink href="/account/activities" icon={History} label="My Activities" />
        <SidebarLink href="/account/events" icon={CalendarDays} label="My Events" />
        <SidebarLink href="/account/tickets" icon={Ticket} label="My Tickets" />
        <SidebarLink href="/account/achievement" icon={Medal} label="Achievement" />
        <SidebarLink href="/account/statistics" icon={Activity} label="Statistics" />
        <SidebarLink href="/account/notification" icon={Bell} label="Notification" />
        <SidebarLink href="/account" icon={UserRound} label="Profile" />
        <SidebarLink href="/account/settings" icon={Settings} label="Settings" />
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
            Live View Event
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
    </aside>
  );
}

function SidebarButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-black transition ${
        active
          ? "bg-purple-50 text-purple-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );
}

function SidebarLink({
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
      prefetch={false}
      className="flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
    >
      <Icon size={20} />
      {label}
    </Link>
  );
}

function HomeTopbar({
  title,
  subtitle,
  initials,
  displayName,
  roleLabel,
  refreshing,
  logoutLoading,
  onRefresh,
  onLogout,
  user,
  hasOfficialAccess,
}: {
  title: string;
  subtitle: string;
  initials: string;
  displayName: string;
  roleLabel: string;
  refreshing: boolean;
  logoutLoading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  user: CurrentUser | null;
  hasOfficialAccess: boolean;
}) {
  const topAction =
    isSuperAdmin(user) || isStaffAmost(user)
      ? { href: "/api/admin-entry", label: isSuperAdmin(user) ? "Control Panel" : "Staff AMOST" }
      : hasOfficialAccess
        ? { href: "/official", label: "Official Event" }
        : null;

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

          {topAction ? (
            <Link
              href={topAction.href}
              prefetch={false}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-purple-700 px-4 text-sm font-black text-white hover:bg-purple-800"
            >
              <ShieldCheck size={17} />
              {topAction.label}
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
              <p className="text-sm font-black leading-none text-slate-950">{displayName}</p>
              <p className="mt-1 text-xs font-bold leading-none text-purple-700">{roleLabel}</p>
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

function ComposerCard({ initials }: { initials: string }) {
  return (
    <section className="rounded-[2rem] border border-purple-100 bg-white p-6 shadow-sm">
      <div className="rounded-2xl bg-purple-50 px-4 py-3 text-xs font-black uppercase tracking-[0.24em] text-purple-700">
        Database Feed Aktif · Foto · Aktivitas · Lokasi · Komentar
      </div>

      <div className="mt-5 flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-700 text-sm font-black text-white">
          {initials}
        </div>

        <div className="flex-1">
          <div className="min-h-[88px] rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-400">
            Bagikan update aktivitasmu, progress latihan, atau pengalaman event...
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <ComposerButton icon={Bike} label="Aktivitas" />
              <ComposerButton icon={MapPin} label="Lokasi" />
              <ComposerButton icon={MessageCircle} label="Komentar" />
            </div>

            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800">
              <Navigation size={18} />
              Post ke Database
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComposerButton({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return (
    <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-4 text-xs font-black text-slate-700 hover:bg-purple-50 hover:text-purple-700">
      <Icon size={16} />
      {label}
    </button>
  );
}

function FeedTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 rounded-full px-5 text-xs font-black uppercase tracking-wide ${
        active ? "bg-purple-700 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function FeedPostCard({ post }: { post: FeedPost }) {
  const typeMeta = {
    activity: { icon: Bike, color: "bg-purple-50 text-purple-700", label: "Tracking" },
    event: { icon: CalendarDays, color: "bg-blue-50 text-blue-700", label: "Event" },
    result: { icon: Trophy, color: "bg-green-50 text-green-700", label: "Result" },
    doorprize: { icon: Gift, color: "bg-yellow-50 text-yellow-700", label: "Doorprize" },
    official: { icon: ShieldCheck, color: "bg-slate-100 text-slate-700", label: "Official" },
  }[post.type];

  const Icon = typeMeta.icon;

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-700 text-sm font-black text-white">
          {post.avatarLabel}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-black text-slate-950">{post.author}</h2>
            <span className="text-sm font-semibold text-slate-400">•</span>
            <span className="text-sm font-bold text-slate-500">{post.roleLabel}</span>
            <span className="text-sm font-semibold text-slate-400">•</span>
            <span className="text-sm font-bold text-slate-500">{post.meta}</span>
          </div>

          <section className="mt-4 rounded-2xl bg-slate-50 p-5">
            <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${typeMeta.color}`}>
              <Icon size={23} />
            </div>

            <p className="mt-4 text-xs font-black uppercase tracking-wide text-purple-700">{typeMeta.label}</p>
            <h3 className="mt-2 text-xl font-black text-slate-950">{post.title}</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{post.body}</p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <PostStat label="Data A" value={post.statA || "-"} />
              <PostStat label="Data B" value={post.statB || "-"} />
              <PostStat label="Data C" value={post.statC || "-"} />
            </div>

            {post.actionHref ? (
              <Link
                href={post.actionHref}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800"
              >
                {post.actionLabel || "Buka"}
              </Link>
            ) : null}
          </section>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-bold text-slate-500">
            <span>{post.likes} suka</span>
            <span>{post.comments} komentar</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function PostStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function ProfileCard({
  initials,
  displayName,
  email,
  roleLabel,
}: {
  initials: string;
  displayName: string;
  email?: string | null;
  roleLabel: string;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-700 text-2xl font-black text-white">
        {initials}
      </div>
      <h2 className="mt-4 text-xl font-black text-slate-950">{displayName}</h2>
      <p className="mt-1 break-all text-sm font-semibold text-slate-500">{email || "-"}</p>
      <span className="mt-4 inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">
        {roleLabel}
      </span>
    </section>
  );
}

function ActiveEventCard({ activeEvent }: { activeEvent: EventItem | null }) {
  if (!activeEvent) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">Event Aktif</h3>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          Belum ada event aktif. Silakan buka halaman event untuk daftar.
        </p>
        <Link
          href="/events"
          className="mt-5 flex h-11 items-center justify-center rounded-xl bg-purple-700 text-sm font-black text-white hover:bg-purple-800"
        >
          Jelajahi Event
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-slate-950">Event Aktif</h3>
        <CalendarDays className="text-purple-700" size={22} />
      </div>

      <h4 className="mt-5 text-xl font-black text-slate-950">{getEventTitle(activeEvent)}</h4>
      <p className="mt-2 text-sm font-semibold text-slate-500">
        {formatDate(activeEvent.event_date)} · {activeEvent.location || "Lokasi menyusul"}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MiniMetric label="Peserta" value={`${activeEvent.participant_count || 0}/${activeEvent.quota || 0}`} />
        <MiniMetric label="Doorprize" value={String(activeEvent.doorprize_count || 0)} />
      </div>

      <Link
        href={`/account/events/${activeEvent.id}/view`}
        className="mt-5 flex h-11 items-center justify-center rounded-xl bg-purple-700 text-sm font-black text-white hover:bg-purple-800"
      >
        Live View Tracking
      </Link>

      <Link
        href={`/events/${activeEvent.id}`}
        className="mt-3 flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50"
      >
        Detail Event
      </Link>
    </section>
  );
}

function QuickAccessCard({ activeEvent }: { activeEvent: EventItem | null }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-slate-950">Quick Access</h3>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <QuickAccess
          href={activeEvent ? `/account/events/${activeEvent.id}/view` : "/account/live-view"}
          icon={Map}
          label="Live View"
        />
        <QuickAccess href="/account/tracking" icon={Activity} label="Tracking" />
        <QuickAccess href="/account/events" icon={CalendarDays} label="Events" />
        <QuickAccess
          href={activeEvent ? `/account/events/${activeEvent.id}/results` : "/account/events"}
          icon={Trophy}
          label="Results"
        />
        <QuickAccess
          href={activeEvent ? `/account/events/${activeEvent.id}/doorprize` : "/account/events"}
          icon={Gift}
          label="Doorprize"
        />
      </div>
    </section>
  );
}

function StatsCard({
  stats,
}: {
  stats: {
    events: number;
    official: number;
    participantTotal: number;
    doorprize: number;
  };
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-slate-950">Ringkasan Home</h3>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniMetric label="Event" value={String(stats.events)} />
        <MiniMetric label="Official" value={String(stats.official)} />
        <MiniMetric label="Peserta" value={String(stats.participantTotal)} />
        <MiniMetric label="Doorprize" value={String(stats.doorprize)} />
      </div>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
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
      prefetch={false}
      className="flex min-h-[82px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs font-black text-slate-950 hover:bg-purple-700 hover:text-white"
    >
      <Icon size={23} />
      <span className="mt-2">{label}</span>
    </Link>
  );
}
