import type { Category, FlavorColors, Localized, Product, CategoryId } from "./types";

// Product names are taken from the current alarz.ps product page.
// English names are provisional transliterations — confirm with the company.
// Colours are only used for the illustrations until real product photos arrive.

export const categories: Category[] = [
  {
    id: "single",
    order: 1,
    name: { ar: "حصة واحدة", en: "Single Serve" },
    tagline: { ar: "لكل لحظة حلوة بيومك", en: "For every sweet moment of your day" },
  },
  {
    id: "family",
    order: 2,
    name: { ar: "عبوات عائلية", en: "Family Packs" },
    tagline: { ar: "لمّة العيلة أطيب مع الآرز", en: "Family time tastes better with Al-Arz" },
  },
  {
    id: "occasion",
    order: 3,
    name: { ar: "عبوات للمناسبات", en: "Occasion Packs" },
    tagline: { ar: "لأفراحكم ومناسباتكم الكبيرة", en: "For your big celebrations" },
  },
];

const C = {
  almond: { base: "#EBCB9F", accent: "#A86F3C" },
  strawberryWhite: { base: "#F6A3B6", accent: "#FFF3E6" },
  cookies: { base: "#F1ECE4", accent: "#3A2A24" },
  chocolate: { base: "#7A4529", accent: "#3B1E10" },
  strawberryCheesecake: { base: "#F3849B", accent: "#F4D9AE" },
  cinnamonCaramel: { base: "#DE9A4E", accent: "#8A4A1C" },
  vanilla: { base: "#F8E9B8", accent: "#E5BF5F" },
  caramel: { base: "#E4A452", accent: "#9C5B1F" },
  mastic: { base: "#F5F2E7", accent: "#BCCDA5" },
  orange: { base: "#FFA040", accent: "#F26A00" },
  lemon: { base: "#F7E565", accent: "#B9CC3F" },
  cherry: { base: "#C9283F", accent: "#740B1C" },
  mocha: { base: "#946143", accent: "#4B2C1C" },
  pistachio: { base: "#B8D27E", accent: "#6A8A38" },
  hazelnut: { base: "#BC8956", accent: "#6A4322" },
  mango: { base: "#FFC15A", accent: "#F28C1B" },
  mint: { base: "#A6E6CF", accent: "#3E9C7C" },
  raspberry: { base: "#EA4D81", accent: "#9E1747" },
  icy: { base: "#9AD8F5", accent: "#2C7FB8" },
  brand: { base: "#FEB258", accent: "#194E91" },
} satisfies Record<string, FlavorColors>;

const F = {
  almond: { ar: "لوز", en: "Almond" },
  strawberryWhite: { ar: "الفراولة والشوكولاتة البيضاء", en: "Strawberry & White Chocolate" },
  cookies: { ar: "كوكيز وكريم", en: "Cookies & Cream" },
  chocolate: { ar: "شوكولاتة", en: "Chocolate" },
  strawberryCheesecake: { ar: "تشيزكيك الفراولة", en: "Strawberry Cheesecake" },
  cinnamonCaramel: { ar: "كراميل بالقرفة", en: "Cinnamon Caramel" },
  caramel: { ar: "كراميل", en: "Caramel" },
  vanilla: { ar: "فانيلا", en: "Vanilla" },
  mastic: { ar: "المستكة العربية", en: "Arabic Mastic" },
  orange: { ar: "برتقال", en: "Orange" },
  lemon: { ar: "ليمون", en: "Lemon" },
  hazelnut: { ar: "بندق", en: "Hazelnut" },
  pistachioMastic: { ar: "الفستق المحمص والمستكة العربية", en: "Roasted Pistachio & Arabic Mastic" },
  cherry: { ar: "كرز", en: "Cherry" },
  mocha: { ar: "موكا", en: "Mocha" },
  pistachio: { ar: "فستق حلبي", en: "Aleppo Pistachio" },
  creamy: { ar: "كريمي", en: "Creamy" },
  tangy: { ar: "تانجي", en: "Tangy" },
  delights: { ar: "ديلايتس", en: "Delights" },
} satisfies Record<string, Localized>;

