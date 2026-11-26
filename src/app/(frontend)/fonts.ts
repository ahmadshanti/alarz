/**
 * Cairo, self-hosted through next/font: the files are preloaded and a metric-matched fallback
 * is generated, so text doesn't jump when the web font arrives (it did on /en before: CLS ~0.1).
 *
 * Cairo ships as two subsets. The stack must be  Latin → Arabic → (one) fallback:
 * if a fallback (Arial, which has Arabic glyphs) came right after the Latin face, Arabic
 * characters would render in Arial and never reach Cairo Arabic.
 */
import localFont from "next/font/local";

const cairoArabic = localFont({
  src: "../../assets/fonts/cairo-arabic-wght-normal.woff2",
  weight: "200 1000",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Arial",
});

const cairoLatin = localFont({
  src: "../../assets/fonts/cairo-latin-wght-normal.woff2",
  weight: "200 1000",
  style: "normal",
  display: "swap",
  adjustFontFallback: false,
});

const [arabicFace, arabicFallback] = cairoArabic.style.fontFamily.split(",").map((s) => s.trim());
const [latinFace] = cairoLatin.style.fontFamily.split(",").map((s) => s.trim());

/** Value for --font-sans (set on <html>). */
export const cairoStack = [latinFace, arabicFace, arabicFallback, "system-ui", "sans-serif"].filter(Boolean).join(", ");
