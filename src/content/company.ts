import type { CharmsFlavor, Milestone, NewsItem, QualityItem, SiteSettings } from "./types";

// Facts taken from the current alarz.ps pages (Our Story, Health & Quality, News, Contact).

export const siteSettings: SiteSettings = {
  phones: ["+970 9 2322777", "+970 9 2326222"],
  address: {
    ar: "المنطقة الصناعية الشرقية، نابلس، فلسطين",
    en: "Eastern Industrial Zone, Nablus, Palestine",
  },
  poBox: { ar: "ص.ب ٢٠", en: "P.O. Box 20" },
  socials: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
  },
  foundedYear: 1950,
  monthlyCapacityLiters: 8_000_000,
};

export const milestones: Milestone[] = [
  {
    id: "m1950",
    year: "1950",
    title: { ar: "البداية من نابلس", en: "It started in Nablus" },
    body: {
      ar: "أسس المرحوم محمد عنبتاوي معملاً لإنتاج الثلج بجهود فردية، لتبريد المياه وحفظ الطعام.",
      en: "The late Mohammad Anabtawi founded an ice factory on his own, making ice to cool water and keep food fresh.",
    },
  },
  {
    id: "mice",
    year: "✦",
    title: { ar: "من الثلج إلى البوظة", en: "From ice to ice cream" },
    body: {
      ar: "تحوّل المعمل إلى مصنع بوظة الآرز، وأصبح رائد صناعة البوظة في فلسطين.",
      en: "The factory became Al-Arz Ice Cream and grew into Palestine's leading ice cream maker.",
    },
  },
  {
    id: "m2007",
    year: "2007",
    title: { ar: "الجودة الفلسطينية والتصدير", en: "Palestinian quality mark & export" },
    body: {
      ar: "حصلنا على شهادة الجودة الفلسطينية وبدأنا التصدير، وكانت الأردن أول وجهة.",
      en: "We earned the Palestinian quality certificate and began exporting, starting with Jordan.",
    },
  },
  {
    id: "m2009",
    year: "2009",
    title: { ar: "شهادة HACCP", en: "HACCP certified" },
    body: {
      ar: "أول شركة مثلجات في فلسطين والأردن تحصل على شهادة السلامة الغذائية HACCP.",
      en: "The first ice cream company in Palestine and Jordan to earn HACCP food-safety certification.",
    },
  },
  {
    id: "m2017",
    year: "2017",
    title: { ar: "وصلنا عُمان", en: "Reaching Oman" },
    body: {
      ar: "منتجات بوظة الآرز على رفوف متاجر سبار في سلطنة عُمان.",
      en: "Al-Arz ice cream arrived on the shelves of Spar stores in Oman.",
    },
  },
];

export const qualityItems: QualityItem[] = [
  {
    id: "q-lab",
    icon: "lab",
    title: { ar: "مختبر ضبط جودة داخلي", en: "In-house quality lab" },
    body: {
      ar: "فحوصات ميكروبيولوجية لكل دفعة قبل ما توصل الأسواق.",
      en: "Microbiological testing on every batch before it reaches the market.",
    },
  },
  {
    id: "q-ps",
    icon: "badge",
    year: "2007",
    title: { ar: "نظام الجودة الفلسطيني", en: "Palestinian Standard (PS)" },
    body: {
      ar: "نطبّق نظام الجودة الفلسطيني من سنة ٢٠٠٧.",
      en: "Applying the Palestinian quality system since 2007.",
    },
  },
  {
    id: "q-haccp",
    icon: "shield",
    year: "2009",
    title: { ar: "سلامة غذائية HACCP", en: "HACCP food safety" },
    body: {
      ar: "نظام تحليل المخاطر وضبط النقاط الحرجة من سنة ٢٠٠٩.",
      en: "Hazard analysis and critical control points since 2009.",
    },
  },
  {
    id: "q-ext",
    icon: "flask",
    title: { ar: "مختبرات خارجية معتمدة", en: "Accredited external labs" },
    body: {
      ar: "نستعين بمختبرات خارجية، منها مختبرات وزارة الصحة.",
      en: "Independent testing, including Ministry of Health laboratories.",
    },
  },
];

export const news: NewsItem[] = [
  {
    id: "n3",
    date: "2017-05-02",
    title: {
      ar: "سلسلة متاجر سبار في عُمان تعرض منتجات بوظة الآرز",
      en: "Spar stores in Oman now carry Al-Arz ice cream",
    },
    excerpt: {
      ar: "خطوة جديدة في رحلة الآرز خارج فلسطين، بوصول منتجاتنا إلى رفوف سبار في السلطنة.",
      en: "Another step beyond Palestine as our products reach Spar shelves across the Sultanate.",
    },
    source: { ar: "أخبار الشركة", en: "Company news" },
  },
  {
    id: "n1",
    date: "2017-03-01",
    title: { ar: "بوظة الآرز قريباً في سلطنة عُمان", en: "Al-Arz ice cream coming soon to Oman" },
    excerpt: {
      ar: "استعدادات لإطلاق منتجات الآرز في السوق العُماني.",
      en: "Preparations to launch Al-Arz products in the Omani market.",
    },
    source: { ar: "أخبار الشركة", en: "Company news" },
  },
  {
    id: "n2",
    date: "2015-12-12",
    title: { ar: "صانع بوظة فلسطيني يجتاح الشرق الأوسط", en: "A Palestinian ice cream maker sweeps the Middle East" },
    excerpt: {
      ar: "قصة توسّع الآرز من نابلس إلى أسواق المنطقة.",
      en: "How Al-Arz grew from Nablus into markets across the region.",
    },
    source: { ar: "صحافة", en: "Press" },
  },
];

// The four Charms packs shown in the "rank them" artwork
export const charmsFlavors: CharmsFlavor[] = [
  { id: "almonds", name: { ar: "لوز", en: "Almonds" }, pack: "#2a63b8", packDeep: "#143f80" },
  { id: "double-chocolate", name: { ar: "شوكولاتة مزدوجة", en: "Double Chocolate" }, pack: "#7a4529", packDeep: "#3b1e10" },
  { id: "cookies-cream", name: { ar: "كوكيز وكريم", en: "Cookies & Cream" }, pack: "#3a3a3d", packDeep: "#111113" },
  { id: "strawberry-white", name: { ar: "فراولة وشوكولاتة بيضاء", en: "Strawberry & White Chocolate" }, pack: "#e0323a", packDeep: "#a3141c" },
];
