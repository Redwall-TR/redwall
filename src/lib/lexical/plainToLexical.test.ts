import { describe, it, expect } from 'vitest'
import { plainToLexical, normalizeToLexical } from './plainToLexical'

describe('plainToLexical', () => {
  it('boş/whitespace → boş root', () => {
    expect(plainToLexical('').root.children).toEqual([])
    expect(plainToLexical('   ').root.children).toEqual([])
    expect(plainToLexical(null).root.children).toEqual([])
    expect(plainToLexical(undefined).root.children).toEqual([])
  })
  it('tek satır → tek paragraf, doğru metin', () => {
    const s = plainToLexical('Merhaba dünya')
    expect(s.root.children).toHaveLength(1)
    const p = s.root.children[0] as { type: string; children: { text: string }[] }
    expect(p.type).toBe('paragraph')
    expect(p.children[0].text).toBe('Merhaba dünya')
  })
  it('çok satır → satır başına paragraf, boş satırlar atlanır', () => {
    const s = plainToLexical('bir\n\niki\n')
    expect(s.root.children).toHaveLength(2)
  })
})

describe('normalizeToLexical', () => {
  it('null/undefined/boş string → null', () => {
    expect(normalizeToLexical(null)).toBeNull()
    expect(normalizeToLexical(undefined)).toBeNull()
    expect(normalizeToLexical('   ')).toBeNull()
  })
  it('dolu string → Lexical state (paragraf)', () => {
    const s = normalizeToLexical('selam')
    expect(s?.root.children).toHaveLength(1)
  })
  it('zaten Lexical (root olan obje) → aynen döner', () => {
    const existing = plainToLexical('x')
    expect(normalizeToLexical(existing)).toBe(existing)
  })
  it('root.children boş olan Lexical → null (render edilecek şey yok)', () => {
    expect(normalizeToLexical(plainToLexical(''))).toBeNull()
  })
})
