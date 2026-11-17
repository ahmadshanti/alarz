/**
 * Content access layer.
 *
 * Every page/component reads content through these functions only.
 * Today they return the static data in src/content; when Payload CMS is added,
 * replace the bodies with Payload Local API calls, e.g.
 *
 *   const payload = await getPayload({ config });
 *   const { docs } = await payload.find({ collection: "products", locale, sort: "order" });
 *
 * Component code does not need to change.
 */
import { categories, products } from "@/content/products";
import { heroFlavors, milestones, news, qualityItems, siteSettings } from "@/content/company";
import type { CategoryId } from "@/content/types";

export async function getCategories() {
  return [...categories].sort((a, b) => a.order - b.order);
}

export async function getProducts(category?: CategoryId) {
  return products
    .filter((p) => !category || p.category === category)
    .sort((a, b) => a.order - b.order);
}

export async function getFeaturedProducts() {
  return products.filter((p) => p.featured);
}

export async function getMilestones() {
  return milestones;
}

export async function getQualityItems() {
  return qualityItems;
}

export async function getNews(limit = 3) {
  return [...news].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export async function getHeroFlavors() {
  return heroFlavors;
}

export async function getSiteSettings() {
  return siteSettings;
}
