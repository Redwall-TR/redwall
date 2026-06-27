import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale, type Locale } from '@/lib/locales';
import { PageHeader, Section } from '@/components/ui';
import QuoteForm from '@/components/sections/QuoteForm';

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = !isLocale(locale) || locale === 'tr';
  return {
    title: isTr ? 'Teklif İste | Redwall' : 'Get a Quote | Redwall',
    description: isTr
      ? 'İhtiyacınıza özel teklif almak için formu doldurun. Kısa sürede size dönüş yapıyoruz.'
      : 'Fill in the form to get a custom quote tailored to your needs. We respond promptly.',
  };
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
      <PageHeader baslik={pageBaslik} aciklama={pageAciklama} />

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
