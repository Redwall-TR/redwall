import { describe, it, expect } from 'vitest';
import { isLocale, pick, DEFAULT_LOCALE } from './locales';

describe('isLocale', () => {
  it('tr/en için true, diğerleri için false', () => {
    expect(isLocale('tr')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('de')).toBe(false);
  });
});
describe('pick', () => {
  it('aktif locale değerini döndürür', () => {
    expect(pick({ tr: 'Merhaba', en: 'Hello' }, 'en')).toBe('Hello');
  });
  it('aktif locale boşsa varsayılana düşer', () => {
    expect(pick({ tr: 'Merhaba', en: '' }, 'en')).toBe('Merhaba');
  });
  it('alan undefined ise undefined döner', () => {
    expect(pick(undefined, 'tr')).toBeUndefined();
  });
});
