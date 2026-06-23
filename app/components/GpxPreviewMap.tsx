"use client";

import { Download, MapPin, Route } from "lucide-react";
import { useMemo } from "react";

type GpxPoint = {
  lat: number;
  lng: number;
  ele?: number | null;
};

type Props = {
  eventId: number;
  gpxFilename?: string | null;
  gpxContent?: string | null;
};

export default function GpxPreviewMap({
  eventId,
  gpxFilename,
  gpxContent,
}: Props) {
  const points = useMemo(() => parseGpxPoints(gpxContent || ""), [gpxContent]);
  const stats = useMemo(() => calculateRouteStats(points), [points]);
  const svgPath = useMemo(() => createSvgPath(points, 960, 420), [points]);

  if (!gpxContent) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="font-black text-amber-900">Route GPX belum tersedia</p>
        <p className="mt-2 text-sm leading-6 text-amber-800">
          Upload file GPX dari halaman Edit Event agar route bisa ditampilkan.
        </p>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
        <p className="font-black text-red-700">GPX tidak bisa dibaca</p>
        <p className="mt-2 text-sm leading-6 text-red-700">
          File GPX tersimpan, tetapi tidak ditemukan titik route trkpt/rtept.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-purple-700">
            Route GPX
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            Preview Route Event
          </h2>
          <p className="mt-1 break-all text-sm text-slate-500">
            {gpxFilename || "route.gpx"}
          </p>
        </div>

        <a
          href={`/api/admin/events/${eventId}/gpx`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-black text-white hover:bg-purple-800"
        >
          <Download size={18} />
          Download GPX
        </a>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <RouteStat
          icon={Route}
          label="Estimasi Jarak"
          value={`${stats.distanceKm.toFixed(2)} KM`}
        />
        <RouteStat
          icon={MapPin}
          label="Jumlah Titik"
          value={points.length.toLocaleString("id-ID")}
        />
        <RouteStat
          icon={Route}
          label="Elevasi"
          value={`${Math.round(stats.minEle || 0)} - ${Math.round(
            stats.maxEle || 0
          )} m`}
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <svg
          viewBox="0 0 960 420"
          className="h-[420px] w-full bg-gradient-to-br from-purple-50 to-slate-100"
          role="img"
          aria-label="Preview route GPX"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect x="0" y="0" width="960" height="420" fill="transparent" />

          {svgPath.path && (
            <path
              d={svgPath.path}
              fill="none"
              stroke="#7e22ce"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {svgPath.start && (
            <>
              <circle cx={svgPath.start.x} cy={svgPath.start.y} r="12" fill="#16a34a" />
              <text
                x={svgPath.start.x + 16}
                y={svgPath.start.y - 12}
                fill="#166534"
                fontSize="20"
                fontWeight="800"
              >
                START
              </text>
            </>
          )}

          {svgPath.finish && (
            <>
              <circle cx={svgPath.finish.x} cy={svgPath.finish.y} r="12" fill="#dc2626" />
              <text
                x={svgPath.finish.x + 16}
                y={svgPath.finish.y + 28}
                fill="#991b1b"
                fontSize="20"
                fontWeight="800"
              >
                FINISH
              </text>
            </>
          )}
        </svg>

        <div className="border-t border-slate-200 bg-white p-3 text-center text-xs font-bold text-slate-500">
          Preview ini memakai SVG ringan tanpa library peta eksternal.
        </div>
      </div>
    </section>
  );
}

function RouteStat({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
        <Icon size={20} />
      </div>
      <p className="mt-4 text-xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function parseGpxPoints(gpx: string): GpxPoint[] {
  if (!gpx.trim()) return [];

  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(gpx, "application/xml");
    const parserError = xml.querySelector("parsererror");

    if (parserError) return [];

    const nodes = Array.from(xml.querySelectorAll("trkpt, rtept"));

    return nodes
      .map((node) => {
        const lat = Number(node.getAttribute("lat"));
        const lng = Number(node.getAttribute("lon"));
        const eleText = node.querySelector("ele")?.textContent || "";
        const ele = Number(eleText);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        return {
          lat,
          lng,
          ele: Number.isFinite(ele) ? ele : null,
        };
      })
      .filter(Boolean) as GpxPoint[];
  } catch {
    return [];
  }
}

function calculateRouteStats(points: GpxPoint[]) {
  let distanceKm = 0;
  let minEle: number | null = null;
  let maxEle: number | null = null;

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];

    if (typeof point.ele === "number") {
      minEle = minEle === null ? point.ele : Math.min(minEle, point.ele);
      maxEle = maxEle === null ? point.ele : Math.max(maxEle, point.ele);
    }

    if (index > 0) {
      distanceKm += haversineKm(points[index - 1], point);
    }
  }

  return {
    distanceKm,
    minEle,
    maxEle,
  };
}

function createSvgPath(points: GpxPoint[], width: number, height: number) {
  if (points.length === 0) {
    return {
      path: "",
      start: null,
      finish: null,
    };
  }

  const padding = 44;
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = Math.max(maxLat - minLat, 0.000001);
  const lngRange = Math.max(maxLng - minLng, 0.000001);

  const projected = points.map((point) => {
    const x = padding + ((point.lng - minLng) / lngRange) * (width - padding * 2);
    const y =
      padding + ((maxLat - point.lat) / latRange) * (height - padding * 2);

    return { x, y };
  });

  const path = projected
    .map((point, index) =>
      index === 0 ? `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}` : `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");

  return {
    path,
    start: projected[0],
    finish: projected[projected.length - 1],
  };
}

function haversineKm(a: GpxPoint, b: GpxPoint) {
  const radius = 6371;
  const dLat = degToRad(b.lat - a.lat);
  const dLng = degToRad(b.lng - a.lng);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(a.lat)) *
      Math.cos(degToRad(b.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return radius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function degToRad(value: number) {
  return (value * Math.PI) / 180;
}
