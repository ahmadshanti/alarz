import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata, resolveLocale } from "@/i18n/metadata";
import { getCategories, getProducts, getSiteSettings } from "@/lib/cms";
import PageHero from "@/components/layout/PageHero";
import Products from "@/components/sections/Products";
import ContactCta from "@/components/teasers/ContactCta";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = ({ params }: Props) => pageMetadata(params, "products");

export default async function ProductsPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const [categories, products, settings] = await Promise.all([getCategories(), getProducts(), getSiteSettings()]);

  return (
    <main>
      <PageHero locale={locale} home={t.pages.home} title={t.pages.products.title} intro={t.pages.products.intro} />
      <Products locale={locale} t={t.products} categories={categories} products={products} />
      <ContactCta locale={locale} t={t.teasers} settings={settings} />
    </main>
  );
}
