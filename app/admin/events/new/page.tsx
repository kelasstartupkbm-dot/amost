"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Gift,
  ImageIcon,
  Loader2,
  MapPin,
  Save,
  Ticket,
} from "lucide-react";

type EventStatus = "draft" | "published" | "closed" | "finished";

type EventForm = {
  title: string;
  slug: string;
  eventType: string;
  location: string;
  startDate: string;
  endDate: string;
  distanceKm: string;
  ticketPrice: string;
  maxParticipants: string;
  doorprizeCount: string;
  coverImage: string;
  description: string;
  status: EventStatus;
};

const initialForm: EventForm = {
  title: "",
  slug: "",
  eventType: "Sepeda",
  location: "",
  startDate: "",
  endDate: "",
  distanceKm: "",
  ticketPrice: "0",
  maxParticipants: "",
  doorprizeCount: "0",
  coverImage: "",
  description: "",
  status: "draft",
};

export default function NewAdminEventPage() {
  const [form, setForm] = useState<EventForm>(initialForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const previewSlug = useMemo(() => {
    return form.slug || createSlug(form.title);
  }, [form.slug, form.title]);

  function updateField<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((current) => {
      if (key === "title" && !current.slug) {
        return {
          ...current,
          title: value,
          slug: createSlug(String(value)),
        };
      }

      return {
        ...current,
        [key]: value,
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    if (!form.title.trim()) {
      setMessage("Nama event wajib diisi.");
      return;
    }

    if (!form.location.trim()) {
      setMessage("Lokasi event wajib diisi.");
      return;
    }

    if (!form.startDate) {
      setMessage("Tanggal mulai wajib diisi.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          slug: previewSlug,
          description: form.description.trim(),
          eventType: form.eventType.trim(),
          location: form.location.trim(),
          startDate: form.startDate,
          endDate: form.endDate || form.startDate,
          distanceKm: Number(form.distanceKm || 0),
          ticketPrice: Number(form.ticketPrice || 0),
          maxParticipants: Number(form.maxParticipants || 0),
          doorprizeCount: Number(form.doorprizeCount || 0),
          coverImage: form.coverImage.trim(),
          status: form.status,
        }),
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
        setMessage(data.message || "Gagal menyimpan event.");
        return;
      }

      window.location.href = "/admin/events";
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan koneksi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/admin/events" className="flex items-center gap-3">
            <div className="logo-symbol responsive-logo">A</div>
            <div>
              <div className="text-[26px] font-black leading-none tracking-wide text-purple-700">
                AMOST
              </div>
              <div className="mt-1 text-[8px] font-black uppercase leading-[1.05] tracking-wide text-purple-700">
                Create Event
              </div>
            </div>
          </Link>

          <Link
            href="/admin/events"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Events
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-7">
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Event Management
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">
                Tambah Event
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Buat event AMOST baru. Event yang disimpan akan masuk ke tabel
                PostgreSQL dan muncul di halaman admin event.
              </p>
            </div>

            {message && (
              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label="Nama Event" icon={CalendarDays}>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="Contoh: Gowes Banyumas Challenge"
                  className="form-input"
                />
              </FormField>

              <FormField label="Slug" icon={FileText}>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(event) =>
                    updateField("slug", createSlug(event.target.value))
                  }
                  placeholder="gowes-banyumas-challenge"
                  className="form-input"
                />
              </FormField>

              <FormField label="Jenis Event" icon={Ticket}>
                <select
                  value={form.eventType}
                  onChange={(event) =>
                    updateField("eventType", event.target.value)
                  }
                  className="form-input"
                >
                  <option value="Sepeda">Sepeda</option>
                  <option value="Lari">Lari</option>
                  <option value="Trail Run">Trail Run</option>
                  <option value="Jalan Sehat">Jalan Sehat</option>
                  <option value="Outdoor">Outdoor</option>
                </select>
              </FormField>

              <FormField label="Lokasi" icon={MapPin}>
                <input
                  type="text"
                  value={form.location}
                  onChange={(event) =>
                    updateField("location", event.target.value)
                  }
                  placeholder="Banyumas, Jawa Tengah"
                  className="form-input"
                />
              </FormField>

              <FormField label="Tanggal Mulai" icon={CalendarDays}>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(event) =>
                    updateField("startDate", event.target.value)
                  }
                  className="form-input"
                />
              </FormField>

              <FormField label="Tanggal Selesai" icon={CalendarDays}>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(event) =>
                    updateField("endDate", event.target.value)
                  }
                  className="form-input"
                />
              </FormField>

              <FormField label="Jarak (KM)" icon={MapPin}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.distanceKm}
                  onChange={(event) =>
                    updateField("distanceKm", event.target.value)
                  }
                  placeholder="45"
                  className="form-input"
                />
              </FormField>

              <FormField label="Harga Tiket" icon={Ticket}>
                <input
                  type="number"
                  min="0"
                  value={form.ticketPrice}
                  onChange={(event) =>
                    updateField("ticketPrice", event.target.value)
                  }
                  placeholder="75000"
                  className="form-input"
                />
              </FormField>

              <FormField label="Kuota Peserta" icon={Ticket}>
                <input
                  type="number"
                  min="0"
                  value={form.maxParticipants}
                  onChange={(event) =>
                    updateField("maxParticipants", event.target.value)
                  }
                  placeholder="1000"
                  className="form-input"
                />
              </FormField>

              <FormField label="Jumlah Doorprize" icon={Gift}>
                <input
                  type="number"
                  min="0"
                  value={form.doorprizeCount}
                  onChange={(event) =>
                    updateField("doorprizeCount", event.target.value)
                  }
                  placeholder="12"
                  className="form-input"
                />
              </FormField>

              <FormField label="Status" icon={FileText}>
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField("status", event.target.value as EventStatus)
                  }
                  className="form-input"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                  <option value="finished">Finished</option>
                </select>
              </FormField>

              <FormField label="Cover Image URL" icon={ImageIcon}>
                <input
                  type="url"
                  value={form.coverImage}
                  onChange={(event) =>
                    updateField("coverImage", event.target.value)
                  }
                  placeholder="https://..."
                  className="form-input"
                />
              </FormField>
            </div>

            <div className="mt-5">
              <FormField label="Deskripsi Event" icon={FileText}>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  placeholder="Tuliskan detail event, ketentuan, fasilitas, dan informasi penting lainnya."
                  rows={6}
                  className="form-input min-h-[150px] resize-y"
                />
              </FormField>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/admin/events"
                className="flex h-12 items-center justify-center rounded-xl border border-slate-200 px-6 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Batal
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-purple-700 px-6 text-sm font-black text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Simpan Event
                  </>
                )}
              </button>
            </div>
          </form>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">
                Preview
              </p>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="relative h-44 bg-gradient-to-br from-purple-50 to-slate-100">
                  {form.coverImage ? (
                    <img
                      src={form.coverImage}
                      alt={form.title || "Cover event"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <ImageIcon size={54} />
                    </div>
                  )}

                  <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-black text-purple-700 shadow-sm">
                    {form.eventType || "Event"}
                  </span>

                  <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                    {formatStatus(form.status)}
                  </span>
                </div>

                <div className="p-5">
                  <h2 className="text-xl font-black text-slate-950">
                    {form.title || "Nama Event"}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    /events/{previewSlug || "slug-event"}
                  </p>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <MapPin size={16} className="text-purple-700" />
                      {form.location || "Lokasi event"}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-purple-700" />
                      {formatDate(form.startDate)}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <MiniStat value={form.maxParticipants || "0"} label="Kuota" />
                    <MiniStat value={form.distanceKm || "0"} label="KM" />
                    <MiniStat
                      value={form.doorprizeCount || "0"}
                      label="Hadiah"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-black text-amber-900">Catatan</p>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                Jika status dipilih <strong>Published</strong>, event bisa
                ditampilkan di halaman publik setelah API public event
                disambungkan.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function FormField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800">
        <Icon size={16} className="text-purple-700" />
        {label}
      </span>
      {children}
    </label>
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

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
