import { describe, it, expect } from 'vitest'
import { sanitizeSvg } from './sanitizeSvg'

describe('sanitizeSvg', () => {
  it('<script> etiketini kaldırır, çizimi korur', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path d="M0 0"/></svg>',
    )
    expect(out).not.toMatch(/<script/i)
    expect(out).toMatch(/path/i)
  })

  it('event handler (onload) attribute’ünü kaldırır', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><rect onload="alert(1)" width="10" height="10"/></svg>',
    )
    expect(out).not.toMatch(/onload/i)
    expect(out).toMatch(/rect/i)
  })

  it('foreignObject/HTML enjeksiyonunu kaldırır', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><img src=x onerror="alert(1)"></foreignObject></svg>',
    )
    expect(out).not.toMatch(/foreignObject/i)
    expect(out).not.toMatch(/onerror/i)
  })

  it('temiz SVG öğelerini ve attribute’lerini korur', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 2L3 4" fill="#fff"/></svg>',
    )
    expect(out).toMatch(/path/i)
    expect(out).toMatch(/M1 2L3 4/)
  })
})
