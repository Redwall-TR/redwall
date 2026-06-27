import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { Section } from '@/components/ui';
import ContactForm from '@/components/sections/ContactForm';
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

  const baslik = isTr ? 'İletişim | Redwall' : 'Contact | Redwall';
  const aciklama = isTr
    ? 'Redwall ile iletişime geçin. Sorularınız, projeleriniz ve teklifleriniz için buradayız.'
    : 'Get in touch with Redwall. We are here for your questions, projects and proposals.';

  return buildMetadata({ baslik, aciklama, locale: loc, path: '/iletisim' });
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return [{ locale: 'tr' }, { locale: 'en' }];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function IletisimPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const loc: Locale = locale;
  const isTr = loc === 'tr';

  const pageBaslik = isTr ? 'İletişim' : 'Contact';
  const pageAciklama = isTr
    ? 'Sorularınız, projeleriniz ve teklifleriniz için aşağıdaki formu doldurun veya doğrudan ulaşın.'
    : 'Fill in the form below or reach out directly for your questions, projects and proposals.';

  return (
    <>
      <PageHero
        eyebrow={isTr ? 'İletişim' : 'Contact'}
        title={pageBaslik}
        description={pageAciklama}
        accent="#e63950"
        chips={isTr ? ['İstanbul', 'info@redwall.com.tr'] : ['Istanbul', 'info@redwall.com.tr']}
        glyph={<ServiceIcon name="document" className="h-[26rem] w-[26rem]" />}
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left: Contact Form */}
          <div>
            <h2 className="mb-6 font-display text-xl font-bold sm:text-2xl">
              {isTr ? 'Bize Yazın' : 'Send Us a Message'}
            </h2>
            <ContactForm />
          </div>

          {/* Right: Contact Info + Map Placeholder */}
          <div className="space-y-8">
            <div>
              <h2 className="mb-6 font-display text-xl font-bold sm:text-2xl">
                {isTr ? 'İletişim Bilgileri' : 'Contact Information'}
              </h2>

              <ul className="space-y-4 text-sm">
                {/* Email */}
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-primary" aria-hidden="true">✉</span>
                  <div>
                    <p className="font-medium">{isTr ? 'E-posta' : 'Email'}</p>
                    <a
                      href="mailto:info@redwall.com.tr"
                      className="text-muted hover:text-primary transition-colors"
                    >
                      info@redwall.com.tr
                    </a>
                  </div>
                </li>

                {/* Phone */}
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-primary" aria-hidden="true">☎</span>
                  <div>
                    <p className="font-medium">{isTr ? 'Telefon' : 'Phone'}</p>
                    <a
                      href="tel:+90XXXXXXXXXX"
                      className="text-muted hover:text-primary transition-colors"
                    >
                      +90 (XXX) XXX XX XX
                    </a>
                  </div>
                </li>

                {/* Address */}
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-primary" aria-hidden="true">⌖</span>
                  <div>
                    <p className="font-medium">{isTr ? 'Adres' : 'Address'}</p>
                    <p className="text-muted">İstanbul, Türkiye</p>
                  </div>
                </li>

                {/* Working Hours */}
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-primary" aria-hidden="true">◷</span>
                  <div>
                    <p className="font-medium">{isTr ? 'Çalışma Saatleri' : 'Working Hours'}</p>
                    <p className="text-muted">
                      {isTr ? 'Pazartesi–Cuma 09:00–18:00' : 'Monday–Friday 09:00–18:00'}
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Map Placeholder */}
            <div
              className="flex h-56 items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted"
              role="img"
              aria-label={isTr ? 'Harita alanı' : 'Map area'}
            >
              {isTr ? 'Harita / Map' : 'Map / Harita'}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
