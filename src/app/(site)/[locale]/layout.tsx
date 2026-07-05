import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CookieConsent from '@/components/layout/CookieConsent';
import { getSiteSettings } from '@/lib/cms/queries';
import { mediaUrl } from '@/lib/cms/image';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationJsonLd, websiteJsonLd } from '@/lib/jsonLd';
import { Analytics } from '@/components/analytics/Analytics';

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

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redwall.tr';
  const siteInfo = settings as unknown as {
    sirketAdi?: string;
    iletisim?: { tel?: string | null; email?: string | null };
    sosyal?: {
      linkedin?: string | null;
      instagram?: string | null;
      youtube?: string | null;
      x?: string | null;
      facebook?: string | null;
    };
  } | null;
  const orgName = siteInfo?.sirketAdi ?? 'Redwall';
  const logo = navbarLogoAcik ?? footerLogoAcik;
  const logoUrl = logo ? (logo.startsWith('http') ? logo : `${SITE_URL}${logo}`) : undefined;
  const sameAs = [
    siteInfo?.sosyal?.linkedin,
    siteInfo?.sosyal?.instagram,
    siteInfo?.sosyal?.youtube,
    siteInfo?.sosyal?.x,
    siteInfo?.sosyal?.facebook,
  ].filter((u): u is string => typeof u === 'string' && u.length > 0);
  const orgLd = organizationJsonLd({
    name: orgName,
    url: SITE_URL,
    logoUrl,
    phone: siteInfo?.iletisim?.tel ?? undefined,
    email: siteInfo?.iletisim?.email ?? undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  });
  const siteLd = websiteJsonLd({ name: orgName, url: SITE_URL });

  return (
    <NextIntlClientProvider>
      <div className="flex min-h-screen flex-col">
        <Analytics />
        <JsonLd data={orgLd} />
        <JsonLd data={siteLd} />
        <Header locale={locale} logoAcik={navbarLogoAcik} logoKoyu={navbarLogoKoyu} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} logoAcik={footerLogoAcik} logoKoyu={footerLogoKoyu} />
        <CookieConsent locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
