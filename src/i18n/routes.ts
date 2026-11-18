import type { Locale } from "@/content/types";

/** Site pages (besides the home page). The key doubles as the URL segment and the nav label key. */
export const pageKeys = ["story", "products", "quality", "news", "contact"] as const;
export type PageKey = (typeof pageKeys)[number];

export function pageHref(locale: Locale, page?: PageKey) {
  return page ? `/${locale}/${page}` : `/${locale}`;
}

/** Same page in the other language (keeps the current sub-path). */
export function switchLocaleHref(pathname: string, to: Locale) {
  return pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${to}`) || `/${to}`;
}
