"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { pageHref } from "@/i18n/routes";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { CharmsFlavor, Locale } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatNumber } from "@/i18n/config";
import PhotoDeck from "@/components/ui/PhotoDeck";
import flavorsImg from "@/assets/charms-flavors.jpg";
import captainImg from "@/assets/captain-vanilla.jpg";
import newArrivalsImg from "@/assets/new-mangaway-bisco.jpg";

gsap.registerPlugin(ScrollTrigger, Flip, useGSAP);

/** "Rank them by your favourite taste" — Charms spotlight on a sky background matching the photo. */
export default function CharmsSpotlight({
  locale,
  t,
  flavors,
}: {
  locale: Locale;
  t: Dictionary["charms"];
  flavors: CharmsFlavor[];
}) {
  const root = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const [order, setOrder] = useState(() => flavors.map((f) => f.id));
  const byId = Object.fromEntries(flavors.map((f) => [f.id, f]));

  const promote = (id: string) => {
    if (order[0] === id) return;
    if (list.current) flipState.current = Flip.getState(list.current.querySelectorAll(".rank-item"));
    setOrder((o) => [id, ...o.filter((x) => x !== id)]);
  };

  // Animate the re-order (FLIP: transform only)
  useLayoutEffect(() => {
    if (!flipState.current) return;
    Flip.from(flipState.current, { duration: 0.7, ease: "power3.inOut", absolute: false });
    flipState.current = null;
  }, [order]);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(".charms-head > *", {
        y: 40,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: ".charms-head", start: "top 82%" },
      });
      gsap.from(".charms-photo", {
        y: 90,
        rotate: locale === "ar" ? 5 : -5,
        autoAlpha: 0,
        duration: 1.4,
        ease: "expo.out",
        scrollTrigger: { trigger: ".charms-photo", start: "top 85%" },
      });
      gsap.from(".rank-item", {
        x: locale === "ar" ? -40 : 40,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 0.9,
        ease: "back.out(1.5)",
        scrollTrigger: { trigger: list.current, start: "top 85%" },
      });

      gsap.matchMedia().add("(min-width: 1024px)", () => {
        gsap.to(".charms-photo-inner", {
          yPercent: -8,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="charms"
      className="relative isolate overflow-hidden py-24 md:py-32"
      style={{ background: "linear-gradient(180deg, #318bd7 0%, #75b3ec 55%, #c5e1fb 100%)" }}
    >
      {/* soft clouds — static gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[18%] h-40 w-[38rem] rounded-full bg-[radial-gradient(closest-side,_rgb(255_255_255/0.45),_transparent)] ltr:-left-40 rtl:-right-40" />
        <div className="absolute bottom-[12%] h-48 w-[44rem] rounded-full bg-[radial-gradient(closest-side,_rgb(255_255_255/0.55),_transparent)] ltr:-right-52 rtl:-left-52" />
      </div>

      <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* Photo */}
        <div className="charms-photo relative mx-auto w-[86%] max-w-[26rem] lg:order-none">
          <div className="charms-photo-inner">
            <PhotoDeck
              rtl={locale === "ar"}
              nextLabel={t.slides.next}
              slides={[
                { src: flavorsImg, alt: t.imageAlt, label: t.slides.charms },
                { src: captainImg, alt: t.slides.captainAlt, label: t.slides.captain },
                {
                  src: newArrivalsImg,
                  alt: t.slides.newAlt,
                  label: t.slides.new,
                  fit: "contain",
                  bg: "linear-gradient(180deg, #00143c 0%, #011949 29%, #02a1ff 71%, #2bb3ff 100%)",
                },
              ]}
            />
          </div>
          {/* playful splash marks like the artwork */}
          <svg viewBox="0 0 40 40" className="absolute -top-6 size-14 text-orange ltr:-left-6 rtl:-right-6" aria-hidden>
            <path d="M18 2 L22 16 M6 10 L16 19 M32 8 L24 18" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Copy + ranking */}
        <div className="text-center lg:text-start">
          <div className="charms-head">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-extrabold text-white ring-1 ring-white/40">
              {t.eyebrow}
            </p>
            <h2 className="mt-5 whitespace-pre-line text-4xl font-black leading-[1.15] text-white [text-shadow:0_4px_24px_rgb(13_47_94/0.35)] md:text-6xl">
              {t.title}
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg font-semibold text-navy-ink/75 lg:mx-0">{t.subtitle}</p>
          </div>

          <ol ref={list} className="mx-auto mt-8 grid max-w-lg gap-3 lg:mx-0" aria-label={t.title.replace("\n", " ")}>
            {order.map((id, i) => {
              const f = byId[id];
              const top = i === 0;
              return (
                <li key={id} className="rank-item">
                  <button
                    type="button"
                    onClick={() => promote(id)}
                    aria-label={`${f.name[locale]} — ${t.hint}`}
                    className={clsx(
                      "group flex w-full items-center gap-4 rounded-2xl p-3 pe-5 text-start outline-none focus-visible:ring-4 focus-visible:ring-orange/70 transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-0.5",
                      top
                        ? "bg-white shadow-[0_20px_40px_-20px_rgba(8,29,60,0.55)]"
                        : "bg-white/70 shadow-[0_10px_30px_-22px_rgba(8,29,60,0.5)] hover:bg-white",
                    )}
                  >
                    <span
                      className="grid size-12 shrink-0 place-items-center rounded-xl text-xl font-black text-white"
                      style={{ background: `linear-gradient(140deg, ${f.pack}, ${f.packDeep})` }}
                    >
                      {formatNumber(i + 1, locale)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-black text-navy">{f.name[locale]}</span>
                      <span className="block text-sm font-semibold text-navy-ink/55">
                        {top ? t.favorite : t.hint}
                      </span>
                    </span>
                    <span
                      className={clsx(
                        "grid size-9 shrink-0 place-items-center rounded-full transition-all duration-300",
                        top ? "bg-orange text-navy-ink" : "bg-navy/5 text-navy/50 group-hover:bg-navy group-hover:text-white",
                      )}
                      aria-hidden
                    >
                      {top ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                          <path d="M12 19V5M6 11l6-6 6 6" />
                        </svg>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <Link href={pageHref(locale, "products")} className="btn btn-primary mt-8">
            {t.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
