import type { Locale } from "@/content/types";
import { formatNumber } from "@/i18n/config";

export type LngLat = { lat: number; lng: number };

/** An-Najah National University — new campus, Nablus (OpenStreetMap way 345017904). */
export const AN_NAJAH: LngLat = { lat: 32.22819, lng: 35.22223 };

/** Great-circle distance in metres. */
export function distanceM(a: LngLat, b: LngLat) {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number, locale: Locale, units: { m: string; km: string }) {
  if (m < 1000) return `${formatNumber(Math.max(10, Math.round(m / 10) * 10), locale)} ${units.m}`;
  return `${formatNumber(m / 1000, locale, { maximumFractionDigits: m < 10_000 ? 1 : 0 })} ${units.km}`;
}

/** Rough travel time: walking up to 1.5 km (80 m/min), otherwise driving in town (~30 km/h). */
export function travelTime(m: number, locale: Locale, units: { walk: string; drive: string }) {
  if (m <= 1500) return `${formatNumber(Math.max(1, Math.ceil(m / 80)), locale)} ${units.walk}`;
  return `${formatNumber(Math.max(1, Math.ceil(m / 500)), locale)} ${units.drive}`;
}

/** Polygon approximating a circle of `radiusM` metres around `c` (for the radius ring). */
export function circlePolygon(c: LngLat, radiusM: number, steps = 64): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.cos((c.lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    coords.push([c.lng + dLng * Math.cos(t), c.lat + dLat * Math.sin(t)]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coords] } };
}

export function directionsUrl(p: LngLat) {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
}
