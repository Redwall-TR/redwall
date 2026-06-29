import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { isLocale, pick, type Locale } from '@/lib/locales';
import { buildMetadata } from '@/lib/metadata';
import { getSiteSettings } from '@/lib/cms/queries';
import { Section } from '@/components/ui';
import ContactForm from '@/components/sections/ContactForm';
import { PageHero } from '@/components/sections/PageHero';
import { ServiceIcon } from '@/components/ui/icons';

interface SiteSettings {
  sirketAdi?: string;
  iletisim?: { tel?: string; email?: string; adres?: { tr: string; en: string } };
  calismaSaatleri?: { tr: string; en: string };
  kunye?: {
    mersisNo?: string | null;
    ticaretSicilNo?: string | null;
    kepAdresi?: string | null;
  } | null;
}

const PLACEHOLDER = '[DOLDURULACAK]';

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

  const settings = await getSiteSettings() as SiteSettings | null;
  const email = settings?.iletisim?.email ?? 'info@redwall.com.tr';
  const tel = settings?.iletisim?.tel ?? '+90 (XXX) XXX XX XX';
  const adres =
    (settings?.iletisim?.adres ? pick(settings.iletisim.adres, loc) : undefined) ?? 'İstanbul, Türkiye';
  const calismaSaatleri =
    (settings?.calismaSaatleri ? pick(settings.calismaSaatleri, loc) : undefined) ??
    (isTr ? 'Pazartesi–Cuma 09:00–18:00' : 'Monday–Friday 09:00–18:00');

  const sirketAdi = settings?.sirketAdi ?? PLACEHOLDER;
  const mersisNo = settings?.kunye?.mersisNo ?? PLACEHOLDER;
  const ticaretSicilNo = settings?.kunye?.ticaretSicilNo ?? PLACEHOLDER;
  const kepAdresi = settings?.kunye?.kepAdresi ?? PLACEHOLDER;

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
        chips={[adres, email]}
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
                      href={`mailto:${email}`}
                      className="text-muted hover:text-primary transition-colors"
                    >
                      {email}
                    </a>
                  </div>
                </li>

                {/* Phone */}
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-primary" aria-hidden="true">☎</span>
                  <div>
                    <p className="font-medium">{isTr ? 'Telefon' : 'Phone'}</p>
                    <a
                      href={`tel:${tel.replace(/[^0-9+]/g, '')}`}
                      className="text-muted hover:text-primary transition-colors"
                    >
                      {tel}
                    </a>
                  </div>
                </li>

                {/* Address */}
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-primary" aria-hidden="true">⌖</span>
                  <div>
                    <p className="font-medium">{isTr ? 'Adres' : 'Address'}</p>
                    <p className="text-muted">{adres}</p>
                  </div>
                </li>

                {/* Working Hours */}
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-primary" aria-hidden="true">◷</span>
                  <div>
                    <p className="font-medium">{isTr ? 'Çalışma Saatleri' : 'Working Hours'}</p>
                    <p className="text-muted">{calismaSaatleri}</p>
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

      {/* ── Künye / Yasal Bilgiler ────────────────────────────────────────────── */}
      <Section id="kunye">
        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="mb-6 font-display text-xl font-bold sm:text-2xl">
            {isTr ? 'Künye / Yasal Bilgiler' : 'Legal Information'}
          </h2>

          <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            {/* Ticaret Unvanı */}
            <div>
              <dt className="font-medium text-foreground">
                {isTr ? 'Ticaret Unvanı' : 'Trade Name'}
              </dt>
              <dd className="mt-0.5 text-muted">{sirketAdi}</dd>
            </div>

            {/* Açık Adres */}
            <div>
              <dt className="font-medium text-foreground">
                {isTr ? 'Açık Adres' : 'Registered Address'}
              </dt>
              <dd className="mt-0.5 text-muted">{adres}</dd>
            </div>

            {/* Telefon */}
            <div>
              <dt className="font-medium text-foreground">
                {isTr ? 'Telefon' : 'Phone'}
              </dt>
              <dd className="mt-0.5 text-muted">{tel}</dd>
            </div>

            {/* E-posta */}
            <div>
              <dt className="font-medium text-foreground">
                {isTr ? 'E-posta' : 'Email'}
              </dt>
              <dd className="mt-0.5 text-muted">{email}</dd>
            </div>

            {/* KEP Adresi */}
            <div>
              <dt className="font-medium text-foreground">
                {isTr ? 'KEP Adresi' : 'Registered Email (KEP)'}
              </dt>
              <dd className={`mt-0.5 ${kepAdresi === PLACEHOLDER ? 'text-warning italic' : 'text-muted'}`}>
                {kepAdresi}
              </dd>
            </div>

            {/* MERSİS No */}
            <div>
              <dt className="font-medium text-foreground">
                {isTr ? 'MERSİS No' : 'MERSIS No'}
              </dt>
              <dd className={`mt-0.5 ${mersisNo === PLACEHOLDER ? 'text-warning italic' : 'text-muted'}`}>
                {mersisNo}
              </dd>
            </div>

            {/* Ticaret Sicil No */}
            <div>
              <dt className="font-medium text-foreground">
                {isTr ? 'Ticaret Sicil No' : 'Trade Registry No'}
              </dt>
              <dd className={`mt-0.5 ${ticaretSicilNo === PLACEHOLDER ? 'text-warning italic' : 'text-muted'}`}>
                {ticaretSicilNo}
              </dd>
            </div>
          </dl>
        </div>
      </Section>
    </>
  );
}
