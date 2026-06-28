import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { sanityFetch } from '@/sanity/lib/fetch';
import { SITE_SETTINGS_QUERY } from '@/sanity/lib/queries';
import { pick, type Locale } from '@/lib/locales';

interface SiteSettings {
  iletisim?: { tel?: string; email?: string; adres?: { tr: string; en: string } };
  sosyal?: { linkedin?: string; instagram?: string; youtube?: string };
}

const ACCENT = '#e63950';

// ── Social icons ──────────────────────────────────────────────────────────────

function SocialIcon({ name }: { name: 'linkedin' | 'instagram' | 'youtube' }) {
  const cls = 'h-[18px] w-[18px]';
  if (name === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden="true">
        <path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3.25 8.25h3.4V20h-3.4V8.25Zm5.3 0h3.26v1.6h.05c.45-.82 1.56-1.69 3.2-1.69 3.43 0 4.06 2.16 4.06 4.97V20h-3.4v-5.27c0-1.26-.02-2.87-1.79-2.87-1.79 0-2.06 1.36-2.06 2.78V20h-3.4V8.25Z" />
      </svg>
    );
  }
  if (name === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cls} aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="3.8" />
        <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cls} aria-hidden="true">
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Link column ───────────────────────────────────────────────────────────────

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">{title}</h3>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-white/65 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

export default async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'nav' });
  const tf = await getTranslations({ locale, namespace: 'footer' });

  const loc: Locale = locale === 'en' ? 'en' : 'tr';
  const isTr = loc === 'tr';
  const settings = await sanityFetch<SiteSettings | null>(SITE_SETTINGS_QUERY, {}, null);

  const email = settings?.iletisim?.email ?? 'info@redwall.com.tr';
  const tel = settings?.iletisim?.tel ?? '+90 (XXX) XXX XX XX';
  const adres =
    (settings?.iletisim?.adres ? pick(settings.iletisim.adres, loc) : undefined) ?? 'İstanbul, Türkiye';

  const social = (['linkedin', 'instagram', 'youtube'] as const)
    .map((name) => ({ name, url: settings?.sosyal?.[name] }))
    .filter((s): s is { name: typeof s.name; url: string } => !!s.url);

  const isKollari = [
    { href: '/yazilim', label: t('yazilim') },
    { href: '/danismanlik', label: t('danismanlik') },
    { href: '/muhendislik', label: t('muhendislik') },
  ];
  const kurumsal = [
    { href: '/kurumsal/hakkimizda', label: t('hakkimizda') },
    { href: '/kurumsal/vizyon-misyon', label: t('vizyonMisyon') },
    { href: '/kurumsal/kalite-belgeler', label: t('kaliteBelgeler') },
  ];
  const dahaFazla = [
    { href: '/projeler', label: t('projeler') },
    { href: '/referanslar', label: t('referanslar') },
    { href: '/sss', label: t('sss') },
    { href: '/blog', label: t('blog') },
    { href: '/kariyer', label: t('kariyer') },
  ];

  return (
    <footer className="relative isolate overflow-hidden bg-[#141416] text-white">
      {/* top accent + blueprint texture */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}66, transparent)` }}
        aria-hidden
      />
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-4">
            <Link
              href="/"
              className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Image
                src="/redwall-logo-footer-dark.svg"
                alt="Redwall"
                width={130}
                height={42}
                className="h-24 w-auto"
              />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">{tf('tagline')}</p>

            {social.length > 0 && (
              <div className="mt-6 flex items-center gap-2.5">
                {social.map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-white/0 hover:bg-primary hover:text-white"
                  >
                    <SocialIcon name={s.name} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          <div className="lg:col-span-2">
            <FooterColumn title={tf('isKollarimiz')} links={isKollari} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title={t('kurumsal')} links={kurumsal} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title={t('dahaFazla')} links={dahaFazla} />
          </div>

          {/* Contact */}
          <div className="col-span-2 lg:col-span-2">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              {t('iletisim')}
            </h3>
            <ul className="flex flex-col gap-3 text-sm">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0" style={{ color: ACCENT }} aria-hidden>✉</span>
                <a href={`mailto:${email}`} className="text-white/65 transition-colors hover:text-white">
                  {email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0" style={{ color: ACCENT }} aria-hidden>☎</span>
                <a
                  href={`tel:${tel.replace(/[^0-9+]/g, '')}`}
                  className="text-white/65 transition-colors hover:text-white"
                >
                  {tel}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0" style={{ color: ACCENT }} aria-hidden>⌖</span>
                <span className="text-white/65">{adres}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-white/40 sm:flex-row sm:px-6">
          <p>
            © 2026 Redwall Yangın Danışmanlık Yazılım ve Mühendislik Hizmetleri LTD. Şti.{' '}
            {tf('haklar')}
          </p>
          <p className="text-white/30">
            {isTr ? 'Yangın güvenliğinde 360° yaklaşım' : 'A 360° approach to fire safety'}
          </p>
        </div>
      </div>
    </footer>
  );
}
