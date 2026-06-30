import type { Payload, PayloadRequest } from 'payload'
import { buildUniqueSlugs } from '@/lib/slug'

/**
 * Slug'ı boş olan tüm referans kayıtlarını ad'dan üretilen benzersiz slug ile
 * doldurur. İdempotent: dolu slug'lara dokunmaz. Doldurulan satır sayısını döner.
 *
 * KRİTİK: Bir migration içinden çağrılırken `req` MUTLAKA geçilmelidir; aksi
 * halde find/update ayrı bir bağlantı açar ve migration'ın ALTER TABLE/CREATE
 * INDEX ile aldığı ACCESS EXCLUSIVE kilidiyle self-deadlock olur (deploy asılır).
 * `req` geçilince işlemler migration transaction'ına katılır → kilit çakışması yok.
 * CLI'dan (transaction yok) çağrılırken `req` verilmez.
 */
export async function backfillReferansSlugs(
  payload: Payload,
  req?: PayloadRequest,
): Promise<number> {
  const { docs } = await payload.find({
    collection: 'referans',
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    req,
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
      req,
    })
    filled++
  }
  return filled
}
