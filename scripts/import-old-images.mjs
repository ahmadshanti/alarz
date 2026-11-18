#!/usr/bin/env node
/**
 * Import product photos from the old alarz.ps website into the new Payload admin.
 * No dependencies — needs Node 18+ only.
 *
 * For every product on the old site it:
 *   1. downloads the photo (tries a larger version first, then the "-small" one),
 *   2. uploads it to the Media library with Arabic alt text,
 *   3. links it to the matching product in the database.
 * Products that already have an image are skipped (use --force to replace).
 *
 * Usage (keep `npm run dev` running in another terminal):
 *   node scripts/import-old-images.mjs --dry-run
 *   node scripts/import-old-images.mjs
 * Options: --api http://localhost:3000   --old https://alarz.ps/ar/   --force
 * Login: asks for email/password, or set ALARZ_EMAIL / ALARZ_PASSWORD.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout, env, argv, exit } from "node:process";
import path from "node:path";

const OLD_PRODUCTS = [
  ["img/products/impuls/c-almonds-small.png", "تشارمز", "لوز"],
  ["img/products/impuls/c-strawberry-small.png", "تشارمز", "الفراولة والشوكولاتة البيضاء"],
  ["img/products/impuls/c-chocolate-small-2.png", "تشارمز", "كوكيز وكريم"],
  ["img/products/impuls/c-cookies-small.png", "تشارمز", "شوكولاتة"],
  ["img/products/takehome/Arz-cream-(Strawberry-Cheesecake)-Small.png", "أرز كريم", "تشيزكيك الفراولة"],
  ["img/products/takehome/A-caramel-small.png", "أرز كريم", "كراميل بالقرفة"],
  ["img/products/impuls/summer-small.png", "سمر", ""],
  ["img/products/impuls/Captain-(strawberry-cheesecake) Small.png", "كابتن", "تشيزكيك الفراولة"],
  ["img/products/impuls/c-caramel-small.png", "كابتن", "كراميل"],
  ["img/products/impuls/captain-chocolate-small.png", "كابتن", "شوكولاتة"],
  ["img/products/impuls/c-vanilla-small.png", "كابتن", "فانيلا"],
  ["img/products/impuls/ya-lail-small.png", "يا ليل", "المستكة العربية"],
  ["img/products/impuls/Tertufo-Small.png", "ترتوفو", ""],
  ["img/products/impuls/Twin-Small.png", "توين", ""],
  ["img/products/impuls/Viki-Small.png", "فيكي", ""],
  ["img/products/impuls/Daymeh-Small.png", "دايمة", ""],
  ["img/products/impuls/b-orange-small.png", "بيارة", "برتقال"],
  ["img/products/impuls/b-lemon-small.png", "بيارة", "ليمون"],
  ["img/products/impuls/Abdu-Small.png", "عبدو", ""],
  ["img/products/impuls/winny-Small.png", "ويني", "فانيلا"],
  ["img/products/impuls/winny-Choclate-small.png", "ويني", "شوكولاتة"],
  ["img/products/impuls/Freshy-Small.png", "فريشي", ""],
  ["img/products/impuls/Lolly-up-Small.png", "لولي أب", ""],
  ["img/products/impuls/Frula-small.png", "فرولا", ""],
  ["img/products/impuls/Icy-Small.png", "آيسي", ""],
  ["img/products/takehome/c-chocolate-Small.png", "قطع تشارمز", "شوكولاتة"],
  ["img/products/takehome/c-hazelnut-Small.png", "قطع تشارمز", "بندق"],
  ["img/products/takehome/roll-pic1-small.png", "رول", "الفستق المحمص والمستكة العربية"],
  ["img/products/takehome/Strawberry-Cheesecake-small.png", "أرز بريميوم", "تشيزكيك الفراولة"],
  ["img/products/takehome/A--Caramel-small.png", "أرز بريميوم", "كراميل"],
  ["img/products/takehome/A--Cherries-small.png", "أرز بريميوم", "كرز"],
  ["img/products/takehome/A--Mocha-small.png", "أرز بريميوم", "موكا"],
  ["img/products/takehome/A--pistachio-small.png", "أرز بريميوم", "فستق حلبي"],
  ["img/products/takehome/A--Cookies-Small.png", "أرز بريميوم", "كوكيز وكريم"],
  ["img/products/Catering/s--creamy-small.png", "سكوبس", "كريمي"],
  ["img/products/takehome/s--tangy-small.png", "سكوبس", "تانجي"],
  ["img/products/Catering/s--delight-small.png", "سكوبس", "ديلايتس"],
  ["img/products/Catering/3-Scoops-small.png", "سكوبس", ""],
];

const arg = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i > -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : def;
};
const API = arg("api", "http://localhost:3000").replace(/\/$/, "");
const OLD = arg("old", "https://alarz.ps/ar/");
const DRY = argv.includes("--dry-run");
const FORCE = argv.includes("--force");

/** Normalise Arabic so small spelling differences still match. */
function norm(t) {
  return (t ?? "")
    .trim()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/&/g, "و")
    .replace(/شكلاته/g, "شوكولاته")
    .replace(/\s+/g, "");
}

