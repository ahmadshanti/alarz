"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { pageHref } from "@/i18n/routes";
import clsx from "clsx";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { CharmsFlavor, Locale } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import SwirlMark from "@/components/ui/SwirlMark";
import posterImg from "@/assets/charms-poster.jpg";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// three.js is loaded only on the client, after the page is interactive
const CharmsBar3D = dynamic(() => import("@/components/three/CharmsBar3D"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center">
      <div className="h-[62%] w-[30%] -rotate-[18deg] animate-pulse rounded-[40%] bg-[#5b2f18]/15" />
    </div>
  ),
});

export default function Hero({
  locale,
  t,
  flavors,
}: {
  locale: Locale;
  t: Dictionary["hero"];
  flavors: CharmsFlavor[];
}) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const flavor = flavors[active];

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from(".hero-eyebrow", { y: 20, autoAlpha: 0, duration: 0.8 }, 0.1)
        .from(".hero-line > span", { yPercent: 115, rotate: 4, duration: 1.2, stagger: 0.12 }, 0.2)
        .from(".hero-sub", { y: 24, autoAlpha: 0, duration: 1 }, 0.55)
        .from(".hero-cta > *", { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, 0.7)
        .from(".hero-stage", { scale: 0.85, autoAlpha: 0, duration: 1.6 }, 0.15)
        .from(".hero-chips > *", { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.06, ease: "back.out(1.7)" }, 0.9);

      gsap.matchMedia().add("(min-width: 1024px)", () => {
        gsap.to(".hero-canvas", {
          yPercent: 8,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-copy", {
          yPercent: -10,
          autoAlpha: 0.25,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="relative isolate overflow-hidden pt-28 pb-24 md:pt-32 md:pb-28 lg:min-h-[100svh]">
      {/* Background — static gradients only */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#fff_0%,_var(--color-cream)_55%,_var(--color-cream-deep)_100%)]" />
        <div className="absolute top-1/2 size-[30rem] rounded-full bg-[radial-gradient(circle,_rgb(254_178_88/0.45)_0%,_rgb(254_178_88/0)_65%)] ltr:-left-32 rtl:-right-32" />
        <SwirlMark
          mono
          className="absolute bottom-[-8rem] w-[30rem] text-navy opacity-[0.05] ltr:right-[-5rem] rtl:left-[-5rem]"
        />
      </div>

      <div className="container-x grid items-center gap-4 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        {/* Copy */}
        <div className="hero-copy relative z-10 text-center lg:text-start">
          <p className="hero-eyebrow eyebrow justify-center lg:justify-start">{t.eyebrow}</p>

          <h1 className="mt-5 font-black leading-[1.05] tracking-tight text-navy">
            <span className="hero-line block overflow-hidden pb-2">
              <span className="block text-[clamp(3rem,9vw,7.5rem)]">{t.titleTop}</span>
            </span>
            <span className="hero-line block overflow-hidden pb-4">
              <span
                className={clsx(
                  "block whitespace-nowrap bg-clip-text text-transparent",
                  locale === "ar" ? "text-[clamp(3.6rem,11vw,9.5rem)]" : "text-[clamp(3rem,8vw,7rem)]",
                )}
                style={{
                  backgroundImage:
                    "linear-gradient(100deg, var(--color-orange-deep) 0%, var(--color-orange) 45%, var(--color-orange-deep) 100%)",
                }}
              >
                {t.titleBrand}
              </span>
            </span>
          </h1>

          <p className="hero-sub mx-auto mt-4 max-w-xl text-lg leading-relaxed text-navy-ink/70 md:text-xl lg:mx-0">
            {t.subtitle}
          </p>

          <div className="hero-cta mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link href={pageHref(locale, "products")} className="btn btn-primary">
              {t.ctaPrimary}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="rtl:-scale-x-100">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link href={pageHref(locale, "story")} className="btn btn-ghost">
              {t.ctaSecondary}
            </Link>
          </div>
        </div>

        {/* Interactive 3D bar */}
        <div className="hero-stage-wrap relative">
          <div className="hero-stage relative mx-auto aspect-square w-full max-w-[36rem]">
            {/* flavour-coloured glow (background-color transitions; no blur filter) */}
            <div
              className="pointer-events-none absolute inset-[6%] rounded-full opacity-35 transition-[background-color] duration-700"
              style={{
                backgroundColor: flavor.pack,
                maskImage: "radial-gradient(closest-side, #000 10%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(closest-side, #000 10%, transparent 100%)",
              }}
            />
            <div className="pointer-events-none absolute inset-[4%] rounded-full border-2 border-dashed border-navy/10" />

            <div className="hero-canvas absolute inset-0">
              <CharmsBar3D
                flavor={flavor.id}
                onInteract={() => setTouched(true)}
                fallback={
                  <Image src={posterImg} alt="Al-Arz Charms" sizes="36rem" className="mx-auto h-full w-auto rounded-[2rem] object-contain" />
                }
              />
            </div>

            {/* drag hint */}
            <div
              className={clsx(
                "pointer-events-none absolute top-[4%] left-[2%] flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-extrabold text-navy shadow-lg shadow-navy/10 transition-opacity duration-500",
                touched ? "opacity-0" : "opacity-100",
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="hero-hand">
                <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4.4 15.6a1.6 1.6 0 0 1 2.4-2.1L9 15.5" />
              </svg>
              {t.dragHint}
            </div>
          </div>

          {/* Flavour picker */}
          <div className="relative z-20 text-center">
            <p className="text-sm font-bold text-navy/60">{t.pickFlavor}</p>
            <div className="hero-chips mt-3 flex flex-wrap justify-center gap-2" role="radiogroup" aria-label={t.pickFlavor}>
              {flavors.map((f, i) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={i === active}
                  onClick={() => setActive(i)}
                  className={clsx(
                    "flex items-center gap-2 rounded-full py-1.5 ps-1.5 pe-4 text-sm font-bold transition-[transform,background-color,color,box-shadow] duration-300",
                    i === active
                      ? "scale-105 bg-navy text-white shadow-lg shadow-navy/30"
                      : "bg-white text-navy shadow-sm hover:-translate-y-0.5 hover:shadow-md",
                  )}
                >
                  <span
                    className="size-7 rounded-full ring-2 ring-white"
                    style={{ background: `linear-gradient(140deg, ${f.pack}, ${f.packDeep})` }}
                  />
                  {f.name[locale]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
