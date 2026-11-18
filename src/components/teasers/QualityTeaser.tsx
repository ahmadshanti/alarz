"use client";

import Link from "next/link";
import type { Locale, QualityItem } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { pageHref } from "@/i18n/routes";
import { qualityIcons } from "@/components/sections/Quality";
import Reveal from "@/components/ui/Reveal";

/** Home-page preview of quality: headline + one compact badge per quality item + link to /quality. */
export default function QualityTeaser({
  locale,
  t,
  cta,
  items,
}: {
  locale: Locale;
  t: Dictionary["quality"];
  cta: string;
  items: QualityItem[];
}) {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-cream-deep/70 p-8 ring-1 ring-orange/15 md:p-14">
          <div className="pointer-events-none absolute -top-32 size-[26rem] rounded-full bg-[radial-gradient(closest-side,_rgb(254_178_88/0.35),_transparent)] ltr:-right-24 rtl:-left-24" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <Reveal>
              <p className="eyebrow">{t.eyebrow}</p>
              <h2 className="mt-4 text-balance text-3xl font-black leading-tight text-navy md:text-5xl">{t.title}</h2>
              <p className="mt-4 max-w-md text-lg text-navy-ink/65">{t.subtitle}</p>
              <Link href={pageHref(locale, "quality")} className="btn btn-primary mt-8">
                {cta}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="rtl:-scale-x-100">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </Reveal>

            <ul className="grid grid-cols-2 gap-4">
              {items.slice(0, 4).map((item, i) => (
                <Reveal as="li" key={item.id} delay={i * 90}>
                  <div
                    className={`group flex h-full flex-col gap-4 rounded-3xl p-5 transition-transform duration-500 hover:-translate-y-1.5 ${
                      i === 1 ? "bg-navy text-white" : "bg-white text-navy"
                    }`}
                  >
                    <span
                      className={`grid size-12 place-items-center rounded-2xl transition-transform duration-500 group-hover:rotate-[-10deg] ${
                        i === 1 ? "bg-orange text-navy-ink" : "bg-orange/20 text-orange-deep"
                      }`}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        {qualityIcons[item.icon]}
                      </svg>
                    </span>
                    <span className="font-black leading-snug">{item.title[locale]}</span>
                    {item.year && (
                      <span className={`mt-auto text-sm font-bold ${i === 1 ? "text-white/50" : "text-navy/40"}`}>{item.year}</span>
                    )}
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
