/**
 * Content access layer.
 *
 * Every page/component reads content through these functions only. They read from
 * Payload CMS (Postgres) through the Local API, and fall back to the static data in
 * src/content when DATABASE_URL is missing, the database is empty, or a query throws —
 * so the public site never breaks because of the CMS.
 *
 * Function names and return types are unchanged from the static version, so no
 * component had to change.
 */
import "server-only";
import { cache } from "react";
import type { Payload } from "payload";

import { categories as staticCategories, products as staticProducts } from "@/content/products";
import {
  charmsFlavors as staticCharmsFlavors,
  milestones as staticMilestones,
  news as staticNews,
  qualityItems as staticQualityItems,
  siteSettings as staticSiteSettings,
} from "@/content/company";
import type {
  Category,
  CategoryId,
  CharmsFlavor,
  CmsImage,
  Localized,
  Milestone,
  NewsItem,
  Product,
  QualityItem,
  SiteSettings,
} from "@/content/types";

/* ------------------------------------------------------------------ */
/* Payload client + safe query helper                                   */
/* ------------------------------------------------------------------ */

const getClient = cache(async (): Promise<Payload | null> => {
  if (!process.env.DATABASE_URL) return null;
  // Lazy: the static fallback path never loads Payload at all.
  const [{ getPayload }, { default: config }] = await Promise.all([import("payload"), import("@payload-config")]);
  return getPayload({ config });
});

async function fromCms<T>(label: string, query: (payload: Payload) => Promise<T | null>, fallback: () => T): Promise<T> {
  try {
    const payload = await getClient();
    if (!payload) return fallback();
    const result = await query(payload);
    return result ?? fallback();
  } catch (err) {
    console.error(`[cms] ${label}: using static content —`, err instanceof Error ? err.message : err);
    return fallback();
  }
}

/* ------------------------------------------------------------------ */
/* Mapping helpers (queries use locale: "all" → localized = { ar, en }) */
/* ------------------------------------------------------------------ */

type Doc = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** { ar, en } with each side falling back to the other. */
function loc(v: unknown): Localized {
  if (v && typeof v === "object") {
    const o = v as Partial<Record<"ar" | "en", unknown>>;
    const a = str(o.ar),
      e = str(o.en);
    return { ar: a || e, en: e || a };
  }
  const s = str(v);
  return { ar: s, en: s };
}

function locOptional(v: unknown): Localized | undefined {
  const l = loc(v);
  return l.ar || l.en ? l : undefined;
}

/**
 * Payload returns absolute media URLs (serverURL is set). next/image only allows our own
 * media through images.localPatterns, so turn links to our Payload media into relative paths.
 */
function toRelative(url: string) {
  try {
    const u = new URL(url, "http://x");
    return u.pathname.startsWith("/api/media/") ? u.pathname + u.search : url;
  } catch {
    return url;
  }
}

function image(v: unknown, size: "card" | "large"): CmsImage | undefined {
  if (!v || typeof v !== "object") return undefined;
  const m = v as Doc & { sizes?: Record<string, { url?: string | null; width?: number | null; height?: number | null }> };
  const sized = m.sizes?.[size];
  const sizedUrl = sized?.url ? toRelative(sized.url) : "";
  const url = sizedUrl || toRelative(str(m.url));
  if (!url) return undefined;
  return {
    url,
    alt: loc(m.alt),
    width: (sized?.url ? sized.width : (m.width as number)) || 800,
    height: (sized?.url ? sized.height : (m.height as number)) || 800,
  };
}

/* ------------------------------------------------------------------ */
/* Categories & products                                                */
/* ------------------------------------------------------------------ */

const loadCatalog = cache(async () =>
  fromCms(
    "catalog",
    async (payload) => {
      const [cats, prods] = await Promise.all([
        payload.find({ collection: "categories", locale: "all", sort: "order", limit: 100, depth: 0 }),
        payload.find({
          collection: "products",
          locale: "all",
          where: { published: { equals: true } },
          sort: "order",
          limit: 1000,
          depth: 1,
        }),
      ]);
      // An empty (not yet seeded) database → keep showing the static catalogue.
      if (cats.docs.length === 0) return null;

      const categories: Category[] = (cats.docs as unknown as Doc[]).map((c) => ({
        id: c.key as CategoryId,
        name: loc(c.name),
        tagline: loc(c.tagline),
        order: (c.order as number) ?? 0,
      }));

      const products: Product[] = (prods.docs as unknown as Doc[]).flatMap((p) => {
        const cat = p.category as Doc | null;
        if (!cat || typeof cat !== "object" || !cat.key) return [];
        const colors = (p.colors ?? {}) as Doc;
        return [
          {
            id: String(p.id),
            category: cat.key as CategoryId,
            line: loc(p.line),
            flavor: locOptional(p.flavor),
            size: locOptional(p.size),
            colors: { base: str(colors.base) || "#FEB258", accent: str(colors.accent) || "#194E91" },
            image: image(p.image, "card"),
            featured: Boolean(p.featured),
            order: (p.order as number) ?? 0,
          },
        ];
      });

      return { categories, products };
    },
    () => ({ categories: staticCategories, products: staticProducts }),
  ),
);

