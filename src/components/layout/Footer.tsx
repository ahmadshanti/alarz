import type { Locale, SiteSettings } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatNumber } from "@/i18n/config";
import Link from "next/link";
import Drip from "@/components/ui/Drip";
import { pageHref } from "@/i18n/routes";

export default function Footer({
  locale,
  t,
  nav,
  settings,
}: {
  locale: Locale;
  t: Dictionary["footer"];
  nav: Dictionary["nav"];
  settings: SiteSettings;
}) {
  const year = formatNumber(new Date().getFullYear(), locale, { useGrouping: false });
  const links = [
    [pageHref(locale), nav.home],
    [pageHref(locale, "story"), nav.story],
    [pageHref(locale, "products"), nav.products],
    [pageHref(locale, "stores"), nav.stores],
    [pageHref(locale, "quality"), nav.quality],
    [pageHref(locale, "news"), nav.news],
    [pageHref(locale, "contact"), nav.contact],
  ] as const;

  return (
    <footer className="relative mt-10 bg-navy-ink pt-24 pb-10 text-white">
      <Drip className="absolute inset-x-0 top-0 h-14 w-full -translate-y-[1px] text-cream" />
      <div className="container-x">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="inline-block rounded-3xl bg-white px-5 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Al-Arz" className="h-14 w-auto" />
            </div>
            <p className="mt-5 max-w-xs text-white/60">{t.tagline}</p>
          </div>
          <nav>
            <ul className="space-y-3">
              {links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="font-bold text-white/75 transition hover:text-orange">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="font-bold text-orange">{t.follow}</p>
            <div className="mt-4 flex gap-3">
              {settings.socials.facebook && (
                <a href={settings.socials.facebook} aria-label="Facebook" target="_blank" rel="noreferrer" className="grid size-12 place-items-center rounded-full bg-white/10 transition hover:-translate-y-1 hover:bg-orange hover:text-navy-ink">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3c-2.8 0-4 1.8-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6z" /></svg>
                </a>
              )}
              {settings.socials.instagram && (
                <a href={settings.socials.instagram} aria-label="Instagram" target="_blank" rel="noreferrer" className="grid size-12 place-items-center rounded-full bg-white/10 transition hover:-translate-y-1 hover:bg-orange hover:text-navy-ink">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
                </a>
              )}
            </div>
            <div className="mt-6 space-y-1 text-white/60">
              {settings.phones.map((p) => (
                <p key={p}><span dir="ltr">{p}</span></p>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-14 border-t border-white/10 pt-6 text-sm text-white/45">
          © {year} {t.rights}
        </div>
      </div>
    </footer>
  );
}
