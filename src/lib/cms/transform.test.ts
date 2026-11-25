import { describe, it, expect } from 'vitest'
import { unwrap } from './transform'

describe('unwrap', () => {
  it('unwraps nested field from array', () => {
    expect(unwrap([{ etiket: { tr: 'a' } }], 'etiket')).toEqual([{ tr: 'a' }])
  })

  it('returns empty array for undefined input', () => {
    expect(unwrap(undefined, 'etiket')).toEqual([])
  })

  it('returns empty array for null input', () => {
    expect(unwrap(null, 'etiket')).toEqual([])
  })

  it('filters out falsy values', () => {
    expect(unwrap([{ etiket: { tr: 'a' } }, { etiket: null }, { etiket: undefined }], 'etiket')).toEqual([
      { tr: 'a' },
    ])
  })

  it('handles empty array', () => {
    expect(unwrap([], 'etiket')).toEqual([])
  })
})

import { yerellestir, paketHucresi, REDWALL_CUT_LANDING } from '@/data/redwall-cut'

describe('redwall-cut landing', () => {
  it('yerellestir: { tr, en } yapraklarını seçilen dile indirir, boşsa Türkçeye düşer', () => {
    const v = { baslik: { tr: 'Merhaba', en: 'Hello' }, sureHedef: 120, bolumler: [{ id: 'x', tur: 'sure', giris: { tr: 'Yalnız TR', en: '' } }] }
    expect(yerellestir(v, 'en')).toEqual({ baslik: 'Hello', sureHedef: 120, bolumler: [{ id: 'x', tur: 'sure', giris: 'Yalnız TR' }] })
  })
  it('paketHucresi: var/yok işarete, başka metin metne döner', () => {
    expect([paketHucresi('Var'), paketHucresi('no'), paketHucresi(null), paketHucresi('İlk beş tema')]).toEqual([true, false, false, 'İlk beş tema'])
  })
  it('başlangıç içeriğinde her metnin iki dili de dolu ve sürüm numarası yok', () => {
    const metin = JSON.stringify(REDWALL_CUT_LANDING)
    expect(metin).not.toMatch(/"(tr|en)":""/)
    expect(metin).not.toMatch(/v\d+\.\d+/)
  })
})
