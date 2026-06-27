import { pick, type Locale } from '@/lib/locales';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Feature {
  baslik: { tr: string; en: string };
  aciklama: { tr: string; en: string };
  icon?: string;
}

interface ProductFeaturesProps {
  features: Feature[];
  locale: Locale;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProductFeatures({ features, locale }: ProductFeaturesProps) {
  if (features.length === 0) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, i) => {
        const baslik = pick(feature.baslik, locale) ?? feature.baslik.tr;
        const aciklama = pick(feature.aciklama, locale) ?? feature.aciklama.tr;

        return (
          <div
            key={i}
            className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-3"
          >
            {/* Icon badge */}
            <div className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckIcon />
            </div>

            {/* Title */}
            <h3 className="font-display text-base font-bold text-foreground">
              {baslik}
            </h3>

            {/* Description */}
            <p className="text-sm leading-relaxed text-muted flex-1">
              {aciklama}
            </p>
          </div>
        );
      })}
    </div>
  );
}
