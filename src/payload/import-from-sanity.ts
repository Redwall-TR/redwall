/**
 * ONE-TIME migration — Sanity `production` → local Payload CMS (3.85.1)
 *
 * Usage:  npm run payload:import-sanity
 *
 * Mirrors live Sanity content into local Payload:
 *  • Globals: siteSettings, navigation, homePage (TR + EN locales)
 *  • Collections: service, product, project, referans, faq, post, job, page
 *  • Media: downloads Sanity image assets, uploads to Payload/MinIO (de-duped)
 *
 * Strategy (clean mirror, idempotent):
 *  1. Fetch ALL docs from Sanity into memory (all 11 types).
 *  2. Validate: assert each expected type returned results + required singletons present.
 *     → If validation fails: console.error + process.exit(1), DB untouched.
 *  3. Delete all docs in CONTENT collections + media (NOT users).
 *  4. Recreate in Payload; write locale:'tr' then locale:'en'.
 *
 * Transforms:
 *  • localeString/localeText {tr,en}      → TR create + EN update
 *  • Sanity image asset                   → download bytes → Payload media upload
 *  • localePortableText (Portable Text)   → Lexical editor state
 *  • reference (homePage.oneCikanUrun)    → Payload relationship by product slug
 */

import { config as dotenvConfig } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenvConfig({ path: resolve(__dirname, '../../.env.local') })
dotenvConfig({ path: resolve(__dirname, '../../.env') })

// Dynamic imports so env vars are set BEFORE payload.config.ts executes
const { default: config } = await import('../../payload.config')
const { getPayload } = await import('payload')
const { createClient } = await import('@sanity/client')

// ── Sanity client ────────────────────────────────────────────────────────────

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '22ukr7s6',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-01',
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
  perspective: 'published',
})

const SANITY_PROJECT = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '22ukr7s6'
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

// ── Type helpers (loose — Sanity docs are dynamic) ─────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = Record<string, any>
type Locale = 'tr' | 'en'

// ── localeString / localeText helpers ──────────────────────────────────────────

function loc(field: unknown, locale: Locale): string | undefined {
  if (field == null) return undefined
  if (typeof field === 'string') return locale === 'tr' ? field : undefined
  if (typeof field === 'object') {
    const v = (field as Record<string, unknown>)[locale]
    return typeof v === 'string' && v.length > 0 ? v : undefined
  }
  return undefined
}

/** Array of localeString → string[] for a locale (drops empties). */
function locArray(arr: unknown[] | undefined, locale: Locale): string[] {
  if (!Array.isArray(arr)) return []
  return arr.map((x) => loc(x, locale)).filter((s): s is string => !!s)
}

// ── Sanity image asset → Payload media (de-duped by asset ref) ─────────────────

/**
 * Resolve a Sanity image asset ref (e.g. image-<hash>-2000x2000-png) to a CDN URL.
 */
function assetRefToUrl(ref: string): string | null {
  // image-<hash>-<w>x<h>-<ext>
  const m = ref.match(/^image-([a-fA-F0-9]+)-(\d+x\d+)-(\w+)$/)
  if (!m) return null
  const [, hash, dims, ext] = m
  return `https://cdn.sanity.io/images/${SANITY_PROJECT}/${SANITY_DATASET}/${hash}-${dims}.${ext}`
}

/** Get a usable CDN URL + filename from a Sanity image field. */
function imageInfo(img: unknown): { url: string; assetId: string; filename: string } | null {
  if (!img || typeof img !== 'object') return null
  const sanityImg = img as { asset?: { _ref?: string }; _ref?: string }
  let ref: string | undefined
  if (sanityImg.asset?._ref) ref = sanityImg.asset._ref
  else if (sanityImg._ref) ref = sanityImg._ref
  if (!ref) return null
  const url = assetRefToUrl(ref)
  if (!url) return null
  const ext = url.split('.').pop() || 'png'
  return { url, assetId: ref, filename: `${ref}.${ext}` }
}

// ── Portable Text → Lexical ────────────────────────────────────────────────────

