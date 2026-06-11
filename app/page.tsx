import Header from "./components/Header";
import HeroSlider from "./components/HeroSlider";
import Features from "./components/Features";
import Stats from "./components/Stats";
import EventsSection from "./components/EventsSection";
import DownloadSection from "./components/DownloadSection";
import CtaSection from "./components/CtaSection";
import Footer from "./components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white pt-[78px] text-slate-950 lg:pt-[96px]">
      <Header />

      <HeroSlider />

      <section className="mx-auto w-full max-w-[1280px] bg-white">
        <Features />
        <Stats />
        <EventsSection />
        <DownloadSection />
        <CtaSection />
      </section>

      <Footer />
    </main>
  );
}
