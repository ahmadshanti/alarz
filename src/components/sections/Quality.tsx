"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Locale, QualityItem } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const icons: Record<QualityItem["icon"], React.ReactNode> = {
  lab: <path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3M7 15h10" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5" />,
  badge: <path d="M12 2l2.4 2.1 3.2-.3.7 3.1 2.8 1.6-1.3 2.9 1.3 2.9-2.8 1.6-.7 3.1-3.2-.3L12 22l-2.4-2.1-3.2.3-.7-3.1-2.8-1.6 1.3-2.9-1.3-2.9 2.8-1.6.7-3.1 3.2.3zM9 12l2 2 4-4" />,
  flask: <path d="M6 3h12M8 3v4a8 8 0 1 0 8 0V3M7.5 14h9" />,
};

export default function Quality({ locale, t, items }: { locale: Locale; t: Dictionary["quality"]; items: QualityItem[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".q-head > *", {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: ".q-head", start: "top 80%" },
      });
      gsap.from(".q-card", {
        y: 80,
        opacity: 0,
        rotate: (i) => (i % 2 ? 3 : -3),
        stagger: 0.12,
        duration: 1.1,
        ease: "back.out(1.4)",
        scrollTrigger: { trigger: ".q-grid", start: "top 82%" },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="quality" className="relative overflow-hidden bg-cream-deep/60 py-24 md:py-32">
      <div className="pointer-events-none absolute -top-40 size-[34rem] rounded-full bg-orange/25 blur-3xl ltr:-left-40 rtl:-right-40" />
      <div className="container-x relative grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div className="q-head">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 className="mt-4 text-balance text-4xl font-black leading-tight text-navy md:text-5xl">{t.title}</h2>
          <p className="mt-5 max-w-md text-lg text-navy-ink/65">{t.subtitle}</p>
        </div>

        <div className="q-grid grid gap-5 sm:grid-cols-2">
          {items.map((item, i) => (
            <article
              key={item.id}
              className={`q-card group relative overflow-hidden rounded-[2rem] p-7 transition-transform duration-500 hover:-translate-y-2 ${
                i === 1 ? "bg-navy text-white" : "bg-white text-navy-ink"
              } ${i % 2 ? "sm:translate-y-10" : ""}`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`grid size-14 place-items-center rounded-2xl transition-transform duration-500 group-hover:rotate-[-10deg] group-hover:scale-110 ${
                    i === 1 ? "bg-orange text-navy-ink" : "bg-orange/20 text-orange-deep"
                  }`}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {icons[item.icon]}
                  </svg>
                </span>
                {item.year && (
                  <span className={`text-4xl font-black ${i === 1 ? "text-white/15" : "text-navy/10"}`}>{item.year}</span>
                )}
              </div>
              <h3 className={`mt-6 text-xl font-black ${i === 1 ? "text-white" : "text-navy"}`}>{item.title[locale]}</h3>
              <p className={`mt-2 leading-relaxed ${i === 1 ? "text-white/70" : "text-navy-ink/65"}`}>{item.body[locale]}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
