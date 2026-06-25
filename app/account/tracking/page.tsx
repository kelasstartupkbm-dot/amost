"use client";

import AccountAppShell from "../../components/AccountAppShell";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bike,
  CalendarDays,
  ChevronRight,
  Clock3,
  Gift,
  History,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Smartphone,
  Trophy,
  UsersRound,
} from "lucide-react";

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
  distance_km?: number | string | null;
  description?: string | null;
};

function getEventTitle(event: EventItem | null | undefined) {
  return (
    String(event?.title || event?.event_title || event?.name || "").trim() ||
    "Event AMOST"
  );
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

function formatDistance(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue) || numberValue <= 0) return "-";

  return `${numberValue.toFixed(2)} KM`;
}

function normalizeStatus(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isActiveEvent(event: EventItem) {
  const status = normalizeStatus(event.status);

  return (
    status === "active" ||
    status === "published" ||
    status === "live" ||
    status === "upcoming" ||
    status === "aktif"
  );
}

function getStatusLabel(value: unknown) {
  const status = normalizeStatus(value);

  if (status === "published") return "Aktif";
  if (status === "active") return "Aktif";
  if (status === "live") return "Live";
  if (status === "upcoming") return "Upcoming";
  if (status === "draft") return "Draft";
  if (status === "finished" || status === "done" || status === "selesai") return "Selesai";

  return status ? status.toUpperCase() : "Aktif";
}

export default function TrackingDashboardCleanPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activeEvents = useMemo(() => {
    return events.filter(isActiveEvent);
  }, [events]);

  const primaryEvent = activeEvents[0] || events[0] || null;

  const trackingStats = useMemo(() => {
    const totalEvents = events.length;
    const activeCount = activeEvents.length;
    const participantTotal = events.reduce((sum, item) => {
      const value = Number(item.participant_count || 0);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
    const totalDistance = events.reduce((sum, item) => {
      const value = Number(item.distance_km || 0);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    return {
      totalEvents,
      activeCount,
      participantTotal,
      totalDistance,
    };
  }, [events, activeEvents]);

  const loadEvents = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

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

      const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.events)
            ? data.events
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
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const rightPanel = (
    <section className="space-y-4">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-slate-950">Event Aktif</h3>
          <CalendarDays className="text-purple-700" size={22} />
        </div>

        {primaryEvent ? (
          <div className="mt-4">
            <h4 className="text-2xl font-black text-slate-950">
              {getEventTitle(primaryEvent)}
            </h4>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {formatDate(primaryEvent.event_date)} · {primaryEvent.location || "Lokasi menyusul"}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <InfoBox label="Peserta" value={String(primaryEvent.participant_count || 0)} />
              <InfoBox label="Kuota" value={String(primaryEvent.quota || "-")} />
            </div>

            <Link
              href={`/account/events/${primaryEvent.id}/view`}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 text-sm font-black text-white hover:bg-purple-800"
            >
              <Navigation size={18} />
              Live View Event
            </Link>

            <Link
              href={`/events/${primaryEvent.id}`}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Detail Event
            </Link>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
            Belum ada event aktif.
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">Quick Access</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <QuickAccess href="/home" icon={Activity} label="Home" />
          <QuickAccess href="/events" icon={CalendarDays} label="Events" />
          {primaryEvent ? (
            <>
              <QuickAccess href={`/account/events/${primaryEvent.id}/results`} icon={Trophy} label="Results" />
              <QuickAccess href={`/account/events/${primaryEvent.id}/doorprize`} icon={Gift} label="Doorprize" />
            </>
          ) : (
            <>
              <QuickAccess href="/account/results" icon={Trophy} label="Results" />
              <QuickAccess href="/events" icon={Gift} label="Doorprize" />
            </>
          )}
        </div>
      </section>
    </section>
  );

  return (
    <AccountAppShell
      active="tracking"
      title="Tracking Dashboard"
      eyebrow="AMOST TRACKING"
      description="Dashboard tracking pribadi. Live View event penuh dibuka dari tombol Live View Event."
      icon={Navigation}
      rightPanel={rightPanel}
    >
      <section className="space-y-5">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-green-700">
            Tracking Dashboard Clean · Bukan Live View Event
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-purple-700">
                Tracking Pribadi
              </p>
              <h2 className="mt-3 text-4xl font-black leading-tight text-slate-950">
                Dashboard ringkas untuk aktivitas dan event kamu.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500">
                Halaman ini tidak lagi menampilkan map event besar agar tidak membingungkan.
                Map penuh hanya ada di halaman Live View Event.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {primaryEvent ? (
                  <Link
                    href={`/account/events/${primaryEvent.id}/view`}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800"
                  >
                    <Navigation size={18} />
                    Buka Live View Event
                  </Link>
                ) : null}

                <Link
                  href="/events"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  <CalendarDays size={18} />
                  Jelajahi Event
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-6">
              <Smartphone className="h-10 w-10 text-purple-700" />
              <h3 className="mt-5 text-2xl font-black text-slate-950">
                Start/Stop Tracking
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Recording tetap dilakukan dari aplikasi Android AMOST. Website menampilkan
                ringkasan, live view event, results, dan doorprize.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard icon={CalendarDays} label="Event" value={String(trackingStats.totalEvents)} />
          <StatCard icon={Activity} label="Aktif" value={String(trackingStats.activeCount)} />
          <StatCard icon={UsersRound} label="Peserta" value={String(trackingStats.participantTotal)} />
          <StatCard icon={Route} label="Rute" value={formatDistance(trackingStats.totalDistance)} />
        </section>

        {loading ? (
          <section className="flex min-h-[280px] flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white text-center shadow-sm">
            <Loader2 className="h-12 w-12 animate-spin text-purple-700" />
            <p className="mt-4 text-xl font-black text-slate-950">Memuat dashboard tracking...</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm font-black text-red-700">
            {errorMessage}
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.82fr]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">Event Tracking</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Pilih event untuk membuka Live View, Results, atau Doorprize.
                  </p>
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

              <div className="mt-5 space-y-3">
                {activeEvents.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                    Belum ada event aktif.
                  </div>
                ) : (
                  activeEvents.slice(0, 6).map((event) => (
                    <EventTrackingCard key={String(event.id)} event={event} />
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-black text-slate-950">Alur Peserta</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Alur ini yang akan kita kunci agar tidak pusing saat pindah halaman.
              </p>

              <div className="mt-6 space-y-3">
                <FlowStep number="1" title="Join Event" description="Peserta daftar dari halaman detail event." />
                <FlowStep number="2" title="Live View" description="Pantau event dari /account/events/[id]/view." />
                <FlowStep number="3" title="Results" description="Hasil event dilihat dari /account/events/[id]/results." />
                <FlowStep number="4" title="Doorprize" description="Undian dilihat dari /account/events/[id]/doorprize." />
                <FlowStep number="5" title="Timeline" description="Aktivitas otomatis muncul di /home." />
              </div>
            </section>
          </section>
        )}

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
              <Bike size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-950">
                Catatan desain
              </h3>
              <p className="mt-2 text-sm font-semibold leading-7 text-slate-500">
                Halaman Tracking Dashboard ini sengaja dibuat ringkas. Tujuannya agar tidak
                terasa sama dengan Live View Event. Map event besar hanya dipakai pada halaman
                event tertentu.
              </p>
            </div>
          </div>
        </section>
      </section>
    </AccountAppShell>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function QuickAccess({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: any;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-700 hover:bg-purple-50 hover:text-purple-700"
    >
      <Icon size={22} />
      {label}
    </Link>
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

function EventTrackingCard({ event }: { event: EventItem }) {
  const participantCount = Number(event.participant_count || 0);
  const quota = Number(event.quota || 0);
  const percent = quota > 0 ? Math.min(100, Math.round((participantCount / quota) * 100)) : 0;

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase text-green-700">
              {getStatusLabel(event.status)}
            </span>
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">
              {participantCount}/{quota || "-"} Peserta
            </span>
          </div>

          <h4 className="mt-3 text-xl font-black text-slate-950">
            {getEventTitle(event)}
          </h4>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {formatDate(event.event_date)} · {event.location || "Lokasi menyusul"}
          </p>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-purple-700" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-2">
          <MiniAction href={`/account/events/${event.id}/view`} icon={Navigation} label="Live" />
          <MiniAction href={`/account/events/${event.id}/results`} icon={Trophy} label="Results" />
          <MiniAction href={`/account/events/${event.id}/doorprize`} icon={Gift} label="Doorprize" />
        </div>
      </div>
    </article>
  );
}

function MiniAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: any;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-16 min-w-[84px] flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white text-[11px] font-black text-slate-700 hover:bg-purple-50 hover:text-purple-700"
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

function FlowStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-700 text-sm font-black text-white">
        {number}
      </div>
      <div>
        <h4 className="font-black text-slate-950">{title}</h4>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}
