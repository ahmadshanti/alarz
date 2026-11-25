"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import type { Locale } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { StorePoint } from "@/lib/cms";
import { formatNumber } from "@/i18n/config";
import { AN_NAJAH, directionsUrl, distanceM, formatDistance, travelTime, type LngLat } from "./geo";
import type { Ranked } from "./StoreMap";
import "./store-locator.css";

// MapLibre needs the browser — load it client-side only, after the page is interactive
const StoreMap = dynamic(() => import("./StoreMap"), {
  ssr: false,
  loading: () => (
    <div className="sl-skeleton absolute inset-0 grid place-items-center">
      <div className="size-14 animate-spin rounded-full border-4 border-orange border-t-transparent" />
    </div>
  ),
});

type Filter = "all" | StorePoint["type"];
type OriginKind = "default" | "gps" | "picked";

const TYPE_DOT: Record<StorePoint["type"], string> = {
  supermarket: "bg-navy",
  minimarket: "bg-orange-deep",
  mall: "bg-[#0E8C7A]",
  other: "bg-[#6B7A90]",
};

export default function StoreLocator({ locale, t }: { locale: Locale; t: Dictionary["stores"] }) {
  const [points, setPoints] = useState<StorePoint[] | null>(null);
  const [origin, setOrigin] = useState<LngLat>(AN_NAJAH);
  const [originKind, setOriginKind] = useState<OriginKind>("default");
  const [filter, setFilter] = useState<Filter>("all");
  const [pickMode, setPickMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "denied">("idle");
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/stores")
      .then((r) => r.json())
      .then((j: { points: StorePoint[] }) => alive && setPoints(j.points ?? []))
      .catch(() => alive && setPoints([]));
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(
    () => (points ?? []).filter((p) => filter === "all" || p.type === filter),
    [points, filter],
  );

  const nearest: Ranked[] = useMemo(() => {
    const units = { m: t.m, km: t.km, walk: t.walk, drive: t.drive };
    return visible
      .map((p) => ({ p, d: distanceM(origin, p) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 30)
      .map(({ p, d }) => ({
        ...p,
        distance: d,
        distanceText: formatDistance(d, locale, units),
        timeText: travelTime(d, locale, units),
      }));
  }, [visible, origin, locale, t]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, supermarket: 0, minimarket: 0, mall: 0, other: 0 };
    for (const p of points ?? []) {
      c.all++;
      c[p.type]++;
    }
    return c;
  }, [points]);

  const pick = useCallback((p: LngLat) => {
    setOrigin(p);
    setOriginKind("picked");
    setPickMode(false);
    setSelectedId(null);
    setStatus("idle");
  }, []);

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) return setStatus("denied");
    setStatus("locating");
    setPickMode(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setOriginKind("gps");
        setSelectedId(null);
        setStatus("idle");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  };

  // keep the selected shop visible in the list
  useEffect(() => {
    if (selectedId == null) return;
    listRef.current?.querySelector(`[data-id="${selectedId}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  const heading = originKind === "gps" ? t.nearYou : originKind === "picked" ? t.nearPicked : t.nearUniversity;
  const filters: Filter[] = ["all", "supermarket", "minimarket", "mall"];
  const rankText = useCallback((n: number) => formatNumber(n, locale), [locale]);

  return (
    <section className="relative pb-20">
      <div className="container-x">
        {/* headline stats */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="sl-stat">
            <b>{points ? formatNumber(counts.all, locale) : "…"}</b> {t.points} {t.onMap}
          </span>
          {nearest[0] && (
            <span className="sl-stat sl-stat--orange">
              {t.nearest}: <b>{nearest[0].distanceText}</b>
            </span>
          )}
        </div>

        <div className="sl-shell grid overflow-hidden rounded-[2.25rem] bg-white shadow-[0_40px_90px_-40px_rgba(13,47,94,0.45)] ring-1 ring-navy/5 [grid-template-areas:'head'_'map'_'list'] lg:h-[48rem] lg:grid-cols-[25rem_1fr] lg:grid-rows-[auto_1fr] lg:[grid-template-areas:'head_map'_'list_map']">
          {/* ---------- controls ---------- */}
          <div className="relative z-10 border-navy/5 p-5 sm:p-6 lg:border-e [grid-area:head]">
            <h2 className="text-2xl font-black text-navy">{t.whereAreYou}</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={useMyLocation} className="sl-btn sl-btn--primary" disabled={status === "locating"}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3.5" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  <circle cx="12" cy="12" r="7.5" />
                </svg>
                {status === "locating" ? t.locating : t.useMyLocation}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPickMode((v) => !v);
                  setSelectedId(null);
                }}
                aria-pressed={pickMode}
                className={clsx("sl-btn", pickMode ? "sl-btn--active" : "sl-btn--ghost")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
                {pickMode ? t.cancel : t.pickOnMap}
              </button>
            </div>
            <p aria-live="polite" className="mt-3 min-h-5 text-sm font-semibold">
              {status === "denied" && <span className="text-[#c2410c]">{t.geoDenied}</span>}
              {status !== "denied" && <span className="text-navy-ink/50">{t.dragHint}</span>}
            </p>

            <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label={t.all}>
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={filter === f}
                  onClick={() => {
                    setFilter(f);
                    setSelectedId(null);
                  }}
                  className={clsx("sl-chip", filter === f && "is-on")}
                >
                  {f !== "all" && <span className={clsx("size-2.5 rounded-full", TYPE_DOT[f])} />}
                  {f === "all" ? t.all : t.types[f]}
                  {points && <span className="sl-chip__n">{formatNumber(counts[f], locale)}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* ---------- map ---------- */}
          <div className="relative h-[62svh] min-h-[24rem] lg:h-auto [grid-area:map]" data-lenis-prevent>
            <StoreMap
              locale={locale}
              points={visible}
              origin={origin}
              originKind={originKind}
              nearest={nearest}
              selectedId={selectedId}
              pickMode={pickMode}
              rankText={rankText}
              labels={{
                you: t.you,
                university: t.university,
                dragHint: t.dragHint,
                directions: t.directions,
                official: t.official,
                types: t.types,
              }}
              onPick={pick}
              onSelect={setSelectedId}
            />

            {pickMode && (
              <div className="sl-hint pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center">
                <span>{t.picking}</span>
              </div>
            )}
            {originKind !== "default" && (
              <button
                type="button"
                onClick={() => {
                  setOrigin(AN_NAJAH);
                  setOriginKind("default");
                  setSelectedId(null);
                }}
                className="sl-float absolute bottom-10 z-10 ltr:left-3 rtl:right-3"
              >
                {t.university}
              </button>
            )}
          </div>

          {/* ---------- nearest list ---------- */}
          <div className="relative min-h-0 border-t border-navy/5 [grid-area:list] lg:border-e lg:border-t-0">
            <div className="px-5 pt-4 pb-2 sm:px-6">
              <h3 className="font-black text-navy">{heading}</h3>
            </div>
            <ol ref={listRef} className="sl-list max-h-[26rem] overflow-y-auto px-3 pb-4 sm:px-4 lg:absolute lg:inset-x-0 lg:top-14 lg:bottom-0 lg:max-h-none" data-lenis-prevent>
              {points === null && <li className="p-4 text-sm font-semibold text-navy/50">{t.loading}</li>}
              {points?.length === 0 && <li className="p-4 text-sm font-semibold text-navy/50">{t.noData}</li>}
              {points && points.length > 0 && nearest.length === 0 && (
                <li className="p-4 text-sm font-semibold text-navy/50">{t.empty}</li>
              )}
              {nearest.map((p, i) => {
                const active = p.id === selectedId;
                const name = locale === "en" && p.nameEn ? p.nameEn : p.name;
                return (
                  <li key={p.id} data-id={p.id} className="sl-item" style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(active ? null : p.id)}
                      aria-expanded={active}
                      className={clsx("sl-card", active && "is-active")}
                    >
                      <span className={clsx("sl-card__rank", i < 10 ? "is-ranked" : "")}>{formatNumber(i + 1, locale)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-extrabold text-navy">{name}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-navy-ink/55">
                          <span className={clsx("size-2 shrink-0 rounded-full", TYPE_DOT[p.type])} />
                          {t.types[p.type]}
                          {p.featured && <span className="rounded-full bg-orange/25 px-1.5 text-[10px] text-navy-ink">{t.official}</span>}
                          {p.city && <span className="truncate">· {p.city}</span>}
                        </span>
                      </span>
                      <span className="shrink-0 text-end">
                        <span className="block font-black text-navy">{p.distanceText}</span>
                        <span className="block text-[11px] font-semibold text-navy-ink/45">{p.timeText}</span>
                      </span>
                    </button>
                    {active && (
                      <a href={directionsUrl(p)} target="_blank" rel="noreferrer" className="sl-dir">
                        {t.directions}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="rtl:-scale-x-100">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </a>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
