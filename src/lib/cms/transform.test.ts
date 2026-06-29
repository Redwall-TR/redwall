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
