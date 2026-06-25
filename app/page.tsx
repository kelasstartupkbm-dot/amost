import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bike,
  CalendarDays,
  CheckCircle2,
  Download,
  Gift,
  Globe2,
  MapPinned,
  PlayCircle,
  ShieldCheck,
  Smartphone,
  Trophy,
  UsersRound,
} from "lucide-react";

export default function PublicLandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-24 max-w-[1440px] items-center justify-between gap-6 px-5 lg:px-10">
          <Link href="/" className="inline-flex items-center">
            <img
              src="/amost_logo_wide_.png"
              alt="AMOST"
              className="h-[68px] w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-9 text-sm font-black text-slate-700 lg:flex">
            <Link href="/" className="text-purple-700">
              Beranda
            </Link>
            <Link href="/events" className="hover:text-purple-700">
              Events
            </Link>
            <a href="#cara-kerja" className="hover:text-purple-700">
              Cara Kerja
            </a>
            <a href="#fitur" className="hover:text-purple-700">
              Fitur
            </a>
            <a href="#komunitas" className="hover:text-purple-700">
              Komunitas
            </a>
            <a href="#tentang" className="hover:text-purple-700">
              Tentang
            </a>
            <a href="#kontak" className="hover:text-purple-700">
              Kontak
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden h-12 items-center justify-center rounded-xl border border-purple-100 bg-white px-5 text-sm font-black text-purple-700 transition hover:bg-purple-50 sm:inline-flex"
            >
              Login
            </Link>
            <Link
              href="/home"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-black text-white shadow-lg shadow-purple-100 transition hover:bg-purple-800"
            >
              Akun Saya
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(126,34,206,0.14),transparent_30%),radial-gradient(circle_at_86%_12%,rgba(34,197,94,0.12),transparent_28%)]" />
        <div className="mx-auto grid min-h-[calc(100vh-96px)] max-w-[1440px] grid-cols-1 items-center gap-10 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-20">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-purple-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Amikom Mobile Outdoor Sport Tracking
            </div>

            <h1 className="mt-8 max-w-[820px] text-[48px] font-black leading-[1.03] tracking-tight text-slate-950 sm:text-[64px] lg:text-[78px]">
              Platform tracking event olahraga outdoor berbasis komunitas.
            </h1>

            <p className="mt-7 max-w-[680px] text-lg leading-9 text-slate-600">
              AMOST membantu peserta, official, dan komunitas mengelola event,
              tracking, results, doorprize, serta timeline aktivitas publik dalam
              satu ekosistem digital.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/events"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-purple-700 px-7 text-base font-black text-white shadow-xl shadow-purple-100 transition hover:bg-purple-800"
              >
                Jelajahi Event
                <CalendarDays size={20} />
              </Link>

              <Link
                href="/login"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 text-base font-black text-slate-800 transition hover:bg-slate-50"
              >
                Login Akun
                <ArrowRight size={20} />
              </Link>
            </div>

            <div className="mt-10 grid max-w-[680px] grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Event" value="Live" />
              <MiniStat label="Tracking" value="GPS" />
              <MiniStat label="Results" value="Real-time" />
              <MiniStat label="Doorprize" value="Ready" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="relative mx-auto max-w-[640px] rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/70">
              <div className="overflow-hidden rounded-[1.5rem] bg-[#eef2f3]">
                <div className="relative h-[520px]">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:42px_42px]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_42%,rgba(126,34,206,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.14),transparent_24%)]" />

                  <div className="absolute left-5 top-5 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Event Aktif
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                        <Bike size={26} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-950">
                          Cetekan Ride
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Purwokerto
                        </p>
                      </div>
                    </div>
                  </div>

                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 700 520"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M70 430 C150 390 170 350 235 335 C300 320 300 245 370 245 C445 245 450 170 515 155 C565 144 590 105 635 75"
                      fill="none"
                      stroke="rgba(126,34,206,0.22)"
                      strokeWidth="18"
                      strokeLinecap="round"
                    />
                    <path
                      d="M70 430 C150 390 170 350 235 335 C300 320 300 245 370 245 C445 245 450 170 515 155 C565 144 590 105 635 75"
                      fill="none"
                      stroke="#7e22ce"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                  </svg>

                  <MapPoint label="S" left="9%" top="79%" />
                  <MapPoint label="1" left="31%" top="62%" />
                  <MapPoint label="2" left="52%" top="45%" />
                  <MapPoint label="3" left="66%" top="30%" />
                  <MapPoint label="F" left="88%" top="11%" />

                  <div className="absolute left-[48%] top-[43%]">
                    <div className="relative">
                      <div className="absolute -inset-7 rounded-full bg-blue-500/20" />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl">
                        <MapPinned size={30} />
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-3">
                    <DemoCard icon={UsersRound} label="Peserta" value="20+" />
                    <DemoCard icon={Trophy} label="Results" value="Live" />
                    <DemoCard icon={Gift} label="Doorprize" value="Ready" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fitur" className="border-y border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
          <div className="max-w-[720px]">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-purple-700">
              Fitur Utama
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 lg:text-5xl">
              Satu platform untuk event, tracking, komunitas, dan data.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              icon={Activity}
              title="Live Tracking"
              description="Pantau aktivitas dan posisi peserta pada event outdoor."
            />
            <FeatureCard
              icon={Trophy}
              title="Results Event"
              description="Tampilkan hasil peserta, status finish, jarak, durasi, dan speed."
            />
            <FeatureCard
              icon={Gift}
              title="Doorprize"
              description="Undian pemenang berbasis peserta terdaftar pada setiap event."
            />
            <FeatureCard
              icon={Globe2}
              title="Community Feed"
              description="Timeline publik untuk update event, tracking, dan komunitas."
            />
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="py-16">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-purple-700">
              Cara Kerja
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 lg:text-5xl">
              Alur peserta dibuat sederhana.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Peserta cukup daftar event, mengikuti tracking melalui aplikasi,
              lalu hasil, doorprize, dan update aktivitas muncul di website.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <StepCard number="1" title="Daftar Akun" text="Pengguna membuat akun AMOST sebagai peserta umum." />
            <StepCard number="2" title="Join Event" text="Peserta memilih event dan mendapatkan nomor peserta." />
            <StepCard number="3" title="Tracking" text="Aktivitas dilakukan melalui aplikasi Android AMOST." />
            <StepCard number="4" title="Results & Feed" text="Hasil event dan update muncul di dashboard serta timeline." />
          </div>
        </div>
      </section>

      <section id="komunitas" className="bg-slate-950 py-16 text-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-8 px-5 lg:grid-cols-[1fr_0.8fr] lg:px-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-green-400">
              AMOST Community
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight lg:text-5xl">
              Dibangun untuk komunitas olahraga outdoor Indonesia.
            </h2>
            <p className="mt-5 max-w-[720px] text-base leading-8 text-slate-300">
              AMOST mendukung event komunitas, ride & learn, live view, data
              hasil, dan dokumentasi aktivitas yang bisa diakses peserta.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="grid grid-cols-2 gap-4">
              <DarkStat label="Official" value="Event" />
              <DarkStat label="Peserta" value="Open" />
              <DarkStat label="Platform" value="Web" />
              <DarkStat label="Aplikasi" value="Android" />
            </div>
          </div>
        </div>
      </section>

      <section id="tentang" className="py-16">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:p-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.28em] text-purple-700">
                  Tentang AMOST
                </p>
                <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                  Amikom Mobile Outdoor Sport Tracking.
                </h2>
              </div>
              <p className="text-base leading-8 text-slate-600">
                AMOST adalah platform digital untuk mendukung pengelolaan event
                olahraga outdoor, live tracking, pencatatan hasil, dan literasi
                teknologi olahraga berbasis komunitas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer id="kontak" className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <img
              src="/amost_logo_wide_.png"
              alt="AMOST"
              className="h-[58px] w-auto object-contain"
            />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              AMOST © 2026. Outdoor sport tracking platform.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/events"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Events
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800"
            >
              Login
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function DemoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm backdrop-blur">
      <Icon className="text-purple-700" size={22} />
      <p className="mt-3 text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function MapPoint({
  label,
  left,
  top,
}: {
  label: string;
  left: string;
  top: string;
}) {
  return (
    <div
      className="absolute flex h-11 w-11 items-center justify-center rounded-full border-4 border-purple-700 bg-white text-base font-black text-purple-700 shadow"
      style={{ left, top }}
    >
      {label}
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
        <Icon size={28} />
      </div>
      <h3 className="mt-6 text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
        {description}
      </p>
    </article>
  );
}

function StepCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-700 text-lg font-black text-white">
        {number}
      </div>
      <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
        {text}
      </p>
    </article>
  );
}

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
