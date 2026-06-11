import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

const events = [
  {
    category: "SEPEDA",
    title: "Gowes Banyumas Challenge",
    location: "Banyumas, Jawa Tengah",
    date: "18 Mei 2024",
    participants: "1.245 Peserta",
  },
  {
    category: "LARI",
    title: "Purwokerto Run 2024",
    location: "Purwokerto, Jawa Tengah",
    date: "26 Mei 2024",
    participants: "2.034 Peserta",
  },
  {
    category: "TRAIL RUN",
    title: "Baturraden Trail Run",
    location: "Baturraden, Jawa Tengah",
    date: "02 Juni 2024",
    participants: "876 Peserta",
  },
  {
    category: "JALAN SEHAT",
    title: "Sehat Bersama AMOST",
    location: "Purwokerto, Jawa Tengah",
    date: "09 Juni 2024",
    participants: "1.102 Peserta",
  },
];

export default function EventsSection() {
  return (
    <section className="relative bg-white px-[88px] pb-8 pt-4">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[20px] font-black uppercase text-purple-700">
          Event Terdekat
        </h2>

        <Link
          href="/events"
          className="flex items-center gap-2 text-[14px] font-bold text-purple-700"
        >
          Lihat Semua Event
          <ArrowRight size={17} />
        </Link>
      </div>

      <button className="absolute left-[48px] top-[155px] z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
        <ChevronLeft size={24} />
      </button>

      <button className="absolute right-[48px] top-[155px] z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
        <ChevronRight size={24} />
      </button>

      <div className="grid grid-cols-4 gap-5">
        {events.map((event) => (
          <article
            key={event.title}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <div className="relative h-[124px] bg-slate-100">
              <div className="absolute left-4 top-4 rounded border border-purple-600 bg-white px-3 py-1 text-[10px] font-black uppercase text-purple-700">
                {event.category}
              </div>

              <div className="absolute inset-x-0 bottom-0 h-[92px]">
                <svg viewBox="0 0 300 130" className="h-full w-full">
                  <path
                    d="M0 100 L85 30 L145 100 L195 56 L260 100 L300 72 L300 130 L0 130 Z"
                    fill="#d7d7d7"
                  />
                  <circle cx="235" cy="30" r="14" fill="#d7d7d7" />
                </svg>
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-[16px] font-black leading-tight text-black">
                {event.title}
              </h3>

              <p className="mt-2 flex items-center gap-1 text-[12px] font-medium text-slate-600">
                <MapPin size={13} className="text-purple-700" />
                {event.location}
              </p>

              <p className="mt-3 text-[13px] font-bold text-black">
                {event.date}
              </p>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-[13px] text-slate-700">
                  {event.participants}
                </p>

                <Link
                  href="/events"
                  className="flex h-8 w-8 items-center justify-center rounded border border-purple-600 text-purple-700"
                >
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
