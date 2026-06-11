import { Flag, PersonStanding, Route } from "lucide-react";

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
    <section className="bg-white px-4 pb-10 pt-4 sm:px-6 md:px-8 lg:px-[70px]">
      <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-purple-200 bg-purple-50/50 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, index) => (
          <div
            key={item.label}
            className={`relative flex min-h-[135px] flex-col items-center justify-center border-purple-200 text-center lg:min-h-[160px] ${
              index !== stats.length - 1 ? "lg:border-r" : ""
            } ${index < 2 ? "sm:border-b lg:border-b-0" : ""}`}
          >
            <item.icon
              className="mb-3 text-purple-700"
              size={34}
              strokeWidth={1.8}
            />

            <p className="text-[32px] font-black leading-none text-purple-700 lg:text-[39px]">
              {item.value}
            </p>

            <p className="mt-2 text-[14px] font-medium text-slate-700 lg:text-[16px]">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
