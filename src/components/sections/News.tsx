"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Locale, NewsItem } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/config";
import SwirlMark from "@/components/ui/SwirlMark";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const covers = [
  "linear-gradient(135deg, #194E91, #0d2f5e)",
  "linear-gradient(135deg, #FEB258, #F28C1B)",
  "linear-gradient(135deg, #F58AA2, #C93A5C)",
];

export default function News({ locale, t, items }: { locale: Locale; t: Dictionary["news"]; items: NewsItem[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".news-card", {
        y: 70,
        opacity: 0,
        stagger: 0.12,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: ".news-grid", start: "top 82%" },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="news" className="py-24 md:py-32">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 className="mt-4 text-4xl font-black text-navy md:text-6xl">{t.title}</h2>
          </div>
        </div>

        <div className="news-grid mt-12 grid gap-6 md:grid-cols-3">
          {items.map((n, i) => (
            <article key={n.id} className="news-card group">
              <a href={n.url ?? "#"} className="block">
                <div
                  className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[2rem]"
                  style={{ background: covers[i % covers.length] }}
                >
                  <SwirlMark
                    mono
                    className="h-[70%] text-white/25 transition-transform duration-700 ease-out group-hover:rotate-[-8deg] group-hover:scale-110"
                  />
                  <span className="absolute bottom-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-navy backdrop-blur ltr:left-4 rtl:right-4">
                    {n.source[locale]}
                  </span>
                </div>
                <div className="mt-5 px-1">
                  <time dateTime={n.date} className="text-sm font-bold text-orange-deep">
                    {formatDate(n.date, locale)}
                  </time>
                  <h3 className="mt-2 text-xl font-black leading-snug text-navy transition-colors group-hover:text-orange-deep">
                    {n.title[locale]}
                  </h3>
                  <p className="mt-2 text-navy-ink/65">{n.excerpt[locale]}</p>
                  <span className="mt-4 inline-flex items-center gap-2 font-extrabold text-navy">
                    {t.readMore}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
