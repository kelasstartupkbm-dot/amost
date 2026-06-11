import Link from "next/link";
import {
  Search,
  ArrowRight,
  Download,
  CalendarDays,
  Ticket,
  MapPin,
  BarChart3,
  ShieldCheck,
  Users,
  Route,
  Bike,
  Footprints,
  Smartphone,
  Play,
  Square,
  Lock,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";

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

const howItWorks = [
  {
    icon: CalendarDays,
    title: "1. Pilih Event",
    desc: "Temukan event olahraga yang kamu minati.",
  },
  {
    icon: Ticket,
    title: "2. Daftar & Dapatkan Tiket",
    desc: "Daftar dan dapatkan tiket secara online.",
  },
  {
    icon: MapPin,
    title: "3. Tracking Aktivitas",
    desc: "Mulai tracking dan pantau aktivitasmu secara realtime.",
  },
  {
    icon: BarChart3,
    title: "4. Simpan & Bagikan",
    desc: "Simpan hasil aktivitas dan bagikan pencapaianmu.",
  },
];

const features = [
  {
    icon: Route,
    title: "Tracking Realtime",
  },
  {
    icon: BarChart3,
    title: "Route & Statistik",
  },
  {
    icon: ShieldCheck,
    title: "Aman & Akurat",
  },
  {
    icon: Users,
    title: "Komunitas Aktif",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <Header />

      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-white to-purple-50">
        <div className="absolute inset-0 hero-pattern" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <p className="mb-4 text-sm font-extrabold uppercase tracking-wide text-purple-700">
              Track. Achieve. Share.
            </p>

            <h1 className="max-w-2xl text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
              Platform Tracking{" "}
              <span className="text-purple-700">Olahraga Outdoor</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              AMOST adalah platform untuk tracking berbagai aktivitas olahraga
              outdoor seperti sepeda, lari, jalan sehat, trail run, dan
              aktivitas lainnya secara realtime.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/events" className="btn-primary">
                Jelajahi Event
                <ArrowRight size={18} />
              </Link>

              <Link href="/download" className="btn-secondary">
                Download App
                <Download size={18} />
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {features.map((item) => (
                <div key={item.title} className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-100">
                    <item.icon size={18} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <HeroPhone />
        </div>
      </section>

      <section id="cara-kerja" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-extrabold uppercase tracking-wide text-purple-700">
            Cara Kerja AMOST
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-4">
          {howItWorks.map((item, index) => (
            <div key={item.title} className="relative text-center">
              {index !== howItWorks.length - 1 && (
                <div className="absolute right-[-22px] top-9 hidden text-3xl text-purple-600 md:block">
                  ›
                </div>
              )}

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-100">
                <item.icon size={30} />
              </div>

              <h3 className="mt-5 text-base font-extrabold text-slate-950">
                {item.title}
              </h3>

              <p className="mx-auto mt-2 max-w-[230px] text-sm leading-6 text-slate-600">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <Stats />
      </section>

      <section id="events" className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black uppercase text-purple-700">
            Event Terdekat
          </h2>

          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-bold text-purple-700 hover:text-purple-900"
          >
            Lihat Semua Event
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {events.map((event) => (
            <EventCard key={event.title} event={event} />
          ))}
        </div>
      </section>

      <DownloadSection />

      <section className="mx-auto max-w-7xl px-6 pb-12 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-purple-800 to-purple-600 px-8 py-7 text-white shadow-xl shadow-purple-200 md:flex-row">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <Users size={38} />
            </div>

            <div>
              <h3 className="text-xl font-black">
                Bergabung bersama ribuan pengguna AMOST sekarang!
              </h3>
              <p className="mt-1 text-sm text-purple-100">
                Track aktivitasmu, ikuti event seru, dan raih pencapaian
                terbaikmu.
              </p>
            </div>
          </div>

          <Link href="/register" className="btn-white">
            Buat Akun Gratis
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="logo-mark">A</div>
          <div>
            <div className="text-3xl font-black leading-none tracking-tight text-purple-700">
              AMOST
            </div>
            <div className="text-[9px] font-bold uppercase leading-none tracking-wide text-purple-700">
              Amikom Mobile Outdoor
              <br />
              Sport Tracking
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-9 text-sm font-semibold text-slate-700 lg:flex">
          <Link className="text-purple-700" href="/">
            Beranda
          </Link>
          <Link href="/events">Events</Link>
          <Link href="#cara-kerja">Cara Kerja</Link>
          <Link href="/fitur">Fitur</Link>
          <Link href="/komunitas">Komunitas</Link>
          <Link href="/tentang">Tentang</Link>
          <Link href="/kontak">Kontak</Link>
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 md:flex">
            <Search size={22} />
          </button>

          <Link href="/login" className="btn-login">
            Login
          </Link>

          <Link href="/register" className="btn-register">
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroPhone() {
  return (
    <div className="relative mx-auto flex w-full max-w-lg justify-center">
      <div className="absolute left-2 top-28 hidden h-56 w-56 rounded-full bg-purple-100 blur-3xl lg:block" />
      <div className="absolute right-2 bottom-8 hidden h-56 w-56 rounded-full bg-slate-200 blur-3xl lg:block" />

      <div className="relative">
        <div className="phone-shell">
          <div className="phone-notch" />

          <div className="px-6 pt-12 text-center">
            <p className="text-sm font-semibold text-slate-500">
              Tracking Aktif
            </p>
            <h2 className="mt-4 text-4xl font-black text-slate-950">
              01:25:36
            </h2>

            <div className="mt-7 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-slate-500">Jarak</p>
                <p className="text-lg font-black">25.34</p>
                <p className="text-xs font-semibold">km</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Kecepatan</p>
                <p className="text-lg font-black">28.7</p>
                <p className="text-xs font-semibold">km/h</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Elevasi</p>
                <p className="text-lg font-black">320</p>
                <p className="text-xs font-semibold">m</p>
              </div>
            </div>
          </div>

          <div className="relative mx-4 mt-8 h-52 overflow-hidden rounded-3xl bg-slate-100">
            <div className="absolute inset-0 map-bg" />
            <svg
              viewBox="0 0 260 190"
              className="absolute inset-0 h-full w-full"
              fill="none"
            >
              <path
                d="M55 145 C80 130 76 105 100 100 C130 94 120 62 147 66 C174 70 165 105 187 105 C215 105 207 70 230 55"
                stroke="#7E22CE"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <circle cx="55" cy="145" r="9" fill="white" />
              <circle cx="55" cy="145" r="5" fill="#7E22CE" />
            </svg>
          </div>

          <div className="mt-7 flex items-center justify-center gap-5">
            <button className="phone-action">
              <Lock size={18} />
            </button>
            <button className="phone-pause">
              <Play size={24} fill="white" />
            </button>
            <button className="phone-action">
              <Square size={16} fill="currentColor" />
            </button>
          </div>
        </div>

        <div className="absolute -bottom-4 left-8 right-8 h-8 rounded-full bg-slate-300/50 blur-xl" />
      </div>
    </div>
  );
}

function Stats() {
  const stats = [
    {
      icon: Users,
      value: "25.6K+",
      label: "Total Pengguna",
    },
    {
      icon: CalendarDays,
      value: "512+",
      label: "Event Diselenggarakan",
    },
    {
      icon: Footprints,
      value: "128K+",
      label: "Aktivitas Tracking",
    },
    {
      icon: Route,
      value: "1.2M+",
      label: "Kilometer Tercatat",
    },
  ];

  return (
    <div className="mt-14 grid grid-cols-1 divide-y divide-purple-100 rounded-2xl border border-purple-100 bg-purple-50/40 shadow-sm md:grid-cols-4 md:divide-x md:divide-y-0">
      {stats.map((item) => (
        <div key={item.label} className="px-8 py-7 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center text-purple-700">
            <item.icon size={32} />
          </div>
          <p className="text-4xl font-black text-purple-700">{item.value}</p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function EventCard({
  event,
}: {
  event: {
    category: string;
    title: string;
    location: string;
    date: string;
    participants: string;
  };
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-28 bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="absolute left-4 top-4 rounded border border-purple-600 bg-white px-3 py-1 text-[10px] font-black text-purple-700">
          {event.category}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20 opacity-60">
          <svg viewBox="0 0 300 120" className="h-full w-full">
            <path d="M0 90 L70 25 L125 90 L170 40 L235 90 L300 55 L300 120 L0 120 Z" fill="#CBD5E1" />
            <circle cx="235" cy="28" r="15" fill="#CBD5E1" />
          </svg>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-base font-black text-slate-950">{event.title}</h3>

        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-600">
          <MapPin size={13} className="text-purple-700" />
          {event.location}
        </p>

        <p className="mt-3 text-sm font-bold text-slate-900">{event.date}</p>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-slate-600">{event.participants}</p>

          <Link
            href="/events"
            className="flex h-8 w-8 items-center justify-center rounded border border-purple-600 text-purple-700 hover:bg-purple-700 hover:text-white"
          >
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function DownloadSection() {
  return (
    <section id="download" className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <div className="grid grid-cols-1 items-center overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white md:grid-cols-2">
        <div className="relative flex h-72 items-end justify-center overflow-hidden">
          <div className="mini-phone left-20">
            <Smartphone className="mx-auto mt-6 text-purple-700" size={32} />
            <div className="mt-5 px-5">
              <p className="text-xs font-semibold text-slate-500">Aktivitas</p>
              <p className="mt-2 text-2xl font-black">28.62</p>
              <p className="text-xs font-bold">km</p>
              <div className="mt-3 h-24 rounded-xl bg-slate-100">
                <svg viewBox="0 0 180 100" className="h-full w-full">
                  <path
                    d="M18 70 C40 20 70 70 95 45 C120 20 145 55 165 25"
                    stroke="#7E22CE"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="mini-phone right-20 translate-x-14">
            <Smartphone className="mx-auto mt-6 text-purple-700" size={32} />
            <div className="mt-5 px-5">
              <p className="text-xs font-semibold text-slate-500">Riwayat</p>
              <div className="mt-4 space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-3"
                  >
                    <div>
                      <p className="text-xs font-black">25.34 km</p>
                      <p className="text-[10px] text-slate-500">
                        12 Mei 2024
                      </p>
                    </div>
                    <div className="h-8 w-12 rounded bg-white" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12">
          <p className="text-sm font-black text-purple-700">
            Track. Achieve. Share.
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">
            Download Aplikasi AMOST
          </h2>
          <p className="mt-4 max-w-md leading-7 text-slate-600">
            Dapatkan pengalaman tracking terbaik di mobile. Tersedia di Android
            dan iOS.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/download" className="store-btn">
              <span className="text-xs">GET IT ON</span>
              <strong>Google Play</strong>
            </Link>
            <Link href="/download" className="store-btn">
              <span className="text-xs">Download on the</span>
              <strong>App Store</strong>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 md:grid-cols-5 lg:px-8">
        <div className="md:col-span-1">
          <Link href="/" className="flex items-center gap-3">
            <div className="logo-mark">A</div>
            <div>
              <div className="text-2xl font-black leading-none text-purple-700">
                AMOST
              </div>
              <div className="text-[9px] font-bold uppercase leading-none text-purple-700">
                Amikom Mobile Outdoor
                <br />
                Sport Tracking
              </div>
            </div>
          </Link>

          <p className="mt-8 text-sm text-slate-500">
            © 2024 AMOST. All rights reserved.
          </p>
        </div>

        <FooterColumn
          title="Platform"
          links={["Beranda", "Events", "Fitur", "Komunitas", "Cara Kerja"]}
        />

        <FooterColumn
          title="Bantuan"
          links={[
            "FAQ",
            "Panduan",
            "Kebijakan Privasi",
            "Syarat & Ketentuan",
            "Kontak Kami",
          ]}
        />

        <div>
          <h4 className="text-sm font-black text-slate-950">Ikuti Kami</h4>
          <div className="mt-5 flex gap-3">
            {[Facebook, Instagram, Youtube].map((Icon, index) => (
              <Link
                key={index}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-800 hover:bg-purple-700 hover:text-white"
              >
                <Icon size={18} />
              </Link>
            ))}
            <Link
              href="#"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-800 hover:bg-purple-700 hover:text-white"
            >
              ♪
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-black text-slate-950">Download App</h4>
          <div className="mt-5 space-y-3">
            <Link href="/download" className="store-btn small">
              <strong>Google Play</strong>
            </Link>
            <Link href="/download" className="store-btn small">
              <strong>App Store</strong>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-black text-slate-950">{title}</h4>
      <div className="mt-5 flex flex-col gap-3">
        {links.map((link) => (
          <Link
            key={link}
            href="#"
            className="text-sm font-medium text-slate-600 hover:text-purple-700"
          >
            {link}
          </Link>
        ))}
      </div>
    </div>
  );
}
