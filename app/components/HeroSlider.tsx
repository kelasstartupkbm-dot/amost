import Link from "next/link";

export default function HeroSlider() {
  return (
    <section className="relative min-h-[520px] overflow-hidden bg-slate-50">
      <div className="absolute inset-0">
        <div className="absolute inset-0 hero-photo" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20" />
      </div>

      <div className="absolute right-[9%] top-[14%] hidden h-72 w-72 rotate-[22deg] rounded-[60px] bg-purple-600/75 blur-[1px] md:block purple-shape" />

      <div className="relative z-10 max-w-xl px-8 pb-24 pt-24 md:px-12 md:pt-28">
        <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-slate-950 md:text-[58px]">
          Track. Achieve.
          <br />
          Share.
        </h1>

        <p className="mt-6 max-w-md text-base leading-8 text-slate-600 md:text-lg">
          Platform tracking olahraga outdoor dan monitoring event secara
          realtime.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/register"
            className="inline-flex h-14 items-center justify-center rounded-xl bg-purple-700 px-8 text-sm font-black text-white shadow-xl shadow-purple-200 transition hover:bg-purple-800"
          >
            Mulai Sekarang
          </Link>

          <Link
            href="/events"
            className="inline-flex h-14 items-center justify-center rounded-xl border border-slate-200 bg-white px-8 text-sm font-black text-slate-900 shadow-sm transition hover:border-purple-200 hover:bg-purple-50"
          >
            Jelajahi Event
          </Link>
        </div>
      </div>
    </section>
  );
}
