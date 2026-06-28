import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { Section } from '@/components/ui';
import QuoteForm from '@/components/sections/QuoteForm';
import { PageHero } from '@/components/sections/PageHero';
import { ServiceIcon } from '@/components/ui/icons';

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = !isLocale(locale) || locale === 'tr';
  const loc = isTr ? ('tr' as const) : ('en' as const);

  const baslik = isTr ? 'Teklif İste | Redwall' : 'Get a Quote | Redwall';
  const aciklama = isTr
    ? 'İhtiyacınıza özel teklif almak için formu doldurun. Kısa sürede size dönüş yapıyoruz.'
    : 'Fill in the form to get a custom quote tailored to your needs. We respond promptly.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/teklif' });
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return [{ locale: 'tr' }, { locale: 'en' }];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TeklifPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const loc: Locale = locale;
  const isTr = loc === 'tr';

  const pageBaslik = isTr ? 'Teklif İste' : 'Get a Quote';
  const pageAciklama = isTr
    ? 'İhtiyacınıza özel teklif için formu doldurun, en kısa sürede size dönüş yapalım.'
    : 'Fill in the form for a quote tailored to your needs and we will get back to you shortly.';

  return (
    <>
      <PageHero
        eyebrow={isTr ? 'Teklif' : 'Quote'}
        title={pageBaslik}
        description={pageAciklama}
        accent="#e63950"
        chips={isTr ? ['Hızlı Yanıt', '1 İş Günü'] : ['Fast Response', '1 Business Day']}
        glyph={<ServiceIcon name="gauge" className="h-[26rem] w-[26rem]" />}
      />

      <Section>
        <div className="mx-auto max-w-2xl">
          <p className="mb-8 text-sm text-muted">
            {isTr
              ? 'Talepler genellikle 1 iş günü içinde yanıtlanır.'
              : 'Requests are typically answered within 1 business day.'}
          </p>
          <QuoteForm locale={loc} />
        </div>
      </Section>
    </>
  );
}
