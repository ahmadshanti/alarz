import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/content/types";
import { isLocale } from "./config";
import { getDictionary } from "./dictionaries";
import type { PageKey } from "./routes";

/** Validates the [locale] param of a page (404 for anything but ar/en). */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

/** <title>, description and hreflang links for an inner page. */
export async function pageMetadata(params: Promise<{ locale: string }>, key: PageKey): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const p = getDictionary(locale).pages[key];
  return {
    title: p.title,
    description: p.intro,
    alternates: { languages: { ar: `/ar/${key}`, en: `/en/${key}` } },
    openGraph: { title: p.title, description: p.intro, locale },
  };
}