export async function getCategories() {
  const { categories } = await loadCatalog();
  return [...categories].sort((a, b) => a.order - b.order);
}

export async function getProducts(category?: CategoryId) {
  const { products } = await loadCatalog();
  return products.filter((p) => !category || p.category === category).sort((a, b) => a.order - b.order);
}

export async function getFeaturedProducts() {
  const { products } = await loadCatalog();
  return products.filter((p) => p.featured);
}

/* ------------------------------------------------------------------ */
/* Story, quality, news                                                 */
/* ------------------------------------------------------------------ */

export const getMilestones = cache(async (): Promise<Milestone[]> =>
  fromCms(
    "milestones",
    async (payload) => {
      const { docs } = await payload.find({ collection: "milestones", locale: "all", sort: "order", limit: 100 });
      if (docs.length === 0) return null;
      return (docs as unknown as Doc[]).map((m) => ({
        id: String(m.id),
        year: str(m.year),
        title: loc(m.title),
        body: loc(m.body),
      }));
    },
    () => staticMilestones,
  ),
);

export const getQualityItems = cache(async (): Promise<QualityItem[]> =>
  fromCms(
    "quality-items",
    async (payload) => {
      const { docs } = await payload.find({ collection: "quality-items", locale: "all", sort: "order", limit: 100 });
      if (docs.length === 0) return null;
      return (docs as unknown as Doc[]).map((q) => ({
        id: String(q.id),
        icon: (q.icon as QualityItem["icon"]) ?? "badge",
        title: loc(q.title),
        body: loc(q.body),
        year: str(q.year) || undefined,
      }));
    },
    () => staticQualityItems,
  ),
);

export async function getNews(limit = 3): Promise<NewsItem[]> {
  return fromCms(
    "news",
    async (payload) => {
      const { docs } = await payload.find({
        collection: "news",
        locale: "all",
        where: { published: { equals: true } },
        sort: "-date",
        limit,
        depth: 1,
      });
      return (docs as unknown as Doc[]).map((n) => ({
        id: String(n.id),
        date: str(n.date),
        title: loc(n.title),
        excerpt: loc(n.excerpt),
        source: loc(n.source),
        url: str(n.url) || undefined,
        cover: image(n.cover, "large"),
      }));
    },
    () => [...staticNews].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit),
  );
}

/* ------------------------------------------------------------------ */
/* Globals                                                              */
/* ------------------------------------------------------------------ */

export const getCharmsFlavors = cache(async (): Promise<CharmsFlavor[]> =>
  fromCms(
    "homepage",
    async (payload) => {
      const home = (await payload.findGlobal({ slug: "homepage", locale: "all" })) as unknown as Doc;
      const rows = (home.charmsFlavors as Doc[] | null | undefined) ?? [];
      if (rows.length === 0) return null;
      return rows.map((r) => ({
        id: str(r.key) || String(r.id),
        name: loc(r.name),
        pack: str(r.pack) || "#2a63b8",
        packDeep: str(r.packDeep) || "#143f80",
      }));
    },
    () => staticCharmsFlavors,
  ),
);

export const getSiteSettings = cache(async (): Promise<SiteSettings> =>
  fromCms(
    "site-settings",
    async (payload) => {
      const s = (await payload.findGlobal({ slug: "site-settings", locale: "all" })) as unknown as Doc;
      const fb = staticSiteSettings;
      const phones = ((s.phones as Doc[] | null) ?? []).map((p) => str(p.number)).filter(Boolean);
      const address = locOptional(s.address);
      const poBox = locOptional(s.poBox);
      // Each field falls back individually, so a half-filled global still renders fine.
      return {
        phones: phones.length ? phones : fb.phones,
        email: str(s.email) || fb.email,
        address: address ?? fb.address,
        poBox: poBox ?? fb.poBox,
        socials: {
          facebook: str(s.facebook) || fb.socials.facebook,
          instagram: str(s.instagram) || fb.socials.instagram,
        },
        foundedYear: (s.foundedYear as number) || fb.foundedYear,
        monthlyCapacityLiters: (s.monthlyCapacityLiters as number) || fb.monthlyCapacityLiters,
      };
    },
    () => staticSiteSettings,
  ),
);

/* ------------------------------------------------------------------ */
/* Contact form                                                         */
/* ------------------------------------------------------------------ */

export interface ContactMessage {
  name: string;
  phone: string;
  type: "general" | "distributor" | "feedback";
  message: string;
  locale: "ar" | "en";
}

/** Stores a contact-form submission in the "messages" collection. Returns false if there is no database. */
export async function saveContactMessage(data: ContactMessage): Promise<boolean> {
  const payload = await getClient();
  if (!payload) {
    console.info("[contact] no DATABASE_URL — message not stored", { ...data, message: data.message.slice(0, 200) });
    return false;
  }
  await payload.create({
    collection: "messages",
    data: { ...data, status: "new" },
    overrideAccess: true, // the public cannot create messages through the REST API
  });
  return true;
}
