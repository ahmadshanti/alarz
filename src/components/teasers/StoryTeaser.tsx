"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Locale, Milestone, SiteSettings } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatNumber } from "@/i18n/config";
import { pageHref } from "@/i18n/routes";
import SwirlMark from "@/components/ui/SwirlMark";
import Drip from "@/components/ui/Drip";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Home-page preview of the story: headline, three stats, the milestone years, and a link to /story. */
export default function StoryTeaser({
  locale,
  t,
  cta,
  milestones,
  settings,
}: {
  locale: Locale;
  t: Dictionary["story"];
  cta: string;
  milestones: Milestone[];
  settings: SiteSettings;
}) {
  const root = useRef<HTMLElement>(null);
  const years = new Date().getFullYear() - settings.foundedYear;
  const millions = settings.monthlyCapacityLiters / 1_000_000;

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const obj = { v: 0 };
        gsap.to(obj, {
          v: Number(el.dataset.count),
          duration: 2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
          onUpdate: () => {
            el.textContent = formatNumber(Math.round(obj.v), locale);
          },
        });
      });
      gsap.from(".st-reveal", {
        y: 50,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });
      gsap.from(".st-year", {
        scale: 0,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 0.8,
        ease: "back.out(2)",
        scrollTrigger: { trigger: ".st-years", start: "top 90%" },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden bg-navy pt-28 pb-28 text-white">
      <Drip className="absolute inset-x-0 top-0 h-16 w-full -translate-y-[1px] text-cream" />
      <SwirlMark mono className="pointer-events-none absolute top-20 h-[26rem] text-white/[0.04] ltr:right-0 rtl:left-0" />

      <div className="container-x relative grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="st-reveal eyebrow !text-orange">{t.eyebrow}</p>
          <h2 className="st-reveal mt-4 text-balance text-4xl font-black leading-tight md:text-5xl">{t.title}</h2>

          {/* milestone years as a mini timeline */}
          <ol className="st-years mt-10 flex flex-wrap items-center gap-2">
            {milestones.map((m, i) => (
              <li key={m.id} className="st-year flex items-center gap-2">
                <span className="grid h-11 min-w-11 place-items-center rounded-full bg-white/10 px-3 text-sm font-black text-orange ring-1 ring-white/15">
                  {m.year}
                </span>
                {i < milestones.length - 1 && <span className="h-0.5 w-5 rounded-full bg-white/20" aria-hidden />}
              </li>
            ))}
          </ol>

          <Link href={pageHref(locale, "story")} className="st-reveal btn mt-10 bg-orange text-navy-ink hover:bg-white">
            {cta}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="rtl:-scale-x-100">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        <dl className="grid grid-cols-2 gap-4">
          <div className="st-reveal rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <dd className="text-5xl font-black text-orange md:text-6xl">
              +<span data-count={years}>0</span>
            </dd>
            <dt className="mt-2 font-bold text-white/70">{t.stats.years}</dt>
          </div>
          <div className="st-reveal rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <dd className="text-5xl font-black text-orange md:text-6xl">
              <span data-count={millions}>0</span>
            </dd>
            <dt className="mt-2 font-bold text-white/70">{t.stats.capacity}</dt>
          </div>
          <div className="st-reveal col-span-2 flex items-center gap-5 rounded-3xl bg-orange p-6 text-navy-ink">
            <dd className="text-4xl font-black md:text-5xl">HACCP</dd>
            <dt className="font-bold">{t.stats.first}</dt>
          </div>
        </dl>
      </div>

      <Drip flip className="absolute inset-x-0 bottom-0 h-16 w-full translate-y-[1px] text-cream" />
    </section>
  );
}
