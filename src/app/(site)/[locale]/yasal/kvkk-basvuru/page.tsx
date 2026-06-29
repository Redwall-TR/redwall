import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { Section } from '@/components/ui';
import KvkkBasvuruForm from '@/components/sections/KvkkBasvuruForm';
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

  const baslik = isTr
    ? 'KVKK İlgili Kişi Başvuru Formu | Redwall'
    : 'KVKK Data Subject Request Form | Redwall';
  const aciklama = isTr
    ? 'Kişisel verilerinize ilişkin KVKK kapsamındaki haklarınızı kullanmak için başvuru formunu doldurun.'
    : 'Submit a request to exercise your rights regarding your personal data under the KVKK.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/yasal/kvkk-basvuru' });
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return [{ locale: 'tr' }, { locale: 'en' }];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function KvkkBasvuruPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const loc: Locale = locale;
  const isTr = loc === 'tr';

  const pageBaslik = isTr ? 'İlgili Kişi Başvuru Formu' : 'Data Subject Request Form';
  const pageAciklama = isTr
    ? 'KVKK kapsamındaki haklarınızı kullanmak için aşağıdaki formu doldurun.'
    : 'Fill in the form below to exercise your rights under the KVKK.';

  return (
    <>
      <PageHero
        eyebrow={isTr ? 'Yasal' : 'Legal'}
        title={pageBaslik}
        description={pageAciklama}
        accent="#e63950"
        chips={isTr ? ['KVKK Md. 11', 'İlgili Kişi Hakları'] : ['KVKK Art. 11', 'Data Subject Rights']}
        glyph={<ServiceIcon name="document" className="h-[26rem] w-[26rem]" />}
      />

      <Section>
        <div className="mx-auto max-w-2xl">
          {/* Alternative submission note */}
          <div
            role="note"
            className="mb-8 rounded-lg border border-border bg-surface px-5 py-4 text-sm text-muted"
          >
            {isTr ? (
              <>
                Başvurunuzu bu form aracılığıyla iletebilir ya da doğrudan aşağıdaki kanallardan
                ulaşabilirsiniz:
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>
                    <strong>KEP:</strong> [DOLDURULACAK: KEP adresi]
                  </li>
                  <li>
                    <strong>E-posta:</strong>{' '}
                    <a href="mailto:info@redwall.com.tr" className="underline hover:text-foreground">
                      info@redwall.com.tr
                    </a>
                  </li>
                </ul>
              </>
            ) : (
              <>
                You may submit your request via this form or reach us directly through:
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>
                    <strong>KEP (Registered e-mail):</strong> [DOLDURULACAK: KEP adresi]
                  </li>
                  <li>
                    <strong>Email:</strong>{' '}
                    <a href="mailto:info@redwall.com.tr" className="underline hover:text-foreground">
                      info@redwall.com.tr
                    </a>
                  </li>
                </ul>
              </>
            )}
          </div>

          <KvkkBasvuruForm locale={loc} />
        </div>
      </Section>
    </>
  );
}
