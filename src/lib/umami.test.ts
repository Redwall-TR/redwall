import { describe, it, expect } from 'vitest';
import { umamiScriptSrc } from './umami';

describe('umamiScriptSrc', () => {
  it('ikisi de doluysa src + websiteId döner', () => {
    expect(umamiScriptSrc('https://analytics.redwall.tr', 'abc-123')).toEqual({
      src: 'https://analytics.redwall.tr/script.js', websiteId: 'abc-123',
    });
  });
  it('trailing slash normalize edilir', () => {
    expect(umamiScriptSrc('https://analytics.redwall.tr/', 'x')?.src).toBe('https://analytics.redwall.tr/script.js');
  });
  it('base yoksa null', () => {
    expect(umamiScriptSrc(undefined, 'x')).toBeNull();
    expect(umamiScriptSrc('', 'x')).toBeNull();
  });
  it('websiteId yoksa null', () => {
    expect(umamiScriptSrc('https://analytics.redwall.tr', undefined)).toBeNull();
    expect(umamiScriptSrc('https://analytics.redwall.tr', '')).toBeNull();
  });
});
