import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata, resolveLocale } from "@/i18n/metadata";
import PageHero from "@/components/layout/PageHero";
import StoreLocator from "@/components/stores/StoreLocator";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = ({ params }: Props) => pageMetadata(params, "stores");

/** "Where to buy": interactive map of points of sale, starting at An-Najah University. */
export default async function StoresPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);

  return (
    <main>
      <PageHero locale={locale} home={t.pages.home} title={t.pages.stores.title} intro={t.pages.stores.intro} />
      <StoreLocator locale={locale} t={t.stores} />
    </main>
  );
}
