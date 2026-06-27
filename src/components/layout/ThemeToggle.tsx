'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const ta = useTranslations('a11y');
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // next-themes mount guard: sets mounted after hydration to avoid SSR mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const isDark = resolvedTheme === 'dark';
  return (
    <button
      aria-label={ta('temaDegistir')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-surface"
    >
      {mounted ? (isDark ? '☀️' : '🌙') : null}
    </button>
  );
}
