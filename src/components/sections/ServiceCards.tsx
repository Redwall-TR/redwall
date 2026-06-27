import { pick, type Locale } from '@/lib/locales';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

type IsKolu = 'yazilim' | 'danismanlik' | 'muhendislik';
type ImzaRengi = 'primary' | 'amber' | 'navy';

interface LocaleString {
  tr: string;
  en: string;
}

export interface ServiceCard {
  isKolu: IsKolu;
  baslik: LocaleString;
  ozet: LocaleString;
  imzaRengi?: ImzaRengi;
}

interface ServiceCardsProps {
  services: ServiceCard[];
  locale: Locale;
}

// ── Static fallback data ──────────────────────────────────────────────────────

const FALLBACK_CARDS: ServiceCard[] = [
  {
    isKolu: 'yazilim',
    baslik: { tr: 'Yazılım', en: 'Software' },
    ozet: {
      tr: 'YangınPro & MekanikPro — fikri mülkiyeti bize ait yangın ve mekanik mühendislik yazılımları.',
      en: 'Fire & mechanical engineering software we own end-to-end — YangınPro & MekanikPro.',
    },
    imzaRengi: 'primary',
  },
  {
    isKolu: 'danismanlik',
    baslik: { tr: 'Danışmanlık', en: 'Consulting' },
    ozet: {
      tr: 'İtfaiyeden olumlu rapor ve yönetmeliğe tam uyum için danışmanlık ve projelendirme.',
      en: 'Consulting & project design for fire-department approval and full regulatory compliance.',
    },
    imzaRengi: 'amber',
  },
  {
    isKolu: 'muhendislik',
    baslik: { tr: 'Mühendislik', en: 'Engineering' },
    ozet: {
      tr: 'Aktif söndürme, pasif önleme ve mekanik tesisat uygulama & taahhüt.',
      en: 'Active suppression, passive prevention, and mechanical installation & contracting.',
    },
    imzaRengi: 'navy',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const HREF_MAP: Record<IsKolu, string> = {
  yazilim: '/yazilim',
  danismanlik: '/danismanlik',
  muhendislik: '/muhendislik',
};

const ACCENT_CLASSES: Record<ImzaRengi, { border: string; icon: string; badge: string }> = {
  primary: {
    border: 'border-primary/40 group-hover:border-primary',
    icon: 'bg-primary/10 text-primary',
    badge: 'bg-primary/10 text-primary ring-primary/20',
  },
  amber: {
    border: 'border-amber/40 group-hover:border-amber',
    icon: 'bg-amber/10 text-amber',
    badge: 'bg-amber/10 text-amber ring-amber/20',
  },
  navy: {
    border: 'border-navy/40 group-hover:border-navy',
    icon: 'bg-navy/10 text-navy',
    badge: 'bg-navy/10 text-navy ring-navy/20',
  },
};

// Simple icons for each arm (inline SVG — avoids external dependency)
function IsKoluIcon({ isKolu, className }: { isKolu: IsKolu; className?: string }) {
  if (isKolu === 'yazilim') {
    return (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    );
  }
  if (isKolu === 'danismanlik') {
    return (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    );
  }
  // muhendislik
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ServiceCards({ services, locale }: ServiceCardsProps) {
  const cards = services.length > 0 ? services : FALLBACK_CARDS;

  const arrowLabel = locale === 'tr' ? 'Keşfet' : 'Explore';
  const sectionLabel =
    locale === 'tr' ? 'Hizmet Kollarımız' : 'Our Business Arms';

  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section heading */}
        <div className="mb-12 text-center">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
            {sectionLabel}
          </span>
          <h2 className="font-display mt-4 text-3xl font-bold text-foreground sm:text-4xl">
            {locale === 'tr'
              ? 'Tek çatı altında üç uzmanlık'
              : 'Three areas of expertise under one roof'}
          </h2>
        </div>

        {/* Cards grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const renk: ImzaRengi = card.imzaRengi ?? 'primary';
            const accent = ACCENT_CLASSES[renk];
            const href = HREF_MAP[card.isKolu];
            const title = pick(card.baslik, locale) ?? card.baslik.tr;
            const summary = pick(card.ozet, locale) ?? card.ozet.tr;

            return (
              <Link
                key={card.isKolu}
                href={href}
                className={cn(
                  'group relative flex flex-col rounded-2xl border bg-surface p-6 transition-all duration-200',
                  'hover:-translate-y-1 hover:shadow-lg',
                  accent.border,
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl',
                    accent.icon,
                  )}
                >
                  <IsKoluIcon isKolu={card.isKolu} className="h-5 w-5" />
                </div>

                {/* Title */}
                <h3 className="font-display text-lg font-bold text-foreground mb-2">
                  {title}
                </h3>

                {/* Summary */}
                <p className="flex-1 text-sm leading-relaxed text-muted">
                  {summary}
                </p>

                {/* Arrow link */}
                <div
                  className={cn(
                    'mt-6 inline-flex items-center gap-1 text-sm font-semibold transition-colors',
                    renk === 'primary' && 'text-primary',
                    renk === 'amber' && 'text-amber',
                    renk === 'navy' && 'text-navy',
                  )}
                >
                  {arrowLabel}
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
