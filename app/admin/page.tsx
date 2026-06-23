"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Gift,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  Search,
  Ticket,
  Users,
} from "lucide-react";

type EventItem = {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  eventType?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  distanceKm?: string | number | null;
  ticketPrice?: string | number | null;
  maxParticipants?: number | null;
  doorprizeCount?: number | null;
  status: string;
  coverImage?: string | null;
  createdAt?: string | null;
  participantCount: number;
};

export default function AdminPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);

  async function loadEvents() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/admin/events", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.status === 403) {
        window.location.href = "/account";
        return;
      }

      if (!response.ok || !data.ok) {
        setMessage(data.message || "Gagal mengambil data event.");
        return;
      }

      setEvents(data.events || []);
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      setLogoutLoading(true);

      await fetch("/api/auth/logout", {
        method: "POST",
      });

      window.location.href = "/login";
    } catch (error) {
      console.error(error);
      window.location.href = "/login";
    } finally {
      setLogoutLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) return events;

    return events.filter((event) => {
      return (
        event.title.toLowerCase().includes(keyword) ||
        String(event.location || "").toLowerCase().includes(keyword) ||
        String(event.eventType || "").toLowerCase().includes(keyword) ||
        event.status.toLowerCase().includes(keyword)
      );
    });
  }, [events, query]);

  const totalParticipants = events.reduce(
    (sum, event) => sum + Number(event.participantCount || 0),
    0
  );

  const totalTickets = events.reduce(
    (sum, event) => sum + Number(event.maxParticipants || 0),
    0
  );

  const totalDoorprizes = events.reduce(
    (sum, event) => sum + Number(event.doorprizeCount || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <div className="logo-symbol responsive-logo">A</div>
            <div className="min-w-0">
              <div className="text-[26px] font-black leading-none tracking-wide text-purple-700">
                AMOST
              </div>
              <div className="mt-1 text-[8px] font-black uppercase leading-[1.05] tracking-wide text-purple-700">
                Event Management
              </div>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/admin"
              className="hidden items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:flex"
            >
              <ArrowLeft size={17} />
              Dashboard
            </Link>

            <Link
              href="/admin/events/new"
              className="flex items-center gap-2 rounded-lg bg-purple-700 px-3 py-2 text-sm font-black text-white hover:bg-purple-800 sm:px-4"
            >
              <Plus size={17} />
              <span className="hidden sm:inline">Tambah Event</span>
              <span className="sm:hidden">Tambah</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            >
              <LogOut size={17} />
              <span>{logoutLoading ? "Keluar..." : "Keluar"}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Admin Event
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">
                Daftar Event
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Kelola event AMOST dari database PostgreSQL. Event di halaman
                ini sudah bukan data dummy.
              </p>
            </div>

            <div className="flex h-12 w-full items-center gap-3 rounded-xl border border-slate-200 px-4 md:w-[360px]">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari event..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full border-0 bg-transparent text-sm font-medium outline-none"
              />
            </div>
          </div>

          {message && (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
              {message}
            </div>
          )}

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={CalendarDays}
              label="Total Event"
              value={events.length.toString()}
            />
            <SummaryCard
              icon={Users}
              label="Total Peserta"
              value={totalParticipants.toLocaleString("id-ID")}
            />
            <SummaryCard
              icon={Ticket}
              label="Total Kuota"
              value={totalTickets.toLocaleString("id-ID")}
            />
            <SummaryCard
              icon={Gift}
              label="Doorprize"
              value={totalDoorprizes.toLocaleString("id-ID")}
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
              <div className="text-center">
                <Loader2 className="mx-auto animate-spin text-purple-700" />
                <p className="mt-3 text-sm font-bold text-slate-600">
                  Memuat event...
                </p>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <CalendarDays className="mx-auto text-slate-400" size={42} />
              <h2 className="mt-4 text-xl font-black text-slate-950">
                Belum ada event
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Tambahkan event pertama untuk mulai memakai AMOST Event
                Management.
              </p>
              <Link
                href="/admin/events/new"
                className="mt-5 inline-flex rounded-lg bg-purple-700 px-5 py-3 text-sm font-black text-white hover:bg-purple-800"
              >
                Tambah Event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((event) => (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative h-40 bg-gradient-to-br from-purple-50 to-slate-100">
                    {event.coverImage ? (
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-300">
                        <CalendarDays size={54} />
                      </div>
                    )}

                    <span
                      className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-black ${
                        event.status === "published"
                          ? "bg-green-100 text-green-700"
                          : event.status === "draft"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {formatStatus(event.status)}
                    </span>

                    <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-black text-purple-700 shadow-sm">
                      {event.eventType || "Event"}
                    </span>
                  </div>

                  <div className="p-5">
                    <h2 className="text-xl font-black text-slate-950">
                      {event.title}
                    </h2>

                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <MapPin size={16} className="text-purple-700" />
                        {event.location || "-"}
                      </p>
                      <p className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-purple-700" />
                        {formatDate(event.startDate)}
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <MiniStat
                        value={Number(event.participantCount || 0).toString()}
                        label="Peserta"
                      />
                      <MiniStat
                        value={String(event.maxParticipants || 0)}
                        label="Kuota"
                      />
                      <MiniStat
                        value={String(event.doorprizeCount || 0)}
                        label="Hadiah"
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="rounded-xl bg-purple-700 px-4 py-3 text-center text-sm font-black text-white hover:bg-purple-800"
                      >
                        Detail
                      </Link>

                      <Link
                        href={`/admin/events/${event.id}/doorprize`}
                        className="rounded-xl border border-purple-200 px-4 py-3 text-center text-sm font-black text-purple-700 hover:bg-purple-50"
                      >
                        Doorprize
                      </Link>
                    </div>

                    <Link
                      href={`/admin/events/${event.id}/participants`}
                      className="mt-3 block rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                      Peserta & Nomor
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
        <Icon size={22} />
      </div>
      <p className="mt-5 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function formatStatus(status: string) {
  if (status === "published") return "Published";
  if (status === "draft") return "Draft";
  if (status === "closed") return "Closed";
  if (status === "finished") return "Finished";
  return status;
}
