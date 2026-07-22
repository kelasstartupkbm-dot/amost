"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ElementType } from "react";
import {
  ArrowRight,
  CalendarDays,
  Gift,
  Loader2,
  MapPin,
  Search,
  Ticket,
  Users,
} from "lucide-react";

type CurrentUser = {
  id?: number | string | null;
  fullName?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string | null;
};

type EventItem = {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  category?: string | null;
  event_date?: string | null;
  location?: string | null;
  participant_count?: number | string | null;
  quota?: number | string | null;
  doorprize_count?: number | string | null;
  status?: string | null;
  description?: string | null;
  image_url?: string | null;
};

function getEventHref(event: EventItem) {
  return `/events/${event.slug || event.id}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Tanggal menyusul";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function normalizeStatus(status: string | null | undefined) {
  const raw = String(status || "published").toLowerCase();

  if (["published", "open", "active", "buka", "live"].includes(raw)) {
    return "Buka";
  }

  if (["upcoming", "draft", "soon", "segera"].includes(raw)) {
    return "Segera";
  }

  if (["closed", "selesai", "finish", "finished"].includes(raw)) {
    return "Selesai";
  }

  return status || "Buka";
}

export default function EventsPage() {
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const isLoggedIn = Boolean(currentUser?.id);

  async function loadCurrentUser() {
    setCheckingAuth(true);

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.ok && data?.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error(error);
      setCurrentUser(null);
    } finally {
      setCheckingAuth(false);
    }
  }

  async function loadEvents() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/events", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setEvents([]);
        setErrorMessage(
          data?.message || data?.error || "Data event belum bisa dimuat."
        );
        return;
      }

      const rows = Array.isArray(data?.events)
        ? data.events
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setEvents(rows);
    } catch (error) {
      console.error(error);
      setEvents([]);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCurrentUser();
    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) return events;

    return events.filter((event) => {
      return [
        event.id,
        event.title,
        event.category,
        formatDate(event.event_date),
        event.location,
        event.status,
        event.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [events, query]);

  const stats = useMemo(() => {
    const totalParticipants = events.reduce((sum, event) => {
      return sum + Number(event.participant_count || 0);
    }, 0);

    const totalDoorprize = events.reduce((sum, event) => {
      return sum + Number(event.doorprize_count || 0);
    }, 0);

    return {
      activeEvents: events.length,
      totalParticipants,
      totalDoorprize,
    };
  }, [events]);

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-100 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(126,34,206,0.16)_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-purple-50/80 to-transparent lg:block" />
        <div className="absolute bottom-0 right-[6%] hidden h-[360px] w-[360px] rotate-45 rounded-[70px] bg-slate-200/30 lg:block" />

        <div className="relative mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-[88px] lg:py-24">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-purple-700">
              AMOST Events
            </p>

            <h1 className="mt-5 max-w-4xl text-[42px] font-black leading-[1.05] tracking-tight text-slate-950 sm:text-[58px] lg:text-[72px]">
              Temukan Event Olahraga Outdoor
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              Ikuti event sepeda, lari, trail run, jalan sehat, dan aktivitas
              outdoor lainnya. Daftar event, dapatkan nomor peserta, dan ikuti
              kesempatan doorprize melalui AMOST.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#event-list"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-purple-700 px-7 text-sm font-black text-white shadow-lg shadow-purple-200 transition hover:bg-purple-800"
              >
                Lihat Event
                <ArrowRight size={19} />
              </a>

              {!checkingAuth && !isLoggedIn ? (
                <Link
                  href="/register"
                  className="inline-flex h-14 items-center justify-center rounded-xl border border-purple-200 bg-white px-7 text-sm font-black text-purple-700 transition hover:bg-purple-50"
                >
                  Daftar Akun
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-12 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={CalendarDays}
              value={String(stats.activeEvents)}
              label="Event Aktif"
            />
            <StatCard
              icon={Users}
              value={`${stats.totalParticipants}+`}
              label="Total Peserta"
            />
            <StatCard
              icon={Gift}
              value={`${stats.totalDoorprize}+`}
              label="Doorprize"
            />
          </div>
        </div>
      </section>

      <section id="event-list" className="bg-slate-50 py-14 lg:py-20">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-[88px]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-purple-700">
                Daftar Event
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Event yang Tersedia
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Data event di halaman ini sudah membaca tabel events yang sama
                dengan dashboard admin.
              </p>
            </div>

            <div className="relative w-full lg:max-w-md">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari event..."
                className="h-13 w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
              />
            </div>
          </div>

          {loading ? (
            <div className="mt-9 flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <Loader2 className="h-10 w-10 animate-spin text-purple-700" />
              <p className="mt-4 text-lg font-black text-slate-950">
                Memuat event...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="mt-9 rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          ) : (
            <div className="mt-9 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard key={String(event.id)} event={event} />
              ))}
            </div>
          )}

          {!loading && !errorMessage && filteredEvents.length === 0 && (
            <div className="mt-9 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-black text-slate-950">
                Event tidak ditemukan
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Coba gunakan kata kunci lain.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: ElementType;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
        <Icon size={23} />
      </div>
      <p className="mt-6 text-4xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const status = normalizeStatus(event.status);
  const statusClass =
    status === "Buka"
      ? "bg-green-50 text-green-700 ring-green-100"
      : status === "Segera"
        ? "bg-amber-50 text-amber-700 ring-amber-100"
        : "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-100 via-white to-slate-100">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title || "Event AMOST"}
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(126,34,206,0.18)_1px,transparent_0)] [background-size:20px_20px]" />
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple-200/70" />
          </>
        )}

        <div className="absolute bottom-6 left-6 rounded-2xl bg-white/90 px-4 py-2 text-sm font-black text-purple-700 shadow-sm backdrop-blur">
          {event.category || "Event"}
        </div>
        <div
          className={`absolute right-5 top-5 rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass}`}
        >
          {status}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-2xl font-black leading-tight text-slate-950">
          {event.title || `Event #${event.id}`}
        </h3>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          {event.description || "Event olahraga outdoor AMOST."}
        </p>

        <div className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
          <InfoRow icon={CalendarDays} text={formatDate(event.event_date)} />
          <InfoRow icon={MapPin} text={event.location || "Lokasi menyusul"} />
          <InfoRow
            icon={Users}
            text={`${Number(event.participant_count || 0)} peserta`}
          />
          <InfoRow
            icon={Gift}
            text={`${Number(event.doorprize_count || 0)} doorprize`}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 pt-2">
          <Link
            href={getEventHref(event)}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-purple-200 text-sm font-black text-purple-700 transition hover:bg-purple-50"
          >
            Detail
          </Link>
          <Link
            href={getEventHref(event)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-purple-700 text-sm font-black text-white transition hover:bg-purple-800"
          >
            Daftar
            <Ticket size={17} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function InfoRow({
  icon: Icon,
  text,
}: {
  icon: ElementType;
  text: string;
}) {
  return (
    <p className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
        <Icon size={16} />
      </span>
      {text}
    </p>
  );
}
