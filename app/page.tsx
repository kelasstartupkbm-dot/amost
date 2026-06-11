import Header from "@/components/Header";
import HeroSlider from "@/components/HeroSlider";
import Stats from "@/components/Stats";
import Features from "@/components/Features";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <section className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <p className="mb-5 text-xl font-bold text-slate-900">
          Landing Page (Website)
        </p>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/80">
          <Header />
          <HeroSlider />
          <Stats />
          <Features />
          <Footer />
        </div>
      </section>
    </main>
  );
}
