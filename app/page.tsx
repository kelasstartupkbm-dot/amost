import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";

const stats = [
  {
    icon: Activity,
    value: "12.5K+",
    label: "Pengguna Aktif",
  },
  {
    icon: CalendarDays,
    value: "350+",
    label: "Event Terselenggara",
  },
  {
    icon: ShieldCheck,
    value: "98.6%",
    label: "Tracking Akurat",
  },
  {
    icon: Users,
    value: "25+",
    label: "Komunitas",
  },
];

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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <section className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <p className="mb-5 text-xl font-bold text-slate-900">
          Landing Page (Website)
        </p>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/80">
          <Header />

          <Hero />

          <Stats />

          <Features />
        </div>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="relative z-20 flex h-20 items-center justify-between border-b border-slate-100 bg-white px-6 md:px-8">
      <Link href="/" className="flex items-center gap-2">
        <div className="amost-mark" />
        <div className="text-xl font-black tracking-wide text-purple-700">
          AMOST
        </div>
      </Link>

      <nav className="hidden items-center gap-10 text-sm font-semibold text-slate-800 md:flex">
        <Link href="/">Beranda</Link>
        <Link href="/events">Event</Link>
        <Link href="/fitur">Fitur</Link>
        <Link href="/komunitas">Komunitas</Link>
        <Link href="/tentang">Tentang</Link>
      </nav>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="hidden text-sm font-bold text-slate-900 sm:block"
        >
          Masuk
        </Link>

        <Link
          href="/register"
          className="rounded-lg bg-purple-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-800"
        >
          Daftar
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[580px] overflow-hidden bg-gradient-to-br from-white via-slate-50 to-purple-50">
      <div className="absolute inset-0 opacity-70">
        <div className="hero-clouds" />
      </div>

      <div className="absolute right-0 top-0 h-full w-full md:w-[58%]">
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/35 to-transparent md:hidden" />

        <div className="cyclist-scene">
          <div className="mountain mountain-one" />
          <div className="mountain mountain-two" />
          <div className="purple-ribbon ribbon-one" />
          <div className="purple-ribbon ribbon-two" />

          <div className="cyclist">
            <div className="helmet" />
            <div className="head" />
            <div className="body" />
            <div className="backpack" />
            <div className="arm arm-left" />
            <div className="arm arm-right" />
            <div className="leg leg-left" />
            <div className="leg leg-right" />
            <div className="bike-frame" />
            <div className="wheel wheel-left" />
            <div className="wheel wheel-right" />
            <div className="handlebar" />
          </div>

          <div className="trail-path" />
          <div className="trees trees-left" />
          <div className="trees trees-right" />
        </div>
      </div>

      <div className="relative z-10 max-w-xl px-8 pb-20 pt-24 md:px-12 md:pt-28">
        <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-slate-950 md:text-6xl">
          Track. Achieve.
          <br />
          Share.
        </h1>

        <p className="mt-6 max-w-md text-lg leading-8 text-slate-600">
          Platform tracking olahraga outdoor dan monitoring event secara
          realtime.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-purple-700 px-7 py-4 text-sm font-black text-white shadow-xl shadow-purple-200 transition hover:bg-purple-800"
          >
            Mulai Sekarang
          </Link>

          <Link
            href="/events"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-900 shadow-sm transition hover:border-purple-200 hover:bg-purple-50"
          >
            Jelajahi Event
          </Link>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="relative z-20 mx-5 -mt-14 rounded-2xl border border-slate-200 bg-white px-3 py-4 shadow-xl shadow-slate-200/80 md:mx-10 md:px-5">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-center gap-4 rounded-xl px-3 py-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-700">
              <item.icon size={24} />
            </div>

            <div>
              <p className="text-2xl font-black leading-none text-slate-950">
                {item.value}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
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
