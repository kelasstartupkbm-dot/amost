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
  ChevronRight,
  CloudSun,
  Download,
  Gift,
  Heart,
  HelpCircle,
  History,
  Home,
  LogOut,
  MapPin,
  Medal,
  MessageCircle,
  MoreHorizontal,
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

type AccountTab = "feed" | "biodata" | "history" | "results";

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

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
        "Dashboard account sekarang menjadi timeline aktivitas publik seperti Strava. Di sini nanti muncul update tracking, finish event, doorprize, dan postingan komunitas.",
      meta: "Baru saja",
      statA: "Community",
      statB: "Tracking",
      statC: "Event",
      actionHref: "/account/tracking",
      actionLabel: "Buka Tracking",
      likes: 24,
      comments: 3,
    },
    {
      id: "user-tracking",
      author: displayName,
      roleLabel,
      avatarLabel: initials,
      type: "activity",
      title: "Membuka Tracking Dashboard",
      body:
        "Dashboard tracking pribadi sudah aktif. Start dan stop tracking tetap dilakukan dari aplikasi Android AMOST, sedangkan website menampilkan ringkasan dan akses event.",
      meta: "Hari ini",
      statA: `${events.length} Event`,
      statB: "0.0 km/jam",
      statC: "Standby",
      actionHref: "/account/tracking",
      actionLabel: "Lihat Dashboard",
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
      body: `${eventTitle} tersedia di AMOST. Peserta dapat membuka detail event, Live View Tracking, Results, dan Doorprize melalui halaman event.`,
      meta: `${formatDate(firstEvent.event_date)} • ${firstEvent.location || "Lokasi menyusul"}`,
      statA: `${firstEvent.participant_count || 0}/${firstEvent.quota || 0} Peserta`,
      statB: normalizeStatus(firstEvent.status),
      statC: `${firstEvent.doorprize_count || 0} Hadiah`,
      actionHref: `/events/${firstEvent.id}`,
      actionLabel: "Detail Event",
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
      body: `${secondEventTitle} masuk dalam daftar event AMOST. Timeline ini nanti bisa menampilkan aktivitas peserta yang join atau finish event.`,
      meta: `${formatDate(secondEvent.event_date)} • ${secondEvent.location || "Lokasi menyusul"}`,
      statA: `${secondEvent.participant_count || 0}/${secondEvent.quota || 0} Peserta`,
      statB: normalizeStatus(secondEvent.status),
      statC: "Open",
      actionHref: `/events/${secondEvent.id}`,
      actionLabel: "Lihat Event",
      likes: 12,
      comments: 1,
    });
  }

  if (officialAccess.length > 0) {
    const firstAccess = officialAccess[0];
    const officialEventTitle =
      firstAccess.event_title || firstAccess.event_name || `Event #${firstAccess.event_id}`;

    posts.push({
      id: `official-${firstAccess.id}`,
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
      "Saat official menjalankan undian, pemenang doorprize bisa tampil sebagai update publik di dashboard account peserta.",
    meta: "Konsep fitur",
    statA: "Winner",
    statB: "Prize",
    statC: "Event",
    actionHref: firstEvent ? `/events/${firstEvent.id}/doorprize` : "/events",
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
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountTab>("feed");

  const hasOfficialAccess = officialAccess.length > 0;
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const roleLabel = formatRole(user?.role);
  const activeEvent = events[0] || null;

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

      try {
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
      } catch (eventsError) {
        console.error(eventsError);
        setEvents([]);
      }
    } catch (error) {
      console.error(error);
      router.replace("/login");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAccount();
  }, []);

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


  const feedPosts = useMemo(() => {
    if (!user) return [];
    return buildFeedPosts(user, events, officialAccess);
  }, [user, events, officialAccess]);

  const activities = [
    {
      title: "Gowes Pagi Purwokerto",
      type: "Sepeda",
      distance: "28.62 km",
      date: "22 Juni 2026",
      status: "Selesai",
    },
    {
      title: "Jalan Sehat AMOST",
      type: "Jalan Sehat",
      distance: "5.10 km",
      date: "18 Juni 2026",
      status: "Selesai",
    },
    {
      title: "Latihan Lari Sore",
      type: "Lari",
      distance: "7.45 km",
      date: "15 Juni 2026",
      status: "Selesai",
    },
  ];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-700">
            <UserRound size={28} />
          </div>
          <p className="text-lg font-black text-slate-950">
            Memuat account feed...
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Mengambil timeline AMOST.
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <AccountSidebar
        activeTab={activeTab}
        activeEventId={activeEvent?.id}
        hasOfficialAccess={hasOfficialAccess}
        onTabChange={setActiveTab}
      />

      <section className="min-h-screen lg:pl-[260px]">
        <AccountTopbar
          title={
            activeTab === "feed"
              ? "Home"
              : activeTab === "biodata"
                ? "Profile"
                : activeTab === "history"
                  ? "My Activities"
                  : "Results"
          }
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
            {activeTab === "feed" ? (
              <FeedContent
                user={user}
                posts={feedPosts}
                activeEvent={activeEvent}
              />
            ) : null}

            {activeTab === "biodata" ? (
              <BiodataContent
                user={user}
                hasOfficialAccess={hasOfficialAccess}
                officialAccess={officialAccess}
              />
            ) : null}

            {activeTab === "history" ? (
              <HistoryContent activities={activities} />
            ) : null}

            {activeTab === "results" ? (
              <ResultsContent activities={activities} />
            ) : null}
          </section>

          <aside className="space-y-5">
            <ProfileMiniCard
              displayName={displayName}
              email={user.email || "-"}
              initials={initials}
              roleLabel={roleLabel}
              hasOfficialAccess={hasOfficialAccess}
            />

            <RightQuickPanel
              activeEvent={activeEvent}
              officialAccess={officialAccess}
              hasOfficialAccess={hasOfficialAccess}
            />
          </aside>
        </section>
      </section>
    </main>
  );
}

