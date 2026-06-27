export type Locale = 'tr' | 'en';
export const LOCALES: Locale[] = ['tr', 'en'];
export const DEFAULT_LOCALE: Locale = 'tr';
export type LocaleString = Record<Locale, string>;

export function isLocale(x: string): x is Locale {
  return (LOCALES as string[]).includes(x);
}
export function pick<T>(field: Record<Locale, T> | undefined, locale: Locale): T | undefined {
  if (!field) return undefined;
  const v = field[locale];
  if (v === '' || v === undefined || v === null) return field[DEFAULT_LOCALE];
  return v;
}
