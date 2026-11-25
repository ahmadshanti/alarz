/**
 * Imports food shops in Palestine (West Bank + Gaza) from OpenStreetMap into the
 * "points-of-sale" collection, for the "where to buy" map.
 *
 *   npm run stores:import
 *
 * - Only adds shops that are not in the database yet (matched by OSM id), so it is safe to
 *   re-run later to pick up new shops; points the company edited or hid are never touched.
 * - Shops whose name is only in Hebrew (settlements) are skipped.
 * - Data © OpenStreetMap contributors (ODbL) — the map shows the attribution.
 * `payload run` exits when this module finishes, hence top-level await + console.log.
 */
import { getPayload } from "payload";
import config from "../payload.config";

const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
// OSM boundary relations: West Bank, Gaza Strip
const AREAS = [
  { name: "West Bank", rel: 1613659 },
  { name: "Gaza Strip", rel: 1473938 },
];
const SHOP_TYPES: Record<string, "supermarket" | "minimarket" | "mall"> = {
  supermarket: "supermarket",
  wholesale: "supermarket",
  mall: "mall",
  department_store: "mall",
  convenience: "minimarket",
  grocery: "minimarket",
  general: "minimarket",
  variety_store: "minimarket",
  greengrocer: "minimarket",
  frozen_food: "minimarket",
  dairy: "minimarket",
  food: "minimarket",
};
const GENERIC_NAME = { supermarket: "سوبر ماركت", minimarket: "ميني ماركت", mall: "مركز تجاري" } as const;

interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

async function overpass(query: string): Promise<OsmElement[]> {
  let lastError = "";
  for (let attempt = 0; attempt < 8; attempt++) {
    const endpoint = OVERPASS[attempt % OVERPASS.length];
    try {
      const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
        headers: { "User-Agent": "alarz-website-store-import/1.0" },
        signal: AbortSignal.timeout(240_000),
      });
      const text = await res.text();
      const json = JSON.parse(text) as { elements: OsmElement[] };
      return json.elements;
    } catch (err) {
      lastError = `${endpoint}: ${err instanceof Error ? err.message.slice(0, 100) : err}`;
      console.log(`[stores] overpass busy, retrying… (${attempt + 1}/8)`);
      await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
    }
  }
  throw new Error(`Overpass failed: ${lastError}`);
}

/** Names that are clearly not food shops (OSM tags are sometimes wrong). Matched shops are hidden, not deleted. */
const NOT_FOOD =
  /electronic|system|mobile|phone|computer|laptop|tech|fashion|cloth|textile|shoe|boutique|pharm|optic|furniture|hardware|tools?|cosmetic|perfume|jewel|salon|barber|print|library|bookstore|stationery|toy|car|auto|tyre|tire|الكترون|إلكترون|موبايل|جوال|خلوي|كمبيوتر|حاسوب|ملابس|ألبسة|البسة|أحذية|احذية|صيدلي|بصريات|اثاث|أثاث|عطور|مجوهرات|صالون|حلاق|مكتبة|قرطاسية|ألعاب|العاب|سيارات|اطارات|إطارات/i;

/** …unless the name also says it sells food (e.g. "ميني ماركت الجوال", "Golden Market"). */
const FOOD_WORD = /market|mart|super|grocer|food|mini|mall|hyper|بقال|ماركت|سوبر|تموين|مول|غذائي|مواد غذائية|هايبر|مخبز|حلويات|ألبان|البان/i;
const isNotFood = (name: string) => NOT_FOOD.test(name) && !FOOD_WORD.test(name);

const HEBREW = /[֐-׿]/;
const ARABIC = /[؀-ۿ]/;

