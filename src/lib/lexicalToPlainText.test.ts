import { describe, it, expect } from 'vitest';
import { lexicalToPlainText } from './lexicalToPlainText';

describe('lexicalToPlainText', () => {
  it('düz string → aynen döner (trim)', () => {
    expect(lexicalToPlainText('  merhaba  ')).toBe('merhaba');
  });
  it('null/undefined → boş string', () => {
    expect(lexicalToPlainText(null)).toBe('');
    expect(lexicalToPlainText(undefined)).toBe('');
  });
  it('tek paragraf Lexical → metin', () => {
    const v = { root: { children: [ { type: 'paragraph', children: [ { type: 'text', text: 'Yangın güvenliği' } ] } ] } };
    expect(lexicalToPlainText(v)).toBe('Yangın güvenliği');
  });
  it('çok paragraf → boşlukla birleşir', () => {
    const v = { root: { children: [
      { type: 'paragraph', children: [ { type: 'text', text: 'Bir' } ] },
      { type: 'paragraph', children: [ { type: 'text', text: 'iki' } ] },
    ] } };
    expect(lexicalToPlainText(v)).toBe('Bir iki');
  });
  it('iç içe (liste/format) → tüm text düğümleri', () => {
    const v = { root: { children: [ { type: 'list', children: [
      { type: 'listitem', children: [ { type: 'text', text: 'a' } ] },
      { type: 'listitem', children: [ { type: 'text', text: 'b' } ] },
    ] } ] } };
    expect(lexicalToPlainText(v)).toBe('a b');
  });
  it('boş root → boş string', () => {
    expect(lexicalToPlainText({ root: { children: [] } })).toBe('');
  });
});
