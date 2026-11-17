import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  getCategories,
  getHeroFlavors,
  getMilestones,
  getNews,
  getProducts,
  getQualityItems,
  getSiteSettings,
} from "@/lib/cms";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import FlavorMarquee from "@/components/sections/FlavorMarquee";
import Story from "@/components/sections/Story";
import Products from "@/components/sections/Products";
import Quality from "@/components/sections/Quality";
import News from "@/components/sections/News";
import Contact from "@/components/sections/Contact";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = getDictionary(locale);
  const [flavors, milestones, categories, products, quality, news, settings] = await Promise.all([
    getHeroFlavors(),
    getMilestones(),
    getCategories(),
    getProducts(),
    getQualityItems(),
    getNews(),
    getSiteSettings(),
  ]);

  return (
    <>
      <Header locale={locale} t={t.nav} />
      <main>
        <Hero locale={locale} t={t.hero} flavors={flavors} />
        <FlavorMarquee locale={locale} items={t.marquee} />
        <Story locale={locale} t={t.story} milestones={milestones} settings={settings} />
        <Products locale={locale} t={t.products} categories={categories} products={products} />
        <Quality locale={locale} t={t.quality} items={quality} />
        <News locale={locale} t={t.news} items={news} />
        <Contact locale={locale} t={t.contact} settings={settings} />
      </main>
      <Footer locale={locale} t={t.footer} nav={t.nav} settings={settings} />
    </>
  );
}