async function run() {
  const payload = await getPayload({ config });

  const existing = await payload.find({
    collection: "points-of-sale",
    limit: 0,
    pagination: false,
    depth: 0,
    select: { osmId: true },
  });
  const known = new Set(existing.docs.map((d) => d.osmId).filter(Boolean));
  console.log(`[stores] ${existing.docs.length} points already in the database`);

  const typeRegex = Object.keys(SHOP_TYPES).join("|");
  const rows: Array<{
    osmId: string;
    name: string;
    nameEn?: string;
    type: "supermarket" | "minimarket" | "mall";
    city?: string;
    address?: string;
    phone?: string;
    lat: number;
    lng: number;
  }> = [];
  let skippedHebrew = 0,
    skippedNotFood = 0;

  for (const area of AREAS) {
    const elements = await overpass(
      `[out:json][timeout:200];area(${3600000000 + area.rel})->.a;nwr["shop"~"^(${typeRegex})$"](area.a);out center tags;`,
    );
    console.log(`[stores] ${area.name}: ${elements.length} shops from OpenStreetMap`);
    for (const el of elements) {
      const t = el.tags ?? {};
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (lat == null || lng == null) continue;
      const nameAr = t["name:ar"] || (t.name && ARABIC.test(t.name) ? t.name : "");
      const anyName = t.name || t["name:ar"] || t["name:en"] || "";
      if (anyName && HEBREW.test(anyName) && !nameAr) {
        skippedHebrew++;
        continue;
      }
      if (isNotFood(`${t.name ?? ""} ${t["name:ar"] ?? ""} ${t["name:en"] ?? ""}`)) {
        skippedNotFood++;
        continue;
      }
      const type = SHOP_TYPES[t.shop] ?? "minimarket";
      const osmId = `${el.type}/${el.id}`;
      if (known.has(osmId)) continue;
      known.add(osmId);
      rows.push({
        osmId,
        name: nameAr || anyName || GENERIC_NAME[type],
        nameEn: t["name:en"] || (t.name && !ARABIC.test(t.name) ? t.name : undefined),
        type,
        city: t["addr:city:ar"] || t["addr:city"] || undefined,
        address: [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ") || undefined,
        phone: t.phone || t["contact:phone"] || undefined,
        lat,
        lng,
      });
    }
  }
  console.log(
    `[stores] ${rows.length} new points to add (skipped: ${skippedHebrew} Hebrew-only names, ${skippedNotFood} non-food shops)`,
  );

  // create in small parallel batches (Neon round-trips dominate)
  let added = 0,
    failed = 0;
  const BATCH = 8;
  for (let i = 0; i < rows.length; i += BATCH) {
    const results = await Promise.allSettled(
      rows.slice(i, i + BATCH).map((data) =>
        payload.create({
          collection: "points-of-sale",
          data: { ...data, source: "osm", active: true, featured: false },
          context: { disableRevalidate: true },
        }),
      ),
    );
    for (const r of results) {
      if (r.status === "fulfilled") added++;
      else {
        failed++;
        if (failed <= 5) console.log(`[stores] ✗ ${r.reason instanceof Error ? r.reason.message : r.reason}`);
      }
    }
    if ((i / BATCH) % 50 === 0) console.log(`[stores] … ${added}/${rows.length}`);
  }
  console.log(`[stores] done — added ${added}, failed ${failed}`);

  // Hide imported points whose name says they are not a food shop (from earlier imports too).
  const all = await payload.find({
    collection: "points-of-sale",
    where: { and: [{ source: { equals: "osm" } }, { active: { equals: true } }] },
    limit: 0,
    pagination: false,
    depth: 0,
    select: { name: true, nameEn: true },
  });
  const bad = all.docs.filter((d) => isNotFood(`${d.name ?? ""} ${d.nameEn ?? ""}`));
  for (const d of bad) {
    await payload.update({ collection: "points-of-sale", id: d.id, data: { active: false }, context: { disableRevalidate: true } });
  }
  console.log(`[stores] hidden ${bad.length} non-food points (set "active" off — restore any from /admin)`);
  if (failed) process.exitCode = 1;
}

try {
  await run();
} catch (err) {
  console.error("[stores] failed:", err);
  process.exitCode = 1;
}
