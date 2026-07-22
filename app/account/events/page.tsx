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
} from "lucide-react";

const EVENTS_REQUEST_TIMEOUT_MS = 5000;

async function fetchEventsJson(
  url: string,
  init: RequestInit = {},
  timeoutMs = EVENTS_REQUEST_TIMEOUT_MS
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

type EventItem = {
  id: number | string;
  slug?: string | number | null;
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
  registered_at?: string | null;
};

function getEventTitle(event: EventItem) {
  return (
    String(event.title || event.event_title || event.name || "").trim() ||
    `Event #${event.id}`
  );
}

function getEventKey(event: EventItem) {
  return String(event.slug || event.id);
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

function normalizeStatus(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function isFinishedEvent(event: EventItem) {
  const status = normalizeStatus(event.status);

  return [
    "finished",
    "finish",
    "done",
    "selesai",
    "closed",
    "ditutup",
    "cancelled",
    "canceled",
  ].includes(status);
}

function isActiveEvent(event: EventItem) {
  return !isFinishedEvent(event);
}

function getStatusLabel(value: unknown) {
  const status = normalizeStatus(value);

  if (status === "published" || status === "active" || status === "aktif") {
    return "Aktif";
  }

  if (status === "live") return "Live";
  if (status === "upcoming") return "Upcoming";
  if (status === "closed" || status === "ditutup") return "Ditutup";

  if (
    status === "finished" ||
    status === "finish" ||
    status === "done" ||
    status === "selesai"
  ) {
    return "Selesai";
  }

  if (status === "draft") return "Draft";

  return status ? status.toUpperCase() : "Aktif";
}

function getStatusClass(value: unknown) {
  const status = normalizeStatus(value);

  if (
    status === "finished" ||
    status === "finish" ||
    status === "done" ||
    status === "selesai" ||
    status === "closed" ||
    status === "ditutup"
  ) {
    return "bg-slate-100 text-slate-700";
  }

  if (status === "draft") return "bg-yellow-50 text-yellow-700";
  if (status === "live") return "bg-green-50 text-green-700";

  return "bg-purple-50 text-purple-700";
}

function getParticipantNumber(event: EventItem) {
  return (
    String(
      event.participant_number ||
        (event as any).participantNo ||
        (event as any).participant_no ||
        (event as any).registration_number ||
        ""
    ).trim() || "-"
  );
}

export default function AccountMyEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "active" | "finished">("all");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadEvents(silent = false) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage("");

    try {
      const { response, data } = await fetchEventsJson(
        "/api/account/events",
        { method: "GET" },
        5000
      );

      if (!response.ok || data?.ok === false) {
        setEvents([]);

        if (response.status === 401) {
          setErrorMessage(
            "Silakan login terlebih dahulu untuk melihat event yang kamu ikuti."
          );
          return;
        }

        setErrorMessage(
          data?.message || data?.error || "Data My Events belum bisa dimuat."
        );
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
      setErrorMessage(
        "Server My Events terlalu lama merespons. Coba klik Refresh."
      );
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

      const matchesSearch =
        !cleanQuery ||
        title.includes(cleanQuery) ||
        location.includes(cleanQuery);

      const matchesTab =
        tab === "all"
          ? true
          : tab === "active"
            ? isActiveEvent(event)
            : isFinishedEvent(event);

      return matchesSearch && matchesTab;
    });
  }, [events, query, tab]);

  const stats = useMemo(() => {
    const active = events.filter(isActiveEvent).length;
    const finished = events.filter(isFinishedEvent).length;
    const tickets = events.filter(
      (event) => getParticipantNumber(event) !== "-"
    ).length;

    return {
      total: events.length,
      active,
      finished,
      tickets,
    };
  }, [events]);

  const rightPanel = (
    <section className="space-y-4">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-slate-950">My Events</h3>
          <CalendarDays className="text-purple-700" size={22} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <InfoBox label="Diikuti" value={String(stats.total)} />
          <InfoBox label="Aktif" value={String(stats.active)} />
          <InfoBox label="Selesai" value={String(stats.finished)} />
          <InfoBox label="Tiket" value={String(stats.tickets)} />
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
        <h3 className="text-lg font-black text-slate-950">Alur Akses</h3>

        <div className="mt-4 space-y-3">
          <FlowItem
            number="1"
            title="Daftar event"
            text="Event otomatis muncul di My Events setelah pendaftaran berhasil."
          />
          <FlowItem
            number="2"
            title="Buka Live Tracking"
            text="Pantau marker dan peserta saat event berlangsung."
          />
          <FlowItem
            number="3"
            title="Results"
            text="Lihat hasil setelah data aktivitas diproses."
          />
          <FlowItem
            number="4"
            title="Doorprize"
            text="Lihat hasil undian doorprize event."
          />
        </div>
      </section>
    </section>
  );

  return (
    <AccountAppShell
      active="events"
      title="My Events"
      eyebrow="ACCOUNT EVENTS"
      description="Event yang sudah kamu daftar dan dapat kamu akses."
      icon={CalendarDays}
      rightPanel={rightPanel}
    >
      <section className="space-y-5">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-green-700">
            Hanya event yang sudah kamu ikuti yang ditampilkan di halaman ini
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <TabButton
                active={tab === "all"}
                onClick={() => setTab("all")}
              >
                Semua
              </TabButton>

              <TabButton
                active={tab === "active"}
                onClick={() => setTab("active")}
              >
                Aktif
              </TabButton>

              <TabButton
                active={tab === "finished"}
                onClick={() => setTab("finished")}
              >
                Selesai
              </TabButton>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari event yang diikuti..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-purple-300 sm:w-[280px]"
                />
              </div>

              <button
                type="button"
                onClick={() => loadEvents(true)}
                disabled={refreshing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-70"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            icon={CalendarDays}
            label="Event Diikuti"
            value={String(stats.total)}
          />
          <StatCard
            icon={Activity}
            label="Event Aktif"
            value={String(stats.active)}
          />
          <StatCard
            icon={Trophy}
            label="Event Selesai"
            value={String(stats.finished)}
          />
          <StatCard
            icon={Ticket}
            label="Tiket Saya"
            value={String(stats.tickets)}
          />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-700" />
              <p className="mt-4 text-xl font-black text-slate-950">
                Memuat My Events...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-black text-red-700">
              {errorMessage}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />

              <h2 className="mt-4 text-2xl font-black text-slate-950">
                Belum ada event yang kamu ikuti.
              </h2>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Daftar event terlebih dahulu agar tiket dan akses peserta muncul
                di halaman ini.
              </p>

              <Link
                href="/events"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800"
              >
                Jelajahi Event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredEvents.map((event) => (
                <EventCard
                  key={`${event.id}-${event.participant_number || ""}`}
                  event={event}
                />
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
  const percent =
    quota > 0
      ? Math.min(100, Math.round((participantCount / quota) * 100))
      : 0;

  const participantNumber = getParticipantNumber(event);
  const eventKey = getEventKey(event);

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
          <CalendarDays size={28} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black uppercase ${getStatusClass(
                event.status
              )}`}
            >
              {getStatusLabel(event.status)}
            </span>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-slate-500">
              {participantCount}/{quota || "-"} Peserta
            </span>
          </div>

          <h3 className="mt-3 text-2xl font-black text-slate-950">
            {getEventTitle(event)}
          </h3>

          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
            <Clock3 size={16} />
            {formatDate(event.event_date)}
            <span>•</span>
            <MapPin size={16} />
            {event.location || "Lokasi menyusul"}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <InfoBox label="Nomor Peserta" value={participantNumber} />
            <InfoBox
              label="Doorprize"
              value={String(event.doorprize_count || 0)}
            />
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-purple-700"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ActionLink
          href={`/events/${eventKey}`}
          icon={CalendarDays}
          label="Detail"
        />
        <ActionLink
          href={`/account/events/${event.id}/view`}
          icon={Navigation}
          label="Live Tracking"
          primary
        />
        <ActionLink
          href={`/account/events/${event.id}/results`}
          icon={Trophy}
          label="Results"
        />
        <ActionLink
          href={`/account/events/${event.id}/doorprize`}
          icon={Gift}
          label="Doorprize"
        />
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

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-full px-5 text-xs font-black uppercase tracking-wide ${
        active
          ? "bg-purple-700 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
        <Icon size={24} />
      </div>
      <p className="mt-5 text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
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

function FlowItem({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-700 text-xs font-black text-white">
        {number}
      </div>
      <div>
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}
