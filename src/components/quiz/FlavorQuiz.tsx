"use client";

/**
 * "What's your flavour?" quiz → a matching Al-Arz product and a shareable story image
 * (1080×1920, drawn on a canvas in the browser: nothing is uploaded anywhere).
 */
import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import type { CategoryId, FlavorColors, Locale, Localized } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatNumber } from "@/i18n/config";
import { pageHref } from "@/i18n/routes";
import ProductArt from "@/components/ui/ProductArt";
import { PROFILES, QUESTIONS, scoreAnswers, type Trait } from "./quizData";
import "./quiz.css";

export interface QuizProduct {
  id: string;
  line: Localized;
  flavor: Localized | null;
  category: CategoryId;
  colors: FlavorColors;
  image: string | null;
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });

export default function FlavorQuiz({ locale, t, products }: { locale: Locale; t: Dictionary["quiz"]; products: QuizProduct[] }) {
  const [step, setStep] = useState(-1); // -1 intro, 0..3 questions, 4 result
  const [picks, setPicks] = useState<number[]>([]);
  const [sharing, setSharing] = useState(false);
  const art = useRef<HTMLDivElement>(null);

  const trait: Trait | null = step === QUESTIONS.length ? scoreAnswers(picks) : null;
  const profile = trait ? PROFILES[trait] : null;
  const product = useMemo(() => {
    if (!profile) return null;
    const line = profile.match.line.toLowerCase();
    const flavor = profile.match.flavor?.toLowerCase();
    return (
      products.find((p) => p.line.en.toLowerCase() === line && (!flavor || p.flavor?.en.toLowerCase().includes(flavor))) ??
      products.find((p) => p.line.en.toLowerCase() === line) ??
      products[0] ??
      null
    );
  }, [profile, products]);

  const choose = (i: number) => {
    const next = [...picks.slice(0, step), i];
    setPicks(next);
    setTimeout(() => setStep((s) => s + 1), 220); // let the pick animate first
  };
  const restart = () => {
    setPicks([]);
    setStep(0);
  };

  /* ---------- story image ---------- */
  const shareStory = async () => {
    if (!profile || !product) return;
    setSharing(true);
    try {
      const W = 1080,
        H = 1920;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const g = c.getContext("2d")!;
      const font = getComputedStyle(document.body).fontFamily;
      const bg = g.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, profile.colors[0]);
      bg.addColorStop(1, profile.colors[1]);
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);
      // soft light behind the product
      const glow = g.createRadialGradient(W / 2, 820, 40, W / 2, 820, 520);
      glow.addColorStop(0, "rgba(255,255,255,0.55)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = glow;
      g.fillRect(0, 0, W, H);
      // logo card
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.roundRect(W / 2 - 190, 110, 380, 170, 48);
      g.fill();
      const logo = await loadImage("/logo.svg");
      g.drawImage(logo, W / 2 - 160, 128, 320, 134);
      // product visual: uploaded photo, or the illustration shown on the page
      let visual: HTMLImageElement | null = null;
      if (product.image) visual = await loadImage(product.image).catch(() => null);
      if (!visual) {
        const svg = art.current?.querySelector("svg");
        if (svg) {
          const xml = new XMLSerializer().serializeToString(svg);
          visual = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`).catch(() => null);
        }
      }
      if (visual) {
        const size = 760;
        const ratio = (visual.naturalWidth || 1) / (visual.naturalHeight || 1);
        const w = ratio >= 1 ? size : size * ratio,
          h = ratio >= 1 ? size / ratio : size;
        g.drawImage(visual, (W - w) / 2, 820 - h / 2, w, h);
      }
      // text
      g.direction = locale === "ar" ? "rtl" : "ltr";
      g.textAlign = "center";
      g.fillStyle = "#ffffff";
      g.shadowColor = "rgba(0,0,0,0.25)";
      g.shadowBlur = 18;
      g.font = `700 46px ${font}`;
      g.fillText(t.storyKicker, W / 2, 1300);
      g.font = `900 96px ${font}`;
      g.fillText(profile.title[locale], W / 2, 1420, W - 120);
      g.shadowBlur = 0;
      g.font = `600 44px ${font}`;
      const words = profile.blurb[locale].split(" ");
      let line = "",
        y = 1530;
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (g.measureText(test).width > W - 200 && line) {
          g.fillText(line, W / 2, y);
          line = w;
          y += 64;
        } else line = test;
      }
      if (line) g.fillText(line, W / 2, y);
      // call to action
      g.fillStyle = "rgba(8,29,60,0.75)";
      g.beginPath();
      g.roundRect(W / 2 - 360, H - 190, 720, 100, 50);
      g.fill();
      g.fillStyle = "#FEB258";
      g.font = `800 40px ${font}`;
      g.fillText(t.storyCta, W / 2, H - 126);

      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", 0.9));
      if (!blob) return;
      const file = new File([blob], "alarz-flavour.jpg", { type: "image/jpeg" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: profile.title[locale], text: `${profile.title[locale]} ${t.storyCta}` });
          return;
        } catch {
          /* cancelled: fall back to download */
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "alarz-flavour.jpg";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } finally {
      setSharing(false);
    }
  };

  /* ---------- views ---------- */
  if (step === -1) {
    return (
      <div className="qz-card qz-intro">
        <div className="qz-emojis" aria-hidden>
          {["🍫", "🌰", "🍓", "🍋", "🍪", "🌿"].map((e, i) => (
            <span key={e} style={{ "--i": i } as React.CSSProperties}>
              {e}
            </span>
          ))}
        </div>
        <h2 className="text-balance text-3xl font-black text-navy md:text-4xl">{t.introTitle}</h2>
        <p className="mx-auto max-w-md text-lg text-navy-ink/65">{t.introBody}</p>
        <button type="button" onClick={() => setStep(0)} className="btn btn-primary mx-auto">
          {t.start}
        </button>
      </div>
    );
  }

  if (step < QUESTIONS.length) {
    const q = QUESTIONS[step];
    return (
      <div className="qz-card" key={step}>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-black text-orange-deep">
            {formatNumber(step + 1, locale)} / {formatNumber(QUESTIONS.length, locale)}
          </span>
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="text-sm font-bold text-navy/55 hover:text-navy">
              {t.back}
            </button>
          )}
        </div>
        <div className="qz-progress" aria-hidden>
          <span style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
        </div>
        <h2 className="qz-q text-balance text-3xl font-black text-navy md:text-4xl">{q.title[locale]}</h2>
        <div className="qz-answers" role="radiogroup" aria-label={q.title[locale]}>
          {q.answers.map((a, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={picks[step] === i}
              onClick={() => choose(i)}
              className={clsx("qz-answer", picks[step] === i && "is-picked")}
              style={{ "--i": i } as React.CSSProperties}
            >
              <span className="qz-answer__emoji" aria-hidden>
                {a.emoji}
              </span>
              <span className="font-extrabold">{a.label[locale]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="qz-card qz-result" style={{ "--c1": profile!.colors[0], "--c2": profile!.colors[1] } as React.CSSProperties}>
      <div className="qz-confetti" aria-hidden>
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
      <p className="eyebrow justify-center">{t.resultKicker}</p>
      <div ref={art} className="qz-visual">
        {product?.image ? (
          <Image src={product.image} alt={product.line[locale]} width={360} height={360} className="h-full w-auto object-contain" />
        ) : product ? (
          <ProductArt id={`qz-${product.id}`} category={product.category} colors={product.colors} className="h-full w-auto" />
        ) : null}
      </div>
      <h2 className="text-balance text-4xl font-black text-navy md:text-5xl">{profile!.title[locale]}</h2>
      <p className="mx-auto max-w-lg text-lg text-navy-ink/70">{profile!.blurb[locale]}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={shareStory} disabled={sharing} className="btn btn-primary">
          {sharing ? t.preparing : t.share}
        </button>
        <Link href={pageHref(locale, "stores")} className="btn btn-ghost">
          {t.whereToBuy}
        </Link>
      </div>
      <button type="button" onClick={restart} className="mx-auto text-sm font-bold text-navy/55 underline-offset-4 hover:text-navy hover:underline">
        {t.again}
      </button>
    </div>
  );
}
