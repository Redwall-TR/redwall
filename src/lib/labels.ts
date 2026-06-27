import type { IsKolu, Locale } from '@/types';

const IS_KOLU_LABELS: Record<IsKolu, Record<Locale, string>> = {
  yazilim: { tr: 'Yazılım', en: 'Software' },
  danismanlik: { tr: 'Danışmanlık', en: 'Consulting' },
  muhendislik: { tr: 'Mühendislik', en: 'Engineering' },
};

export function isKoluLabel(isKolu: IsKolu, locale: Locale): string {
  return IS_KOLU_LABELS[isKolu]?.[locale] ?? isKolu;
}
