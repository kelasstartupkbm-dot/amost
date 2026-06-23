"use client";

import { Download, MapPin, Route } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

type SvgPoint = {
  x: number;
  y: number;
};

export default function GpxPreviewMap({
  eventId,
  gpxFilename,
  gpxContent,
}: Props) {
  const points = useMemo(() => parseGpxPoints(gpxContent || ""), [gpxContent]);
  const stats = useMemo(() => calculateRouteStats(points), [points]);
  const routeSvg = useMemo(() => buildSvgRoute(points), [points]);

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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-black text-white transition hover:bg-purple-800"
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
          value={formatElevation(stats.minEle, stats.maxEle)}
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-black text-slate-900">Visual Route</p>
            <p className="text-xs font-semibold text-slate-500">
              Preview ringan tanpa dependency Leaflet
            </p>
          </div>

          <div className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
            {routeSvg.sampledCount.toLocaleString("id-ID")} titik ditampilkan
          </div>
        </div>

        <div className="relative h-[420px] w-full overflow-hidden bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(126,34,206,0.16)_1px,transparent_0)] [background-size:22px_22px]" />

          <svg
            viewBox="0 0 1000 420"
            className="relative z-10 h-full w-full"
            role="img"
            aria-label="Preview route GPX"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect
              x="24"
              y="24"
              width="952"
              height="372"
              rx="22"
              fill="rgba(248,250,252,0.72)"
              stroke="rgba(226,232,240,1)"
              strokeWidth="2"
            />

            {routeSvg.pathD && (
              <>
                <path
                  d={routeSvg.pathD}
                  fill="none"
                  stroke="rgba(126,34,206,0.18)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d={routeSvg.pathD}
                  fill="none"
                  stroke="#7e22ce"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {routeSvg.start && (
              <g>
                <circle
                  cx={routeSvg.start.x}
                  cy={routeSvg.start.y}
                  r="12"
                  fill="#16a34a"
                  stroke="white"
                  strokeWidth="4"
                />
                <text
                  x={routeSvg.start.x + 18}
                  y={routeSvg.start.y - 12}
                  fill="#166534"
                  fontSize="18"
                  fontWeight="900"
                >
                  START
                </text>
              </g>
            )}

            {routeSvg.finish && (
              <g>
                <circle
                  cx={routeSvg.finish.x}
                  cy={routeSvg.finish.y}
                  r="12"
                  fill="#dc2626"
                  stroke="white"
                  strokeWidth="4"
                />
                <text
                  x={routeSvg.finish.x + 18}
                  y={routeSvg.finish.y + 24}
                  fill="#991b1b"
                  fontSize="18"
                  fontWeight="900"
                >
                  FINISH
                </text>
              </g>
            )}
          </svg>
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-500 md:grid-cols-2">
          <p>
            Lat: {routeSvg.minLat.toFixed(6)} sampai {routeSvg.maxLat.toFixed(6)}
          </p>
          <p>
            Lng: {routeSvg.minLng.toFixed(6)} sampai {routeSvg.maxLng.toFixed(6)}
          </p>
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
  icon: LucideIcon;
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

  const points: GpxPoint[] = [];

  const normalPointRegex = /<(trkpt|rtept)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let normalMatch: RegExpExecArray | null;

  while ((normalMatch = normalPointRegex.exec(gpx)) !== null) {
    const attrs = normalMatch[2] || "";
    const inner = normalMatch[3] || "";

    const point = parsePoint(attrs, inner);
    if (point) points.push(point);
  }

  const selfClosingPointRegex = /<(trkpt|rtept)\b([^>]*)\/>/gi;
  let selfClosingMatch: RegExpExecArray | null;

  while ((selfClosingMatch = selfClosingPointRegex.exec(gpx)) !== null) {
    const attrs = selfClosingMatch[2] || "";

    const point = parsePoint(attrs, "");
    if (point) points.push(point);
  }

  return points;
}

function parsePoint(attrs: string, inner: string): GpxPoint | null {
  const lat = Number(readXmlAttr(attrs, "lat"));
  const lng = Number(readXmlAttr(attrs, "lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const eleText = inner.match(/<ele[^>]*>([^<]+)<\/ele>/i)?.[1] || "";
  const ele = Number(eleText.trim());

  return {
    lat,
    lng,
    ele: Number.isFinite(ele) ? ele : null,
  };
}

function readXmlAttr(attrs: string, name: string) {
  const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  return attrs.match(pattern)?.[1] || "";
}

function calculateRouteStats(points: GpxPoint[]) {
  let distanceKm = 0;
  let minEle: number | null = null;
  let maxEle: number | null = null;

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];

    if (typeof point.ele === "number" && Number.isFinite(point.ele)) {
      minEle = minEle === null ? point.ele : Math.min(minEle, point.ele);
      maxEle = maxEle === null ? point.ele : Math.max(maxEle, point.ele);
    }

    if (index > 0) {
      distanceKm += haversineKm(points[index - 1], point);
    }
  }

  return { distanceKm, minEle, maxEle };
}

function buildSvgRoute(points: GpxPoint[]) {
  const width = 1000;
  const height = 420;
  const padding = 48;
  const maxRenderPoints = 1600;

  const sampledPoints = samplePoints(points, maxRenderPoints);

  const lats = sampledPoints.map((point) => point.lat);
  const lngs = sampledPoints.map((point) => point.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = Math.max(maxLat - minLat, 0.000001);
  const lngRange = Math.max(maxLng - minLng, 0.000001);

  const svgPoints: SvgPoint[] = sampledPoints.map((point) => {
    const x = padding + ((point.lng - minLng) / lngRange) * (width - padding * 2);
    const y = padding + ((maxLat - point.lat) / latRange) * (height - padding * 2);

    return {
      x: roundSvgNumber(x),
      y: roundSvgNumber(y),
    };
  });

  const pathD = svgPoints
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.x} ${point.y}`;
    })
    .join(" ");

  return {
    pathD,
    start: svgPoints[0] || null,
    finish: svgPoints[svgPoints.length - 1] || null,
    sampledCount: sampledPoints.length,
    minLat,
    maxLat,
    minLng,
    maxLng,
  };
}

function samplePoints(points: GpxPoint[], maxPoints: number) {
  if (points.length <= maxPoints) return points;

  const step = Math.ceil(points.length / maxPoints);
  const sampled: GpxPoint[] = [];

  for (let index = 0; index < points.length; index += step) {
    sampled.push(points[index]);
  }

  const lastPoint = points[points.length - 1];
  const lastSampledPoint = sampled[sampled.length - 1];

  if (lastPoint && lastSampledPoint !== lastPoint) {
    sampled.push(lastPoint);
  }

  return sampled;
}

function formatElevation(minEle: number | null, maxEle: number | null) {
  if (minEle === null || maxEle === null) {
    return "Tidak ada data";
  }

  return `${Math.round(minEle)} - ${Math.round(maxEle)} m`;
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

function roundSvgNumber(value: number) {
  return Math.round(value * 100) / 100;
}
