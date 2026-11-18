"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { Locale } from "@/content/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { pageHref, switchLocaleHref } from "@/i18n/routes";

const navKeys = ["story", "products", "quality", "news"] as const;

export default function Header({ locale, t }: { locale: Locale; t: Dictionary["nav"] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? `/${locale}`;
  const links = navKeys.map((key) => ({ key, href: pageHref(locale, key) }));
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // close the mobile menu after navigating
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const other = locale === "ar" ? "en" : "ar";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={clsx(
          "container-x transition-all duration-500",
          scrolled ? "pt-3" : "pt-5",
        )}
      >
        <nav
          className={clsx(
            "flex items-center justify-between rounded-full ps-4 pe-2 transition-all duration-500",
            scrolled
              ? "bg-white/95 py-2 shadow-[0_10px_40px_-15px_rgba(13,47,94,0.35)] md:bg-white/80 md:backdrop-blur-xl"
              : "bg-transparent py-3",
          )}
        >
          <Link href={`/${locale}`} aria-label="Al-Arz" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Al-Arz"
              className={clsx("w-auto transition-all duration-500", scrolled ? "h-10" : "h-12 md:h-14")}
            />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <li key={l.key}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={clsx(
                    "group relative rounded-full px-4 py-2 font-bold transition-colors hover:text-navy",
                    isActive(l.href) ? "text-navy" : "text-navy-ink/80",
                  )}
                >
                  {t[l.key]}
                  <span
                    className={clsx(
                      "absolute inset-x-4 -bottom-0.5 h-1 origin-center rounded-full bg-orange transition-transform duration-300 group-hover:scale-x-100",
                      isActive(l.href) ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              href={switchLocaleHref(pathname, other)}
              className="rounded-full px-4 py-2 text-sm font-bold text-navy transition-colors hover:bg-navy/5"
              lang={other}
            >
              {t.switchLang}
            </Link>
            <Link href={pageHref(locale, "contact")} className="btn btn-primary hidden !py-2.5 !px-5 text-sm sm:inline-flex">
              {t.contact}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t.menu}
              className="grid size-11 place-items-center rounded-full bg-navy text-white lg:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 7h16M4 12h10M4 17h16" />
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      <div
        className={clsx(
          "fixed inset-0 z-50 flex flex-col bg-navy text-white transition-[clip-path] duration-700 ease-[cubic-bezier(.77,0,.18,1)] lg:hidden",
          open ? "[clip-path:circle(150%_at_90%_5%)]" : "pointer-events-none [clip-path:circle(0%_at_90%_5%)]",
        )}
        aria-hidden={!open}
      >
        <div className="container-x flex items-center justify-between pt-6">
          <span className="text-2xl font-black text-orange">{locale === "ar" ? "الآرز" : "Al-Arz"}</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t.close}
            className="grid size-11 place-items-center rounded-full bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <ul className="container-x mt-14 flex flex-col gap-2">
          {[{ href: pageHref(locale), key: "home" as const }, ...links, { href: pageHref(locale, "contact"), key: "contact" as const }].map((l, i) => (
            <li
              key={l.key}
              style={{ transitionDelay: open ? `${150 + i * 70}ms` : "0ms" }}
              className={clsx(
                "transition-all duration-500",
                open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
              )}
            >
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className={clsx("block py-2 text-4xl font-black hover:text-orange", pathname === l.href && "text-orange")}
              >
                {t[l.key]}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
