import { describe, it, expect } from 'vitest'
import { safe } from './client'

describe('safe', () => {
  it('returns fallback on throw', async () => {
    expect(await safe(async () => { throw new Error('x') }, 42)).toBe(42)
  })

  it('returns value on success', async () => {
    expect(await safe(async () => 7, 0)).toBe(7)
  })
})
