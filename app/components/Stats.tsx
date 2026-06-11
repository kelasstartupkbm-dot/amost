import { Flag, Map, PersonStanding, Route } from "lucide-react";

const stats = [
  {
    icon: PersonStanding,
    value: "25.6K+",
    label: "Total Pengguna",
  },
  {
    icon: Flag,
    value: "512+",
    label: "Event Diselenggarakan",
  },
  {
    icon: PersonStanding,
    value: "128K+",
    label: "Aktivitas Tracking",
  },
  {
    icon: Route,
    value: "1.2M+",
    label: "Kilometer Tercatat",
  },
];

export default function Stats() {
  return (
    <section className="bg-white px-[88px] pb-10 pt-4">
      <div className="grid grid-cols-4 overflow-hidden rounded-xl border border-purple-200 bg-purple-50/50 shadow-sm">
        {stats.map((item, index) => (
          <div
            key={item.label}
            className={`relative flex min-h-[160px] flex-col items-center justify-center text-center ${
              index !== stats.length - 1 ? "border-r border-purple-200" : ""
            }`}
          >
            <item.icon className="mb-3 text-purple-700" size={37} strokeWidth={1.8} />

            <p className="text-[39px] font-black leading-none text-purple-700">
              {item.value}
            </p>

            <p className="mt-2 text-[16px] font-medium text-slate-700">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
