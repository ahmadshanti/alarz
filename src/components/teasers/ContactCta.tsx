import Link from "next/link";
import type { Locale, SiteSettings } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { pageHref } from "@/i18n/routes";
import SwirlMark from "@/components/ui/SwirlMark";
import Reveal from "@/components/ui/Reveal";

/** Home-page closer: "want Al-Arz in your shop?" with phone numbers and a link to /contact. */
export default function ContactCta({
  locale,
  t,
  settings,
}: {
  locale: Locale;
  t: Dictionary["teasers"];
  settings: SiteSettings;
}) {
  return (
    <section className="py-16 md:py-24">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-orange p-8 text-navy-ink md:p-14">
            <SwirlMark mono className="pointer-events-none absolute -bottom-16 h-80 text-navy/10 ltr:-right-6 rtl:-left-6" />
            <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <h2 className="text-balance text-3xl font-black leading-tight md:text-5xl">{t.contactTitle}</h2>
                <p className="mt-4 text-lg font-semibold text-navy-ink/75">{t.contactSubtitle}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {settings.phones.map((p) => (
                    <a
                      key={p}
                      href={`tel:${p.replace(/\s/g, "")}`}
                      dir="ltr"
                      className="rounded-full bg-white/60 px-4 py-2 font-bold transition hover:bg-white"
                    >
                      {p}
                    </a>
                  ))}
                </div>
              </div>
              <Link href={pageHref(locale, "contact")} className="btn btn-primary shrink-0 self-start md:self-center">
                {t.contactCta}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="rtl:-scale-x-100">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
