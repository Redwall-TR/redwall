import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { plainToLexical } from '../lib/lexical/plainToLexical'
import { REDWALL_CUT_KART } from '../data/redwall-cut'
import type { Product } from '../payload-types'

const zengin = (metin: string) => plainToLexical(metin) as NonNullable<Product['aciklama']>

// Veri migration'ı: Redwall Cut ürün kaydını ekler (liste kartı + sitemap + detay sayfasının
// "yayında" kapısı bu kayda bakar). Landing içeriği koddadır: src/data/redwall-cut.ts.
// DİKKAT: payload.* çağrılarına `req` geçilir; yoksa migration transaction'ı ile deadlock olur.
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const k = REDWALL_CUT_KART
  const mevcut = await payload.find({
    collection: 'product',
    where: { slug: { equals: k.slug } },
    limit: 1,
    req,
  })
  if (mevcut.totalDocs > 0) return

  const doc = await payload.create({
    collection: 'product',
    locale: 'tr',
    data: {
      slug: k.slug,
      ad: k.ad,
      yayinda: true,
      slogan: k.slogan.tr,
      aciklama: zengin(k.aciklama.tr),
      sira: k.sira,
    },
    req,
  })
  await payload.update({
    collection: 'product',
    id: doc.id,
    locale: 'en',
    data: { slogan: k.slogan.en, aciklama: zengin(k.aciklama.en) },
    req,
  })
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({
    collection: 'product',
    where: { slug: { equals: REDWALL_CUT_KART.slug } },
    req,
  })
}
