import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CookieConsent from '@/components/layout/CookieConsent';
import { getSiteSettings } from '@/lib/cms/queries';
import { mediaUrl } from '@/lib/cms/image';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const settings = await getSiteSettings();
  const marka = (settings as unknown as { marka?: Record<string, unknown> } | null)?.marka ?? null;
  const navbarLogoAcik = marka ? mediaUrl(marka.navbarLogoAcik) ?? null : null;
  const navbarLogoKoyu = marka ? mediaUrl(marka.navbarLogoKoyu) ?? null : null;
  const footerLogoAcik = marka ? mediaUrl(marka.footerLogoAcik) ?? null : null;
  const footerLogoKoyu = marka ? mediaUrl(marka.footerLogoKoyu) ?? null : null;

  return (
    <NextIntlClientProvider>
      <div className="flex min-h-screen flex-col">
        <Header locale={locale} logoAcik={navbarLogoAcik} logoKoyu={navbarLogoKoyu} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} logoAcik={footerLogoAcik} logoKoyu={footerLogoKoyu} />
        <CookieConsent locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