function ptSpanToLexNodes(child: AnyDoc, markDefs: AnyDoc[]): AnyDoc[] {
  const text: string = child.text ?? ''
  const marks: string[] = Array.isArray(child.marks) ? child.marks : []

  // Lexical text format bitmask: bold=1, italic=2, underline=8, code=16, ...
  let format = 0
  if (marks.includes('strong')) format |= 1
  if (marks.includes('em')) format |= 2
  if (marks.includes('underline')) format |= 8
  if (marks.includes('code')) format |= 16

  const textNode: AnyDoc = {
    type: 'text',
    detail: 0,
    format,
    mode: 'normal',
    style: '',
    text,
    version: 1,
  }

  // Link mark? (markDefs entry referenced by a mark key)
  const linkDef = marks
    .map((mk) => markDefs.find((d) => d._key === mk && d._type === 'link'))
    .find(Boolean)

  if (linkDef) {
    return [
      {
        type: 'link',
        version: 3,
        fields: {
          linkType: 'custom',
          url: linkDef.href ?? '#',
          newTab: false,
        },
        direction: 'ltr',
        format: '',
        indent: 0,
        children: [textNode],
      },
    ]
  }

  return [textNode]
}

function ptBlockToLexNode(block: AnyDoc): AnyDoc | null {
  const style: string = block.style ?? 'normal'
  const markDefs: AnyDoc[] = Array.isArray(block.markDefs) ? block.markDefs : []
  const children: AnyDoc[] = Array.isArray(block.children) ? block.children : []

  const lexChildren = children
    .filter((c) => c._type === 'span')
    .flatMap((c) => ptSpanToLexNodes(c, markDefs))

  if (lexChildren.length === 0) return null

  const base = {
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    children: lexChildren,
  }

  if (/^h[1-6]$/.test(style)) {
    return { ...base, type: 'heading', tag: style }
  }
  if (style === 'blockquote') {
    return { ...base, type: 'quote' }
  }
  // 'normal' and any unknown style → paragraph (don't lose the text)
  return { ...base, type: 'paragraph', textFormat: 0, textStyle: '' }
}

/**
 * Convert Sanity Portable Text (array of blocks) → Payload Lexical editor state.
 * Handles paragraphs, headings, blockquotes, bold/italic/underline/code, links,
 * and bullet/numbered lists. Unknown block types fall back to a paragraph.
 */
function portableTextToLexical(blocks: unknown, context?: string): AnyDoc {
  const emptyRoot = {
    root: {
      type: 'root',
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
      children: [],
    },
  }
  if (!Array.isArray(blocks) || blocks.length === 0) return emptyRoot

  const rootChildren: AnyDoc[] = []
  let listBuffer: { tag: 'ul' | 'ol'; items: AnyDoc[] } | null = null

  const flushList = () => {
    if (listBuffer && listBuffer.items.length > 0) {
      rootChildren.push({
        type: 'list',
        listType: listBuffer.tag === 'ol' ? 'number' : 'bullet',
        tag: listBuffer.tag,
        start: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: listBuffer.items,
      })
    }
    listBuffer = null
  }

  for (const block of blocks) {
    if (block?._type !== 'block') {
      // Unknown (e.g. image block) — skip silently to avoid losing text-only docs
      flushList()
      continue
    }

    const node = ptBlockToLexNode(block)
    if (!node) {
      console.warn(`  ⚠  PT block dropped (no children) [${context ?? 'unknown'}] style=${block.style ?? 'normal'}`)
      continue
    }

    if (block.listItem) {
      const tag: 'ul' | 'ol' = block.listItem === 'number' ? 'ol' : 'ul'
      if (!listBuffer || listBuffer.tag !== tag) {
        flushList()
        listBuffer = { tag, items: [] }
      }
      listBuffer.items.push({
        type: 'listitem',
        value: listBuffer.items.length + 1,
        checked: undefined,
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: node.children,
      })
    } else {
      flushList()
      rootChildren.push(node)
    }
  }
  flushList()

  if (rootChildren.length === 0) return emptyRoot

  return {
    root: {
      type: 'root',
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
      children: rootChildren,
    },
  }
}

