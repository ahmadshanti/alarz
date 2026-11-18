import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata, resolveLocale } from "@/i18n/metadata";
import { getMilestones, getSiteSettings } from "@/lib/cms";
import PageHero from "@/components/layout/PageHero";
import Story from "@/components/sections/Story";
import ContactCta from "@/components/teasers/ContactCta";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = ({ params }: Props) => pageMetadata(params, "story");

export default async function StoryPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const [milestones, settings] = await Promise.all([getMilestones(), getSiteSettings()]);

  return (
    <main>
      <PageHero locale={locale} home={t.pages.home} title={t.pages.story.title} intro={t.pages.story.intro} />
      <Story locale={locale} t={t.story} milestones={milestones} settings={settings} />
      <ContactCta locale={locale} t={t.teasers} settings={settings} />
    </main>
  );
}
