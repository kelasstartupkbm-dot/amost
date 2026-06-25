"use client";

import AccountAppShell from "../../components/AccountAppShell";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Clock3,
  Gift,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Ticket,
  Trophy,
  UsersRound,
} from "lucide-react";

type EventItem = {
  id: number | string;
  title?: string | null;
  event_title?: string | null;
  name?: string | null;
  description?: string | null;
  event_date?: string | null;
  location?: string | null;
  participant_count?: number | string | null;
  quota?: number | string | null;
  doorprize_count?: number | string | null;
  status?: string | null;
  participant_number?: string | null;
  registration_status?: string | null;
};

function getEventTitle(event: EventItem) {
  return String(event.title || event.event_title || event.name || "").trim() || `Event #${event.id}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Tanggal menyusul";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function normalizeStatus(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function getStatusLabel(value: unknown) {
  const status = normalizeStatus(value);
  if (status === "published") return "Aktif";
  if (status === "active") return "Aktif";
  if (status === "live") return "Live";
  if (status === "upcoming") return "Upcoming";
  if (status === "finished" || status === "done" || status === "selesai") return "Selesai";
  if (status === "draft") return "Draft";
  return status ? status.toUpperCase() : "Aktif";
}

function getStatusClass(value: unknown) {
  const status = normalizeStatus(value);
  if (status === "finished" || status === "done" || status === "selesai") return "bg-slate-100 text-slate-700";
  if (status === "draft") return "bg-yellow-50 text-yellow-700";
  if (status === "live") return "bg-green-50 text-green-700";
  return "bg-purple-50 text-purple-700";
}

function isActiveEvent(event: EventItem) {
  const status = normalizeStatus(event.status);
  return status === "active" || status === "published" || status === "live" || status === "upcoming" || status === "aktif" || !status;
}

function getParticipantNumber(event: EventItem) {
  return String(
    event.participant_number ||
      (event as any).participantNo ||
      (event as any).participant_no ||
      (event as any).registration_number ||
      ""
  ).trim() || "-";
}

export default function AccountMyEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "active" | "finished">("all");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadEvents(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setErrorMessage("");

    try {
      const response = await fetch("/api/events", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setEvents([]);
        setErrorMessage(data?.message || data?.error || "Data event belum bisa dimuat.");
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
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      const title = getEventTitle(event).toLowerCase();
      const location = String(event.location || "").toLowerCase();
      const status = normalizeStatus(event.status);

      const matchesSearch = !cleanQuery || title.includes(cleanQuery) || location.includes(cleanQuery);
      const matchesTab =
        tab === "all"
          ? true
          : tab === "active"
            ? isActiveEvent(event)
            : status === "finished" || status === "done" || status === "selesai";

      return matchesSearch && matchesTab;
    });
  }, [events, query, tab]);

  const stats = useMemo(() => {
    const active = events.filter(isActiveEvent).length;
    const finished = Math.max(0, events.length - active);
    const participantTotal = events.reduce((sum, event) => {
      const value = Number(event.participant_count || 0);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    return { total: events.length, active, finished, participantTotal };
  }, [events]);

  const rightPanel = (
    <section className="space-y-4">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-slate-950">My Events</h3>
          <CalendarDays className="text-purple-700" size={22} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <InfoBox label="Total" value={String(stats.total)} />
          <InfoBox label="Aktif" value={String(stats.active)} />
          <InfoBox label="Selesai" value={String(stats.finished)} />
          <InfoBox label="Peserta" value={String(stats.participantTotal)} />
        </div>

        <Link
          href="/events"
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          Jelajahi Event Publik
          <ChevronRight size={17} />
        </Link>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">Alur Event</h3>
        <div className="mt-4 space-y-3">
          <FlowItem number="1" title="Detail" text="Lihat informasi event." />
          <FlowItem number="2" title="Live" text="Pantau tracking event." />
          <FlowItem number="3" title="Results" text="Lihat hasil peserta." />
          <FlowItem number="4" title="Doorprize" text="Lihat undian pemenang." />
        </div>
      </section>
    </section>
  );

  return (
    <AccountAppShell
      active="events"
      title="My Events"
      eyebrow="ACCOUNT EVENTS"
      description="Daftar event yang bisa kamu akses dari dashboard akun."
      icon={CalendarDays}
      rightPanel={rightPanel}
    >
      <section className="space-y-5">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-green-700">
            Account Menu Active · My Events
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <TabButton active={tab === "all"} onClick={() => setTab("all")}>Semua</TabButton>
              <TabButton active={tab === "active"} onClick={() => setTab("active")}>Aktif</TabButton>
              <TabButton active={tab === "finished"} onClick={() => setTab("finished")}>Selesai</TabButton>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari event..."
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
          <StatCard icon={CalendarDays} label="Total Event" value={String(stats.total)} />
          <StatCard icon={Activity} label="Event Aktif" value={String(stats.active)} />
          <StatCard icon={UsersRound} label="Total Peserta" value={String(stats.participantTotal)} />
          <StatCard icon={Ticket} label="Tiket" value={String(events.length)} />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-700" />
              <p className="mt-4 text-xl font-black text-slate-950">Memuat event...</p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-black text-red-700">
              {errorMessage}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />
              <h2 className="mt-4 text-2xl font-black text-slate-950">Belum ada event.</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Event akan muncul setelah dibuat admin atau setelah kamu mengikuti event.
              </p>
              <Link href="/events" className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800">
                Jelajahi Event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredEvents.map((event) => (
                <EventCard key={String(event.id)} event={event} />
              ))}
            </div>
          )}
        </section>
      </section>
    </AccountAppShell>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const participantCount = Number(event.participant_count || 0);
  const quota = Number(event.quota || 0);
  const percent = quota > 0 ? Math.min(100, Math.round((participantCount / quota) * 100)) : 0;
  const participantNumber = getParticipantNumber(event);

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
          <CalendarDays size={28} />
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
            <Clock3 size={16} />
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
        <ActionLink href={`/events/${event.id}`} icon={CalendarDays} label="Detail" />
        <ActionLink href={`/account/events/${event.id}/view`} icon={Navigation} label="Live" primary />
        <ActionLink href={`/account/events/${event.id}/results`} icon={Trophy} label="Results" />
        <ActionLink href={`/account/events/${event.id}/doorprize`} icon={Gift} label="Doorprize" />
      </div>
    </article>
  );
}

function ActionLink({ href, icon: Icon, label, primary }: { href: string; icon: any; label: string; primary?: boolean }) {
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

function TabButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-full px-5 text-xs font-black uppercase tracking-wide ${
        active ? "bg-purple-700 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
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
