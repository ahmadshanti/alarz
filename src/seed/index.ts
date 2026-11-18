/**
 * Imports the static content in src/content into the CMS database.
 *
 *   npm run seed            → only if no products exist yet
 *   npm run seed -- --force → wipes the CONTENT collections first and re-imports
 *                             (users, media and messages are never touched)
 *
 * Each document is created in Arabic, then updated with its English text.
 * Note: `payload run` exits as soon as this module finishes evaluating, so everything
 * runs under top-level await and logs with console.log (payload.logger output is cut off).
 */
import { getPayload } from "payload";
import config from "../payload.config";
import { categories, products } from "../content/products";
import { charmsFlavors, milestones, news, qualityItems, siteSettings } from "../content/company";
import type { CategoryId } from "../content/types";

const force = process.argv.includes("--force");
const context = { disableRevalidate: true };
const CONTENT = ["products", "categories", "milestones", "quality-items", "news"] as const;

async function seed() {
  const payload = await getPayload({ config });

  const { totalDocs } = await payload.count({ collection: "products" });
  if (totalDocs > 0 && !force) {
    console.log(`[seed] ${totalDocs} products already exist — skipping. Use "npm run seed -- --force" to re-import.`);
    return;
  }

  if (force) {
    for (const collection of CONTENT) {
      const res = await payload.delete({ collection, where: { id: { exists: true } }, context });
      console.log(`[seed] cleared ${collection} (${res.docs.length})`);
    }
  }

  // Categories
  const categoryIds = {} as Record<CategoryId, number>;
  for (const c of categories) {
    const doc = await payload.create({
      collection: "categories",
      locale: "ar",
      data: { key: c.id, name: c.name.ar, tagline: c.tagline.ar, order: c.order },
      context,
    });
    await payload.update({
      collection: "categories",
      id: doc.id,
      locale: "en",
      data: { name: c.name.en, tagline: c.tagline.en },
      context,
    });
    categoryIds[c.id] = doc.id;
  }
  console.log(`[seed] categories: ${categories.length}`);

  // Products
  for (const p of products) {
    const doc = await payload.create({
      collection: "products",
      locale: "ar",
      data: {
        line: p.line.ar,
        ...(p.flavor ? { flavor: p.flavor.ar } : {}),
        ...(p.size ? { size: p.size.ar } : {}),
        category: categoryIds[p.category],
        colors: { base: p.colors.base, accent: p.colors.accent },
        featured: Boolean(p.featured),
        published: true,
        order: p.order,
      },
      context,
    });
    await payload.update({
      collection: "products",
      id: doc.id,
      locale: "en",
      data: {
        line: p.line.en,
        ...(p.flavor ? { flavor: p.flavor.en } : {}),
        ...(p.size ? { size: p.size.en } : {}),
      },
      context,
    });
  }
  console.log(`[seed] products: ${products.length}`);

  // Milestones
  for (const [i, m] of milestones.entries()) {
    const doc = await payload.create({
      collection: "milestones",
      locale: "ar",
      data: { year: m.year, title: m.title.ar, body: m.body.ar, order: i + 1 },
      context,
    });
    await payload.update({
      collection: "milestones",
      id: doc.id,
      locale: "en",
      data: { title: m.title.en, body: m.body.en },
      context,
    });
  }
  console.log(`[seed] milestones: ${milestones.length}`);

  // Quality items
  for (const [i, q] of qualityItems.entries()) {
    const doc = await payload.create({
      collection: "quality-items",
      locale: "ar",
      data: { icon: q.icon, year: q.year, title: q.title.ar, body: q.body.ar, order: i + 1 },
      context,
    });
    await payload.update({
      collection: "quality-items",
      id: doc.id,
      locale: "en",
      data: { title: q.title.en, body: q.body.en },
      context,
    });
  }
  console.log(`[seed] quality items: ${qualityItems.length}`);

  // News
  for (const n of news) {
    const doc = await payload.create({
      collection: "news",
      locale: "ar",
      data: {
        title: n.title.ar,
        excerpt: n.excerpt.ar,
        source: n.source.ar,
        url: n.url,
        date: new Date(n.date).toISOString(),
        published: true,
      },
      context,
    });
    await payload.update({
      collection: "news",
      id: doc.id,
      locale: "en",
      data: { title: n.title.en, excerpt: n.excerpt.en, source: n.source.en },
      context,
    });
  }
  console.log(`[seed] news: ${news.length}`);

  // Homepage global — array rows: write ar, then reuse the row ids for en
  const home = await payload.updateGlobal({
    slug: "homepage",
    locale: "ar",
    data: {
      charmsFlavors: charmsFlavors.map((f) => ({ key: f.id, name: f.name.ar, pack: f.pack, packDeep: f.packDeep })),
    },
    context,
  });
  const rowIds = (home.charmsFlavors ?? []).map((r) => r.id);
  await payload.updateGlobal({
    slug: "homepage",
    locale: "en",
    data: {
      charmsFlavors: charmsFlavors.map((f, i) => ({
        id: rowIds[i],
        key: f.id,
        name: f.name.en,
        pack: f.pack,
        packDeep: f.packDeep,
      })),
    },
    context,
  });
  console.log(`[seed] homepage: ${charmsFlavors.length} Charms flavours`);

  // Site settings global
  const settings = await payload.updateGlobal({
    slug: "site-settings",
    locale: "ar",
    data: {
      phones: siteSettings.phones.map((number) => ({ number })),
      email: siteSettings.email,
      address: siteSettings.address.ar,
      poBox: siteSettings.poBox.ar,
      facebook: siteSettings.socials.facebook,
      instagram: siteSettings.socials.instagram,
      foundedYear: siteSettings.foundedYear,
      monthlyCapacityLiters: siteSettings.monthlyCapacityLiters,
    },
    context,
  });
  await payload.updateGlobal({
    slug: "site-settings",
    locale: "en",
    data: {
      phones: (settings.phones ?? []).map((p) => ({ id: p.id, number: p.number })),
      address: siteSettings.address.en,
      poBox: siteSettings.poBox.en,
    },
    context,
  });
  console.log("[seed] site settings");

  console.log("[seed] done ✔");
}

try {
  await seed();
} catch (err) {
  console.error("[seed] failed:", err);
  process.exitCode = 1;
}
