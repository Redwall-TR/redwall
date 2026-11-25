import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { plainToLexical } from '../lib/lexical/plainToLexical'
import { lexicalToPlainText } from '../lib/lexicalToPlainText'

// Veri migration'ı: /yazilim sayfasının CMS'teki genel metinlerine (service[yazilim]) Redwall Cut'ı ekler.
// Bu metinler panelden elle yazılmıştır; bu yüzden her alan YALNIZCA bilinen eski metinle birebir aynıysa
// değiştirilir. Panelde başka bir şey yazılmışsa o alana dokunulmaz (elle güncellenir).
// DİKKAT: payload.* çağrılarına `req` geçilir; yoksa migration transaction'ı ile deadlock olur.

const URUN = 'Redwall Cut'

/** Hero özeti: eski metin → yeni metin (canlıdaki ve seed'deki yazımlar). */
export const OZET: Record<'tr' | 'en', Record<string, string>> = {
  tr: {
    'Fikri mülkiyeti tamamen kurumumuza ait olan, yangın ve mekanik tesisat disiplinlerine özel geliştirdiğimiz tescilli mühendislik yazılımları.':
      'Fikri mülkiyeti tamamen kurumumuza ait olan; yangın ve mekanik tesisat disiplinlerine özel geliştirdiğimiz tescilli mühendislik yazılımları ve fotoğrafçılar için otomatik video ve fotoğraf stüdyomuz Redwall Cut.',
    "YangınPro & MekanikPro — fikri mülkiyeti Redwall'a ait, bulut tabanlı mühendislik yazılımları.":
      "YangınPro, MekanikPro ve Redwall Cut: fikri mülkiyeti Redwall'a ait mühendislik ve medya yazılımları.",
  },
  en: {
    'Proprietary engineering software developed specifically for the fire protection and mechanical systems disciplines, with full intellectual property rights held by our organization.':
      'Proprietary engineering software developed specifically for the fire protection and mechanical systems disciplines, and Redwall Cut, our automatic video and photo studio for photographers, with full intellectual property rights held by our organization.',
    'YangınPro & MekanikPro — cloud-based engineering software owned by Redwall.':
      'YangınPro, MekanikPro and Redwall Cut: engineering and media software owned by Redwall.',
  },
}

/** Giriş cümlesi (yalnızca TR girilmiş). */
export const GIRIS_ESKI =
  'Redwall Yazılım iş kolu, yangın ve mekanik mühendislik alanlarında kullanılan ve fikri mülkiyeti tamamen bize ait yazılım ürünleri geliştirmektedir.'
export const GIRIS_YENI =
  'Redwall Yazılım iş kolu, yangın ve mekanik mühendislik alanlarının yanında fotoğraf ve video üretimi için de fikri mülkiyeti tamamen bize ait yazılım ürünleri geliştirmektedir.'

type Yerel<T> = Partial<Record<'tr' | 'en', T | null>>
type Chip = { id?: string | null; etiket?: Yerel<string> | null }

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const { docs } = await payload.find({
    collection: 'service',
    where: { isKolu: { equals: 'yazilim' } },
    locale: 'all',
    depth: 0,
    limit: 1,
    req,
  })
  if (docs.length === 0) return
  const s = docs[0] as unknown as {
    id: number | string
    ozet?: Yerel<string>
    chips?: Chip[] | null
    girisLead?: Yerel<unknown>
  }
  const yaz = (locale: 'tr' | 'en', data: Record<string, unknown>) =>
    payload.update({ collection: 'service', id: s.id, locale, data, req })

  // 1) Hero özeti (ana sayfadaki "Yazılım" kartı da bunu kullanır)
  for (const locale of ['tr', 'en'] as const) {
    const yeni = OZET[locale][(s.ozet?.[locale] ?? '').trim()]
    if (yeni) await yaz(locale, { ozet: yeni })
    else payload.logger.info(`service[yazilim].ozet (${locale}) elle değiştirilmiş; dokunulmadı.`)
  }

  // 2) Hero etiketleri: ürün adı yoksa MekanikPro'dan sonra (o da yoksa sona) eklenir
  const chips = s.chips ?? []
  if (chips.length > 0 && !chips.some((c) => c.etiket?.tr === URUN)) {
    const sira = chips.findIndex((c) => c.etiket?.tr === 'MekanikPro') + 1 || chips.length
    const dizi = (locale: 'tr' | 'en', yeniId?: string | null) => [
      ...chips.slice(0, sira).map((c) => ({ id: c.id, etiket: c.etiket?.[locale] })),
      { id: yeniId ?? undefined, etiket: URUN },
      ...chips.slice(sira).map((c) => ({ id: c.id, etiket: c.etiket?.[locale] })),
    ]
    const tr = (await yaz('tr', { chips: dizi('tr') })) as unknown as { chips?: Chip[] }
    await yaz('en', { chips: dizi('en', tr.chips?.[sira]?.id) })
  }

  // 3) Giriş cümlesi
  if (lexicalToPlainText(s.girisLead?.tr).trim() === GIRIS_ESKI) await yaz('tr', { girisLead: plainToLexical(GIRIS_YENI) })
  else if (s.girisLead?.tr) payload.logger.info('service[yazilim].girisLead elle değiştirilmiş; dokunulmadı.')
}

// İçerik düzenlemesi: geri alınacak şema yok; metinler panelden düzeltilir.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function down(_: MigrateDownArgs): Promise<void> {}
