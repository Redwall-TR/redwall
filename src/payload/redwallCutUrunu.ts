import type { Payload, PayloadRequest } from 'payload'
import { plainToLexical } from '../lib/lexical/plainToLexical'
import { REDWALL_CUT_KART, REDWALL_CUT_LANDING, yerellestir, type Landing } from '../data/redwall-cut'
import type { Product } from '../payload-types'

const zengin = (metin: string) => plainToLexical(metin) as NonNullable<Product['aciklama']>

/** İngilizce satırlara, Türkçe yazımda oluşan satır kimliklerini verir (yoksa Payload satırları yeniden yaratır). */
function kimlikle<T extends { id?: string | null }>(en: T[] | null | undefined, tr: { id?: string | null }[] | null | undefined): T[] {
  return (en ?? []).map((satir, i) => ({ ...satir, id: tr?.[i]?.id }))
}

/**
 * Redwall Cut ürün kaydını başlangıç içeriğiyle yazar (kart + landing, TR ve EN).
 * Kayıt zaten varsa dokunmaz: yönetim panelinde yapılan düzenlemeler ezilmez.
 * Migration içinden çağrılırken `req` verilmelidir (yoksa transaction ile deadlock olur).
 */
export async function redwallCutUrununuYaz(payload: Payload, req?: PayloadRequest): Promise<boolean> {
  const k = REDWALL_CUT_KART
  const mevcut = await payload.find({ collection: 'product', where: { slug: { equals: k.slug } }, limit: 1, req })
  if (mevcut.totalDocs > 0) return false

  const tr = yerellestir(REDWALL_CUT_LANDING, 'tr') as Landing<string>
  const en = yerellestir(REDWALL_CUT_LANDING, 'en') as Landing<string>

  const doc = await payload.create({
    collection: 'product',
    locale: 'tr',
    data: { slug: k.slug, ad: k.ad, yayinda: true, sira: k.sira, slogan: k.slogan.tr, aciklama: zengin(k.aciklama.tr), landing: tr },
    req,
  })
  const yazilan = doc.landing
  await payload.update({
    collection: 'product',
    id: doc.id,
    locale: 'en',
    data: {
      slogan: k.slogan.en,
      aciklama: zengin(k.aciklama.en),
      landing: {
        ...en,
        bolumler: kimlikle(en.bolumler, yazilan?.bolumler).map((b, i) => ({
          ...b,
          maddeler: kimlikle(b.maddeler, yazilan?.bolumler?.[i]?.maddeler),
        })),
        paketSatirlari: kimlikle(en.paketSatirlari, yazilan?.paketSatirlari),
      },
    },
    req,
  })
  return true
}
