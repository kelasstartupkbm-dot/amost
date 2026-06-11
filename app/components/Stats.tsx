import { Activity, CalendarDays, ShieldCheck, Users } from "lucide-react";

const stats = [
  {
    icon: Activity,
    value: "12.5K+",
    label: "Pengguna Aktif",
  },
  {
    icon: CalendarDays,
    value: "350+",
    label: "Event Terselenggara",
  },
  {
    icon: ShieldCheck,
    value: "98.6%",
    label: "Tracking Akurat",
  },
  {
    icon: Users,
    value: "25+",
    label: "Komunitas",
  },
];

export default function Stats() {
  return (
    <section className="relative z-20 mx-5 -mt-12 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-xl shadow-slate-200/80 md:mx-10">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-center gap-4 px-3 py-4"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
              <item.icon size={23} />
            </div>

            <div>
              <p className="text-2xl font-black leading-none text-slate-950">
                {item.value}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
