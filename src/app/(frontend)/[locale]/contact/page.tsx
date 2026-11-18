import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata, resolveLocale } from "@/i18n/metadata";
import { getSiteSettings } from "@/lib/cms";
import PageHero from "@/components/layout/PageHero";
import Contact from "@/components/sections/Contact";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = ({ params }: Props) => pageMetadata(params, "contact");

export default async function ContactPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const settings = await getSiteSettings();

  return (
    <main>
      <PageHero locale={locale} home={t.pages.home} title={t.pages.contact.title} intro={t.pages.contact.intro} />
      <Contact locale={locale} t={t.contact} settings={settings} />
    </main>
  );
}
