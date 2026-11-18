"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Locale, Product } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatNumber } from "@/i18n/config";
import { pageHref } from "@/i18n/routes";
import { ProductCard } from "@/components/sections/Products";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Home-page preview of the catalogue: a swipeable rail of featured products + link to /products. */
export default function ProductsTeaser({
  locale,
  t,
  teasers,
  products,
  total,
}: {
  locale: Locale;
  t: Dictionary["products"];
  teasers: Dictionary["teasers"];
  products: Product[];
  total: number;
}) {
  const root = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const rtl = locale === "ar";

  useGSAP(
    () => {
      gsap.from(".pt-head > *", {
        y: 40,
        autoAlpha: 0,
        stagger: 0.1,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: ".pt-head", start: "top 82%" },
      });
      gsap.from(".pt-rail .product-card", {
        x: rtl ? -80 : 80,
        autoAlpha: 0,
        stagger: 0.07,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: rail.current, start: "top 85%" },
      });
    },
    { scope: root },
  );

  // "forward" = towards the end of the rail in reading direction
  const scrollRail = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    el.scrollBy({ left: dir * (rtl ? -1 : 1) * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const arrow = (dir: 1 | -1) => (
    <button
      type="button"
      onClick={() => scrollRail(dir)}
      aria-label={dir === 1 ? (rtl ? "التالي" : "Next") : rtl ? "السابق" : "Previous"}
      className="grid size-12 place-items-center rounded-full bg-white text-navy shadow-md shadow-navy/10 ring-1 ring-navy/5 transition hover:-translate-y-0.5 hover:bg-navy hover:text-white"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={dir === -1 ? "ltr:-scale-x-100" : "rtl:-scale-x-100"}>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  );

  return (
    <section ref={root} className="relative py-24 md:py-28">
      <div className="container-x">
        <div className="pt-head flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 className="mt-4 text-4xl font-black text-navy md:text-6xl">
              <span className="melt-underline">{teasers.productsTitle}</span>
            </h2>
            <p className="mt-5 max-w-xl text-lg text-navy-ink/65">{t.subtitle}</p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {arrow(-1)}
            {arrow(1)}
          </div>
        </div>
      </div>

      {/* rail: native horizontal scroll with snap (cheap, swipeable on phones) */}
      <div
        ref={rail}
        className="pt-rail no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-[max(1.25rem,calc((100vw-82rem)/2+2rem))] pt-4 pb-8"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[15.5rem] shrink-0 snap-start md:w-[17rem]">
            <ProductCard p={p} locale={locale} />
          </div>
        ))}
      </div>

      <div className="container-x mt-2 flex flex-col items-center gap-3 text-center">
        <Link href={pageHref(locale, "products")} className="btn btn-primary">
          {teasers.productsCta}
          <span className="grid min-w-7 place-items-center rounded-full bg-orange px-1.5 text-xs text-navy-ink">
            {formatNumber(total, locale)}
          </span>
        </Link>
        <p className="text-sm font-bold text-navy/45 md:hidden">{teasers.productsHint}</p>
      </div>
    </section>
  );
}
