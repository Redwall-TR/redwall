import DOMPurify from 'isomorphic-dompurify'

/**
 * Yüklenen SVG içeriğini XSS'e karşı güvenli hale getirir: `<script>`,
 * `<foreignObject>`, event handler'ları (on*), `javascript:` URL'leri ve diğer
 * aktif içeriği strip eder; geçerli SVG çizim öğelerini (path, rect, g, vb.) korur.
 * DOMPurify'ın SVG profili kullanılır (savunmaya ek olarak script/foreignObject
 * açıkça yasaklanır).
 */
export function sanitizeSvg(input: string): string {
  return DOMPurify.sanitize(input, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject'],
  })
}
