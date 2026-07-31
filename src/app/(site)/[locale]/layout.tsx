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
import { organizationJsonLd, websiteJsonLd, localBusinessJsonLd } from '@/lib/jsonLd';
import { TR_PROVINCES, SERVICE_PROVINCES } from '@/lib/tr-cities';
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

  // Yerel-işletme yapısal verisi — yalnızca arama motorları / AI ajanları okur.
  // Şehir + hizmet türü sinyali burada; görünür metinde tekrarlanmaz.
  const localLd = localBusinessJsonLd({
    name: orgName,
    url: SITE_URL,
    logoUrl,
    phone: siteInfo?.iletisim?.tel ?? undefined,
    email: siteInfo?.iletisim?.email ?? undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    description:
      locale === 'en'
        ? 'Fire safety consulting, fire protection systems, and fire engineering services based in Sakarya (Adapazarı) — fire detection and suppression systems, fire-department compliance and code consulting. Serving all 81 provinces of Turkey, with dedicated coverage in Sakarya, Kocaeli, Düzce and Bolu.'
        : 'Sakarya (Adapazarı) merkezli yangın danışmanlığı, yangın sistemleri ve yangın güvenliği mühendisliği hizmetleri; yangın algılama ve söndürme sistemleri, itfaiye uyumu ve mevzuat danışmanlığı ile Sakarya, Kocaeli, Düzce ve Bolu başta olmak üzere Türkiye’nin 81 iline hizmet.',
    // 81 il geniş kapsam + 4 çekirdek şehir öncelikli — makine-okur kapsam sinyali.
    areaServed: [...SERVICE_PROVINCES, ...TR_PROVINCES.filter((p) => !SERVICE_PROVINCES.includes(p as (typeof SERVICE_PROVINCES)[number])), 'Türkiye'],
    priceRange: '₺₺',
  });

  return (
    <NextIntlClientProvider>
      <div className="flex min-h-screen flex-col">
        <Analytics />
        <JsonLd data={orgLd} />
        <JsonLd data={siteLd} />
        <JsonLd data={localLd} />
        <Header locale={locale} logoAcik={navbarLogoAcik} logoKoyu={navbarLogoKoyu} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} logoAcik={footerLogoAcik} logoKoyu={footerLogoKoyu} />
        <CookieConsent locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
