import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata, resolveLocale } from "@/i18n/metadata";
import { getNews } from "@/lib/cms";
import PageHero from "@/components/layout/PageHero";
import News from "@/components/sections/News";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = ({ params }: Props) => pageMetadata(params, "news");

export default async function NewsPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const items = await getNews(100);

  return (
    <main>
      <PageHero locale={locale} home={t.pages.home} title={t.pages.news.title} intro={t.pages.news.intro} />
      <News locale={locale} t={t.news} items={items} />
    </main>
  );
}
