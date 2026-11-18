import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { dirFor, isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import SmoothScroll from "@/components/providers/SmoothScroll";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getSiteSettings } from "@/lib/cms";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    title: { default: t.meta.title, template: `%s | ${locale === "ar" ? "بوظة الآرز" : "Al-Arz Ice Cream"}` },
    description: t.meta.description,
    icons: { icon: "/favicon.svg" },
    alternates: { languages: { ar: "/ar", en: "/en" } },
    openGraph: { title: t.meta.title, description: t.meta.description, locale },
  };
}

export const viewport: Viewport = {
  themeColor: "#FEB258",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const settings = await getSiteSettings();

  return (
    <html lang={locale} dir={dirFor(locale)}>
      <body className="font-sans">
        <SmoothScroll>
          <Header locale={locale} t={t.nav} />
          {children}
          <Footer locale={locale} t={t.footer} nav={t.nav} settings={settings} />
        </SmoothScroll>
      </body>
    </html>
  );
}
