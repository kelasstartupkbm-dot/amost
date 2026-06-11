import Link from "next/link";
import { ArrowRight, BarChart3, MapPin, Ticket, Users } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Live Tracking",
    desc: "Pantau aktivitasmu secara realtime dengan akurasi tinggi.",
    color: "purple",
  },
  {
    icon: BarChart3,
    title: "Statistik Lengkap",
    desc: "Dapatkan insight lengkap dari setiap aktivitasmu.",
    color: "purple",
  },
  {
    icon: Ticket,
    title: "Event & Ticketing",
    desc: "Ikuti event seru dan dapatkan tiket dengan mudah.",
    color: "orange",
  },
  {
    icon: Users,
    title: "Komunitas",
    desc: "Bergabung dengan komunitas dan bagikan pencapaianmu.",
    color: "green",
  },
];

export default function Features() {
  return (
    <section className="px-6 pb-10 pt-16 md:px-10">
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-950">
          Fitur Unggulan
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Semua yang kamu butuhkan untuk pengalaman olahraga outdoor terbaik.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-4">
        {features.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200"
          >
            <div
              className={`mb-6 flex h-14 w-14 items-center justify-center rounded-full ${
                item.color === "orange"
                  ? "bg-orange-100 text-orange-600"
                  : item.color === "green"
                    ? "bg-green-100 text-green-600"
                    : "bg-purple-100 text-purple-700"
              }`}
            >
              <item.icon size={26} />
            </div>

            <h3 className="text-base font-black text-slate-950">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {item.desc}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-purple-700"
        >
          Lihat Event AMOST
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}
