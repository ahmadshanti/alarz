// Shared content types. These mirror the CMS collections we will create later
// (Payload CMS), so swapping the static data for the CMS is a change in
// src/lib/cms.ts only — components never import the data files directly.

export type Locale = "ar" | "en";

export type Localized = Record<Locale, string>;

export type CategoryId = "single" | "family" | "occasion";

export interface Category {
  id: CategoryId;
  name: Localized;
  tagline: Localized;
  order: number;
}

export interface FlavorColors {
  /** Main cream colour of the flavour */
  base: string;
  /** Darker accent (sauce, chunks, packaging stripe) */
  accent: string;
}

export interface Product {
  id: string;
  category: CategoryId;
  /** Product line, e.g. "Charms" */
  line: Localized;
  /** Flavour, when the product line has several */
  flavor?: Localized;
  /** Size label, e.g. "4.5 L" */
  size?: Localized;
  colors: FlavorColors;
  featured?: boolean;
  order: number;
}

export interface Milestone {
  id: string;
  year: string;
  title: Localized;
  body: Localized;
}

export interface NewsItem {
  id: string;
  date: string; // ISO date
  title: Localized;
  excerpt: Localized;
  source: Localized;
  url?: string;
}

export interface QualityItem {
  id: string;
  icon: "lab" | "shield" | "badge" | "flask";
  title: Localized;
  body: Localized;
  year?: string;
}

export interface HeroFlavor {
  id: string;
  name: Localized;
  colors: FlavorColors;
}

export interface SiteSettings {
  phones: string[];
  email?: string;
  address: Localized;
  poBox: Localized;
  socials: { facebook?: string; instagram?: string };
  foundedYear: number;
  monthlyCapacityLiters: number;
}
