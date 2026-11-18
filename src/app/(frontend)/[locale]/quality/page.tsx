import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata, resolveLocale } from "@/i18n/metadata";
import { getQualityItems, getSiteSettings } from "@/lib/cms";
import PageHero from "@/components/layout/PageHero";
import Quality from "@/components/sections/Quality";
import ContactCta from "@/components/teasers/ContactCta";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = ({ params }: Props) => pageMetadata(params, "quality");

export default async function QualityPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const [items, settings] = await Promise.all([getQualityItems(), getSiteSettings()]);

  return (
    <main>
      <PageHero locale={locale} home={t.pages.home} title={t.pages.quality.title} intro={t.pages.quality.intro} />
      <Quality locale={locale} t={t.quality} items={items} />
      <ContactCta locale={locale} t={t.teasers} settings={settings} />
    </main>
  );
}
