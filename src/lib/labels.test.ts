import { describe, it, expect } from 'vitest';
import { isKoluLabel } from './labels';

describe('isKoluLabel', () => {
  it('yazilim tr için Yazılım döner', () => {
    expect(isKoluLabel('yazilim', 'tr')).toBe('Yazılım');
  });
  it('yazilim en için Software döner', () => {
    expect(isKoluLabel('yazilim', 'en')).toBe('Software');
  });
  it('danismanlik tr için Danışmanlık döner', () => {
    expect(isKoluLabel('danismanlik', 'tr')).toBe('Danışmanlık');
  });
  it('danismanlik en için Consulting döner', () => {
    expect(isKoluLabel('danismanlik', 'en')).toBe('Consulting');
  });
  it('muhendislik tr için Mühendislik döner', () => {
    expect(isKoluLabel('muhendislik', 'tr')).toBe('Mühendislik');
  });
  it('muhendislik en için Engineering döner', () => {
    expect(isKoluLabel('muhendislik', 'en')).toBe('Engineering');
  });
});
