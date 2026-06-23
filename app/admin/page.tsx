"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Gift,
  Loader2,
  Search,
  Ticket,
  UsersRound,
} from "lucide-react";
import AdminHeader from "../components/AdminHeader";

type AdminEvent = {
  id: number | string;
  title?: string | null;
  name?: string | null;
  event_name?: string | null;
  category?: string | null;
  sport_type?: string | null;
  status?: string | null;
  quota?: number | string | null;
  total_quota?: number | string | null;
  participant_count?: number | string | null;
  total_participants?: number | string | null;
  doorprize_count?: number | string | null;
  doorprize_total?: number | string | null;
  image_url?: string | null;
  cover_image_url?: string | null;
  banner_url?: string | null;
  location?: string | null;
  created_at?: string | null;
};

type StatCard = {
  label: string;
  value: string | number;
  icon: typeof CalendarDays;
};

function getEventTitle(event: AdminEvent) {
  return (
    event.title ||
    event.event_name ||
    event.name ||
    `Event #${event.id}`
  );
}

function getEventImage(event: AdminEvent) {
  return (
    event.cover_image_url ||
    event.image_url ||
    event.banner_url ||
    ""
  );
}

function getEventCategory(event: AdminEvent) {
  return event.category || event.sport_type || "Event";
}

function getEventStatus(event: AdminEvent) {
  return event.status || "Draft";
}

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function pickEvents(data: any): AdminEvent[] {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.events)) return data.events;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

export default function AdminPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadEvents() {
    setLoading(true);
    setErrorMessage("");

    const candidates = [
      "/api/admin/events",
      "/api/events",
      "/api/admin/event",
    ];

    for (const url of candidates) {
      try {
        const response = await fetch(url, {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          continue;
        }

        const parsedEvents = pickEvents(data);

        setEvents(parsedEvents);
        setLoading(false);
        return;
      } catch (error) {
        console.error(error);
      }
    }

    setEvents([]);
    setErrorMessage("Data event belum bisa dimuat. Periksa API /api/admin/events.");
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return events;

    return events.filter((event) => {
      const joined = [
        getEventTitle(event),
        getEventCategory(event),
        getEventStatus(event),
        event.location || "",
        String(event.id),
      ]
        .join(" ")
        .toLowerCase();

      return joined.includes(keyword);
    });
  }, [events, search]);

  const totalParticipants = useMemo(() => {
    return events.reduce((total, event) => {
      return total + toNumber(event.participant_count ?? event.total_participants);
    }, 0);
  }, [events]);

  const totalQuota = useMemo(() => {
    return events.reduce((total, event) => {
      return total + toNumber(event.quota ?? event.total_quota);
    }, 0);
  }, [events]);

  const totalDoorprize = useMemo(() => {
    return events.reduce((total, event) => {
      return total + toNumber(event.doorprize_count ?? event.doorprize_total);
    }, 0);
  }, [events]);

  const stats: StatCard[] = [
    {
      label: "Total Event",
      value: events.length,
      icon: CalendarDays,
    },
    {
      label: "Total Peserta",
      value: totalParticipants,
      icon: UsersRound,
    },
    {
      label: "Total Kuota",
      value: totalQuota,
      icon: Ticket,
    },
    {
      label: "Doorprize",
      value: totalDoorprize,
      icon: Gift,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <AdminHeader
        active="dashboard"
        title="Daftar Event"
        subtitle="Kelola event AMOST dari database PostgreSQL. Event di halaman ini sudah bukan data dummy."
        showRefresh
        onRefresh={loadEvents}
      />

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-[88px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Admin Event
              </p>
              <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Daftar Event
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Kelola event AMOST dari database PostgreSQL. Event di halaman ini
                sudah bukan data dummy.
              </p>
            </div>

            <div className="relative w-full lg:w-[360px]">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari event..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
              />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <item.icon size={22} />
                </div>
                <p className="mt-5 text-3xl font-black text-slate-950">
                  {item.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
          {loading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <Loader2 className="h-10 w-10 animate-spin text-purple-700" />
              <p className="mt-4 text-lg font-black text-slate-950">
                Memuat event...
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Mengambil data dari server AMOST.
              </p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                <CalendarDays size={30} />
              </div>
              <h2 className="mt-5 text-2xl font-black text-slate-950">
                Belum ada event
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Tambahkan event baru dari tombol Tambah Event di header admin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((event) => {
                const image = getEventImage(event);
                const status = getEventStatus(event);

                return (
                  <article
                    key={String(event.id)}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative h-44 bg-slate-100">
                      {image ? (
                        <img
                          src={image}
                          alt={getEventTitle(event)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-50 to-slate-100 text-purple-700">
                          <CalendarDays size={42} />
                        </div>
                      )}

                      <div className="absolute left-4 top-4 rounded-full bg-white px-4 py-1 text-xs font-black text-purple-700 shadow-sm">
                        {getEventCategory(event)}
                      </div>

                      <div className="absolute right-4 top-4 rounded-full bg-white px-4 py-1 text-xs font-black text-slate-700 shadow-sm">
                        {status}
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="line-clamp-2 text-xl font-black leading-tight text-slate-950">
                        {getEventTitle(event)}
                      </h3>

                      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-lg font-black text-slate-950">
                            {toNumber(event.participant_count ?? event.total_participants)}
                          </p>
                          <p className="text-[11px] font-bold uppercase text-slate-500">
                            Peserta
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-lg font-black text-slate-950">
                            {toNumber(event.quota ?? event.total_quota)}
                          </p>
                          <p className="text-[11px] font-bold uppercase text-slate-500">
                            Kuota
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-lg font-black text-slate-950">
                            {toNumber(event.doorprize_count ?? event.doorprize_total)}
                          </p>
                          <p className="text-[11px] font-bold uppercase text-slate-500">
                            Hadiah
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex gap-3">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                        >
                          Detail
                        </Link>

                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="flex h-10 flex-1 items-center justify-center rounded-xl bg-purple-700 text-sm font-black text-white transition hover:bg-purple-800"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
