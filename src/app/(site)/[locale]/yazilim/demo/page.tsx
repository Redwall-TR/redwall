import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { Section } from '@/components/ui';
import DemoForm from '@/components/sections/DemoForm';
import { PageHero } from '@/components/sections/PageHero';
import { ServiceIcon } from '@/components/ui/icons';
import { ACCENT } from '@/lib/theme';

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = !isLocale(locale) || locale === 'tr';
  const loc = isTr ? ('tr' as const) : ('en' as const);

  const baslik = isTr ? 'Demo Talep | Redwall' : 'Request a Demo | Redwall';
  const aciklama = isTr
    ? 'YangınPro ve MekanikPro yazılımları için ücretsiz demo talep edin.'
    : 'Request a free demo of our YangınPro and MekanikPro software.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/yazilim/demo' });
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return [{ locale: 'tr' }, { locale: 'en' }];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const loc: Locale = locale;
  const isTr = loc === 'tr';

  const pageBaslik = isTr ? 'Demo Talep Et' : 'Request a Demo';
  const pageAciklama = isTr
    ? 'YangınPro ve MekanikPro yazılımlarını yakından görmek için aşağıdaki formu doldurun.'
    : 'Fill in the form below to see our YangınPro and MekanikPro software in action.';

  return (
    <>
      <PageHero
        eyebrow={isTr ? 'Yazılım' : 'Software'}
        title={pageBaslik}
        description={pageAciklama}
        accent={ACCENT}
        chips={isTr ? ['YangınPro', 'MekanikPro'] : ['YangınPro', 'MekanikPro']}
        glyph={<ServiceIcon name="code" className="h-[26rem] w-[26rem]" />}
      />

      <Section>
        <div className="mx-auto max-w-2xl">
          <DemoForm locale={loc} />
        </div>
      </Section>
    </>
  );
}
