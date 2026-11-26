import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata, resolveLocale } from "@/i18n/metadata";
import { getProducts } from "@/lib/cms";
import PageHero from "@/components/layout/PageHero";
import FlavorQuiz from "@/components/quiz/FlavorQuiz";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = ({ params }: Props) => pageMetadata(params, "quiz");

/** "What's your flavour?" — a quick personality quiz that ends on a real Al-Arz product. */
export default async function QuizPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const t = getDictionary(locale);
  const products = (await getProducts()).map((p) => ({
    id: p.id,
    line: p.line,
    flavor: p.flavor ?? null,
    category: p.category,
    colors: p.colors,
    image: p.image?.url ?? null,
  }));

  return (
    <main>
      <PageHero locale={locale} home={t.pages.home} title={t.pages.quiz.title} intro={t.pages.quiz.intro} />
      <section className="pb-24">
        <div className="container-x mx-auto max-w-3xl">
          <FlavorQuiz locale={locale} t={t.quiz} products={products} />
        </div>
      </section>
    </main>
  );
}
