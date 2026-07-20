"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Gift,
  Loader2,
  Lock,
  MapPin,
  Radio,
  Trophy,
  Ticket,
  Users,
} from "lucide-react";
import {
  getRegistrationClosedLabel,
  isEventRegistrationClosed,
} from "../../lib/amostEventStatus";

type AnyRecord = Record<string, any>;

type EventDetail = {
  id?: number | string;
  slug?: string;
  title?: string;
  name?: string;
  event_title?: string;
  description?: string;
  event_description?: string;
  status?: string;
  registration_status?: string;
  registrationStatus?: string;
  location?: string;
  city?: string;
  distance_km?: number | string;
  distance?: number | string;
  quota?: number | string;
  max_participants?: number | string;
  participant_count?: number | string;
  participants_count?: number | string;
  registered_count?: number | string;
  doorprize_count?: number | string;
  doorprize?: number | string;
  fee?: number | string;
  price?: number | string;
  registration_fee?: number | string;
  event_date?: string;
  date?: string;
  start_at?: string;
  startAt?: string;
  end_at?: string;
  endAt?: string;
  image_url?: string;
  image?: string;
  banner_url?: string;
  cover_url?: string;
};

type RegistrationInfo = {
  id?: number | string;
  event_id?: number | string;
  user_id?: number | string;
  participant_number?: string | null;
  status?: string;
};

function getRowsFromApi(payload: any): AnyRecord[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.events)) return payload.events;
  return [];
}

function getEventFromApi(payload: any): EventDetail | null {
  if (!payload) return null;
  if (payload.event && typeof payload.event === "object") return payload.event;
  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) return payload.data;
  if (payload.item && typeof payload.item === "object") return payload.item;
  if (payload.detail && typeof payload.detail === "object") return payload.detail;

  const rows = getRowsFromApi(payload);
  if (rows[0]) return rows[0] as EventDetail;

  if (typeof payload === "object" && (payload.id || payload.slug || payload.title || payload.name)) {
    return payload as EventDetail;
  }

  return null;
}