function AccountSidebar({
  activeTab,
  activeEventId,
  hasOfficialAccess,
  onTabChange,
}: {
  activeTab: AccountTab;
  activeEventId?: number | string;
  hasOfficialAccess: boolean;
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
        <SidebarLink href="/account/tracking" icon={Navigation} label="Tracking" />
        <SidebarButton
          icon={History}
          label="My Activities"
          active={activeTab === "history"}
          onClick={() => onTabChange("history")}
        />
        <SidebarLink href="/events" icon={CalendarDays} label="My Events" />
        <SidebarLink href="/events" icon={Ticket} label="My Tickets" />
        <SidebarButton
          icon={Medal}
          label="Achievement"
          active={activeTab === "results"}
          onClick={() => onTabChange("results")}
        />
        <SidebarButton
          icon={Activity}
          label="Statistics"
          active={activeTab === "results"}
          onClick={() => onTabChange("results")}
        />
        <SidebarLink href="/account" icon={Bell} label="Notification" />
        <SidebarLink href="/account" icon={UserRound} label="Profile" />
        <SidebarLink href="/account" icon={Settings} label="Settings" />
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
          href={activeEventId ? `/event/${activeEventId}/view` : "/events"}
          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          <HelpCircle size={19} />
          Live View Event
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
      className="flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
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

function ProfileMiniCard({
  displayName,
  email,
  initials,
  roleLabel,
  hasOfficialAccess,
}: {
  displayName: string;
  email: string;
  initials: string;
  roleLabel: string;
  hasOfficialAccess: boolean;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-700 text-2xl font-black text-white">
        {initials}
      </div>

      <h2 className="mt-4 text-xl font-black text-slate-950">{displayName}</h2>
      <p className="mt-1 break-all text-sm font-semibold text-slate-500">{email}</p>

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
  );
}

function FeedContent({
  user,
  posts,
  activeEvent,
}: {
  user: CurrentUser;
  posts: FeedPost[];
  activeEvent: EventItem | null;
}) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <FeedFilter active label="Semua" />
        <FeedFilter label="Tracking" />
        <FeedFilter label="Events" />
        <FeedFilter label="Results" />
        <FeedFilter label="Doorprize" />
      </div>

      {posts.map((post) => (
        <FeedPostCard key={post.id} post={post} />
      ))}
    </section>
  );
}

