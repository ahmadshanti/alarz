"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import clsx from "clsx";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export interface DeckSlide {
  src: StaticImageData;
  alt: string;
  label: string;
  /** "contain" for wide artwork shown inside the portrait card, on a matching background */
  fit?: "cover" | "contain";
  bg?: string;
}

/**
 * Stacked photo cards. Tap / swipe / auto-advance sends the front card to the back.
 * Only transform + opacity are animated.
 */
export default function PhotoDeck({
  slides,
  rtl,
  nextLabel,
  interval = 5000,
}: {
  slides: DeckSlide[];
  rtl: boolean;
  nextLabel: string;
  interval?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [front, setFront] = useState(0);
  const busy = useRef(false);
  const paused = useRef(false);
  const inView = useRef(false);
  const startX = useRef<number | null>(null);
  const dir = rtl ? -1 : 1;

  // place every card according to its depth in the stack
  const layout = useCallback(
    (frontIdx: number, animate: boolean) => {
      const cards = root.current?.querySelectorAll<HTMLElement>(".deck-card");
      cards?.forEach((el, i) => {
        const depth = (i - frontIdx + slides.length) % slides.length;
        const vars = {
          x: depth * 18 * dir,
          y: depth * -14,
          rotate: depth * 4 * dir,
          scale: 1 - depth * 0.06,
          autoAlpha: depth > 2 ? 0 : 1,
          zIndex: 10 - depth,
        };
        if (animate) gsap.to(el, { ...vars, duration: 0.75, ease: "power3.out" });
        else gsap.set(el, vars);
      });
    },
    [slides.length, dir],
  );

  useGSAP(() => layout(0, false), { scope: root });

  const go = useCallback(
    (step: 1 | -1) => {
      if (busy.current) return;
      busy.current = true;
      const cards = root.current!.querySelectorAll<HTMLElement>(".deck-card");
      const next = (front + step + slides.length) % slides.length;
      if (step === 1) {
        // throw the front card away, then tuck it in at the back
        gsap.to(cards[front], {
          x: `${-110 * dir}%`,
          rotate: -14 * dir,
          duration: 0.45,
          ease: "power2.in",
          onComplete: () => {
            setFront(next);
            layout(next, true);
            gsap.delayedCall(0.6, () => (busy.current = false));
          },
        });
      } else {
        setFront(next);
        gsap.fromTo(cards[next], { x: `${-110 * dir}%`, rotate: -14 * dir }, { x: 0, rotate: 0, duration: 0.6, ease: "power3.out" });
        layout(next, true);
        gsap.delayedCall(0.6, () => (busy.current = false));
      }
    },
    [front, slides.length, dir, layout],
  );

  // auto-advance while visible (not for reduced-motion users)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = root.current!;
    const io = new IntersectionObserver(([e]) => (inView.current = e.isIntersecting));
    io.observe(el);
    const id = window.setInterval(() => {
      if (inView.current && !paused.current && !document.hidden) go(1);
    }, interval);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, [go, interval]);

  return (
    <div>
      <div
        ref={root}
        className="relative aspect-[4/5] w-full cursor-pointer select-none"
        style={{ touchAction: "pan-y" }}
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) < 40) go(1);
          else go(dx * dir < 0 ? 1 : -1);
        }}
        role="group"
        aria-roledescription="carousel"
      >
        {slides.map((s, i) => (
          <div
            key={i}
            className="deck-card absolute inset-0 overflow-hidden rounded-[2.25rem] shadow-[0_40px_80px_-30px_rgba(8,29,60,0.6)] ring-8 ring-white/40 will-change-transform"
            style={{ background: s.bg ?? "#fff" }}
            aria-hidden={i !== front}
          >
            <Image
              src={s.src}
              alt={s.alt}
              placeholder="blur"
              sizes="(min-width: 1024px) 26rem, 86vw"
              draggable={false}
              className={clsx(
                "pointer-events-none absolute inset-0 h-full w-full",
                s.fit === "contain" ? "scale-[1.12] object-contain" : "object-cover",
              )}
              style={
                s.fit === "contain"
                  ? {
                      maskImage: "linear-gradient(180deg, transparent 27%, #000 31%, #000 69%, transparent 73%)",
                      WebkitMaskImage: "linear-gradient(180deg, transparent 27%, #000 31%, #000 69%, transparent 73%)",
                    }
                  : undefined
              }
            />
          </div>
        ))}
      </div>

      {/* caption + dots */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <span className="min-w-0 truncate rounded-full bg-white/85 px-4 py-1.5 text-sm font-extrabold text-navy shadow-md shadow-navy/10">
          {slides[front].label}
        </span>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <span
              key={i}
              className={clsx("h-2 rounded-full transition-all duration-500", i === front ? "w-6 bg-white" : "w-2 bg-white/50")}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label={nextLabel}
          className="grid size-10 place-items-center rounded-full bg-navy text-white shadow-lg shadow-navy/25 transition-transform duration-300 hover:scale-110"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="rtl:-scale-x-100">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
