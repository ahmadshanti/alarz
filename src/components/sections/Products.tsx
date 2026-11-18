"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Category, CategoryId, Locale, Product } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatNumber } from "@/i18n/config";
import ProductArt from "@/components/ui/ProductArt";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function ProductCard({ p, locale }: { p: Product; locale: Locale }) {
  const ref = useRef<HTMLElement>(null);

  // 3D tilt following the pointer
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${-y * 10}deg`);
    el.style.setProperty("--ry", `${x * 12}deg`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <article
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="product-card group relative [perspective:900px]"
    >
      <div
        className="relative h-full overflow-hidden rounded-[2rem] bg-white p-4 pb-5 shadow-[0_20px_50px_-30px_rgba(13,47,94,0.45)] ring-1 ring-navy/5 transition-[transform,box-shadow] duration-300 ease-out group-hover:shadow-[0_30px_60px_-25px_rgba(13,47,94,0.5)]"
        style={{ transform: "rotateX(var(--rx,0)) rotateY(var(--ry,0))", transformStyle: "preserve-3d" }}
      >
        <div
          className="relative grid aspect-square place-items-center overflow-hidden rounded-[1.5rem]"
          style={{ background: `radial-gradient(circle at 50% 60%, ${p.colors.base}cc, ${p.colors.base}33 70%)` }}
        >
          <div
            className="absolute size-[90%] rounded-full opacity-70 transition-transform duration-700 group-hover:scale-125"
            style={{ background: `radial-gradient(closest-side, ${p.colors.base}, transparent)` }}
          />
          {p.image ? (
            <Image
              src={p.image.url}
              alt={p.image.alt[locale] || p.line[locale]}
              width={p.image.width}
              height={p.image.height}
              sizes="(min-width: 1280px) 15rem, (min-width: 768px) 30vw, 45vw"
              className="relative h-[78%] w-auto object-contain drop-shadow-[0_18px_18px_rgba(13,47,94,0.25)] transition-transform duration-500 ease-[var(--ease-bounce)] group-hover:-translate-y-2 group-hover:rotate-[-6deg] group-hover:scale-110"
            />
          ) : (
            <ProductArt
              id={p.id}
              category={p.category}
              colors={p.colors}
              className="relative h-[78%] w-auto drop-shadow-[0_18px_18px_rgba(13,47,94,0.25)] transition-transform duration-500 ease-[var(--ease-bounce)] group-hover:-translate-y-2 group-hover:rotate-[-6deg] group-hover:scale-110"
            />
          )}
          {p.featured && (
            <span className="absolute top-3 rounded-full bg-navy px-3 py-1 text-xs font-bold text-white ltr:left-3 rtl:right-3">
              {locale === "ar" ? "مميز" : "Featured"}
            </span>
          )}
        </div>
        <div className="mt-4 px-1">
          <h3 className="text-xl font-black text-navy">{p.line[locale]}</h3>
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-navy-ink/60">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.colors.accent }} />
            {p.flavor?.[locale] ?? p.size?.[locale] ?? (locale === "ar" ? "نكهة الآرز الأصلية" : "Signature Al-Arz flavour")}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function Products({
  locale,
  t,
  categories,
  products,
}: {
  locale: Locale;
  t: Dictionary["products"];
  categories: Category[];
  products: Product[];
}) {
  const root = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<CategoryId>(categories[0].id);
  const list = useMemo(() => products.filter((p) => p.category === active), [products, active]);
  const activeCat = categories.find((c) => c.id === active)!;

  useGSAP(
    () => {
      gsap.from(".products-head > *", {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: ".products-head", start: "top 80%" },
      });
    },
    { scope: root },
  );

  // Re-animate the grid every time the category changes
  useGSAP(
    () => {
      gsap.fromTo(
        ".product-card",
        { y: 60, opacity: 0, scale: 0.92 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: { each: 0.04, from: "start" },
          ease: "back.out(1.4)",
          scrollTrigger: { trigger: grid.current, start: "top 85%" },
        },
      );
    },
    { scope: grid, dependencies: [active], revertOnUpdate: true },
  );

  return (
    <section ref={root} id="products" className="relative py-24 md:py-32">
      <div className="container-x">
        <div className="products-head flex flex-col items-center text-center">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 className="mt-4 text-4xl font-black text-navy md:text-6xl">
            <span className="melt-underline">{t.title}</span>
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-navy-ink/65">{t.subtitle}</p>

          {/* Tabs */}
          <div className="mt-10 inline-flex flex-wrap justify-center gap-1 rounded-3xl bg-white p-1.5 sm:rounded-full shadow-[0_15px_40px_-20px_rgba(13,47,94,0.35)] ring-1 ring-navy/5" role="tablist">
            {categories.map((c) => {
              const count = products.filter((p) => p.category === c.id).length;
              return (
                <button
                  key={c.id}
                  role="tab"
                  type="button"
                  aria-selected={c.id === active}
                  onClick={() => setActive(c.id)}
                  className={clsx(
                    "relative flex items-center gap-2 rounded-full px-5 py-3 font-extrabold transition-all duration-300",
                    c.id === active ? "bg-navy text-white shadow-lg shadow-navy/25" : "text-navy hover:bg-navy/5",
                  )}
                >
                  {c.name[locale]}
                  <span
                    className={clsx(
                      "grid min-w-7 place-items-center rounded-full px-1.5 text-xs",
                      c.id === active ? "bg-orange text-navy-ink" : "bg-navy/10",
                    )}
                  >
                    {formatNumber(count, locale)}
                  </span>
                </button>
              );
            })}
          </div>
          <p key={active} className="mt-5 font-bold text-orange-deep" style={{ animation: "float-y 3s ease-in-out infinite" }}>
            {activeCat.tagline[locale]}
          </p>
        </div>

        <div
          ref={grid}
          className={clsx(
            "mt-12 grid gap-5",
            list.length === 1
              ? "mx-auto max-w-sm grid-cols-1"
              : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
          )}
          role="tabpanel"
        >
          {list.map((p) => (
            <ProductCard key={p.id} p={p} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
