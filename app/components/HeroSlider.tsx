import Link from "next/link";
import { ArrowRight, Download, Lock, Pause, Square } from "lucide-react";

export default function HeroSlider() {
  return (
    <section className="relative w-full overflow-hidden border-b border-slate-200 bg-white">
      <div className="absolute inset-0 hero-bg" />

      <div className="relative mx-auto grid min-h-[620px] max-w-[1440px] grid-cols-1 items-center px-4 py-12 sm:px-6 md:px-8 lg:grid-cols-[1fr_420px] lg:px-[94px] xl:grid-cols-[1fr_520px]">
        <div className="relative z-10">
          <p className="mb-5 text-[12px] font-black uppercase tracking-wide text-purple-700 sm:text-[14px]">
            Track. Achieve. Share.
          </p>

          <h1 className="max-w-[620px] text-[38px] font-black leading-[1.08] tracking-[-1.2px] text-black sm:text-[46px] md:text-[54px] lg:text-[56px]">
            Platform Tracking
            <br />
            <span className="text-purple-700">Olahraga Outdoor</span>
          </h1>

          <p className="mt-6 max-w-[560px] text-[15px] leading-[1.75] text-slate-700 sm:text-[17px] md:text-[18px]">
            AMOST adalah platform untuk tracking berbagai aktivitas olahraga
            outdoor seperti sepeda, lari, jalan sehat, trail run, dan aktivitas
            lainnya secara realtime.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <Link
              href="/events"
              className="flex h-[52px] w-full items-center justify-center gap-3 rounded-md bg-purple-700 px-7 text-[15px] font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-800 sm:w-auto sm:min-w-[190px]"
            >
              Jelajahi Event
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/download"
              className="flex h-[52px] w-full items-center justify-center gap-3 rounded-md border border-purple-700 bg-white px-7 text-[15px] font-bold text-slate-950 transition hover:bg-purple-50 sm:w-auto sm:min-w-[205px]"
            >
              Download App
              <Download size={18} />
            </Link>
          </div>

          <div className="mt-12 grid max-w-[650px] grid-cols-2 gap-5 sm:grid-cols-4 lg:mt-20">
            <FeatureMini icon="target" title="Tracking Realtime" />
            <FeatureMini icon="route" title="Route & Statistik" />
            <FeatureMini icon="shield" title="Aman & Akurat" />
            <FeatureMini icon="users" title="Komunitas Aktif" />
          </div>
        </div>

        <div className="relative z-10 mt-10 hidden justify-center lg:flex">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}

function FeatureMini({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="mini-icon">
        {icon === "target" && <span>◎</span>}
        {icon === "route" && <span>⌁</span>}
        {icon === "shield" && <span>♢</span>}
        {icon === "users" && <span>♙</span>}
      </div>

      <p className="text-[12px] font-bold text-slate-900 sm:whitespace-nowrap sm:text-[13px]">
        {title}
      </p>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative scale-[0.85] xl:scale-100">
      <div className="phone-shadow" />

      <div className="phone">
        <div className="phone-inner-border" />
        <div className="phone-notch" />

        <div className="relative z-10 px-7 pt-[64px] text-center">
          <p className="text-[13px] font-medium text-slate-500">
            Tracking Aktif
          </p>

          <h2 className="mt-5 text-[38px] font-black leading-none text-black">
            01:25:36
          </h2>

          <div className="mt-8 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[11px] text-slate-500">Jarak</p>
              <p className="mt-1 text-[17px] font-black text-black">25.34</p>
              <p className="text-[10px] font-bold text-slate-800">km</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-500">Kecepatan</p>
              <p className="mt-1 text-[17px] font-black text-black">28.7</p>
              <p className="text-[10px] font-bold text-slate-800">km/h</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-500">Elevasi</p>
              <p className="mt-1 text-[17px] font-black text-black">320</p>
              <p className="text-[10px] font-bold text-slate-800">m</p>
            </div>
          </div>
        </div>

        <div className="relative mx-[18px] mt-9 h-[190px] overflow-hidden rounded-[26px] bg-slate-100">
          <div className="absolute inset-0 phone-map-bg" />

          <svg
            viewBox="0 0 270 200"
            className="absolute inset-0 h-full w-full"
            fill="none"
          >
            <path
              d="M54 153 C77 128 77 113 100 106 C127 98 126 69 153 73 C181 77 170 113 196 112 C222 111 212 74 238 59"
              stroke="#7E22CE"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle cx="54" cy="153" r="11" fill="white" />
            <circle cx="54" cy="153" r="6" fill="#7E22CE" />
          </svg>
        </div>

        <div className="mt-7 flex items-center justify-center gap-6">
          <button className="phone-control">
            <Lock size={17} />
          </button>

          <button className="phone-main-control">
            <Pause size={26} fill="white" />
          </button>

          <button className="phone-control">
            <Square size={15} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
