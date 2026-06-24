"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Ticket,
  UserCog,
} from "lucide-react";

type OfficialAccess = {
  id: number;
  event_id: number | string;
  user_id: number | string;
  permission_level: string;
  status: string;
  notes?: string | null;
  event_title?: string | null;
  event_name?: string | null;
  event_status?: string | null;
  category?: string | null;
  location?: string | null;
  quota?: number | string | null;
  doorprize_count?: number | string | null;
};

function getEventTitle(item: OfficialAccess) {
  return item.event_title || item.event_name || `Event #${item.event_id}`;
}

function formatPermission(value: string | null | undefined) {
  const permission = String(value || "operator").toLowerCase();

  if (permission === "result") return "Result Officer";
  if (permission === "doorprize") return "Doorprize Officer";
  if (permission === "viewer") return "Viewer";

  return "Operator Event";
}

export default function OfficialPanelPage() {
  const [items, setItems] = useState<OfficialAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadAccess() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/account/event-officials", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setItems([]);
        setErrorMessage(
          data?.message ||
            data?.error ||
            "Akses Official Event belum bisa dimuat."
        );
        return;
      }

      const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
          ? data.items
          : [];

      setItems(rows);
    } catch (error) {
      console.error(error);
      setItems([]);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccess();
  }, []);

  const stats = useMemo(() => {
    const active = items.filter((item) => item.status === "active").length;
    const doorprize = items.filter(
      (item) => item.permission_level === "doorprize"
    ).length;

    return {
      total: items.length,
      active,
      doorprize,
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[92px] max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-[88px]">
          <div className="flex items-center gap-5">
            <Link
              href="/account"
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              aria-label="Kembali ke akun"
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
              <p className="text-xs font-black uppercase tracking-[0.22em] text-green-700">
                Official Event
              </p>
              <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950">
                Panel Official Event
              </h1>
              <p className="mt-1 max-w-xl text-sm font-medium leading-6 text-slate-500">
                Kelola akses event yang ditugaskan kepadamu.
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

            <button
              type="button"
              onClick={loadAccess}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-[88px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-green-700">
                Akses Official
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Event yang Ditugaskan
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Halaman ini hanya menampilkan event yang diberikan oleh Super
                Admin atau Staff AMOST kepada akunmu.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Event" value={stats.total} />
              <StatBox label="Aktif" value={stats.active} />
              <StatBox label="Doorprize" value={stats.doorprize} />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
              <Loader2 className="h-10 w-10 animate-spin text-green-700" />
              <p className="mt-4 text-lg font-black text-slate-950">
                Memuat akses official...
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Mengambil data event yang ditugaskan.
              </p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
                <UserCog size={30} />
              </div>
              <h3 className="mt-5 text-2xl font-black text-slate-950">
                Belum Ada Akses Official Event
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Akunmu belum ditugaskan sebagai Official Event pada event
                manapun.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                      <ShieldCheck size={24} />
                    </div>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase text-green-700">
                      {item.status || "active"}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-black leading-tight text-slate-950">
                    {getEventTitle(item)}
                  </h3>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                    Event ID: {item.event_id}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <InfoBox
                      label="Akses"
                      value={formatPermission(item.permission_level)}
                      green
                    />
                    <InfoBox label="Kategori" value={item.category || "Event"} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <InfoBox
                      label="Kuota"
                      value={String(item.quota || 0)}
                      icon={<Ticket size={15} />}
                    />
                    <InfoBox
                      label="Status Event"
                      value={item.event_status || "-"}
                      icon={<CalendarDays size={15} />}
                    />
                  </div>

                  {item.notes && (
                    <div className="mt-4 rounded-xl border border-slate-200 p-3">
                      <p className="text-xs font-black uppercase text-slate-500">
                        Catatan
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.notes}
                      </p>
                    </div>
                  )}

<div className="mt-5 flex gap-3">
  <Link
    href={`/official/events/${item.event_id}`}
    className="flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 text-sm font-black text-slate-700 hover:bg-slate-50"
  >
    Lihat Detail
  </Link>

  <Link
    href={`/official/events/${item.event_id}`}
    className="flex h-10 flex-1 items-center justify-center rounded-xl bg-green-700 text-sm font-black text-white hover:bg-green-800"
  >
    Kelola
  </Link>
</div>
                      Kelola
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function InfoBox({
  label,
  value,
  green,
  icon,
}: {
  label: string;
  value: string;
  green?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p
        className={`mt-1 flex items-center gap-2 text-sm font-black ${
          green ? "text-green-700" : "text-slate-950"
        }`}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}
