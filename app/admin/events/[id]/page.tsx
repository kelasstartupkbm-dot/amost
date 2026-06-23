"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Edit,
  Gift,
  Loader2,
  MapPin,
  Route,
  Send,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";

type EventDetail = {
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
  updatedAt?: string | null;
  participantCount: number;
};

type PageProps = {
  params: {
    id: string;
  };
};

export default function AdminEventDetailPage({ params }: PageProps) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState("");

  async function loadEvent() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`/api/admin/events/${params.id}`, {
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
        setMessage(data.message || "Gagal mengambil detail event.");
        return;
      }

      setEvent(data.event);
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  }

  async function publishEvent() {
    if (!event) return;

    try {
      setActionLoading("publish");
      setMessage("");

      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: event.title,
          slug: event.slug,
          description: event.description || "",
          eventType: event.eventType || "Event",
          location: event.location || "",
          startDate: toDateTimeLocal(event.startDate),
          endDate: toDateTimeLocal(event.endDate || event.startDate),
          distanceKm: event.distanceKm || 0,
          ticketPrice: event.ticketPrice || 0,
          maxParticipants: event.maxParticipants || 0,
          doorprizeCount: event.doorprizeCount || 0,
          coverImage: event.coverImage || "",
          status: "published",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setMessage(data.message || "Gagal publish event.");
        return;
      }

      await loadEvent();
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan saat publish event.");
    } finally {
      setActionLoading("");
    }
  }

  async function deleteEvent() {
    if (!event) return;

    const confirmed = window.confirm(
      `Hapus event "${event.title}"? Event yang sudah punya peserta tidak bisa dihapus.`
    );

    if (!confirmed) return;

    try {
      setActionLoading("delete");
      setMessage("");

      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setMessage(data.message || "Gagal menghapus event.");
        return;
      }

      window.location.href = "/admin";
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan saat menghapus event.");
    } finally {
      setActionLoading("");
    }
  }

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <div className="logo-symbol responsive-logo">A</div>
            <div>
              <div className="text-[26px] font-black leading-none tracking-wide text-purple-700">
                AMOST
              </div>
              <div className="mt-1 text-[8px] font-black uppercase leading-[1.05] tracking-wide text-purple-700">
                Event Detail
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {event && (
              <>
                <Link
                  href={`/admin/events/${event.id}/edit`}
                  className="hidden items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:flex"
                >
                  <Edit size={17} />
                  Edit
                </Link>

                {event.status !== "published" && (
                  <button
                    type="button"
                    onClick={publishEvent}
                    disabled={actionLoading === "publish"}
                    className="hidden items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-100 disabled:opacity-60 sm:flex"
                  >
                    <Send size={17} />
                    {actionLoading === "publish" ? "Publish..." : "Publish"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={deleteEvent}
                  disabled={actionLoading === "delete"}
                  className="hidden items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-60 sm:flex"
                >
                  <Trash2 size={17} />
                  {actionLoading === "delete" ? "Hapus..." : "Hapus"}
                </button>
              </>
            )}

            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={17} />
              Events
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="text-center">
              <Loader2 className="mx-auto animate-spin text-purple-700" />
              <p className="mt-3 text-sm font-bold text-slate-600">
                Memuat detail event...
              </p>
            </div>
          </div>
        ) : message && !event ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-700">
            {message}
          </div>
        ) : event ? (
          <>
            {message && (
              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                {message}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-72 bg-gradient-to-br from-purple-50 to-slate-100">
                {event.coverImage ? (
                  <img
                    src={event.coverImage}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <CalendarDays size={80} />
                  </div>
                )}

                <span
                  className={`absolute left-6 top-6 rounded-full px-4 py-2 text-sm font-black ${
                    event.status === "published"
                      ? "bg-green-100 text-green-700"
                      : event.status === "draft"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {formatStatus(event.status)}
                </span>
              </div>

              <div className="p-6">
                <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                  {event.eventType || "Event"}
                </p>

                <h1 className="mt-3 text-3xl font-black text-slate-950 md:text-4xl">
                  {event.title}
                </h1>

                <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                  <span className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-purple-700" />
                    {formatDate(event.startDate)}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin size={18} className="text-purple-700" />
                    {event.location || "-"}
                  </span>
                  <span className="flex items-center gap-2">
                    <Route size={18} className="text-purple-700" />
                    {Number(event.distanceKm || 0).toLocaleString("id-ID")} KM
                  </span>
                </div>

                <p className="mt-6 max-w-4xl whitespace-pre-line text-sm leading-7 text-slate-600">
                  {event.description || "Belum ada deskripsi event."}
                </p>

                <div className="mt-6 flex flex-wrap gap-3 sm:hidden">
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
                  >
                    Edit
                  </Link>

                  {event.status !== "published" && (
                    <button
                      type="button"
                      onClick={publishEvent}
                      className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-700"
                    >
                      Publish
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={deleteEvent}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={Users}
                label="Peserta Terdaftar"
                value={Number(event.participantCount || 0).toLocaleString("id-ID")}
              />
              <SummaryCard
                icon={Ticket}
                label="Kuota Peserta"
                value={Number(event.maxParticipants || 0).toLocaleString("id-ID")}
              />
              <SummaryCard
                icon={Gift}
                label="Hadiah Doorprize"
                value={Number(event.doorprizeCount || 0).toLocaleString("id-ID")}
              />
              <SummaryCard
                icon={Ticket}
                label="Harga Tiket"
                value={formatRupiah(event.ticketPrice)}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Link
                href={`/admin/events/${event.id}/participants`}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Peserta & Nomor
              </Link>

              <Link
                href={`/admin/events/${event.id}/doorprize`}
                className="rounded-2xl border border-purple-200 bg-white p-5 text-center text-sm font-black text-purple-700 shadow-sm hover:bg-purple-50"
              >
                Doorprize
              </Link>

              <Link
                href={`/events/${event.slug}`}
                className="rounded-2xl bg-purple-700 p-5 text-center text-sm font-black text-white shadow-sm hover:bg-purple-800"
              >
                Lihat Halaman Publik
              </Link>
            </div>
          </>
        ) : null}
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
        <Icon size={24} />
      </div>
      <p className="mt-5 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
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

function formatRupiah(value?: string | number | null) {
  const numberValue = Number(value || 0);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function formatStatus(status: string) {
  if (status === "published") return "Published";
  if (status === "draft") return "Draft";
  if (status === "closed") return "Closed";
  if (status === "finished") return "Finished";
  return status;
}