function variants(p) {
  const big = p.replace(/[-\s]?(small|Small)(?=(-\d+)?\.)/, "");
  return big !== p ? [big, p] : [p];
}

async function download(p) {
  for (const candidate of variants(p)) {
    const url = new URL(candidate.split("/").map(encodeURIComponent).join("/"), OLD);
    try {
      const r = await fetch(url);
      const type = r.headers.get("content-type") ?? "";
      if (!r.ok || !type.startsWith("image/")) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > 500) return { buf, type, filename: path.basename(candidate) };
    } catch {
      /* try next */
    }
  }
  return null;
}

async function ask(question, hidden = false) {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  if (hidden) {
    rl._writeToOutput = (s) => rl.output.write(s.includes(question) ? s : "*");
  }
  const answer = await rl.question(question);
  rl.close();
  if (hidden) stdout.write("\n");
  return answer.trim();
}

const email = env.ALARZ_EMAIL || (await ask("Admin email: "));
const password = env.ALARZ_PASSWORD || (await ask("Password: ", true));

let res = await fetch(`${API}/api/users/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
}).catch(() => null);
if (!res?.ok) {
  console.error(`Login failed (${res?.status ?? "no connection"}). Check email/password and that "npm run dev" is running.`);
  exit(1);
}
const auth = { Authorization: `JWT ${(await res.json()).token}` };
console.log("✓ logged in");

res = await fetch(`${API}/api/products?limit=500&locale=ar&depth=0`, { headers: auth });
const products = (await res.json()).docs;
const index = new Map(products.map((p) => [`${norm(p.line)}|${norm(p.flavor)}`, p]));
console.log(`✓ ${products.length} products in the database\n`);

let done = 0, skipped = 0, failed = 0;
for (const [imgPath, line, flavor] of OLD_PRODUCTS) {
  const label = flavor ? `${line} – ${flavor}` : line;
  const product = index.get(`${norm(line)}|${norm(flavor)}`);
  if (!product) { console.log(`✗ no matching product in the database: ${label}`); failed++; continue; }
  if (product.image && !FORCE) { console.log(`· already has an image, skipped: ${label}`); skipped++; continue; }
  if (DRY) { console.log(`→ would import: ${label}  ←  ${imgPath}`); continue; }

  const file = await download(imgPath);
  if (!file) { console.log(`✗ could not download: ${label} (${imgPath})`); failed++; continue; }

  const form = new FormData();
  form.append("file", new Blob([file.buf], { type: file.type }), file.filename);
  form.append("_payload", JSON.stringify({ alt: label }));
  const up = await fetch(`${API}/api/media?locale=ar`, { method: "POST", headers: auth, body: form });
  if (!up.ok) { console.log(`✗ upload failed (${up.status}): ${label}`); failed++; continue; }
  const mediaId = (await up.json()).doc.id;

  const link = await fetch(`${API}/api/products/${product.id}`, {
    method: "PATCH",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ image: mediaId }),
  });
  if (!link.ok) { console.log(`✗ could not link image (${link.status}): ${label}`); failed++; continue; }
  console.log(`✓ ${label}  (${Math.round(file.buf.length / 1024)} KB, ${file.filename})`);
  done++;
}

console.log(`\nDone: ${done} imported, ${skipped} skipped, ${failed} failed.`);
if (done) console.log("⚠ Check 'تشارمز – كوكيز وكريم' and 'تشارمز – شوكولاتة' — the old site may have their photos swapped.");
