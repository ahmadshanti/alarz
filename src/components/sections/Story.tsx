"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Locale, Milestone, SiteSettings } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatNumber } from "@/i18n/config";
import SwirlMark from "@/components/ui/SwirlMark";
import Drip from "@/components/ui/Drip";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Story({
  locale,
  t,
  milestones,
  settings,
}: {
  locale: Locale;
  t: Dictionary["story"];
  milestones: Milestone[];
  settings: SiteSettings;
}) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const rtl = locale === "ar";
  const years = new Date().getFullYear() - settings.foundedYear;
  const millions = settings.monthlyCapacityLiters / 1_000_000;

  useGSAP(
    () => {
      // Count-up stats
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const to = Number(el.dataset.count);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: to,
          duration: 2.2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: () => {
            el.textContent = formatNumber(Math.round(obj.v), locale);
          },
        });
      });

      gsap.from(".story-head > *", {
        y: 40,
        opacity: 0,
        stagger: 0.12,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: ".story-head", start: "top 80%" },
      });

      const mm = gsap.matchMedia();

      // Desktop: pinned horizontal timeline
      mm.add("(min-width: 1024px)", () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - el.parentElement!.clientWidth;
        gsap.to(el, {
          x: () => (rtl ? distance() : -distance()),
          ease: "none",
          scrollTrigger: {
            trigger: ".story-pin",
            start: "top top+=60",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        gsap.to(".story-progress", {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".story-pin",
            start: "top top+=60",
            end: () => `+=${distance()}`,
            scrub: true,
          },
        });
        gsap.from(".story-card", {
          y: 90,
          rotate: rtl ? -3 : 3,
          opacity: 0,
          duration: 1.1,
          stagger: 0.1,
          ease: "back.out(1.5)",
          scrollTrigger: { trigger: ".story-pin", start: "top 75%" },
        });
      });

      // Mobile: simple reveals
      mm.add("(max-width: 1023px)", () => {
        gsap.utils.toArray<HTMLElement>(".story-card").forEach((card) => {
          gsap.from(card, {
            y: 50,
            opacity: 0,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: { trigger: card, start: "top 88%" },
          });
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="story" className="relative bg-navy pt-28 pb-24 text-white">
      <Drip className="absolute inset-x-0 top-0 h-16 w-full -translate-y-[1px] text-cream" />
      <SwirlMark mono className="pointer-events-none absolute top-24 h-[28rem] text-white/[0.035] ltr:right-0 rtl:left-0" />

      <div className="container-x story-head relative">
        <p className="eyebrow !text-orange">{t.eyebrow}</p>
        <h2 className="mt-4 max-w-4xl text-balance text-4xl font-black leading-tight md:text-6xl">{t.title}</h2>

        <dl className="mt-14 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur">
            <dd className="text-6xl font-black text-orange md:text-7xl">
              +<span data-count={years}>0</span>
            </dd>
            <dt className="mt-2 font-bold text-white/70">{t.stats.years}</dt>
          </div>
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur">
            <dd className="text-6xl font-black text-orange md:text-7xl">
              <span data-count={millions}>0</span>
            </dd>
            <dt className="mt-2 font-bold text-white/70">{t.stats.capacity}</dt>
          </div>
          <div className="flex flex-col justify-between rounded-3xl bg-orange p-6 text-navy-ink">
            <dd className="text-5xl font-black md:text-6xl">HACCP</dd>
            <dt className="mt-2 font-bold">{t.stats.first}</dt>
          </div>
        </dl>
      </div>

      {/* Timeline */}
      <div className="story-pin relative mt-20 overflow-hidden lg:h-[calc(100svh-60px)] lg:flex lg:flex-col lg:justify-center">
        <div className="container-x relative">
          <div className="absolute inset-x-5 top-[3.25rem] hidden h-1 rounded-full bg-white/10 md:inset-x-8 lg:block">
            <div className="story-progress h-full origin-left scale-x-0 rounded-full bg-orange rtl:origin-right" />
          </div>
          <div className="overflow-visible">
            <div ref={track} className="flex flex-col gap-6 lg:w-max lg:flex-row lg:gap-8">
              {milestones.map((m, i) => (
                <article
                  key={m.id}
                  className="story-card group relative lg:w-[26rem] lg:shrink-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="relative z-10 grid size-[6.5rem] shrink-0 place-items-center rounded-full bg-orange text-3xl font-black text-navy-ink shadow-[0_0_0_10px_var(--color-navy)] transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110">
                      {m.year}
                    </span>
                    <span className="text-sm font-bold text-white/40">
                      {formatNumber(i + 1, locale, { minimumIntegerDigits: 2 })}
                    </span>
                  </div>
                  <div className="mt-6 rounded-[2rem] bg-white p-7 text-navy-ink shadow-2xl shadow-black/30 transition-transform duration-500 group-hover:-translate-y-2">
                    <h3 className="text-2xl font-black text-navy">{m.title[locale]}</h3>
                    <p className="mt-3 leading-relaxed text-navy-ink/70">{m.body[locale]}</p>
                  </div>
                </article>
              ))}
              {/* spacer so the last card can reach the centre */}
              <div className="hidden lg:block lg:w-[20vw] lg:shrink-0" />
            </div>
          </div>
        </div>
      </div>

      <Drip flip className="absolute inset-x-0 bottom-0 h-16 w-full translate-y-[1px] text-cream" />
    </section>
  );
}
