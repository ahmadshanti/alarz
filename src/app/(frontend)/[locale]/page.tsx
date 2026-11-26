import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/metadata";
import { pageHref } from "@/i18n/routes";
import {
  getCharmsFlavors,
  getFeaturedProducts,
  getMilestones,
  getNews,
  getProducts,
  getQualityItems,
  getSiteSettings,
} from "@/lib/cms";
import Hero from "@/components/sections/Hero";
import FlavorMarquee from "@/components/sections/FlavorMarquee";
import CharmsSpotlight from "@/components/sections/CharmsSpotlight";
import News from "@/components/sections/News";
import StoryTeaser from "@/components/teasers/StoryTeaser";
import ProductsTeaser from "@/components/teasers/ProductsTeaser";
import QualityTeaser from "@/components/teasers/QualityTeaser";
import ContactCta from "@/components/teasers/ContactCta";
import QuizTeaser from "@/components/teasers/QuizTeaser";

// Content comes from the CMS; pages are also re-rendered on every CMS change (see src/payload/hooks/revalidate.ts).
export const revalidate = 3600;

/** Home: the hero and Charms showcase, then a short preview of every section, each linking to its own page. */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const [charms, milestones, featured, allProducts, quality, news, settings] = await Promise.all([
    getCharmsFlavors(),
    getMilestones(),
    getFeaturedProducts(),
    getProducts(),
    getQualityItems(),
    getNews(3),
    getSiteSettings(),
  ]);

  // featured first, topped up with other products so the rail always feels full
  const rail = [...featured, ...allProducts.filter((p) => !p.featured)].slice(0, 10);

  return (
    <main>
      <Hero locale={locale} t={t.hero} ar={t.ar} flavors={charms} />
      <FlavorMarquee locale={locale} items={t.marquee} />
      <CharmsSpotlight locale={locale} t={t.charms} flavors={charms} />
      <StoryTeaser locale={locale} t={t.story} cta={t.teasers.storyCta} milestones={milestones} settings={settings} />
      <ProductsTeaser locale={locale} t={t.products} teasers={t.teasers} products={rail} total={allProducts.length} />
      <QuizTeaser locale={locale} t={t.quiz} />
      <QualityTeaser locale={locale} t={t.quality} cta={t.teasers.qualityCta} items={quality} />
      <News locale={locale} t={t.news} items={news} more={{ href: pageHref(locale, "news"), label: t.teasers.newsCta }} />
      <ContactCta locale={locale} t={t.teasers} settings={settings} />
    </main>
  );
}