function textValue(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function numberValue(...values: unknown[]): number {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function moneyValue(value: unknown): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "-";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function normalizeStatus(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function statusLabel(value: unknown): string {
  const status = normalizeStatus(value);
  if (!status) return "Buka";

  if (["selesai", "finished", "finish", "completed", "complete", "ended"].includes(status)) {
    return "Selesai";
  }

  if (["closed", "ditutup"].includes(status)) return "Ditutup";
  if (["cancelled", "canceled", "batal"].includes(status)) return "Batal";
  if (["draft"].includes(status)) return "Draft";
  if (["published", "open", "buka", "active", "aktif"].includes(status)) return "Buka";

  return String(value ?? "Buka");
}

function statusClass(value: unknown): string {
  const label = statusLabel(value).toLowerCase();

  if (label === "selesai") return "bg-slate-100 text-slate-600";
  if (label === "ditutup" || label === "batal") return "bg-red-50 text-red-600";
  if (label === "draft") return "bg-amber-50 text-amber-700";

  return "bg-emerald-50 text-emerald-700";
}

function pickImage(event: EventDetail | null): string {
  const image = textValue(event?.image_url, event?.banner_url, event?.cover_url, event?.image);
  return image || "/images/amost-event-placeholder.jpg";
}

function eventTitle(event: EventDetail | null): string {
  return textValue(event?.title, event?.name, event?.event_title, "Detail Event");
}

function eventDescription(event: EventDetail | null): string {
  return textValue(
    event?.description,
    event?.event_description,
    "Ikuti event olahraga outdoor bersama AMOST."
  );
}

async function fetchJson(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const text = await res.text();
  let payload: any = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { ok: false, message: text };
  }

  if (!res.ok) {
    const message = payload?.message || payload?.error || `Request gagal (${res.status})`;
    const error = new Error(message) as Error & { status?: number; payload?: any };
    error.status = res.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export default function EventDetailPage() {
  const router = useRouter();
  const routeParams = useParams();
  const eventId = String((routeParams as any)?.id ?? "");

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [registration, setRegistration] = useState<RegistrationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [joinMessage, setJoinMessage] = useState("");

  const title = useMemo(() => eventTitle(event), [event]);
  const description = useMemo(() => eventDescription(event), [event]);
  const image = useMemo(() => pickImage(event), [event]);

  const participantCount = numberValue(
    event?.participant_count,
    event?.participants_count,
    event?.registered_count
  );

  const quota = numberValue(event?.quota, event?.max_participants);
  const distanceKm = numberValue(event?.distance_km, event?.distance);
  const fee = numberValue(event?.fee, event?.price, event?.registration_fee);

  const eventDate = textValue(event?.event_date, event?.date, event?.start_at, event?.startAt);
  const location = textValue(event?.location, event?.city, "-");

  const registrationClosed = isEventRegistrationClosed({
    status: event?.status,
    registrationStatus: event?.registration_status ?? event?.registrationStatus,
    eventDate: event?.event_date ?? event?.date,
    startAt: event?.start_at ?? event?.startAt,
    endAt: event?.end_at ?? event?.endAt,
  });

  const registrationClosedLabel = getRegistrationClosedLabel({
    status: event?.status,
    registrationStatus: event?.registration_status ?? event?.registrationStatus,
    eventDate: event?.event_date ?? event?.date,
    startAt: event?.start_at ?? event?.startAt,
    endAt: event?.end_at ?? event?.endAt,
  });

  const isRegistered = Boolean(registration?.id || registration?.status === "registered");

  const loadEvent = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    setError("");

    try {
      const payload = await fetchJson(`/api/events/${encodeURIComponent(eventId)}`);
      const nextEvent = getEventFromApi(payload);

      if (!nextEvent) {
        throw new Error("Data event tidak ditemukan.");
      }

      setEvent(nextEvent);

      const nextRegistration =
        payload?.registration ??
        payload?.myRegistration ??
        payload?.data?.registration ??
        null;

      if (nextRegistration) {
        setRegistration(nextRegistration);
      }
    } catch (err: any) {
      setError(err?.message || "Gagal memuat event.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  async function handleJoin() {
    if (!eventId || joining || registrationClosed || isRegistered) return;

    setJoining(true);
    setJoinMessage("");
    setError("");

    try {
      const payload = await fetchJson(`/api/events/${encodeURIComponent(eventId)}/join`, {
        method: "POST",
      });

      const nextRegistration =
        payload?.registration ??
        payload?.data ??
        payload?.item ??
        null;

      if (nextRegistration) {
        setRegistration(nextRegistration);
      }

      setJoinMessage(payload?.message || "Berhasil daftar event.");
      await loadEvent();
    } catch (err: any) {
      if (err?.status === 401) {
        router.push(`/login?next=/events/${encodeURIComponent(eventId)}`);
        return;
      }

      setError(err?.message || "Gagal daftar event.");
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6">
          <div className="rounded-3xl border border-slate-200 bg-white px-10 py-9 text-center shadow-sm">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-purple-700" />
            <h1 className="mt-5 text-2xl font-black text-slate-950">Memuat detail event...</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">Mengambil data event AMOST.</p>
          </div>
        </section>
      </main>
    );
  }

  if (error && !event) {
    return (
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
          <div className="w-full rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-3xl font-black text-slate-950">Event tidak dapat dibuka</h1>
            <p className="mt-3 text-slate-600">{error}</p>
            <Link
              href="/events"
              className="mt-6 inline-flex rounded-2xl bg-purple-700 px-6 py-3 font-black text-white hover:bg-purple-800"
            >
              Kembali ke Events
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm hover:border-purple-200 hover:text-purple-700"
          >
            ← Semua Event
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/account/events"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm hover:border-purple-200 hover:text-purple-700"
            >
              My Events
            </Link>

            <button
              type="button"
              onClick={handleJoin}
              disabled={registrationClosed || joining || isRegistered}
              className={
                registrationClosed || joining || isRegistered
                  ? "inline-flex cursor-not-allowed items-center gap-2 rounded-2xl bg-slate-200 px-5 py-3 text-sm font-black text-slate-500"
                  : "inline-flex items-center gap-2 rounded-2xl bg-purple-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-purple-200 hover:bg-purple-800"
              }
            >
              <Ticket className="h-4 w-4" />
              {registrationClosed
                ? registrationClosedLabel
                : isRegistered
                  ? "Sudah Terdaftar"
                  : joining
                    ? "Memproses..."
                    : "Daftar Event"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="h-72 w-full overflow-hidden bg-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/images/amost-event-placeholder.jpg";
              }}
            />
          </div>

          <div className="grid gap-8 p-8 lg:grid-cols-[1fr_520px]">
            <div>
              <span className={`inline-flex rounded-full px-4 py-2 text-xs font-black uppercase ${statusClass(event?.status)}`}>
                {statusLabel(event?.status)}
              </span>

              <h1 className="mt-5 text-5xl font-black leading-tight text-slate-950">
                {title}
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                {description}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Status Pendaftaran
              </p>

              <h2 className="mt-3 text-2xl font-black text-slate-950">
                {isRegistered ? "Terdaftar" : registrationClosed ? registrationClosedLabel : "Belum Terdaftar"}
              </h2>

              <p className="mt-2 font-semibold text-slate-600">
                {isRegistered
                  ? `Nomor peserta: ${registration?.participant_number || "-"}`
                  : registrationClosed
                    ? "Pendaftaran tidak tersedia karena event sudah selesai atau ditutup."
                    : "Daftar dulu untuk membuka akses Live Tracking, Results, dan Doorprize."}
              </p>

              <button
                type="button"
                onClick={handleJoin}
                disabled={registrationClosed || joining || isRegistered}
                className={
                  registrationClosed || joining || isRegistered
                    ? "mt-5 w-full cursor-not-allowed rounded-2xl bg-slate-200 px-5 py-4 font-black text-slate-500"
                    : "mt-5 w-full rounded-2xl bg-purple-700 px-5 py-4 font-black text-white shadow-lg shadow-purple-200 hover:bg-purple-800"
                }
              >
                {registrationClosed
                  ? registrationClosedLabel
                  : isRegistered
                    ? "Sudah Terdaftar"
                    : joining
                      ? "Memproses..."
                      : "Daftar Event Sekarang"}
              </button>

              {joinMessage ? (
                <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  {joinMessage}
                </p>
              ) : null}

              {error ? (
                <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 border-t border-slate-100 p-8 sm:grid-cols-2 lg:grid-cols-5">
            <InfoCard icon={<CalendarDays className="h-6 w-6" />} label="Tanggal" value={formatDate(eventDate)} />
            <InfoCard icon={<MapPin className="h-6 w-6" />} label="Lokasi" value={location} />
            <InfoCard icon={<Radio className="h-6 w-6" />} label="Distance" value={`${distanceKm.toFixed(2)} KM`} />
            <InfoCard icon={<Users className="h-6 w-6" />} label="Peserta" value={`${participantCount}/${quota || "-"}`} />
            <InfoCard icon={<Ticket className="h-6 w-6" />} label="Biaya" value={moneyValue(fee)} />
          </div>
        </div>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          {isRegistered ? (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                <div>
                  <h2 className="text-2xl font-black text-slate-950">Akses peserta sudah terbuka</h2>
                  <p className="font-semibold text-slate-500">
                    Kamu bisa membuka Live Tracking, Results, dan Doorprize.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <AccessCard
                  href={`/events/${encodeURIComponent(eventId)}/tracking`}
                  icon={<Radio className="h-7 w-7" />}
                  title="Live Tracking"
                  desc="Pantau posisi dan aktivitas event."
                />
                <AccessCard
                  href={`/events/${encodeURIComponent(eventId)}/results`}
                  icon={<Trophy className="h-7 w-7" />}
                  title="Results"
                  desc="Lihat hasil dan catatan event."
                />
                <AccessCard
                  href={`/events/${encodeURIComponent(eventId)}/doorprize`}
                  icon={<Gift className="h-7 w-7" />}
                  title="Doorprize"
                  desc="Lihat undian dan pemenang."
                />
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Lock className="h-8 w-8 text-slate-400" />
              </div>

              <h2 className="mt-5 text-3xl font-black text-slate-950">
                {registrationClosed ? registrationClosedLabel : "Daftar untuk membuka akses peserta"}
              </h2>

              <p className="mt-3 font-semibold text-slate-500">
                {registrationClosed
                  ? "Akses pendaftaran sudah ditutup untuk event ini."
                  : "Setelah terdaftar, kamu bisa mengakses Live Tracking, Results, dan Doorprize."}
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function AccessCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:border-purple-200 hover:bg-purple-50"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{desc}</p>
      <p className="mt-5 inline-flex items-center gap-2 text-sm font-black text-purple-700">
        Buka <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </p>
    </Link>
  );
}
