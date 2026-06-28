'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { LOCALES, type Locale } from '@/lib/locales';
import { cn } from '@/lib/utils';

// ── Bayraklar (küçük, yuvarlatılmış SVG) ───────────────────────────────────────

function Flag({ locale, className }: { locale: string; className?: string }) {
  const cls = cn('h-3.5 w-5 flex-shrink-0 rounded-[2px] ring-1 ring-black/10', className);
  if (locale === 'tr') {
    return (
      <svg viewBox="0 0 24 16" className={cls} aria-hidden="true">
        <rect width="24" height="16" fill="#E30A17" />
        <circle cx="9" cy="8" r="3.8" fill="#fff" />
        <circle cx="10.3" cy="8" r="3" fill="#E30A17" />
        <polygon
          fill="#fff"
          points="13.8,6 14.3,7.4 15.7,7.4 14.6,8.3 15,9.6 13.8,8.8 12.6,9.6 13,8.3 11.9,7.4 13.3,7.4"
        />
      </svg>
    );
  }
  // English → İngiltere (Union Jack, basitleştirilmiş)
  return (
    <svg viewBox="0 0 24 16" className={cls} aria-hidden="true">
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#fff" strokeWidth="3" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#C8102E" strokeWidth="1.4" />
      <path d="M12 0V16M0 8H24" stroke="#fff" strokeWidth="4" />
      <path d="M12 0V16M0 8H24" stroke="#C8102E" strokeWidth="2.2" />
    </svg>
  );
}

const LABELS: Record<string, string> = { tr: 'Türkçe', en: 'English' };

// ── Component ──────────────────────────────────────────────────────────────────

export default function LocaleSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Dışarı tıklama / Escape ile kapat
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function select(l: Locale) {
    setOpen(false);
    router.replace(pathname, { locale: l });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Dil / Language"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Flag locale={locale} />
        <span className="uppercase">{locale}</span>
        <svg
          className={cn('h-3 w-3 text-muted transition-transform', open && 'rotate-180')}
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 pt-2">
          <div
            role="menu"
            className="min-w-[150px] overflow-hidden rounded-lg border border-border bg-surface p-1 shadow-lg"
          >
            {LOCALES.map((l: Locale) => (
              <button
                key={l}
                type="button"
                role="menuitem"
                onClick={() => select(l)}
                aria-current={l === locale ? 'true' : undefined}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                  l === locale
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-foreground hover:bg-background',
                )}
              >
                <Flag locale={l} />
                <span>{LABELS[l]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
