import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CookieConsent from '@/components/layout/CookieConsent';
import { getProducts } from '@/lib/cms/queries';
import { pick, type Locale } from '@/lib/locales';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // Yazılım menüsü yalnızca yayındaki ürünlerden üretilir (getProducts
  // zaten yayinda=true filtreler). Yayından kaldırılan ürün menüde de çıkmaz.
  const loc: Locale = locale === 'en' ? 'en' : 'tr';
  const products = (await getProducts()) as unknown as Array<{
    slug?: string;
    ad?: { tr: string; en: string };
  }> | null;
  const softwareItems = (products ?? [])
    .filter((p): p is { slug: string; ad?: { tr: string; en: string } } => !!p?.slug)
    .map((p) => ({
      key: p.slug,
      href: `/yazilim/${p.slug}`,
      label: (p.ad ? pick(p.ad, loc) : p.slug) ?? p.slug,
    }));

  return (
    <NextIntlClientProvider>
      <div className="flex min-h-screen flex-col">
        <Header locale={locale} softwareItems={softwareItems} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} />
        <CookieConsent locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
