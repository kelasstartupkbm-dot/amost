"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ElementType } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Gift,
  Loader2,
  Map,
  MapPin,
  Route,
  ShieldCheck,
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

      setRegistration(data.registration || null);
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
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const benefits = [
    "Nomor peserta dibuat setelah pendaftaran valid.",
    "Peserta valid dapat mengikuti undian doorprize.",
    "Tracking aktivitas dapat dipantau melalui aplikasi AMOST.",
    "Hasil event dan aktivitas tersimpan di akun pengguna.",
  ];

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

  if (errorMessage && !event) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
        <div className="mx-auto max-w-[960px] rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-black">{errorMessage}</p>
          <Link
            href="/events"
            className="mt-4 inline-flex rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white"
          >
            Kembali ke Events
          </Link>
        </div>
      </main>
    );
  }

  if (!event) return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <img
              src="/amost_logo_wide_.png"
              alt="AMOST"
              className="h-[58px] w-auto object-contain"
            />
          </Link>

          <Link
            href="/events"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Events
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-64 bg-gradient-to-br from-purple-100 via-slate-100 to-slate-200 md:h-80">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title || "Event AMOST"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute bottom-0 left-0 right-0 h-44 opacity-80">
                <svg viewBox="0 0 900 220" className="h-full w-full">
                  <path
                    d="M0 180 L120 55 L240 180 L350 80 L460 180 L600 60 L720 180 L900 90 L900 220 L0 220 Z"
                    fill="#cbd5e1"
                  />
                  <circle cx="720" cy="48" r="25" fill="#cbd5e1" />
                </svg>
              </div>
            )}

            <div className="absolute left-6 top-6 rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-700">
              {normalizeStatus(event.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-[1fr_380px] lg:p-8">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                {event.category || "Event"}
              </p>

              <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 md:text-5xl">
                {event.title || `Event #${event.id}`}
              </h1>

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <CalendarDays size={17} className="text-purple-700" />
                  {formatDate(event.event_date)}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={17} className="text-purple-700" />
                  {event.location || "Lokasi menyusul"}
                </span>
                <span className="flex items-center gap-2">
                  <Route size={17} className="text-purple-700" />
                  {Number(event.distance_km || 0)} KM
                </span>
              </div>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
                {event.description ||
                  "Event sepeda outdoor AMOST dengan tracking realtime, nomor peserta, tiket online, route map, checkpoint, leaderboard, dan undian nomor peserta untuk doorprize."}
              </p>

              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon={Users}
                  label="Peserta"
                  value={String(event.participant_count || 0)}
                />
                <MetricCard
                  icon={Ticket}
                  label="Kuota"
                  value={String(event.quota || 0)}
                />
                <MetricCard
                  icon={Map}
                  label="Rute"
                  value={event.route_file ? "Ada" : "-"}
                />
                <MetricCard
                  icon={Gift}
                  label="Doorprize"
                  value={String(event.doorprize_count || 0)}
                />
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Pendaftaran Event
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Daftar & Dapatkan Nomor Peserta
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Setelah pendaftaran valid, kamu akan mendapatkan nomor peserta
                yang dapat digunakan untuk doorprize.
              </p>

              <div className="mt-5 rounded-xl border border-purple-100 bg-white p-4">
                <p className="text-sm font-bold text-slate-500">Biaya registrasi</p>
                <p className="mt-1 text-3xl font-black text-purple-700">
                  {formatCurrency(event.registration_fee)}
                </p>
              </div>

              {successMessage ? (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                  {successMessage}
                </div>
              ) : null}

              {errorMessage ? (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              {isRegistered ? (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-black text-green-700">
                    Kamu sudah terdaftar
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {registration?.participant_number || "Nomor diproses"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Status: {registration?.status || registration?.registration_status || "registered"}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joining}
                  className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-purple-700 text-sm font-black text-white shadow-lg shadow-purple-200 hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {joining ? "Mendaftarkan..." : "Daftar Event Sekarang"}
                </button>
              )}

              <Link
                href="/account"
                className="mt-3 flex h-12 items-center justify-center rounded-xl border border-purple-700 text-sm font-black text-purple-700 hover:bg-purple-50"
              >
                Buka Akun Saya
              </Link>
            </aside>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">
              Ketentuan Event
            </h2>

            <div className="mt-5 grid gap-3">
              {benefits.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"
                >
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-green-600"
                  />
                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Trophy size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Doorprize
                </h2>
                <p className="text-sm text-slate-500">
                  Undian berdasarkan nomor peserta.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 text-amber-700" size={20} />
                <p className="text-sm leading-6 text-amber-800">
                  Hanya peserta dengan status pendaftaran valid yang dapat masuk
                  ke undian doorprize.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
        <Icon size={22} />
      </div>
      <p className="mt-4 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}
