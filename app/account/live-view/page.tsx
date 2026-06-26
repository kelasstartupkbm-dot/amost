"use client";

import AccountAppShell from "../../components/AccountAppShell";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Gift,
  Loader2,
  Map,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Signal,
  Trophy,
  UsersRound,
} from "lucide-react";

type EventItem = {
  id: number | string;
  title?: string | null;
  event_title?: string | null;
  name?: string | null;
  event_date?: string | null;
  location?: string | null;
  participant_count?: number | string | null;
  quota?: number | string | null;
  status?: string | null;
  participant_number?: string | null;
  registration_status?: string | null;
  doorprize_count?: number | string | null;
};

const REQUEST_TIMEOUT_MS = 5000;

async function fetchJson(url: string, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
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

function getEventTitle(event: EventItem) {
  return String(event.title || event.event_title || event.name || "").trim() || `Event #${event.id}`;
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

function normalizeStatus(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function isLiveCandidate(event: EventItem) {
  const status = normalizeStatus(event.status);
  return status === "live" || status === "active" || status === "published" || status === "upcoming" || status === "aktif" || !status;
}

function getStatusLabel(value: unknown) {
  const status = normalizeStatus(value);

  if (status === "live") return "Live";
  if (status === "active" || status === "published" || status === "aktif") return "Aktif";
  if (status === "upcoming") return "Upcoming";
  if (status === "finished" || status === "done" || status === "selesai") return "Selesai";

  return status ? status.toUpperCase() : "Aktif";
}

function getStatusClass(value: unknown) {
  const status = normalizeStatus(value);

  if (status === "live") return "bg-green-50 text-green-700";
  if (status === "finished" || status === "done" || status === "selesai") return "bg-slate-100 text-slate-700";
  if (status === "upcoming") return "bg-blue-50 text-blue-700";

  return "bg-purple-50 text-purple-700";
}

function getParticipantNumber(event: EventItem) {
  return String(
    event.participant_number ||
      (event as any).participantNo ||
      (event as any).participant_no ||
      (event as any).registration_number ||
      "",
  ).trim() || "-";
}

export default function AccountLiveViewHubPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadEvents(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setErrorMessage("");

    try {
      const { response, data } = await fetchJson("/api/events", { method: "GET" }, 5000);

      if (!response.ok || data?.ok === false) {
        setEvents([]);
        setErrorMessage(data?.message || data?.error || "Data Live View belum bisa dimuat.");
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
      setErrorMessage("Server event terlalu lama merespons. Coba klik Refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const liveEvents = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      const title = getEventTitle(event).toLowerCase();
      const location = String(event.location || "").toLowerCase();

      return isLiveCandidate(event) && (!cleanQuery || title.includes(cleanQuery) || location.includes(cleanQuery));
    });
  }, [events, query]);

  const stats = useMemo(() => {
    const total = liveEvents.length;
    const live = liveEvents.filter((event) => normalizeStatus(event.status) === "live").length;
    const active = liveEvents.filter((event) => ["active", "published", "aktif", ""].includes(normalizeStatus(event.status))).length;
    const participantTotal = liveEvents.reduce((sum, event) => {
      const value = Number(event.participant_count || 0);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    return { total, live, active, participantTotal };
  }, [liveEvents]);

  const rightPanel = (
    <section className="space-y-4">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-slate-950">Ringkasan Live View</h3>
          <Signal className="text-purple-700" size={22} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <InfoBox label="Event" value={String(stats.total)} />
          <InfoBox label="Live" value={String(stats.live)} />
          <InfoBox label="Aktif" value={String(stats.active)} />
          <InfoBox label="Peserta" value={String(stats.participantTotal)} />
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">Alur Cepat</h3>

        <div className="mt-4 space-y-3">
          <FlowItem number="1" title="Pilih event" text="Pilih event yang ingin dipantau." />
          <FlowItem number="2" title="Buka Live View" text="Masuk ke halaman peta fullscreen." />
          <FlowItem number="3" title="Pantau data" text="Lihat live marker, standby, dan result." />
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">Shortcut</h3>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <Shortcut href="/account/tracking" icon={Navigation} label="Data Tracking" />
          <Shortcut href="/account/events" icon={CalendarDays} label="My Events" />
          <Shortcut href="/events" icon={Map} label="Event Publik" />
        </div>
      </section>
    </section>
  );

  return (
    <AccountAppShell
      active={"live-view" as any}
      title="Live View"
      eyebrow="AMOST LIVE VIEW"
      description="Halaman pintas untuk membuka live tracking event yang sedang aktif atau bisa dipantau."
      icon={Map}
      rightPanel={rightPanel}
    >
      <section className="space-y-5">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 rounded-2xl bg-purple-50 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-purple-700">
            Live View sekarang tersedia langsung dari sidebar kiri, tepat di bawah Dashboard.
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Pilih Event untuk Live View</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Klik tombol Live View untuk membuka halaman peta fullscreen event.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari event live..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-purple-300 sm:w-[280px]"
                />
              </div>

              <button
                type="button"
                onClick={() => loadEvents(true)}
                disabled={refreshing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-70"
              >
                <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard icon={Map} label="Event Dipantau" value={String(stats.total)} />
          <StatCard icon={Signal} label="Live" value={String(stats.live)} />
          <StatCard icon={Activity} label="Aktif" value={String(stats.active)} />
          <StatCard icon={UsersRound} label="Peserta" value={String(stats.participantTotal)} />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-700" />
              <p className="mt-4 text-xl font-black text-slate-950">Memuat Live View...</p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-black text-red-700">
              {errorMessage}
            </div>
          ) : liveEvents.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <Map className="mx-auto h-12 w-12 text-slate-300" />
              <h2 className="mt-4 text-2xl font-black text-slate-950">Belum ada event live.</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Event aktif atau upcoming akan muncul di sini.
              </p>
              <Link href="/account/events" className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800">
                Buka My Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {liveEvents.map((event) => (
                <LiveEventCard key={String(event.id)} event={event} />
              ))}
            </div>
          )}
        </section>
      </section>
    </AccountAppShell>
  );
}

function LiveEventCard({ event }: { event: EventItem }) {
  const participantCount = Number(event.participant_count || 0);
  const quota = Number(event.quota || 0);
  const percent = quota > 0 ? Math.min(100, Math.round((participantCount / quota) * 100)) : 0;
  const participantNumber = getParticipantNumber(event);

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
          <Map size={28} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${getStatusClass(event.status)}`}>
              {getStatusLabel(event.status)}
            </span>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-slate-500">
              {participantCount}/{quota || "-"} Peserta
            </span>
          </div>

          <h3 className="mt-3 text-2xl font-black text-slate-950">{getEventTitle(event)}</h3>

          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
            <CalendarDays size={16} />
            {formatDate(event.event_date)}
            <span>•</span>
            <MapPin size={16} />
            {event.location || "Lokasi menyusul"}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <InfoBox label="Nomor Peserta" value={participantNumber} />
            <InfoBox label="Doorprize" value={String(event.doorprize_count || 0)} />
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-purple-700" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ActionLink href={`/account/events/${event.id}/view`} icon={Map} label="Live View" primary />
        <ActionLink href={`/events/${event.id}`} icon={CalendarDays} label="Detail" />
        <ActionLink href={`/account/events/${event.id}/results`} icon={Trophy} label="Results" />
        <ActionLink href={`/account/events/${event.id}/doorprize`} icon={Gift} label="Doorprize" />
      </div>
    </article>
  );
}

function ActionLink({
  href,
  icon: Icon,
  label,
  primary,
}: {
  href: string;
  icon: any;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex h-14 items-center justify-center gap-2 rounded-xl text-xs font-black ${
        primary
          ? "bg-purple-700 text-white hover:bg-purple-800"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-700"
      }`}
    >
      <Icon size={17} />
      {label}
    </Link>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
        <Icon size={24} />
      </div>
      <p className="mt-5 text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </section>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function FlowItem({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-700 text-xs font-black text-white">
        {number}
      </div>
      <div>
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function Shortcut({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 hover:bg-purple-50 hover:text-purple-700"
    >
      <Icon size={20} />
      {label}
    </Link>
  );
}
