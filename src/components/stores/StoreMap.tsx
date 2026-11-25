"use client";

/**
 * The map itself (MapLibre GL + free OpenFreeMap vector tiles, no API key).
 * - All points of sale as clustered circles (fast with thousands of points)
 * - Numbered pins for the nearest shops, a draggable "you / university" pin and a radius ring
 * - Arabic labels via the RTL text plugin (served from /public/vendor)
 * Loaded only on the "where to buy" page, client-side.
 */
import { useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type Map as MlMap, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Locale } from "@/content/types";
import type { StorePoint } from "@/lib/cms";
import { circlePolygon, directionsUrl, type LngLat } from "./geo";

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const TYPE_COLORS: Record<StorePoint["type"], string> = {
  supermarket: "#194E91",
  minimarket: "#F28C1B",
  mall: "#0E8C7A",
  other: "#6B7A90",
};

export interface Ranked extends StorePoint {
  distance: number;
  distanceText: string;
  timeText: string;
}

export interface StoreMapLabels {
  you: string;
  university: string;
  dragHint: string;
  directions: string;
  official: string;
  types: Record<StorePoint["type"], string>;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Brand the light basemap and show place names in the page language. */
function themeStyle(style: StyleSpecification, locale: Locale): StyleSpecification {
  const name =
    locale === "ar"
      ? ["coalesce", ["get", "name:ar"], ["get", "name"]]
      : ["coalesce", ["get", "name:en"], ["get", "name:latin"], ["get", "name"]];
  for (const layer of style.layers) {
    const l = layer as { id: string; type: string; layout?: Record<string, unknown>; paint?: Record<string, unknown> };
    if (l.layout && "text-field" in l.layout) l.layout["text-field"] = name;
    if (l.type === "background") l.paint = { ...l.paint, "background-color": "#faf5ec" };
    if (l.type === "fill" && /water/.test(l.id)) l.paint = { ...l.paint, "fill-color": "#cfe3f4" };
    if (l.type === "fill" && /park|landcover|wood|grass|landuse_park/.test(l.id))
      l.paint = { ...l.paint, "fill-color": "#e6eedb", "fill-opacity": 0.7 };
    if (l.type === "symbol" && l.paint && "text-color" in l.paint) l.paint["text-color"] = "#4b5b76";
  }
  return style;
}

function pinElement(kind: "origin" | "university", label: string, hint: string) {
  const el = document.createElement("div");
  el.className = `sl-origin sl-origin--${kind}`;
  el.innerHTML = `
    <span class="sl-origin__pulse"></span>
    <span class="sl-origin__dot">${
      kind === "university"
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>`
    }</span>
    <span class="sl-origin__label">${esc(label)}<small>${esc(hint)}</small></span>`;
  return el;
}

function rankElement(rank: number, rankText: string, featured: boolean) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `sl-rank${featured ? " sl-rank--featured" : ""}`;
  el.style.setProperty("--delay", `${rank * 60}ms`);
  el.innerHTML = `<span>${rankText}</span>`;
  return el;
}

export default function StoreMap({
  locale,
  points,
  origin,
  originKind,
  nearest,
  selectedId,
  pickMode,
  labels,
  rankText,
  onPick,
  onSelect,
}: {
  locale: Locale;
  points: StorePoint[];
  origin: LngLat;
  originKind: "default" | "gps" | "picked";
  nearest: Ranked[];
  selectedId: number | null;
  pickMode: boolean;
  labels: StoreMapLabels;
  rankText: (n: number) => string;
  onPick: (p: LngLat) => void;
  onSelect: (id: number | null) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const [ready, setReady] = useState(false);
  const originMarker = useRef<maplibregl.Marker | null>(null);
  const rankMarkers = useRef<Map<number, maplibregl.Marker>>(new Map());
  const popup = useRef<maplibregl.Popup | null>(null);
  // latest props for event handlers registered once
  const live = useRef({ pickMode, onPick, onSelect, points });
  live.current = { pickMode, onPick, onSelect, points };

  /* ---------- create the map once ---------- */
  useEffect(() => {
    let cancelled = false;
    if (maplibregl.getRTLTextPluginStatus() === "unavailable") {
      maplibregl.setRTLTextPlugin("/vendor/mapbox-gl-rtl-text-0.3.0.js", true).catch(() => {});
    }

    (async () => {
      let style: StyleSpecification | string = STYLE_URL;
      try {
        style = themeStyle((await (await fetch(STYLE_URL)).json()) as StyleSpecification, locale);
      } catch {
        /* fall back to the plain style URL */
      }
      if (cancelled || !box.current) return;

      const m = new maplibregl.Map({
        container: box.current,
        style,
        center: [origin.lng, origin.lat],
        zoom: 14.3,
        minZoom: 7,
        maxZoom: 18.5,
        maxBounds: [
          [33.6, 30.6],
          [36.4, 33.5],
        ],
        attributionControl: { compact: true },
        cooperativeGestures: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
      m.touchZoomRotate.disableRotation();
      map.current = m;

      m.on("load", () => {
        m.addSource("stores", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
          cluster: true,
          clusterRadius: 46,
          clusterMaxZoom: 14,
        });
        m.addSource("radius", { type: "geojson", data: { type: "FeatureCollection", features: [] } });

        m.addLayer({ id: "radius-fill", type: "fill", source: "radius", paint: { "fill-color": "#194E91", "fill-opacity": 0.05 } });
        m.addLayer({
          id: "radius-line",
          type: "line",
          source: "radius",
          paint: { "line-color": "#194E91", "line-opacity": 0.35, "line-width": 1.5, "line-dasharray": [2, 2] },
        });
        m.addLayer({
          id: "clusters",
          type: "circle",
          source: "stores",
          filter: ["has", "point_count"],
          // white bubbles with a navy ring: clearly different from the orange numbered "nearest" pins
          paint: {
            "circle-color": ["step", ["get", "point_count"], "#ffffff", 150, "#194E91"],
            "circle-radius": ["step", ["get", "point_count"], 16, 40, 21, 150, 28],
            "circle-stroke-color": "#194E91",
            "circle-stroke-width": ["step", ["get", "point_count"], 2.5, 150, 0],
            "circle-opacity": 0.96,
          },
        });
        m.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "stores",
          filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Bold"], "text-size": 13 },
          paint: { "text-color": ["step", ["get", "point_count"], "#194E91", 150, "#ffffff"] },
        });
        m.addLayer({
          id: "stores-dot",
          type: "circle",
          source: "stores",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": [
              "match",
              ["get", "type"],
              "supermarket",
              TYPE_COLORS.supermarket,
              "minimarket",
              TYPE_COLORS.minimarket,
              "mall",
              TYPE_COLORS.mall,
              TYPE_COLORS.other,
            ],
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 4, 15, 7, 18, 10],
            "circle-stroke-color": ["case", ["get", "featured"], "#FEB258", "#ffffff"],
            "circle-stroke-width": ["case", ["get", "featured"], 3.5, 2],
          },
        });
        m.addLayer({
          id: "stores-label",
          type: "symbol",
          source: "stores",
          minzoom: 15.5,
          filter: ["!", ["has", "point_count"]],
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 12,
            "text-offset": [0, 1.3],
            "text-anchor": "top",
            "text-max-width": 9,
          },
          paint: { "text-color": "#10223f", "text-halo-color": "#ffffff", "text-halo-width": 1.6 },
        });

        // interactions
        m.on("click", "clusters", async (e) => {
          const f = e.features?.[0];
          if (!f || live.current.pickMode) return;
          const src = m.getSource("stores") as GeoJSONSource;
          const zoom = await src.getClusterExpansionZoom(f.properties.cluster_id as number);
          m.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: zoom + 0.3, duration: reduceMotion() ? 0 : 700 });
        });
        m.on("click", "stores-dot", (e) => {
          if (live.current.pickMode) return;
          const id = e.features?.[0]?.properties?.id as number | undefined;
          if (id != null) live.current.onSelect(id);
        });
        for (const layer of ["clusters", "stores-dot"]) {
          m.on("mouseenter", layer, () => !live.current.pickMode && (m.getCanvas().style.cursor = "pointer"));
          m.on("mouseleave", layer, () => !live.current.pickMode && (m.getCanvas().style.cursor = ""));
        }
        m.on("click", (e) => {
          if (live.current.pickMode) live.current.onPick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        });

        setReady(true);
      });
    })();

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- data ---------- */
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    (m.getSource("stores") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        properties: { id: p.id, type: p.type, featured: Boolean(p.featured), label: locale === "en" && p.nameEn ? p.nameEn : p.name },
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      })),
    });
  }, [ready, points, locale]);

  /* ---------- origin pin + radius ring + camera ---------- */
  const firstFit = useRef(true);
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;

    originMarker.current?.remove();
    const kind = originKind === "default" ? "university" : "origin";
    const el = pinElement(kind, originKind === "default" ? labels.university : labels.you, labels.dragHint);
    const marker = new maplibregl.Marker({ element: el, draggable: true, anchor: "center" }).setLngLat([origin.lng, origin.lat]).addTo(m);
    marker.on("dragend", () => {
      const p = marker.getLngLat();
      live.current.onPick({ lat: p.lat, lng: p.lng });
    });
    originMarker.current = marker;

    const ringRadius = Math.max(400, Math.min(nearest[Math.min(9, nearest.length - 1)]?.distance ?? 1000, 20_000));
    (m.getSource("radius") as GeoJSONSource).setData({ type: "FeatureCollection", features: [circlePolygon(origin, ringRadius)] });

    // camera: frame the origin with its nearest shops
    const bounds = new maplibregl.LngLatBounds([origin.lng, origin.lat], [origin.lng, origin.lat]);
    nearest.slice(0, 6).forEach((p) => bounds.extend([p.lng, p.lat]));
    const wide = (box.current?.clientWidth ?? 800) > 640;
    // extra top room: the numbered pins stand ~40px above their point
    const padding = wide ? { top: 120, bottom: 80, left: 90, right: 90 } : { top: 90, bottom: 60, left: 40, right: 40 };
    if (firstFit.current && originKind === "default") {
      firstFit.current = false;
      if (nearest.length) m.fitBounds(bounds, { padding, maxZoom: 15.5, duration: 0 });
    } else {
      m.fitBounds(bounds, { padding, maxZoom: 16, duration: reduceMotion() ? 0 : 1600, essential: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, origin.lat, origin.lng, originKind, nearest.length ? nearest[0].id : -1]);

  /* ---------- numbered pins for the nearest shops ---------- */
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    rankMarkers.current.forEach((mk) => mk.remove());
    rankMarkers.current.clear();
    nearest.slice(0, 10).forEach((p, i) => {
      const el = rankElement(i + 1, rankText(i + 1), Boolean(p.featured));
      el.setAttribute("aria-label", p.name);
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        live.current.onSelect(p.id);
      });
      const mk = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([p.lng, p.lat]).addTo(m);
      rankMarkers.current.set(p.id, mk);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, nearest]);

  /* ---------- selection: highlight + popup + fly ---------- */
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    rankMarkers.current.forEach((mk, id) => mk.getElement().classList.toggle("is-active", id === selectedId));
    // detach first: a popup closed by code must not clear the new selection
    const previous = popup.current;
    popup.current = null;
    previous?.remove();
    if (selectedId == null) return;
    const p = nearest.find((n) => n.id === selectedId) ?? (live.current.points.find((n) => n.id === selectedId) as Ranked | undefined);
    if (!p) return;
    const name = locale === "en" && p.nameEn ? p.nameEn : p.name;
    const html = `
      <div class="sl-pop">
        <span class="sl-pop__type" style="--c:${TYPE_COLORS[p.type]}">${esc(labels.types[p.type])}${p.featured ? ` · ${esc(labels.official)}` : ""}</span>
        <strong>${esc(name)}</strong>
        ${p.city || p.address ? `<span class="sl-pop__addr">${esc([p.address, p.city].filter(Boolean).join("، "))}</span>` : ""}
        ${"distanceText" in p && p.distanceText ? `<span class="sl-pop__dist">${esc(p.distanceText)} · ${esc(p.timeText)}</span>` : ""}
        <a class="sl-pop__btn" href="${directionsUrl(p)}" target="_blank" rel="noreferrer">${esc(labels.directions)}</a>
      </div>`;
    const pop = new maplibregl.Popup({ offset: 26, closeButton: true, maxWidth: "260px", className: "sl-popup" })
      .setLngLat([p.lng, p.lat])
      .setHTML(html)
      .addTo(m);
    popup.current = pop;
    // closed by the visitor (× or clicking the map) → clear the selection
    pop.on("close", () => popup.current === pop && live.current.onSelect(null));
    m.easeTo({ center: [p.lng, p.lat], zoom: Math.max(m.getZoom(), 15.5), duration: reduceMotion() ? 0 : 900, offset: [0, 60] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, selectedId]);

  /* ---------- pick mode cursor ---------- */
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    m.getCanvas().style.cursor = pickMode ? "crosshair" : "";
  }, [pickMode, ready]);

  return (
    <div className="absolute inset-0">
      {/* h-full/w-full, not absolute: maplibre's own CSS forces `position: relative` on this element */}
      <div ref={box} className="h-full w-full" />
      {!ready && (
        <div className="sl-skeleton absolute inset-0 grid place-items-center">
          <div className="size-14 animate-spin rounded-full border-4 border-orange border-t-transparent" />
        </div>
      )}
    </div>
  );
}
