export interface ReferenceListItem {
  id: string
  ad: string
  slug?: string
  logo?: unknown
  gorus?: unknown
}

/** İlişkili projesi olan + slug'ı olan referans için detay linki; aksi halde undefined. */
export function referansHref(
  ref: { id: string; slug?: string },
  counts: Record<string, number>,
): string | undefined {
  if (!ref.slug) return undefined
  return (counts[ref.id] ?? 0) > 0 ? `/referanslar/${ref.slug}` : undefined
}
