import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { REDWALL_CUT_SLUG } from '../data/redwall-cut'
import { redwallCutUrununuYaz } from '../payload/redwallCutUrunu'

// Veri migration'ı: Redwall Cut ürün kaydını başlangıç içeriğiyle ekler (kart + landing).
// Kayıt varsa dokunmaz; içerik sonrasında /admin'den yönetilir.
// Şema (landing alanları) bir önceki migration'dadır: product_landing.
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await redwallCutUrununuYaz(payload, req)
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({ collection: 'product', where: { slug: { equals: REDWALL_CUT_SLUG } }, req })
}
