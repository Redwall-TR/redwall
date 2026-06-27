import { pick, type Locale } from '@/lib/locales';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

interface HeroCta {
  etiket: LocaleString;
  href: string;
}

export interface HeroData {
  heroBaslik?: LocaleString;
  heroAltMetin?: LocaleString;
  heroBirincilCta?: HeroCta;
  heroIkincilCta?: HeroCta;
}

interface HeroProps {
  data: HeroData | null;
  locale: Locale;
}

// ── Fallback content ─────────────────────────────────────────────────────────

const FALLBACK: Record<Locale, { baslik: string; altMetin: string; birincil: string; ikincil: string }> = {
  tr: {
    baslik: 'Yangın güvenliğinde 360° yaklaşım: Yazılım, Danışmanlık, Mühendislik.',
    altMetin:
      'Redwall; kendi geliştirdiği yazılımlar, itfaiye uyumlu danışmanlık ve anahtar teslim mühendislik hizmetleriyle yangın güvenliğinin her adımında yanınızda.',
    birincil: 'Teklif İste',
    ikincil: 'Yazılımı İncele',
  },
  en: {
    baslik: 'A 360° approach to fire safety: Software, Consulting, Engineering.',
    altMetin:
      'Redwall covers every step of fire safety — proprietary software, fire-department-compliant consulting, and turnkey engineering services.',
    birincil: 'Get a Quote',
    ikincil: 'Explore Software',
  },
};

const FALLBACK_HREFS = { birincil: '/teklif', ikincil: '/yazilim' } as const;

// ── Component ────────────────────────────────────────────────────────────────

export default function Hero({ data, locale }: HeroProps) {
  const fb = FALLBACK[locale];

  const baslik =
    data?.heroBaslik ? pick(data.heroBaslik, locale) ?? fb.baslik : fb.baslik;
  const altMetin =
    data?.heroAltMetin ? pick(data.heroAltMetin, locale) ?? fb.altMetin : fb.altMetin;

  const birincilLabel =
    data?.heroBirincilCta?.etiket
      ? pick(data.heroBirincilCta.etiket, locale) ?? fb.birincil
      : fb.birincil;
  const birincilHref = data?.heroBirincilCta?.href ?? FALLBACK_HREFS.birincil;

  const ikincilLabel =
    data?.heroIkincilCta?.etiket
      ? pick(data.heroIkincilCta.etiket, locale) ?? fb.ikincil
      : fb.ikincil;
  const ikincilHref = data?.heroIkincilCta?.href ?? FALLBACK_HREFS.ikincil;

  // Split headline at the colon so we can accent the second part
  const colonIdx = baslik.indexOf(':');
  const beforeColon = colonIdx !== -1 ? baslik.slice(0, colonIdx + 1) : baslik;
  const afterColon = colonIdx !== -1 ? baslik.slice(colonIdx + 1).trim() : '';

  return (
    <section
      className={cn(
        'relative isolate overflow-hidden bg-[#141416] text-white',
        'py-24 sm:py-32',
      )}
    >
      {/* Blueprint grid overlay */}
      <div
        className="blueprint-grid absolute inset-0 opacity-[0.06] pointer-events-none"
        aria-hidden="true"
      />

      {/* Radial glow behind headline */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Eyebrow badge */}
        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20 mb-6">
          {locale === 'tr' ? 'Yangın Güvenliği Çözümleri' : 'Fire Safety Solutions'}
        </span>

        {/* Main headline */}
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl max-w-3xl">
          {afterColon ? (
            <>
              <span className="text-white">{beforeColon}</span>{' '}
              <span className="text-gradient">{afterColon}</span>
            </>
          ) : (
            <span className="text-gradient">{baslik}</span>
          )}
        </h1>

        {/* Subtext */}
        <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-white/70">
          {altMetin}
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap gap-4">
          <Button href={birincilHref} variant="primary">
            {birincilLabel}
          </Button>
          <Button
            href={ikincilHref}
            variant="secondary"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            {ikincilLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
