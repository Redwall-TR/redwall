import { describe, it, expect } from 'vitest'
import { unwrap, mediaRef } from './transform'

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

describe('mediaRef', () => {
  it('returns object with url for valid upload object', () => {
    expect(mediaRef({ url: '/api/media/file/x.png' })).toEqual({ url: '/api/media/file/x.png' })
  })

  it('returns null for null input', () => {
    expect(mediaRef(null)).toBeNull()
  })

  it('returns null for unresolved numeric id', () => {
    expect(mediaRef(5)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(mediaRef(undefined)).toBeNull()
  })

  it('returns null for string without url property', () => {
    expect(mediaRef('just-a-string')).toBeNull()
  })

  it('returns null for object without url property', () => {
    expect(mediaRef({ id: 5, filename: 'test.png' })).toBeNull()
  })
})
