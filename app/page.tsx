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
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto max-w-[1440px] overflow-hidden border border-slate-200 bg-white shadow-sm">
        <Header />
        <HeroSlider />
        <Features />
        <Stats />
        <EventsSection />
        <DownloadSection />
        <CtaSection />
        <Footer />
      </div>
    </main>
  );
}