const L = {
  charms: { ar: "تشارمز", en: "Charms" },
  arzCream: { ar: "أرز كريم", en: "Arz Cream" },
  summer: { ar: "سمر", en: "Summer" },
  captain: { ar: "كابتن", en: "Captain" },
  yaLeil: { ar: "يا ليل", en: "Ya Leil" },
  tartufo: { ar: "ترتوفو", en: "Tartufo" },
  twin: { ar: "توين", en: "Twin" },
  vicky: { ar: "فيكي", en: "Vicky" },
  dayma: { ar: "دايمة", en: "Dayma" },
  bayyara: { ar: "بيارة", en: "Bayyara" },
  abdo: { ar: "عبدو", en: "Abdo" },
  winnie: { ar: "ويني", en: "Winnie" },
  freshy: { ar: "فريشي", en: "Freshy" },
  lollyUp: { ar: "لولي أب", en: "Lolly Up" },
  frola: { ar: "فرولا", en: "Frola" },
  icy: { ar: "آيسي", en: "Icy" },
  charmsBites: { ar: "قطع تشارمز", en: "Charms Bites" },
  roll: { ar: "رول", en: "Roll" },
  arzPremium: { ar: "أرز بريميوم", en: "Arz Premium" },
  scoops: { ar: "سكوبس", en: "Scoops" },
} satisfies Record<string, Localized>;

type Row = [line: Localized, flavor: Localized | undefined, colors: FlavorColors, extra?: Partial<Product>];

const rows: Record<CategoryId, Row[]> = {
  single: [
    [L.charms, F.almond, C.almond, { featured: true }],
    [L.charms, F.strawberryWhite, C.strawberryWhite],
    [L.charms, F.cookies, C.cookies],
    [L.charms, F.chocolate, C.chocolate],
    [L.arzCream, F.strawberryCheesecake, C.strawberryCheesecake, { featured: true }],
    [L.arzCream, F.cinnamonCaramel, C.cinnamonCaramel],
    [L.summer, undefined, C.mango],
    [L.captain, F.strawberryCheesecake, C.strawberryCheesecake],
    [L.captain, F.caramel, C.caramel],
    [L.captain, F.chocolate, C.chocolate],
    [L.captain, F.vanilla, C.vanilla],
    [L.yaLeil, F.mastic, C.mastic, { featured: true }],
    [L.tartufo, undefined, C.chocolate],
    [L.twin, undefined, C.vanilla],
    [L.vicky, undefined, C.raspberry],
    [L.dayma, undefined, C.vanilla],
    [L.bayyara, F.orange, C.orange, { featured: true }],
    [L.bayyara, F.lemon, C.lemon],
    [L.abdo, undefined, C.brand],
    [L.winnie, F.vanilla, C.vanilla],
    [L.winnie, F.chocolate, C.chocolate],
    [L.freshy, undefined, C.mint],
    [L.lollyUp, undefined, C.raspberry],
    [L.frola, undefined, C.strawberryCheesecake],
    [L.icy, undefined, C.icy],
  ],
  family: [
    [L.charmsBites, F.chocolate, C.chocolate],
    [L.charmsBites, F.hazelnut, C.hazelnut],
    [L.roll, F.pistachioMastic, C.pistachio, { featured: true }],
    [L.arzPremium, F.strawberryCheesecake, C.strawberryCheesecake],
    [L.arzPremium, F.caramel, C.caramel],
    [L.arzPremium, F.cherry, C.cherry],
    [L.arzPremium, F.mocha, C.mocha],
    [L.arzPremium, F.pistachio, C.pistachio, { featured: true }],
    [L.arzPremium, F.cookies, C.cookies],
    [L.scoops, F.creamy, C.vanilla],
    [L.scoops, F.tangy, C.orange],
    [L.scoops, F.delights, C.strawberryWhite],
  ],
  occasion: [[L.scoops, undefined, C.brand, { size: { ar: "٤٫٥ لتر", en: "4.5 L" }, featured: true }]],
};

export const products: Product[] = (Object.keys(rows) as CategoryId[]).flatMap((category) =>
  rows[category].map(([line, flavor, colors, extra], i) => ({
    id: `${category}-${i + 1}`,
    category,
    line,
    flavor,
    colors,
    order: i + 1,
    ...extra,
  })),
);
