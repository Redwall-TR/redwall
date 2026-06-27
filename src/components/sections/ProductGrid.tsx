import { pick, type Locale } from '@/lib/locales';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

interface LocaleString {
  tr: string;
  en: string;
}

export interface ProductCard {
  slug: string;
  ad: string;
  slogan?: LocaleString;
  aciklama?: LocaleString;
  ozellikler?: Array<{
    baslik?: LocaleString;
    aciklama?: LocaleString;
  }>;
}

interface ProductGridProps {
  products: ProductCard[];
  locale: Locale;
}

// ── Fallback data ─────────────────────────────────────────────────────────────

const FALLBACK_PRODUCTS: ProductCard[] = [
  {
    slug: 'yanginpro',
    ad: 'YangınPro',
    slogan: {
      tr: 'Yangın Mühendisliğini Dijitalleştirin',
      en: 'Digitise Fire Engineering',
    },
    aciklama: {
      tr: 'Yangın mühendisliği ve itfaiye uygunluk süreçlerini dijitalleştiren yazılım.',
      en: 'Software that digitizes fire engineering and fire-department compliance workflows.',
    },
  },
  {
    slug: 'mekanikpro',
    ad: 'MekanikPro',
    slogan: {
      tr: 'Mekanik Hesapları Otomatikleştirin',
      en: 'Automate Mechanical Calculations',
    },
    aciklama: {
      tr: 'Mekanik tesisat ve HVAC mühendisliği hesaplarını otomatikleştiren yazılım.',
      en: 'Software that automates mechanical installation and HVAC engineering calculations.',
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProductGrid({ products, locale }: ProductGridProps) {
  const cards = products.length > 0 ? products : FALLBACK_PRODUCTS;

  const badgeLabel = locale === 'tr' ? 'Yazılım' : 'Software';
  const detailsLabel = locale === 'tr' ? 'İncele' : 'View Details';

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {cards.map((product) => {
        const slogan = pick(product.slogan, locale);
        const aciklama = pick(product.aciklama, locale);

        return (
          <Link
            key={product.slug}
            href={`/yazilim/${product.slug}`}
            className={cn(
              'group relative flex flex-col rounded-2xl border border-primary/30 bg-surface p-6',
              'transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-lg',
            )}
          >
            {/* Icon */}
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CodeIcon className="h-5 w-5" />
            </div>

            {/* Badge */}
            <div className="mb-3">
              <Badge tone="primary">{badgeLabel}</Badge>
            </div>

            {/* Product name */}
            <h3 className="font-display text-xl font-bold text-foreground mb-1">
              {product.ad}
            </h3>

            {/* Slogan */}
            {slogan && (
              <p className="text-sm font-medium text-primary mb-3">{slogan}</p>
            )}

            {/* Description */}
            {aciklama && (
              <p className="flex-1 text-sm leading-relaxed text-muted">
                {aciklama}
              </p>
            )}

            {/* Arrow link */}
            <div className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors">
              {detailsLabel}
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
  );
}
