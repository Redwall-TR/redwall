import type { CSSProperties } from 'react';

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Fixed bright hex accent (the hero band is always dark). */
  accent?: string;
  /** Short scope labels that encode what the page actually covers. */
  chips?: string[];
  /** Oversized faint background mark — pass an svg/icon node. */
  glyph?: React.ReactNode;
}

/**
 * Signature page hero band for sub-pages: always-dark, blueprint-textured,
 * with a per-page accent glow + eyebrow. Anchors each page with the brand's
 * engineering identity instead of a thin header on flat white.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  accent = '#e63950',
  chips,
  glyph,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#141416] text-white">
      {/* blueprint technical texture */}
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-[0.06]" aria-hidden />
      {/* accent glow */}
      <div
        className="pointer-events-none absolute -right-28 -top-28 h-[28rem] w-[28rem] rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      {/* oversized faint signature glyph */}
      {glyph && (
        <div
          className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-[15%] opacity-[0.07] md:block"
          style={{ color: accent }}
          aria-hidden
        >
          {glyph}
        </div>
      )}

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-32 sm:px-6">
        {eyebrow && (
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-8" style={{ backgroundColor: accent }} />
            <span
              className="text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: accent }}
            >
              {eyebrow}
            </span>
          </div>
        )}

        <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.06] sm:text-5xl lg:text-6xl">
          {title}
        </h1>

        {description && (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">{description}</p>
        )}

        {chips && chips.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2">
            {chips.map((c) => (
              <li
                key={c}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80"
              >
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* bottom hairline accent that fades into the content */}
      <div
        className="absolute bottom-0 left-0 h-px w-full"
        style={
          {
            background: `linear-gradient(90deg, transparent, ${accent}66, transparent)`,
          } as CSSProperties
        }
        aria-hidden
      />
    </section>
  );
}
