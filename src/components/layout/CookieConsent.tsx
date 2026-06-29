'use client';

import { useReducer, useEffect } from 'react';
import { Link } from '@/i18n/navigation';

const STORAGE_KEY = 'cookie-consent';

const strings = {
  tr: {
    text: 'Bu site, deneyiminizi iyileştirmek için yalnızca zorunlu çerezler kullanır.',
    linkLabel: 'Çerez Politikası',
    accept: 'Kabul Et',
    reject: 'Reddet',
  },
  en: {
    text: 'This site uses strictly necessary cookies only to improve your experience.',
    linkLabel: 'Cookie Policy',
    accept: 'Accept',
    reject: 'Reject',
  },
} as const;

type State = 'unknown' | 'show' | 'hidden';

function reducer(_state: State, action: 'init-show' | 'init-hide' | 'dismiss'): State {
  if (action === 'init-show') return 'show';
  if (action === 'init-hide') return 'hidden';
  if (action === 'dismiss') return 'hidden';
  return 'hidden';
}

export default function CookieConsent({ locale }: { locale: string }) {
  const [state, dispatch] = useReducer(reducer, 'unknown');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    dispatch(stored ? 'init-hide' : 'init-show');
  }, []);

  function handleChoice(value: 'accepted' | 'rejected') {
    localStorage.setItem(STORAGE_KEY, value);
    dispatch('dismiss');
  }

  if (state !== 'show') return null;

  const lang = locale === 'en' ? 'en' : 'tr';
  const s = strings[lang];

  return (
    <div
      role="dialog"
      aria-label={lang === 'tr' ? 'Çerez bildirimi' : 'Cookie notice'}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#141416] text-white shadow-lg"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-white/70">
          {s.text}{' '}
          <Link
            href="/yasal/cerez-politikasi"
            className="text-white/90 underline underline-offset-2 transition-colors hover:text-white"
          >
            {s.linkLabel}
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={() => handleChoice('rejected')}
            className="rounded-md border border-white/20 px-4 py-1.5 text-sm text-white/65 transition-colors hover:border-white/40 hover:text-white"
          >
            {s.reject}
          </button>
          <button
            onClick={() => handleChoice('accepted')}
            className="rounded-md bg-primary px-4 py-1.5 text-sm text-white transition-colors hover:bg-primary/90"
          >
            {s.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
