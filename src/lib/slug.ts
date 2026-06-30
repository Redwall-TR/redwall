const TR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
  ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
}

/** Türkçe-duyarlı slug üretir; boş/anlamsız girdide '' döner. */
export function slugify(input: string): string {
  if (!input) return ''
  return input
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => TR_MAP[c] ?? c)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Liste için benzersiz slug atar: dolu `slug` korunur; boş olan `ad`'dan
 * üretilir; çakışmada `-2`, `-3`… soneki eklenir. slugify boş dönerse
 * 'referans' tabanı kullanılır.
 */
export function buildUniqueSlugs<T extends { ad: string; slug?: string | null }>(
  items: T[],
): { item: T; slug: string }[] {
  const used = new Set<string>()
  const out: { item: T; slug: string }[] = []
  for (const item of items) {
    if (item.slug) {
      used.add(item.slug)
      out.push({ item, slug: item.slug })
      continue
    }
    const base = slugify(item.ad) || 'referans'
    let s = base
    let n = 2
    while (used.has(s)) s = `${base}-${n++}`
    used.add(s)
    out.push({ item, slug: s })
  }
  return out
}
