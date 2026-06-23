"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Gift,
  MapPin,
  Search,
  Ticket,
  Users,
} from "lucide-react";

type EventItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  participants: string;
  doorprize: string;
  status: "Buka" | "Segera" | "Selesai";
  description: string;
};

const events: EventItem[] = [
  {
    id: "gowes-banyumas-challenge",
    title: "Gowes Banyumas Challenge",
    category: "Sepeda",
    date: "22 Juni 2026",
    location: "Purwokerto, Banyumas",
    participants: "257+ peserta",
    doorprize: "Doorprize tersedia",
    status: "Buka",
    description:
      "Event gowes outdoor untuk komunitas sepeda, peserta umum, dan pegiat olahraga Banyumas.",
  },
  {
    id: "sehat-bersama-amost",
    title: "Sehat Bersama AMOST",
    category: "Jalan Sehat",
    date: "28 Juni 2026",
    location: "GOR Satria Purwokerto",
    participants: "180+ peserta",
    doorprize: "Doorprize tersedia",
    status: "Buka",
    description:
      "Jalan sehat berbasis nomor peserta dengan pencatatan aktivitas dan sistem doorprize AMOST.",
  },
  {
    id: "trail-run-baturaden",
    title: "Baturaden Trail Run",
    category: "Trail Run",
    date: "Juli 2026",
    location: "Baturaden",
    participants: "120+ peserta",
    doorprize: "Hadiah finisher",
    status: "Segera",
    description:
      "Trail run ringan untuk mengenalkan pengalaman tracking outdoor berbasis AMOST.",
  },
];

export default function EventsPage() {
  const [query, setQuery] = useState("");

  const filteredEvents = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) return events;

    return events.filter((event) => {
      return [
        event.title,
        event.category,
        event.date,
        event.location,
        event.status,
        event.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [query]);

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

              <Link
                href="/register"
                className="inline-flex h-14 items-center justify-center rounded-xl border border-purple-200 bg-white px-7 text-sm font-black text-purple-700 transition hover:bg-purple-50"
              >
                Daftar Akun
              </Link>
            </div>
          </div>

          <div className="mt-12 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={CalendarDays} value="3" label="Event Aktif" />
            <StatCard icon={Users} value="257+" label="Total Peserta" />
            <StatCard icon={Gift} value="35+" label="Doorprize" />
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
                Pilih event yang sesuai, masuk atau daftar akun, lalu ikuti
                instruksi pendaftaran di halaman event.
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

          <div className="mt-9 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {filteredEvents.length === 0 && (
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
  icon: React.ElementType;
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
  const statusClass =
    event.status === "Buka"
      ? "bg-green-50 text-green-700 ring-green-100"
      : event.status === "Segera"
        ? "bg-amber-50 text-amber-700 ring-amber-100"
        : "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-100 via-white to-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(126,34,206,0.18)_1px,transparent_0)] [background-size:20px_20px]" />
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple-200/70" />
        <div className="absolute bottom-6 left-6 rounded-2xl bg-white/90 px-4 py-2 text-sm font-black text-purple-700 shadow-sm backdrop-blur">
          {event.category}
        </div>
        <div
          className={`absolute right-5 top-5 rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass}`}
        >
          {event.status}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-2xl font-black leading-tight text-slate-950">
          {event.title}
        </h3>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          {event.description}
        </p>

        <div className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
          <InfoRow icon={CalendarDays} text={event.date} />
          <InfoRow icon={MapPin} text={event.location} />
          <InfoRow icon={Users} text={event.participants} />
          <InfoRow icon={Gift} text={event.doorprize} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 pt-2">
          <Link
            href={`/events/${event.id}`}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-purple-200 text-sm font-black text-purple-700 transition hover:bg-purple-50"
          >
            Detail
          </Link>
          <Link
            href="/register"
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
  icon: React.ElementType;
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
