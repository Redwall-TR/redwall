import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getSiteSettings } from '@/lib/cms/queries';
import { pick, type Locale } from '@/lib/locales';

type Social = 'linkedin' | 'instagram' | 'youtube' | 'x' | 'facebook' | 'whatsapp';

interface SiteSettings {
  sirketAdi?: string;
  iletisim?: { tel?: string; email?: string; adres?: { tr: string; en: string } };
  sosyal?: Partial<Record<Social, string>>;
}

const ACCENT = '#e63950';
const SOCIAL_ORDER: Social[] = ['linkedin', 'instagram', 'youtube', 'x', 'facebook', 'whatsapp'];

// ── Social icons ──────────────────────────────────────────────────────────────

function SocialIcon({ name }: { name: Social }) {
  const cls = 'h-[18px] w-[18px]';
  switch (name) {
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden="true">
          <path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3.25 8.25h3.4V20h-3.4V8.25Zm5.3 0h3.26v1.6h.05c.45-.82 1.56-1.69 3.2-1.69 3.43 0 4.06 2.16 4.06 4.97V20h-3.4v-5.27c0-1.26-.02-2.87-1.79-2.87-1.79 0-2.06 1.36-2.06 2.78V20h-3.4V8.25Z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cls} aria-hidden="true">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="3.8" />
          <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cls} aria-hidden="true">
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
          <path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden="true">
          <path d="M17.5 3h2.7l-5.9 6.8L21.2 21h-5.4l-4.3-5.6L6.6 21H3.9l6.3-7.2L2.8 3h5.5l3.9 5.1L17.5 3Zm-1 16.4h1.5L7.6 4.5H6l10.5 14.9Z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden="true">
          <path d="M13.5 21v-8H16l.5-3h-3V8.1c0-.9.3-1.5 1.6-1.5H17V4c-.3 0-1.3-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9V10H8.5v3H11v8h2.5Z" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden="true">
          <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Zm0 16.4c-1.4 0-2.8-.4-4-1.1l-.3-.2-2.7.7.7-2.6-.2-.3A7.4 7.4 0 1 1 12 19.4Zm4.1-5.5c-.2-.1-1.3-.7-1.5-.7-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6 6 0 0 1-1.8-1.1 6.7 6.7 0 0 1-1.2-1.6c-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3a2.6 2.6 0 0 0-.8 1.9c0 1.1.8 2.2.9 2.4.1.2 1.6 2.5 3.9 3.5l1.3.5c.5.2 1 .1 1.4.1.4-.1 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1l-.4-.2Z" />
        </svg>
      );
  }
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
  const settings = await getSiteSettings() as SiteSettings | null;

  const sirketAdi =
    settings?.sirketAdi ?? 'Redwall Yangın Danışmanlık Yazılım ve Mühendislik Hizmetleri LTD. Şti.';
  const email = settings?.iletisim?.email ?? 'info@redwall.com.tr';
  const tel = settings?.iletisim?.tel ?? '+90 (XXX) XXX XX XX';
  const adres =
    (settings?.iletisim?.adres ? pick(settings.iletisim.adres, loc) : undefined) ?? 'İstanbul, Türkiye';

  const social = SOCIAL_ORDER.map((name) => ({ name, url: settings?.sosyal?.[name] })).filter(
    (s): s is { name: Social; url: string } => !!s.url,
  );

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
    { href: '/cozumler', label: t('cozumler') },
    { href: '/projeler', label: t('projeler') },
    { href: '/referanslar', label: t('referanslar') },
    { href: '/sss', label: t('sss') },
    { href: '/blog', label: t('blog') },
    { href: '/kariyer', label: t('kariyer') },
    { href: '/dokumanlar', label: t('dokumanlar') },
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
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/40 sm:px-6">
          {/* Legal links row */}
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Link href="/yasal/kvkk-aydinlatma" className="text-white/40 transition-colors hover:text-white/70">
              {isTr ? 'KVKK Aydınlatma' : 'GDPR Notice'}
            </Link>
            <Link href="/yasal/gizlilik-politikasi" className="text-white/40 transition-colors hover:text-white/70">
              {isTr ? 'Gizlilik Politikası' : 'Privacy Policy'}
            </Link>
            <Link href="/yasal/cerez-politikasi" className="text-white/40 transition-colors hover:text-white/70">
              {isTr ? 'Çerez Politikası' : 'Cookie Policy'}
            </Link>
            <Link href="/yasal/kullanim-kosullari" className="text-white/40 transition-colors hover:text-white/70">
              {isTr ? 'Kullanım Koşulları' : 'Terms of Use'}
            </Link>
            <Link href="/iletisim#kunye" className="text-white/40 transition-colors hover:text-white/70">
              {isTr ? 'Künye' : 'Imprint'}
            </Link>
          </div>
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p>
              © 2026 {sirketAdi}. {tf('haklar')}
            </p>
            <p className="text-white/30">
              {isTr ? 'Yangın güvenliğinde 360° yaklaşım' : 'A 360° approach to fire safety'}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
