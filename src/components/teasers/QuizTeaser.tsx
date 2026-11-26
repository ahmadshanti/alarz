import Link from "next/link";
import type { Locale } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { pageHref } from "@/i18n/routes";
import Reveal from "@/components/ui/Reveal";

/** Home-page invitation to the "What's your flavour?" quiz. */
export default function QuizTeaser({ locale, t }: { locale: Locale; t: Dictionary["quiz"] }) {
  return (
    <section className="py-10 md:py-16">
      <div className="container-x">
        <Reveal>
          <Link
            href={pageHref(locale, "quiz")}
            className="group relative flex flex-col items-center gap-6 overflow-hidden rounded-[2.5rem] bg-[linear-gradient(120deg,#2d1408_0%,#6e3c1f_45%,#F28C1B_100%)] p-8 text-center text-white md:flex-row md:p-12 md:text-start"
          >
            <span className="pointer-events-none absolute -top-20 size-72 rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.25),transparent)] ltr:-right-16 rtl:-left-16" />
            <span className="flex shrink-0 gap-2 text-5xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 md:text-6xl" aria-hidden>
              🍫🌰🍓
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="block text-3xl font-black md:text-5xl">{t.teaserTitle}</span>
              <span className="mt-3 block text-lg text-white/80">{t.teaserBody}</span>
            </span>
            <span className="btn relative shrink-0 bg-white text-navy group-hover:bg-orange group-hover:text-navy-ink">
              {t.teaserCta}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="rtl:-scale-x-100">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
