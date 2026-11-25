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

  const baslik = isTr ? 'YangınPro, MekanikPro ve Redwall Cut için Ücretsiz Demo Talebi' : 'Request a Free YangınPro, MekanikPro or Redwall Cut Demo';
  const aciklama = isTr
    ? 'YangınPro, MekanikPro ve Redwall Cut yazılımlarını yakından tanımak için ücretsiz demo talep edin; ekibimiz kısa sürede sizinle iletişime geçsin.'
    : 'Request a free demo of YangınPro, MekanikPro or Redwall Cut to see them in action — our team will reach out shortly to schedule your session.';

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
    ? 'YangınPro, MekanikPro ve Redwall Cut yazılımlarını yakından görmek için aşağıdaki formu doldurun.'
    : 'Fill in the form below to see YangınPro, MekanikPro or Redwall Cut in action.';

  return (
    <>
      <PageHero
        eyebrow={isTr ? 'Yazılım' : 'Software'}
        title={pageBaslik}
        description={pageAciklama}
        accent={ACCENT}
        chips={['YangınPro', 'MekanikPro', 'Redwall Cut']}
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
