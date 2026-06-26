"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Download,
  Gift,
  Home,
  Map,
  Navigation,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";

type BottomItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
};

type EventShortcutItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
};

function isAccountArea(pathname: string) {
  return pathname === "/home" || pathname.startsWith("/account");
}

function getEventId(pathname: string) {
  const match = pathname.match(/^\/account\/events\/([^/]+)/);
  const eventId = match?.[1];

  if (!eventId) return "";
  if (["new", "create", "edit"].includes(eventId.toLowerCase())) return "";

  return eventId;
}

function isExactOrChild(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isEventSubPage(
  pathname: string,
  eventId: string,
  key: "detail" | "view" | "results" | "doorprize" | "gpx",
) {
  if (!eventId) return false;

  if (key === "detail") return pathname === `/account/events/${eventId}`;

  return pathname === `/account/events/${eventId}/${key}`;
}

export default function AccountMobileNav() {
  const pathname = usePathname() || "/";

  if (!isAccountArea(pathname)) {
    return null;
  }

  const eventId = getEventId(pathname);
  const liveHref = eventId ? `/account/events/${eventId}/view` : "/account/live-view";

  const bottomItems: BottomItem[] = [
    {
      href: "/home",
      label: "Home",
      icon: Home,
      active: pathname === "/home",
    },
    {
      href: liveHref,
      label: "Live",
      icon: Map,
      active: pathname === "/account/live-view" || pathname.endsWith("/view"),
    },
    {
      href: "/account/tracking",
      label: "Tracking",
      icon: Navigation,
      active: isExactOrChild(pathname, "/account/tracking"),
    },
    {
      href: "/account/events",
      label: "Events",
      icon: CalendarDays,
      active: isExactOrChild(pathname, "/account/events"),
    },
    {
      href: "/account",
      label: "Profile",
      icon: UserRound,
      active: pathname === "/account" || isExactOrChild(pathname, "/account/settings"),
    },
  ];

  const eventItems: EventShortcutItem[] = eventId
    ? [
        {
          href: `/account/events/${eventId}`,
          label: "Detail",
          active: isEventSubPage(pathname, eventId, "detail"),
          icon: CalendarDays,
        },
        {
          href: `/account/events/${eventId}/view`,
          label: "Live",
          active: isEventSubPage(pathname, eventId, "view"),
          icon: Map,
        },
        {
          href: `/account/events/${eventId}/results`,
          label: "Results",
          active: isEventSubPage(pathname, eventId, "results"),
          icon: Trophy,
        },
        {
          href: `/account/events/${eventId}/doorprize`,
          label: "Doorprize",
          active: isEventSubPage(pathname, eventId, "doorprize"),
          icon: Gift,
        },
        {
          href: `/account/events/${eventId}/gpx`,
          label: "GPX",
          active: isEventSubPage(pathname, eventId, "gpx"),
          icon: Download,
        },
      ]
    : [];

  return (
    <>
      {eventItems.length > 0 ? (
        <nav className="fixed inset-x-3 bottom-[78px] z-[95] rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.16)] backdrop-blur-xl lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {eventItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={`flex min-w-max items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${
                    item.active
                      ? "bg-purple-700 text-white"
                      : "bg-slate-50 text-slate-700 hover:bg-purple-50 hover:text-purple-700"
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200 bg-white/95 px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-[520px] grid-cols-5 gap-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                prefetch={false}
                className={`flex min-h-[56px] flex-col items-center justify-center rounded-2xl px-1 text-[10px] font-black ${
                  item.active
                    ? "bg-purple-700 text-white"
                    : "text-slate-500 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                <Icon size={20} />
                <span className="mt-1 leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className={eventItems.length > 0 ? "h-[150px] lg:hidden" : "h-[88px] lg:hidden"} />
    </>
  );
}
