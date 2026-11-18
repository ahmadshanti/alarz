import Link from "next/link";
import type { Locale } from "@/content/types";
import { pageHref } from "@/i18n/routes";
import SwirlMark from "@/components/ui/SwirlMark";

/**
 * Banner at the top of every inner page: breadcrumb, big title, short intro.
 * Entrance is a CSS animation (no JS); background is static gradients only.
 */
export default function PageHero({
  locale,
  home,
  title,
  intro,
}: {
  locale: Locale;
  home: string;
  title: string;
  intro: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-cream pt-36 pb-16 md:pt-44 md:pb-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#fff_0%,_var(--color-cream)_60%,_var(--color-cream-deep)_100%)]" />
        <div className="absolute -top-24 size-[34rem] rounded-full bg-[radial-gradient(circle,_rgb(254_178_88/0.4)_0%,_rgb(254_178_88/0)_65%)] ltr:-right-24 rtl:-left-24" />
        <div className="absolute -bottom-40 size-[28rem] rounded-full bg-[radial-gradient(circle,_rgb(25_78_145/0.12)_0%,_rgb(25_78_145/0)_65%)] ltr:-left-24 rtl:-right-24" />
        <SwirlMark
          mono
          className="page-hero-swirl absolute top-16 h-[26rem] text-navy opacity-[0.06] ltr:right-[4%] rtl:left-[4%]"
        />
      </div>

      <div className="container-x">
        <nav aria-label="breadcrumb" className="page-hero-in text-sm font-bold text-navy/50">
          <Link href={pageHref(locale)} className="transition-colors hover:text-orange-deep">
            {home}
          </Link>
          <span className="mx-2 text-orange" aria-hidden>
            /
          </span>
          <span className="text-navy" aria-current="page">
            {title}
          </span>
        </nav>

        <h1 className="page-hero-in mt-5 text-[clamp(3rem,9vw,6.5rem)] font-black leading-[1.05] text-navy [animation-delay:80ms]">
          <span className="melt-underline">{title}</span>
        </h1>
        <p className="page-hero-in mt-6 max-w-2xl text-lg leading-relaxed text-navy-ink/70 [animation-delay:160ms] md:text-xl">
          {intro}
        </p>
      </div>
    </section>
  );
}