function FeedFilter({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
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

function FeedPostCard({ post }: { post: FeedPost }) {
  const iconMap: Record<FeedPost["type"], ElementType> = {
    activity: Bike,
    event: CalendarDays,
    result: Trophy,
    doorprize: Gift,
    official: ShieldCheck,
  };

  const Icon = iconMap[post.type];

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-700 text-sm font-black text-white">
          {post.avatarLabel}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black text-slate-950">{post.author}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {post.roleLabel} • {post.meta}
              </p>
            </div>

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              title="Menu"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="mt-4 rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
              <Icon size={24} />
            </div>

            <h3 className="mt-4 text-xl font-black text-slate-950">
              {post.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">{post.body}</p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {post.statA ? <FeedStat label="Info" value={post.statA} /> : null}
              {post.statB ? <FeedStat label="Status" value={post.statB} /> : null}
              {post.statC ? <FeedStat label="Detail" value={post.statC} /> : null}
            </div>

            {post.actionHref && post.actionLabel ? (
              <Link
                href={post.actionHref}
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 text-sm font-black text-white hover:bg-purple-800"
              >
                {post.actionLabel}
                <ChevronRight size={16} />
              </Link>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <button className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-black text-slate-600 hover:bg-slate-50">
              <Heart size={17} />
              {post.likes}
            </button>
            <button className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-black text-slate-600 hover:bg-slate-50">
              <MessageCircle size={17} />
              {post.comments}
            </button>
            <button className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-black text-slate-600 hover:bg-slate-50">
              Bagikan
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function FeedStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function RightQuickPanel({
  activeEvent,
  officialAccess,
  hasOfficialAccess,
}: {
  activeEvent: EventItem | null;
  officialAccess: OfficialAccess[];
  hasOfficialAccess: boolean;
}) {
  return (
    <>
      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-950">Event Aktif</h3>
          <CalendarDays className="text-purple-700" size={22} />
        </div>

        {activeEvent ? (
          <div className="mt-4">
            <p className="text-xl font-black text-slate-950">
              {getEventTitle(activeEvent)}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              {formatDate(activeEvent.event_date)} •{" "}
              {activeEvent.location || "Lokasi menyusul"}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <SmallInfo
                label="Peserta"
                value={`${activeEvent.participant_count || 0}/${activeEvent.quota || 0}`}
              />
              <SmallInfo
                label="Doorprize"
                value={String(activeEvent.doorprize_count || 0)}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <Link
                href={`/event/${activeEvent.id}/view`}
                className="flex h-11 items-center justify-center rounded-xl bg-purple-700 text-sm font-black text-white hover:bg-purple-800"
              >
                Live View Tracking
              </Link>
              <Link
                href={`/events/${activeEvent.id}`}
                className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Detail Event
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-center">
            <p className="text-sm font-black text-slate-950">
              Belum ada event aktif
            </p>
            <Link
              href="/events"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-purple-700 px-4 text-xs font-black text-white"
            >
              Cari Event
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-950">Quick Access</h3>
          <UsersRound className="text-purple-700" size={22} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <QuickAccess href="/account/tracking" icon={Activity} label="Tracking" />
          <QuickAccess href="/events" icon={CalendarDays} label="Events" />
          <QuickAccess
            href={activeEvent ? `/events/${activeEvent.id}/results` : "/events"}
            icon={Trophy}
            label="Results"
          />
          <QuickAccess
            href={activeEvent ? `/events/${activeEvent.id}/doorprize` : "/events"}
            icon={Gift}
            label="Doorprize"
          />
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-950">Official Access</h3>
          <ShieldCheck
            className={hasOfficialAccess ? "text-green-700" : "text-slate-300"}
            size={22}
          />
        </div>

        {hasOfficialAccess ? (
          <div className="mt-4 space-y-3">
            {officialAccess.slice(0, 3).map((item) => (
              <Link
                key={String(item.id)}
                href={`/official/events/${item.event_id}`}
                className="block rounded-2xl bg-green-50 p-4 hover:bg-green-100"
              >
                <p className="font-black text-slate-950">
                  {item.event_title || item.event_name || `Event #${item.event_id}`}
                </p>
                <p className="mt-1 text-xs font-black uppercase text-green-700">
                  {item.permission_level || "Official"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Belum ada akses Official Event.
          </p>
        )}
      </section>
    </>
  );
}

function SmallInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
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

function BiodataContent({
  user,
  hasOfficialAccess,
  officialAccess,
}: {
  user: CurrentUser;
  hasOfficialAccess: boolean;
  officialAccess: OfficialAccess[];
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-black text-slate-950">Informasi Akun</h3>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <BiodataRow label="Nama" value={user.fullName || "-"} />
        <BiodataRow label="Email" value={user.email || "-"} />
        <BiodataRow label="No. HP" value={user.phone || "-"} />
        <BiodataRow label="Role" value={formatRole(user.role)} />
        <BiodataRow label="Status Akun" value={user.status || "-"} />
        <BiodataRow
          label="Official Event"
          value={hasOfficialAccess ? `${officialAccess.length} event` : "-"}
        />
      </div>
    </section>
  );
}

function BiodataRow({ label, value }: { label: string; value: string }) {
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

function HistoryContent({
  activities,
}: {
  activities: Array<{
    title: string;
    type: string;
    distance: string;
    date: string;
    status: string;
  }>;
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-black text-slate-950">History Aktivitas</h3>

      <div className="mt-5 space-y-3">
        {activities.map((item) => (
          <div
            key={item.title}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-black text-slate-950">{item.title}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {item.type} • {item.date}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">
                {item.distance}
              </span>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase text-green-700">
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResultsContent({
  activities,
}: {
  activities: Array<{
    title: string;
    type: string;
    distance: string;
    date: string;
    status: string;
  }>;
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-black text-slate-950">Results</h3>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {activities.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <Trophy className="text-purple-700" size={28} />
            <p className="mt-4 font-black text-slate-950">{item.title}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {item.distance}
            </p>
            <span className="mt-4 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase text-green-700">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
