import Link from "next/link";

const slides = [
  {
    title: "Track. Achieve. Share.",
    desc: "Platform tracking olahraga outdoor dan monitoring event secara realtime.",
    primary: "Mulai Sekarang",
    secondary: "Jelajahi Event",
  },
];

export default function HeroSlider() {
  const slide = slides[0];

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
          {slide.title.split(". ").map((part, index) => (
            <span key={part}>
              {part}
              {index === 0 && "."}
              {index === 1 && "."}
              {index === 1 && <br />}
              {index === 2 && "."}
              {index === 0 && " "}
            </span>
          ))}
        </h1>

        <p className="mt-6 max-w-md text-lg leading-8 text-slate-600">
          {slide.desc}
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-purple-700 px-7 py-4 text-sm font-black text-white shadow-xl shadow-purple-200 transition hover:bg-purple-800"
          >
            {slide.primary}
          </Link>

          <Link
            href="/events"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-900 shadow-sm transition hover:border-purple-200 hover:bg-purple-50"
          >
            {slide.secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
