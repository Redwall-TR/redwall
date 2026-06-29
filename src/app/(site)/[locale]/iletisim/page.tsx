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
  const email = settings?.iletisim?.email ?? 'info@redwall.tr';
  const tel = settings?.iletisim?.tel ?? '+90 (XXX) XXX XX XX';
  const adres =
    (settings?.iletisim?.adres ? pick(settings.iletisim.adres, loc) : undefined) ?? 'İstanbul, Türkiye';
  // Harita: OpenStreetMap embed (anahtarsız + güvenilir frame'lenir; Google'ın
  // anahtarsız embed'i X-Frame-Options ile reddedildiği için OSM tercih edildi).
  // Koordinatlar şirketin resmi adresine göre sabittir (Kurtuluş Mah., Adapazarı/Sakarya).
  const HARITA_LAT = 40.78021641245962;
  const HARITA_LON = 30.400269386519778;
  const bbox = [HARITA_LON - 0.006, HARITA_LAT - 0.003, HARITA_LON + 0.006, HARITA_LAT + 0.003]
    .map((n) => n.toFixed(6))
    .join('%2C');
  const haritaSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${HARITA_LAT}%2C${HARITA_LON}`;
  // "Google Haritalar'da aç" linki için kanonik TR adresi (metin tabanlı arama).
  const haritaAdres = settings?.iletisim?.adres?.tr || adres;
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

            {/* Konum haritası (Google Maps embed — API anahtarı gerektirmez) */}
            <iframe
              title={isTr ? 'Konum haritası' : 'Location map'}
              src={haritaSrc}
              className="h-56 w-full rounded-xl border border-border"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(haritaAdres)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              {isTr ? 'Google Haritalar\'da aç →' : 'Open in Google Maps →'}
            </a>
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
