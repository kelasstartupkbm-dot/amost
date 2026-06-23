"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Upload,
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
  gpxFilename: string;
  gpxContent: string;
  description: string;
  status: EventStatus;
};

type PageProps = {
  params: {
    id: string;
  };
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
  gpxFilename: "",
  gpxContent: "",
  description: "",
  status: "draft",
};

export default function EditAdminEventPage({ params }: PageProps) {
  const [form, setForm] = useState<EventForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const gpxInputRef = useRef<HTMLInputElement | null>(null);

  const previewSlug = useMemo(() => {
    return form.slug || createSlug(form.title);
  }, [form.slug, form.title]);

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

      const event = data.event;

      setForm({
        title: event.title || "",
        slug: event.slug || "",
        eventType: event.eventType || "Sepeda",
        location: event.location || "",
        startDate: toDateTimeLocal(event.startDate),
        endDate: toDateTimeLocal(event.endDate || event.startDate),
        distanceKm: String(event.distanceKm || ""),
        ticketPrice: String(event.ticketPrice || "0"),
        maxParticipants: String(event.maxParticipants || ""),
        doorprizeCount: String(event.doorprizeCount || "0"),
        coverImage: event.coverImage || "",
        gpxFilename: event.gpxFilename || "",
        gpxContent: event.gpxContent || "",
        description: event.description || "",
        status: event.status || "draft",
      });
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleImageUpload(file?: File) {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!validTypes.includes(file.type)) {
      setMessage("Format flyer harus JPG, PNG, atau WEBP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Ukuran flyer maksimal 2 MB.");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    updateField("coverImage", dataUrl);
    setMessage("");
  }

  async function handleGpxUpload(file?: File) {
    if (!file) return;

    const isGpx =
      file.name.toLowerCase().endsWith(".gpx") ||
      file.type === "application/gpx+xml" ||
      file.type === "text/xml" ||
      file.type === "application/xml" ||
      file.type === "";

    if (!isGpx) {
      setMessage("File route harus berformat .gpx.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setMessage("Ukuran GPX maksimal 3 MB.");
      return;
    }

    const text = await file.text();

    if (!text.toLowerCase().includes("<gpx")) {
      setMessage("Isi file tidak terdeteksi sebagai GPX valid.");
      return;
    }

    updateField("gpxFilename", file.name);
    updateField("gpxContent", text);
    setMessage("");
  }

  function removeImage() {
    updateField("coverImage", "");
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function removeGpx() {
    updateField("gpxFilename", "");
    updateField("gpxContent", "");
    if (gpxInputRef.current) gpxInputRef.current.value = "";
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

      const response = await fetch(`/api/admin/events/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
          coverImage: form.coverImage,
          gpxFilename: form.gpxFilename,
          gpxContent: form.gpxContent,
          status: form.status,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setMessage(data.message || "Gagal menyimpan perubahan event.");
        return;
      }

      window.location.href = `/admin/events/${params.id}`;
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan koneksi.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-purple-700" />
          <p className="mt-3 text-sm font-bold text-slate-600">Memuat form edit...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={`/admin/events/${params.id}`} className="flex items-center gap-3">
            <div className="logo-symbol responsive-logo">A</div>
            <div>
              <div className="text-[26px] font-black leading-none tracking-wide text-purple-700">AMOST</div>
              <div className="mt-1 text-[8px] font-black uppercase leading-[1.05] tracking-wide text-purple-700">Edit Event</div>
            </div>
          </Link>

          <Link href={`/admin/events/${params.id}`} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <ArrowLeft size={17} />
            Detail Event
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-7">
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">Event Management</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">Edit Event</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">Perbarui informasi event, flyer, dan route GPX.</p>
            </div>

            {message && <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">{message}</div>}

            <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <UploadBox title="Upload Flyer / Gambar Event" description="JPG, PNG, WEBP. Maksimal 2 MB." icon={ImageIcon} buttonLabel="Pilih Flyer" hasFile={Boolean(form.coverImage)} fileLabel={form.coverImage ? "Flyer sudah dipilih" : ""} onClick={() => imageInputRef.current?.click()} onRemove={removeImage} />
              <UploadBox title="Upload Route GPX" description="File .gpx. Maksimal 3 MB." icon={Upload} buttonLabel="Pilih GPX" hasFile={Boolean(form.gpxContent)} fileLabel={form.gpxFilename || ""} onClick={() => gpxInputRef.current?.click()} onRemove={removeGpx} />

              <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => handleImageUpload(event.target.files?.[0])} />
              <input ref={gpxInputRef} type="file" accept=".gpx,application/gpx+xml,text/xml,application/xml" className="hidden" onChange={(event) => handleGpxUpload(event.target.files?.[0])} />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label="Nama Event" icon={CalendarDays}><input type="text" value={form.title} onChange={(event) => updateField("title", event.target.value)} className="form-input" /></FormField>
              <FormField label="Slug" icon={FileText}><input type="text" value={form.slug} onChange={(event) => updateField("slug", createSlug(event.target.value))} className="form-input" /></FormField>
              <FormField label="Jenis Event" icon={Ticket}><select value={form.eventType} onChange={(event) => updateField("eventType", event.target.value)} className="form-input"><option value="Sepeda">Sepeda</option><option value="Lari">Lari</option><option value="Trail Run">Trail Run</option><option value="Jalan Sehat">Jalan Sehat</option><option value="Outdoor">Outdoor</option></select></FormField>
              <FormField label="Lokasi" icon={MapPin}><input type="text" value={form.location} onChange={(event) => updateField("location", event.target.value)} className="form-input" /></FormField>
              <FormField label="Tanggal Mulai" icon={CalendarDays}><input type="datetime-local" value={form.startDate} onChange={(event) => updateField("startDate", event.target.value)} className="form-input" /></FormField>
              <FormField label="Tanggal Selesai" icon={CalendarDays}><input type="datetime-local" value={form.endDate} onChange={(event) => updateField("endDate", event.target.value)} className="form-input" /></FormField>
              <FormField label="Jarak (KM)" icon={MapPin}><input type="number" min="0" step="0.01" value={form.distanceKm} onChange={(event) => updateField("distanceKm", event.target.value)} className="form-input" /></FormField>
              <FormField label="Harga Tiket" icon={Ticket}><input type="number" min="0" value={form.ticketPrice} onChange={(event) => updateField("ticketPrice", event.target.value)} className="form-input" /></FormField>
              <FormField label="Kuota Peserta" icon={Ticket}><input type="number" min="0" value={form.maxParticipants} onChange={(event) => updateField("maxParticipants", event.target.value)} className="form-input" /></FormField>
              <FormField label="Jumlah Doorprize" icon={Gift}><input type="number" min="0" value={form.doorprizeCount} onChange={(event) => updateField("doorprizeCount", event.target.value)} className="form-input" /></FormField>
              <FormField label="Status" icon={FileText}><select value={form.status} onChange={(event) => updateField("status", event.target.value as EventStatus)} className="form-input"><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option><option value="finished">Finished</option></select></FormField>
              <FormField label="Cover Image URL / Data" icon={ImageIcon}><input type="text" value={form.coverImage} onChange={(event) => updateField("coverImage", event.target.value)} placeholder="Upload flyer atau paste URL gambar" className="form-input" /></FormField>
            </div>

            <div className="mt-5"><FormField label="Deskripsi Event" icon={FileText}><textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={6} className="form-input min-h-[150px] resize-y" /></FormField></div>
            <div className="mt-5"><FormField label="Isi GPX" icon={FileText}><textarea value={form.gpxContent} onChange={(event) => updateField("gpxContent", event.target.value)} rows={5} placeholder="Upload GPX atau paste isi file GPX di sini." className="form-input min-h-[120px] resize-y font-mono text-xs" /></FormField></div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link href={`/admin/events/${params.id}`} className="flex h-12 items-center justify-center rounded-xl border border-slate-200 px-6 text-sm font-black text-slate-700 hover:bg-slate-50">Batal</Link>
              <button type="submit" disabled={saving} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-purple-700 px-6 text-sm font-black text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? <><Loader2 size={18} className="animate-spin" />Menyimpan...</> : <><Save size={18} />Simpan Perubahan</>}
              </button>
            </div>
          </form>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">Preview Flyer</p>
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="relative h-56 bg-gradient-to-br from-purple-50 to-slate-100">
                  {form.coverImage ? <img src={form.coverImage} alt={form.title || "Cover event"} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><ImageIcon size={54} /></div>}
                </div>
                <div className="p-5"><h2 className="text-xl font-black text-slate-950">{form.title || "Nama Event"}</h2><p className="mt-2 text-sm text-slate-500">/events/{previewSlug || "slug-event"}</p></div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wide text-purple-700">Status GPX</p>
              {form.gpxContent ? <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4"><p className="text-sm font-black text-green-700">GPX sudah tersedia</p><p className="mt-1 break-all text-xs font-semibold text-green-700">{form.gpxFilename || "route.gpx"}</p><p className="mt-2 text-xs text-green-700">{form.gpxContent.length.toLocaleString("id-ID")} karakter</p></div> : <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-black text-amber-800">GPX belum diupload</p></div>}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function UploadBox({ title, description, icon: Icon, buttonLabel, hasFile, fileLabel, onClick, onRemove }: { title: string; description: string; icon: any; buttonLabel: string; hasFile: boolean; fileLabel: string; onClick: () => void; onRemove: () => void; }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700"><Icon size={22} /></div><div className="min-w-0 flex-1"><p className="font-black text-slate-950">{title}</p><p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>{hasFile && <p className="mt-3 truncate rounded-lg bg-white px-3 py-2 text-xs font-bold text-green-700">{fileLabel}</p>}<div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={onClick} className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-black text-white hover:bg-purple-800">{buttonLabel}</button>{hasFile && <button type="button" onClick={onRemove} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100">Hapus</button>}</div></div></div></div>;
}

function FormField({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode; }) {
  return <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800"><Icon size={16} className="text-purple-700" />{label}</span>{children}</label>;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function createSlug(value: string) {
  return value.toLowerCase().trim().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
