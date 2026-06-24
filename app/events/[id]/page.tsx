"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ElementType } from "react";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Gift,
  Loader2,
  Map,
  MapPin,
  Route,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";

type PublicEvent = {
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
  distance_km?: number | string | null;
  registration_fee?: number | string | null;
  image_url?: string | null;
  route_file?: string | null;
};

type Registration = {
  id?: number | string;
  participant_number?: string | null;
  status?: string | null;
  registration_status?: string | null;
};

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

function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value || 0);

  if (!amount) return "FREE";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeStatus(status: string | null | undefined) {
  const raw = String(status || "published").toLowerCase();

  if (["published", "open", "active", "buka", "live"].includes(raw)) {
    return "Aktif";
  }

  if (["upcoming", "draft", "soon", "segera"].includes(raw)) {
    return "Segera";
  }

  if (["closed", "selesai", "finish", "finished"].includes(raw)) {
    return "Selesai";
  }

  return status || "Aktif";
}

export default function PublicEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || "");

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadEvent() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setEvent(null);
        setErrorMessage(data?.message || data?.error || "Event tidak ditemukan.");
        return;
      }

      setEvent(data.event || data.data || null);
      setRegistration(data.registration || null);
      setIsRegistered(Boolean(data.isRegistered));
    } catch (error) {
      console.error(error);
      setEvent(null);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!event?.id) return;

    setJoining(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/events/${event.id}/join`, {
        method: "POST",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        router.push(`/login?next=/events/${event.id}`);
        return;
      }

      if (!response.ok || data?.ok === false) {
        setErrorMessage(data?.message || data?.error || "Pendaftaran gagal.");
        return;
      }

      const newRegistration = data.registration || data.data || null;

      setRegistration(newRegistration);
      setIsRegistered(true);
      setSuccessMessage(data.message || "Berhasil daftar event.");
      await loadEvent();
    } catch (error) {
      console.error(error);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setJoining(false);
    }
  }

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-purple-700" />
          <p className="mt-4 text-lg font-black">Memuat event...</p>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
        <div className="mx-auto max-w-[960px] rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <p className="text-xl font-black">{errorMessage || "Event tidak ditemukan."}</p>
          <Link
            href="/events"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-red-700 px-5 text-sm font-black text-white"
          >
            Kembali ke Events
          </Link>
        </div>
      </main>
    );
  }

  const title = event.title || `Event #${event.id}`;
  const participantNumber =
    registration?.participant_number || registration?.id || "-";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[92px] max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-[88px]">
          <div className="flex items-center gap-5">
            <Link
              href="/events"
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={22} />
            </Link>

            <Link href="/" className="flex items-center">
              <img
                src="/amost_logo_wide_.png"
                alt="AMOST"
                className="h-[58px] w-auto object-contain"
              />
            </Link>

            <div className="hidden border-l border-slate-200 pl-5 md:block">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-700">
                AMOST Event
              </p>
              <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950">
                {title}
              </h1>
              <p className="mt-1 max-w-xl text-sm font-medium leading-6 text-slate-500">
                Detail event, pendaftaran, akses live tracking, results, dan doorprize.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/account"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Akun Saya
            </Link>

            <Link
              href="/events"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-purple-700 px-4 text-sm font-black text-white hover:bg-purple-800"
            >
              Semua Event
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-[88px]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={title}
              className="h-[260px] w-full object-cover"
            />
          ) : (
            <div className="flex h-[220px] items-center justify-center bg-gradient-to-br from-purple-50 to-slate-100">
              <CalendarDays className="h-16 w-16 text-purple-700" />
            </div>
          )}

          <div className="p-6 lg:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase text-purple-700">
                  {normalizeStatus(event.status)}
                </span>

                <h2 className="mt-4 text-4xl font-black leading-tight text-slate-950">
                  {title}
                </h2>

                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                  {event.description || "Event olahraga outdoor AMOST."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:min-w-[280px]">
                <p className="text-xs font-black uppercase text-slate-500">
                  Status Pendaftaran
                </p>

                {isRegistered ? (
                  <div className="mt-3">
                    <p className="text-3xl font-black text-purple-700">
                      {String(participantNumber)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-600">
                      Nomor peserta aktif
                    </p>
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="text-xl font-black text-slate-950">
                      Belum Terdaftar
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-600">
                      Daftar dulu untuk membuka akses peserta.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  disabled={joining || isRegistered}
                  onClick={handleJoin}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 text-sm font-black text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {joining ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {isRegistered ? "Sudah Terdaftar" : joining ? "Mendaftar..." : "Daftar Event Sekarang"}
                </button>
              </div>
            </div>

            {errorMessage ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                {successMessage}
              </div>
            ) : null}

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <InfoCard
                icon={CalendarDays}
                label="Tanggal"
                value={formatDate(event.event_date)}
              />
              <InfoCard
                icon={MapPin}
                label="Lokasi"
                value={event.location || "Lokasi menyusul"}
              />
              <InfoCard
                icon={Route}
                label="Distance"
                value={`${Number(event.distance_km || 0).toFixed(2)} KM`}
              />
              <InfoCard
                icon={Users}
                label="Peserta"
                value={`${event.participant_count || 0}/${event.quota || 0}`}
              />
              <InfoCard
                icon={Ticket}
                label="Biaya"
                value={formatCurrency(event.registration_fee)}
              />
            </div>
          </div>
        </section>

        {isRegistered ? (
          <section className="mt-6 rounded-3xl border border-purple-100 bg-purple-50 p-6 shadow-sm lg:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                  Akses Peserta
                </p>
                <h3 className="mt-2 text-3xl font-black text-slate-950">
                  Menu Event Kamu
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Akses ini muncul karena akunmu sudah terdaftar pada event ini.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[620px]">
                <ParticipantAccessButton
                  href={`/event/${event.id}/view`}
                  icon={Map}
                  label="Live View Tracking"
                />
                <ParticipantAccessButton
                  href={`/events/${event.id}/results`}
                  icon={Trophy}
                  label="Results"
                />
                <ParticipantAccessButton
                  href={`/events/${event.id}/doorprize`}
                  icon={Gift}
                  label="Doorprize"
                />
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm lg:p-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-2xl font-black text-slate-950">
              Daftar untuk membuka akses peserta
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Setelah terdaftar, kamu bisa mengakses Live View Tracking, Results, dan Doorprize.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
        <Icon size={22} />
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function ParticipantAccessButton({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[92px] flex-col items-center justify-center rounded-2xl bg-white px-4 py-5 text-center text-sm font-black text-slate-950 shadow-sm ring-1 ring-purple-100 hover:bg-purple-700 hover:text-white"
    >
      <Icon size={28} />
      <span className="mt-3">{label}</span>
    </Link>
  );
}
