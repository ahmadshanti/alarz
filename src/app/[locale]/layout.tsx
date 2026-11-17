import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { dirFor, isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import SmoothScroll from "@/components/providers/SmoothScroll";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    title: t.meta.title,
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

  return (
    <html lang={locale} dir={dirFor(locale)}>
      <body className="font-sans">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
