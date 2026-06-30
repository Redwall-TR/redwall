import { describe, it, expect } from 'vitest'
import { referansHref } from './references'

describe('referansHref', () => {
  it('proje sayısı > 0 ve slug varsa link döner', () => {
    expect(referansHref({ id: 'a', slug: 'acme' }, { a: 2 })).toBe('/referanslar/acme')
  })
  it('proje sayısı 0 ise undefined döner', () => {
    expect(referansHref({ id: 'a', slug: 'acme' }, { a: 0 })).toBeUndefined()
  })
  it('counts içinde yoksa undefined döner', () => {
    expect(referansHref({ id: 'b', slug: 'beta' }, { a: 2 })).toBeUndefined()
  })
  it('slug yoksa undefined döner', () => {
    expect(referansHref({ id: 'a' }, { a: 2 })).toBeUndefined()
  })
})
