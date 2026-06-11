import {
  BarChart3,
  CalendarCheck,
  MapPin,
  Ticket,
} from "lucide-react";

const steps = [
  {
    icon: CalendarCheck,
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

export default function Features() {
  return (
    <section id="cara-kerja" className="border-t border-slate-200 bg-white px-[94px] pb-8 pt-8">
      <h2 className="text-center text-[18px] font-black uppercase tracking-wide text-purple-700">
        Cara Kerja AMOST
      </h2>

      <div className="mx-auto mt-8 grid max-w-[1060px] grid-cols-4 items-start gap-12">
        {steps.map((step, index) => (
          <div key={step.title} className="relative text-center">
            {index !== steps.length - 1 && (
              <div className="absolute right-[-33px] top-[37px] text-[44px] font-light leading-none text-purple-600">
                ›
              </div>
            )}

            <div className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-full bg-purple-100 text-purple-700">
              <step.icon size={35} strokeWidth={1.9} />
            </div>

            <h3 className="mt-5 text-[15px] font-black text-black">
              {step.title}
            </h3>

            <p className="mx-auto mt-2 max-w-[210px] text-[14px] leading-[1.45] text-slate-600">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