/** True if a localePortableText field has any content for the given locale. */
function hasPT(field: unknown, locale: Locale): boolean {
  if (!field || typeof field !== 'object') return false
  const locField = (field as Record<string, unknown>)[locale]
  return Array.isArray(locField) && locField.length > 0
}

// ── main ───────────────────────────────────────────────────────────────────────

async function main() {
  const payload = await getPayload({ config })

  // Loosely-typed wrappers: this one-time migration feeds dynamic Sanity data
  // (with optional/undefined values) into Payload. The generated collection
  // types reject `undefined` for required fields, so we relax the data arg here.
  // The `any` casts below are intentional — Payload's overloads require collection-specific
  // discriminated union types that cannot be satisfied when passing cross-collection data.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const create = (args: any) => payload.create(args)
  const update = (args: any) => payload.update(args)
  const updateGlobal = (args: any) => payload.updateGlobal(args)
  /* eslint-enable @typescript-eslint/no-explicit-any */

  console.log('📥  Sanity → Payload import başlıyor…\n')

  // ── Media de-dup cache: Sanity assetId → Payload media id ───────────────────
  const mediaCache = new Map<string, string | number>()

  async function uploadImage(img: unknown, altText?: string): Promise<string | number | null> {
    const info = imageInfo(img)
    if (!info) return null
    if (mediaCache.has(info.assetId)) return mediaCache.get(info.assetId)!

    const res = await fetch(info.url)
    if (!res.ok) {
      console.warn(`  ⚠  Görsel indirilemedi (${res.status}): ${info.url}`)
      return null
    }
    const arrayBuf = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuf)
    const contentType = res.headers.get('content-type') || 'image/png'

    const doc = await create({
      collection: 'media',
      data: { alt: altText || info.assetId },
      file: {
        data: buffer,
        mimetype: contentType,
        name: info.filename,
        size: buffer.length,
      },
      overrideAccess: true,
    })
    mediaCache.set(info.assetId, doc.id)
    console.log(`  ⬆  media: ${info.filename} (id=${doc.id})`)
    return doc.id
  }

  // ── 1. Fetch ALL Sanity docs into memory (validate BEFORE any delete) ────────

  console.log('🔍  Sanity verileri çekiliyor ve doğrulanıyor…')

  const ss: AnyDoc = await sanity.fetch(
    `*[_type=="siteSettings" && !(_id in path("drafts.**"))][0]`,
  )
  const nav: AnyDoc = await sanity.fetch(
    `*[_type=="navigation" && !(_id in path("drafts.**"))][0]`,
  )
  const home: AnyDoc = await sanity.fetch(
    `*[_type=="homePage" && !(_id in path("drafts.**"))][0]{
      ..., "oneCikanUrunSlug": oneCikanUrun->slug.current
    }`,
  )
  const products: AnyDoc[] = await sanity.fetch(
    `*[_type=="product" && !(_id in path("drafts.**"))]|order(sira asc)`,
  )
  const services: AnyDoc[] = await sanity.fetch(
    `*[_type=="service" && !(_id in path("drafts.**"))]|order(sira asc)`,
  )
  const projects: AnyDoc[] = await sanity.fetch(
    `*[_type=="project" && !(_id in path("drafts.**"))]|order(yil desc)`,
  )
  const referanslar: AnyDoc[] = await sanity.fetch(
    `*[_type=="referans" && !(_id in path("drafts.**"))]|order(ad asc)`,
  )
  const faqs: AnyDoc[] = await sanity.fetch(
    `*[_type=="faq" && !(_id in path("drafts.**"))]|order(sira asc)`,
  )
  const posts: AnyDoc[] = await sanity.fetch(
    `*[_type=="post" && !(_id in path("drafts.**"))]|order(tarih desc)`,
  )
  const jobs: AnyDoc[] = await sanity.fetch(
    `*[_type=="jobPosting" && !(_id in path("drafts.**"))]`,
  )
  const pages: AnyDoc[] = await sanity.fetch(
    `*[_type=="page" && !(_id in path("drafts.**"))]`,
  )

  // Validate: required singletons must be present + at least one doc per collection
  const validationErrors: string[] = []
  if (!ss) validationErrors.push('siteSettings singleton bulunamadı')
  if (!nav) validationErrors.push('navigation singleton bulunamadı')
  if (!home) validationErrors.push('homePage singleton bulunamadı')
  if (!products.length) validationErrors.push('product koleksiyonu boş döndü')
  if (!services.length) validationErrors.push('service koleksiyonu boş döndü')
  if (!projects.length) validationErrors.push('project koleksiyonu boş döndü')
  if (!referanslar.length) validationErrors.push('referans koleksiyonu boş döndü')
  if (!faqs.length) validationErrors.push('faq koleksiyonu boş döndü')
  if (!posts.length) validationErrors.push('post koleksiyonu boş döndü')
  if (!jobs.length) validationErrors.push('job koleksiyonu boş döndü')
  if (!pages.length) validationErrors.push('page koleksiyonu boş döndü')

  if (validationErrors.length > 0) {
    console.error('❌  Sanity doğrulama hatası — veritabanına dokunulmadı:')
    for (const e of validationErrors) console.error(`   • ${e}`)
    process.exit(1)
  }

  console.log(
    `  ✓ Doğrulama geçti — product:${products.length} service:${services.length}` +
    ` project:${projects.length} referans:${referanslar.length} faq:${faqs.length}` +
    ` post:${posts.length} job:${jobs.length} page:${pages.length}\n`,
  )

  // ── 2. Clean mirror: delete content collections + media (NOT users) ──────────
  const contentCollections = [
    'service',
    'product',
    'project',
    'referans',
    'faq',
    'post',
    'job',
    'page',
    'media',
  ] as const

  console.log('🧹  Mevcut içerik temizleniyor…')
  for (const c of contentCollections) {
    const del = await payload.delete({
      collection: c,
      where: { id: { exists: true } },
      overrideAccess: true,
    })
    console.log(`  – ${c}: ${del.docs.length} silindi`)
  }
  console.log('')

  const counts: Record<string, number> = {}

  // ── 3. Globals ──────────────────────────────────────────────────────────────

  // 3a. siteSettings (use pre-fetched ss)
  if (ss) {
    const sosyal = ss.sosyal || {}
    await updateGlobal({
      slug: 'siteSettings',
      locale: 'tr',
      data: {
        sirketAdi: ss.sirketAdi || 'Redwall',
        iletisim: {
          tel: ss.iletisim?.tel,
          email: ss.iletisim?.email,
          adres: loc(ss.iletisim?.adres, 'tr'),
        },
        // Explicit null for fields absent in Sanity — globals are updated (not
        // deleted), so omitting a key would retain any stale prior value.
        sosyal: {
          linkedin: sosyal.linkedin ?? null,
          instagram: sosyal.instagram ?? null,
          youtube: sosyal.youtube ?? null,
          x: sosyal.x ?? null,
          facebook: sosyal.facebook ?? null,
          whatsapp: sosyal.whatsapp ?? null,
        },
        calismaSaatleri: loc(ss.calismaSaatleri, 'tr'),
        istatistikler: (ss.istatistikler || []).map((i: AnyDoc) => ({
          deger: i.deger,
          etiket: loc(i.etiket, 'tr'),
        })),
        seo: {
          baslik: loc(ss.seo?.baslik, 'tr'),
          aciklama: loc(ss.seo?.aciklama, 'tr'),
        },
      },
      overrideAccess: true,
    })
    await updateGlobal({
      slug: 'siteSettings',
      locale: 'en',
      data: {
        iletisim: { adres: loc(ss.iletisim?.adres, 'en') },
        calismaSaatleri: loc(ss.calismaSaatleri, 'en'),
        istatistikler: (ss.istatistikler || []).map((i: AnyDoc) => ({
          deger: i.deger,
          etiket: loc(i.etiket, 'en'),
        })),
        seo: {
          baslik: loc(ss.seo?.baslik, 'en'),
          aciklama: loc(ss.seo?.aciklama, 'en'),
        },
      },
      overrideAccess: true,
    })
    console.log('  ✓ siteSettings güncellendi')
  }

  // 3b. navigation (use pre-fetched nav)
  if (nav) {
    const navData = (locale: Locale) => ({
      headerLinks: (nav.headerLinks || []).map((l: AnyDoc) => ({
        etiket: loc(l.etiket, locale),
        href: l.href,
        alt: (l.alt || []).map((a: AnyDoc) => ({
          etiket: loc(a.etiket, locale),
          href: a.href,
        })),
      })),
      footerKolonlari: (nav.footerKolonlari || []).map((k: AnyDoc) => ({
        baslik: loc(k.baslik, locale),
        linkler: (k.linkler || []).map((a: AnyDoc) => ({
          etiket: loc(a.etiket, locale),
          href: a.href,
        })),
      })),
    })
    await updateGlobal({ slug: 'navigation', locale: 'tr', data: navData('tr'), overrideAccess: true })
    await updateGlobal({ slug: 'navigation', locale: 'en', data: navData('en'), overrideAccess: true })
    console.log('  ✓ navigation güncellendi')
  }

  // ── 4. Collections (content) — products first (homePage references them) ──────

  // 4a. product (use pre-fetched products)
  const productSlugToId = new Map<string, string | number>()
  counts.product = 0
  for (const p of products) {
    const slug = p.slug?.current
    if (!slug) continue
    const ekranGorselleri: AnyDoc[] = []
    const srcEkranCount = (p.ekranGorselleri || []).length
    for (const g of p.ekranGorselleri || []) {
      const id = await uploadImage(g, p.ad)
      if (id) ekranGorselleri.push({ gorsel: id })
    }
    if (ekranGorselleri.length < srcEkranCount) {
      console.warn(`  ⚠  product[${slug}] ekranGorselleri: ${ekranGorselleri.length}/${srcEkranCount} görsel yüklendi`)
    }
    const doc = await create({
      collection: 'product',
      locale: 'tr',
      data: {
        slug,
        ad: p.ad,
        slogan: loc(p.slogan, 'tr'),
        aciklama: loc(p.aciklama, 'tr'),
        ozellikler: (p.ozellikler || []).map((o: AnyDoc) => ({
          icon: o.icon,
          baslik: loc(o.baslik, 'tr'),
          aciklama: loc(o.aciklama, 'tr'),
        })),
        hedefKitle: locArray(p.hedefKitle, 'tr').map((m) => ({ madde: m })),
        ekranGorselleri,
        sira: p.sira,
      },
      overrideAccess: true,
    })
    productSlugToId.set(slug, doc.id)
    await update({
      collection: 'product',
      id: doc.id,
      locale: 'en',
      data: {
        slogan: loc(p.slogan, 'en'),
        aciklama: loc(p.aciklama, 'en'),
        ozellikler: (p.ozellikler || []).map((o: AnyDoc) => ({
          baslik: loc(o.baslik, 'en'),
          aciklama: loc(o.aciklama, 'en'),
        })),
        hedefKitle: locArray(p.hedefKitle, 'en').map((m) => ({ madde: m })),
      },
      overrideAccess: true,
    })
    counts.product++
    console.log(`  ✓ product[${slug}]`)
  }

  // 4b. service (use pre-fetched services)
  counts.service = 0
  for (const s of services) {
    const doc = await create({
      collection: 'service',
      locale: 'tr',
      data: {
        isKolu: s.isKolu,
        baslik: loc(s.baslik, 'tr'),
        ozet: loc(s.ozet, 'tr'),
        chips: locArray(s.chips, 'tr').map((e) => ({ etiket: e })),
        girisLead: loc(s.girisLead, 'tr'),
        girisParagraflar: locArray(s.girisParagraflar, 'tr').map((pp) => ({ paragraf: pp })),
        altHizmetler: (s.altHizmetler || []).map((a: AnyDoc) => ({
          icon: a.icon,
          baslik: loc(a.baslik, 'tr'),
          aciklama: loc(a.aciklama, 'tr'),
        })),
        surec: (s.surec || []).map((a: AnyDoc) => ({
          baslik: loc(a.baslik, 'tr'),
          aciklama: loc(a.aciklama, 'tr'),
        })),
        sira: s.sira,
      },
      overrideAccess: true,
    })
    await update({
      collection: 'service',
      id: doc.id,
      locale: 'en',
      data: {
        baslik: loc(s.baslik, 'en'),
        ozet: loc(s.ozet, 'en'),
        chips: locArray(s.chips, 'en').map((e) => ({ etiket: e })),
        girisLead: loc(s.girisLead, 'en'),
        girisParagraflar: locArray(s.girisParagraflar, 'en').map((pp) => ({ paragraf: pp })),
        altHizmetler: (s.altHizmetler || []).map((a: AnyDoc) => ({
          baslik: loc(a.baslik, 'en'),
          aciklama: loc(a.aciklama, 'en'),
        })),
        surec: (s.surec || []).map((a: AnyDoc) => ({
          baslik: loc(a.baslik, 'en'),
          aciklama: loc(a.aciklama, 'en'),
        })),
      },
      overrideAccess: true,
    })
    counts.service++
    console.log(`  ✓ service[${s.isKolu}]`)
  }

  // 4c. project (use pre-fetched projects)
  counts.project = 0
  for (const pr of projects) {
    const slug = pr.slug?.current
    if (!slug) continue
    const gorseller: AnyDoc[] = []
    const srcGorsellerCount = (pr.gorseller || []).length
    for (const g of pr.gorseller || []) {
      const id = await uploadImage(g, loc(pr.baslik, 'tr'))
      if (id) gorseller.push({ gorsel: id })
    }
    if (gorseller.length < srcGorsellerCount) {
      console.warn(`  ⚠  project[${slug}] gorseller: ${gorseller.length}/${srcGorsellerCount} görsel yüklendi`)
    }
    const doc = await create({
      collection: 'project',
      locale: 'tr',
      data: {
        slug,
        baslik: loc(pr.baslik, 'tr'),
        musteri: pr.musteri,
        isKolu: pr.isKolu,
        durum: pr.durum,
        yil: pr.yil,
        il: pr.il,
        kapsam: loc(pr.kapsam, 'tr'),
        ozet: loc(pr.ozet, 'tr'),
        aciklama: hasPT(pr.aciklama, 'tr')
          ? portableTextToLexical(pr.aciklama.tr, `project[${slug}].aciklama.tr`)
          : undefined,
        gorseller,
        oneCikan: !!pr.oneCikan,
      },
      overrideAccess: true,
    })
    await update({
      collection: 'project',
      id: doc.id,
      locale: 'en',
      data: {
        baslik: loc(pr.baslik, 'en'),
        kapsam: loc(pr.kapsam, 'en'),
        ozet: loc(pr.ozet, 'en'),
        aciklama: hasPT(pr.aciklama, 'en')
          ? portableTextToLexical(pr.aciklama.en, `project[${slug}].aciklama.en`)
          : undefined,
      },
      overrideAccess: true,
    })
    counts.project++
    console.log(`  ✓ project[${slug}]`)
  }

  // 4d. referans (use pre-fetched referanslar)
  counts.referans = 0
  for (const r of referanslar) {
    const logoId = await uploadImage(r.logo, r.ad)
    const doc = await create({
      collection: 'referans',
      locale: 'tr',
      data: {
        ad: r.ad,
        logo: logoId ?? undefined,
        anasayfada: !!r.anasayfada,
        gorus: {
          metin: loc(r.gorus?.metin, 'tr'),
          kisi: r.gorus?.kisi,
          unvan: loc(r.gorus?.unvan, 'tr'),
        },
      },
      overrideAccess: true,
    })
    await update({
      collection: 'referans',
      id: doc.id,
      locale: 'en',
      data: {
        gorus: {
          metin: loc(r.gorus?.metin, 'en'),
          unvan: loc(r.gorus?.unvan, 'en'),
        },
      },
      overrideAccess: true,
    })
    counts.referans++
    console.log(`  ✓ referans[${r.ad}]${logoId ? ' (logo ✓)' : ''}`)
  }

  // 4e. faq (use pre-fetched faqs)
  counts.faq = 0
  for (const f of faqs) {
    const doc = await create({
      collection: 'faq',
      locale: 'tr',
      data: {
        kategori: f.kategori,
        soru: loc(f.soru, 'tr'),
        cevap: loc(f.cevap, 'tr'),
        sira: f.sira,
      },
      overrideAccess: true,
    })
    await update({
      collection: 'faq',
      id: doc.id,
      locale: 'en',
      data: { soru: loc(f.soru, 'en'), cevap: loc(f.cevap, 'en') },
      overrideAccess: true,
    })
    counts.faq++
    console.log(`  ✓ faq[${(loc(f.soru, 'tr') || '').slice(0, 30)}…]`)
  }

  // 4f. post (use pre-fetched posts)
  counts.post = 0
  for (const p of posts) {
    const slug = p.slug?.current
    if (!slug) continue
    const kapakId = await uploadImage(p.kapak, loc(p.baslik, 'tr'))
    const doc = await create({
      collection: 'post',
      locale: 'tr',
      data: {
        slug,
        baslik: loc(p.baslik, 'tr'),
        tarih: p.tarih ? new Date(p.tarih).toISOString() : undefined,
        kapak: kapakId ?? undefined,
        ozet: loc(p.ozet, 'tr'),
        icerik: hasPT(p.icerik, 'tr') ? portableTextToLexical(p.icerik.tr, `post[${slug}].icerik.tr`) : undefined,
        etiketler: (Array.isArray(p.etiketler) ? p.etiketler : []).filter(Boolean).map((e: string) => ({ etiket: e })),
      },
      overrideAccess: true,
    })
    await update({
      collection: 'post',
      id: doc.id,
      locale: 'en',
      data: {
        baslik: loc(p.baslik, 'en'),
        ozet: loc(p.ozet, 'en'),
        icerik: hasPT(p.icerik, 'en') ? portableTextToLexical(p.icerik.en, `post[${slug}].icerik.en`) : undefined,
      },
      overrideAccess: true,
    })
    counts.post++
    console.log(`  ✓ post[${slug}]`)
  }

  // 4g. job (use pre-fetched jobs)
  counts.job = 0
  for (const j of jobs) {
    const slug = j.slug?.current
    if (!slug) continue
    const doc = await create({
      collection: 'job',
      locale: 'tr',
      data: {
        slug,
        baslik: loc(j.baslik, 'tr'),
        lokasyon: j.lokasyon,
        tip: j.tip,
        aciklama: hasPT(j.aciklama, 'tr') ? portableTextToLexical(j.aciklama.tr, `job[${slug}].aciklama.tr`) : undefined,
        aktif: j.aktif !== false,
      },
      overrideAccess: true,
    })
    await update({
      collection: 'job',
      id: doc.id,
      locale: 'en',
      data: {
        baslik: loc(j.baslik, 'en'),
        aciklama: hasPT(j.aciklama, 'en') ? portableTextToLexical(j.aciklama.en, `job[${slug}].aciklama.en`) : undefined,
      },
      overrideAccess: true,
    })
    counts.job++
    console.log(`  ✓ job[${slug}]`)
  }

  // 4h. page (use pre-fetched pages)
  counts.page = 0
  for (const pg of pages) {
    const slug = pg.slug?.current
    if (!slug) continue
    const doc = await create({
      collection: 'page',
      locale: 'tr',
      data: {
        slug,
        baslik: loc(pg.baslik, 'tr'),
        altBaslik: loc(pg.altBaslik, 'tr'),
        chips: locArray(pg.chips, 'tr').map((e) => ({ etiket: e })),
        girisLead: loc(pg.girisLead, 'tr'),
        girisParagraflar: locArray(pg.girisParagraflar, 'tr').map((pp) => ({ paragraf: pp })),
        vizyonBaslik: loc(pg.vizyonBaslik, 'tr'),
        vizyonMetin: loc(pg.vizyonMetin, 'tr'),
        misyonBaslik: loc(pg.misyonBaslik, 'tr'),
        misyonMetin: loc(pg.misyonMetin, 'tr'),
        kartlarEyebrow: loc(pg.kartlarEyebrow, 'tr'),
        kartlarBaslik: loc(pg.kartlarBaslik, 'tr'),
        kartlarAciklama: loc(pg.kartlarAciklama, 'tr'),
        kartlar: (pg.kartlar || []).map((k: AnyDoc) => ({
          icon: k.icon,
          baslik: loc(k.baslik, 'tr'),
          aciklama: loc(k.aciklama, 'tr'),
        })),
      },
      overrideAccess: true,
    })
    await update({
      collection: 'page',
      id: doc.id,
      locale: 'en',
      data: {
        baslik: loc(pg.baslik, 'en'),
        altBaslik: loc(pg.altBaslik, 'en'),
        chips: locArray(pg.chips, 'en').map((e) => ({ etiket: e })),
        girisLead: loc(pg.girisLead, 'en'),
        girisParagraflar: locArray(pg.girisParagraflar, 'en').map((pp) => ({ paragraf: pp })),
        vizyonBaslik: loc(pg.vizyonBaslik, 'en'),
        vizyonMetin: loc(pg.vizyonMetin, 'en'),
        misyonBaslik: loc(pg.misyonBaslik, 'en'),
        misyonMetin: loc(pg.misyonMetin, 'en'),
        kartlarEyebrow: loc(pg.kartlarEyebrow, 'en'),
        kartlarBaslik: loc(pg.kartlarBaslik, 'en'),
        kartlarAciklama: loc(pg.kartlarAciklama, 'en'),
        kartlar: (pg.kartlar || []).map((k: AnyDoc) => ({
          baslik: loc(k.baslik, 'en'),
          aciklama: loc(k.aciklama, 'en'),
        })),
      },
      overrideAccess: true,
    })
    counts.page++
    console.log(`  ✓ page[${slug}]`)
  }

  // 4i. homePage (after products so oneCikanUrun relationship resolves, uses pre-fetched home)
  if (home) {
    const urunId = home.oneCikanUrunSlug
      ? productSlugToId.get(home.oneCikanUrunSlug)
      : undefined
    await updateGlobal({
      slug: 'homePage',
      locale: 'tr',
      data: {
        heroBaslik: loc(home.heroBaslik, 'tr') || 'Redwall',
        heroAltMetin: loc(home.heroAltMetin, 'tr'),
        heroBirincilCta: {
          etiket: loc(home.heroBirincilCta?.etiket, 'tr'),
          href: home.heroBirincilCta?.href,
        },
        heroIkincilCta: {
          etiket: loc(home.heroIkincilCta?.etiket, 'tr'),
          href: home.heroIkincilCta?.href,
        },
        oneCikanUrun: urunId ?? undefined,
        yaklasim: hasPT(home.yaklasim, 'tr')
          ? portableTextToLexical(home.yaklasim.tr, 'homePage.yaklasim.tr')
          : undefined,
      },
      overrideAccess: true,
    })
    await updateGlobal({
      slug: 'homePage',
      locale: 'en',
      data: {
        heroBaslik: loc(home.heroBaslik, 'en') || undefined,
        heroAltMetin: loc(home.heroAltMetin, 'en'),
        heroBirincilCta: { etiket: loc(home.heroBirincilCta?.etiket, 'en') },
        heroIkincilCta: { etiket: loc(home.heroIkincilCta?.etiket, 'en') },
        yaklasim: hasPT(home.yaklasim, 'en')
          ? portableTextToLexical(home.yaklasim.en, 'homePage.yaklasim.en')
          : undefined,
      },
      overrideAccess: true,
    })
    console.log(`  ✓ homePage güncellendi${urunId ? ' (oneCikanUrun ✓)' : ''}`)
  }

  counts.media = mediaCache.size

  console.log('\n📊  İçe aktarım özeti:')
  for (const [k, v] of Object.entries(counts)) {
    console.log(`   ${k.padEnd(12)} : ${v}`)
  }
  console.log('\n✅  Import tamamlandı.')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌  Import hatası:', err)
  process.exit(1)
})
