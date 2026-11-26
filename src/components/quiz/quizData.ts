/**
 * "What's your flavour?" — 4 light questions → one Al-Arz product that matches you.
 * Each answer adds points to taste traits; the top trait picks a result profile, and each profile
 * points at a real catalogue product (matched by product line + flavour, so CMS edits keep working).
 */
import type { Localized } from "@/content/types";

export type Trait = "nutty" | "chocolate" | "cookies" | "fruity" | "creamy" | "caramel" | "arabic" | "family";

export interface Answer {
  emoji: string;
  label: Localized;
  traits: Partial<Record<Trait, number>>;
}
export interface Question {
  title: Localized;
  answers: Answer[];
}

export const QUESTIONS: Question[] = [
  {
    title: { ar: "شو مزاجك اليوم؟", en: "What's your mood today?" },
    answers: [
      { emoji: "😎", label: { ar: "رايق ومروّق", en: "Chill and relaxed" }, traits: { creamy: 2, caramel: 1 } },
      { emoji: "⚡", label: { ar: "طاقة وحماس", en: "Full of energy" }, traits: { fruity: 2, nutty: 1 } },
      { emoji: "🫶", label: { ar: "بدي لمّة العيلة", en: "Family time" }, traits: { family: 3 } },
      { emoji: "🍫", label: { ar: "بدي إشي يدلّعني", en: "I deserve a treat" }, traits: { chocolate: 2, cookies: 1 } },
    ],
  },
  {
    title: { ar: "وين بتحب تاكل بوظتك؟", en: "Where do you enjoy your ice cream?" },
    answers: [
      { emoji: "🏖️", label: { ar: "برّا تحت الشمس", en: "Outside in the sun" }, traits: { fruity: 2 } },
      { emoji: "🛋️", label: { ar: "ع الكنبة قدّام فيلم", en: "On the sofa with a movie" }, traits: { chocolate: 1, cookies: 2 } },
      { emoji: "🚶", label: { ar: "وأنا ماشي بالبلد", en: "Walking around town" }, traits: { nutty: 2, creamy: 1 } },
      { emoji: "🎉", label: { ar: "بالسهرات والمناسبات", en: "At gatherings" }, traits: { family: 2, arabic: 1 } },
    ],
  },
  {
    title: { ar: "اختار القرمشة", en: "Pick your crunch" },
    answers: [
      { emoji: "🌰", label: { ar: "مكسرات", en: "Nuts" }, traits: { nutty: 3 } },
      { emoji: "🍪", label: { ar: "بسكوت", en: "Cookies" }, traits: { cookies: 3 } },
      { emoji: "🍓", label: { ar: "قطع فواكه", en: "Fruit pieces" }, traits: { fruity: 2 } },
      { emoji: "☁️", label: { ar: "ولا إشي، بحبها ناعمة", en: "None — smooth please" }, traits: { creamy: 2, arabic: 1 } },
    ],
  },
  {
    title: { ar: "وآخر إشي… شو بتحب أكثر؟", en: "Last one… which do you love most?" },
    answers: [
      { emoji: "🍋", label: { ar: "حامض ومنعش", en: "Zesty and fresh" }, traits: { fruity: 3 } },
      { emoji: "🍯", label: { ar: "كراميل", en: "Caramel" }, traits: { caramel: 3 } },
      { emoji: "🌿", label: { ar: "مستكة وفستق", en: "Mastic and pistachio" }, traits: { arabic: 3 } },
      { emoji: "🍫", label: { ar: "شوكولاتة غامقة", en: "Dark chocolate" }, traits: { chocolate: 3 } },
    ],
  },
];

export interface Profile {
  trait: Trait;
  /** catalogue match: product line (English) + flavour keyword (English, optional) */
  match: { line: string; flavor?: string };
  title: Localized;
  blurb: Localized;
  colors: [string, string];
}

