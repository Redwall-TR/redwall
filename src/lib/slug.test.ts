import { describe, it, expect } from 'vitest'
import { slugify, buildUniqueSlugs } from './slug'

describe('slugify', () => {
  it('Türkçe karakterleri ASCII slug yapar', () => {
    expect(slugify('Şişli Ağır Çelik İnşaat')).toBe('sisli-agir-celik-insaat')
  })
  it('boşluk ve sembolleri tek tireye indirger, baş/son tireyi kırpar', () => {
    expect(slugify('  Redwall   &  Co.  ')).toBe('redwall-co')
  })
  it('İ ve ı harflerini i yapar', () => {
    expect(slugify('İLKER ışık')).toBe('ilker-isik')
  })
  it('boş girdi için boş döner', () => {
    expect(slugify('')).toBe('')
  })
})

describe('buildUniqueSlugs', () => {
  it('mevcut slugu korur, boş olanı ad\'dan üretir', () => {
    const out = buildUniqueSlugs([
      { ad: 'Acme', slug: 'acme-custom' },
      { ad: 'Beta A.Ş.', slug: null },
    ])
    expect(out.map((o) => o.slug)).toEqual(['acme-custom', 'beta-a-s'])
  })
  it('çakışan sluglara sonek ekler', () => {
    const out = buildUniqueSlugs([
      { ad: 'Çelik', slug: null },
      { ad: 'Celik', slug: null },
    ])
    expect(out.map((o) => o.slug)).toEqual(['celik', 'celik-2'])
  })
  it('slugify boş dönerse referans tabanını kullanır', () => {
    const out = buildUniqueSlugs([{ ad: '!!!', slug: null }])
    expect(out[0].slug).toBe('referans')
  })
})
