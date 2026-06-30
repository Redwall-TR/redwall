import type { Payload } from 'payload'
import { buildUniqueSlugs } from '@/lib/slug'

/**
 * Slug'ı boş olan tüm referans kayıtlarını ad'dan üretilen benzersiz slug ile
 * doldurur. İdempotent: dolu slug'lara dokunmaz. Doldurulan satır sayısını döner.
 */
export async function backfillReferansSlugs(payload: Payload): Promise<number> {
  const { docs } = await payload.find({
    collection: 'referans',
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  const items = docs.map((d) => ({
    id: d.id,
    ad: (d as unknown as { ad: string }).ad,
    slug: (d as unknown as { slug?: string | null }).slug ?? null,
  }))

  const assigned = buildUniqueSlugs(items)
  let filled = 0
  for (const { item, slug } of assigned) {
    if (item.slug) continue
    await payload.update({
      collection: 'referans',
      id: item.id,
      data: { slug } as unknown as Record<string, unknown>,
      overrideAccess: true,
    })
    filled++
  }
  return filled
}