export const PROFILES: Record<Trait, Profile> = {
  nutty: {
    trait: "nutty",
    match: { line: "Charms", flavor: "Almond" },
    title: { ar: "إنت تشارمز لوز!", en: "You're Charms Almond!" },
    blurb: { ar: "مقرمش من برّا وطيّب من جوّا. بتحب التفاصيل، وما بترضى إلا بالأصلي.", en: "Crunchy outside, sweet inside. You love the details and only settle for the real thing." },
    colors: ["#6e3c1f", "#c8935a"],
  },
  chocolate: {
    trait: "chocolate",
    match: { line: "Charms", flavor: "Chocolate" },
    title: { ar: "إنت تشارمز شوكولاتة!", en: "You're Charms Chocolate!" },
    blurb: { ar: "عميق، غني، وما في حدا بيقاومك. الدلع إلك مش رفاهية… هو أسلوب حياة.", en: "Deep, rich and impossible to resist. Treating yourself isn't a luxury — it's a lifestyle." },
    colors: ["#2d1408", "#7a4529"],
  },
  cookies: {
    trait: "cookies",
    match: { line: "Charms", flavor: "Cookies" },
    title: { ar: "إنت تشارمز كوكيز وكريم!", en: "You're Charms Cookies & Cream!" },
    blurb: { ar: "إنت خليط حلو من الهدوء والمفاجآت. أبيض وأسود… بس دايماً ملوّن.", en: "A sweet mix of calm and surprises. Black and white — yet always colourful." },
    colors: ["#1b1615", "#f3eee6"],
  },
  fruity: {
    trait: "fruity",
    match: { line: "Bayyara", flavor: "Orange" },
    title: { ar: "إنت بيارة برتقال!", en: "You're Bayyara Orange!" },
    blurb: { ar: "منعش زي نسمة الصيف، وطاقتك بتعدي كل اللي حواليك. ريحة البيارات بدمّك.", en: "Fresh as a summer breeze, with energy that rubs off on everyone around you." },
    colors: ["#F26A00", "#FFA040"],
  },
  creamy: {
    trait: "creamy",
    match: { line: "Captain", flavor: "Vanilla" },
    title: { ar: "إنت كابتن فانيلا!", en: "You're Captain Vanilla!" },
    blurb: { ar: "كلاسيكي وما بتطلع من الموضة. الكل بيرتاح معك، وإنت الكابتن الحقيقي.", en: "A classic that never goes out of style. Everyone feels at ease with you — the real captain." },
    colors: ["#E5BF5F", "#F8E9B8"],
  },
  caramel: {
    trait: "caramel",
    match: { line: "Captain", flavor: "Caramel" },
    title: { ar: "إنت كابتن كراميل!", en: "You're Captain Caramel!" },
    blurb: { ar: "دافي وحنون، وكلامك زي الكراميل… بيذوب بالقلب.", en: "Warm and kind — your words melt hearts like caramel." },
    colors: ["#9C5B1F", "#E4A452"],
  },
  arabic: {
    trait: "arabic",
    match: { line: "Ya Leil", flavor: "Mastic" },
    title: { ar: "إنت يا ليل بالمستكة!", en: "You're Ya Leil Mastic!" },
    blurb: { ar: "أصيل وبتحب ريحة البلد. الطعم الفلسطيني القديم بيعرفك وإنت بتعرفه.", en: "Authentic, with a love for the taste of home — old-school Palestinian flavour knows you by name." },
    colors: ["#6A8A38", "#B8D27E"],
  },
  family: {
    trait: "family",
    match: { line: "Arz Premium", flavor: "Pistachio" },
    title: { ar: "إنت أرز بريميوم فستق!", en: "You're Arz Premium Pistachio!" },
    blurb: { ar: "قلب اللمّة. وين ما بتكون، بتكون العيلة والضحك والصحن الكبير.", en: "The heart of every gathering — where you are, there's family, laughter and a big bowl." },
    colors: ["#194E91", "#B8D27E"],
  },
};

/** Highest-scoring trait (ties broken by the order the visitor answered). */
export function scoreAnswers(picks: number[]): Trait {
  const score: Partial<Record<Trait, number>> = {};
  const firstSeen: Trait[] = [];
  picks.forEach((a, q) => {
    for (const [t, v] of Object.entries(QUESTIONS[q].answers[a].traits) as [Trait, number][]) {
      score[t] = (score[t] ?? 0) + v;
      if (!firstSeen.includes(t)) firstSeen.push(t);
    }
  });
  return firstSeen.sort((a, b) => (score[b] ?? 0) - (score[a] ?? 0))[0] ?? "creamy";
}
