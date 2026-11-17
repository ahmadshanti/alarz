import type { Locale } from "@/content/types";

export const locales: Locale[] = ["ar", "en"];
export const defaultLocale: Locale = "ar";

export function isLocale(value: string): value is Locale {
  return (locales as string[]).includes(value);
}

export function dirFor(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Arabic-Indic digits for Arabic UI, Latin digits for English */
export function formatNumber(n: number, locale: Locale, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", opts).format(n);
}

export function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
