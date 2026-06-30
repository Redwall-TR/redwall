/**
 * Content adapter functions — queries Payload Local API and returns data in the
 * exact shape the existing components expect (matching the legacy Sanity GROQ projections).
 *
 * All functions use `locale: 'all'` so localized fields come back as { tr, en } objects.
 * depth: 2 resolves media uploads and relationships to full objects.
 */

import { getPayloadClient, safe } from './client'
import { unwrap } from './transform'

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function getProjects() {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'project',
      sort: '-yil',
      locale: 'all',
      depth: 2,
      limit: 100,
    })
    return docs.map((r) => ({
      slug: r.slug,
      baslik: r.baslik,
      musteri: r.musteri,
      isKolu: r.isKolu,
      durum: r.durum,
      yil: r.yil,
      il: r.il,
      ozet: r.ozet,
      gorsel: Array.isArray(r.gorseller) && r.gorseller.length > 0 ? (r.gorseller[0] as Record<string, unknown>)?.gorsel ?? null : null,
      oneCikan: r.oneCikan,
    }))
  }, [])
}

export async function getProject(slug: string) {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'project',
      where: { slug: { equals: slug } },
      locale: 'all',
      depth: 2,
      limit: 1,
    })
    const r = docs[0]
    if (!r) return null
    const ref = (r as unknown as { referans?: { ad?: string; slug?: string } }).referans
    return {
      baslik: r.baslik,
      musteri: r.musteri,
      referans: ref && ref.slug ? { ad: ref.ad ?? '', slug: ref.slug } : null,
      isKolu: r.isKolu,
      durum: r.durum,
      yil: r.yil,
      il: r.il,
      kapsam: r.kapsam,
      ozet: r.ozet,
      aciklama: r.aciklama,
      gorseller: Array.isArray(r.gorseller)
        ? r.gorseller.map((row: Record<string, unknown>) => row?.gorsel ?? null).filter(Boolean)
        : [],
    }
  }, null)
}

export async function getFeaturedProjects() {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'project',
      where: { oneCikan: { equals: true } },
      sort: '-yil',
      locale: 'all',
      depth: 2,
      limit: 3,
    })
    return docs.map((r) => ({
      slug: r.slug,
      baslik: r.baslik,
      musteri: r.musteri,
      isKolu: r.isKolu,
      durum: r.durum,
      gorsel: Array.isArray(r.gorseller) && r.gorseller.length > 0 ? (r.gorseller[0] as Record<string, unknown>)?.gorsel ?? null : null,
    }))
  }, [])
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export async function getServices() {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'service',
      sort: 'sira',
      locale: 'all',
      depth: 2,
      limit: 100,
    })
    return docs.map((r) => ({
      isKolu: r.isKolu,
      baslik: r.baslik,
      ozet: r.ozet,
      altHizmetler: r.altHizmetler,
      imzaRengi: (r as unknown as Record<string, unknown>).imzaRengi,
    }))
  }, [])
}

export async function getService(isKolu: string) {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'service',
      where: { isKolu: { equals: isKolu } },
      locale: 'all',
      depth: 2,
      limit: 1,
    })
    const r = docs[0]
    if (!r) return null
    return {
      isKolu: r.isKolu,
      baslik: r.baslik,
      ozet: r.ozet,
      chips: unwrap(r.chips, 'etiket'),
      girisLead: r.girisLead,
      girisParagraflar: unwrap(r.girisParagraflar, 'paragraf'),
      altHizmetler: r.altHizmetler,
      surec: r.surec,
    }
  }, null)
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function getProducts() {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'product',
      where: { yayinda: { equals: true } },
      sort: 'sira',
      locale: 'all',
      depth: 2,
      limit: 100,
    })
    return docs.map((r) => ({
      slug: r.slug,
      ad: r.ad,
      slogan: r.slogan,
      aciklama: r.aciklama,
      ozellikler: r.ozellikler,
    }))
  }, [])
}

export async function getProduct(slug: string) {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'product',
      where: { slug: { equals: slug }, yayinda: { equals: true } },
      locale: 'all',
      depth: 2,
      limit: 1,
    })
    const r = docs[0]
    if (!r) return null
    return {
      ad: r.ad,
      slogan: r.slogan,
      aciklama: r.aciklama,
      ozellikler: r.ozellikler,
      hedefKitle: unwrap(r.hedefKitle, 'madde'),
      ekranGorselleri: unwrap(r.ekranGorselleri, 'gorsel'),
    }
  }, null)
}

// ---------------------------------------------------------------------------
// References
// ---------------------------------------------------------------------------

export async function getReferences() {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'referans',
      sort: 'ad',
      locale: 'all',
      depth: 2,
      limit: 100,
    })
    return docs.map((r) => ({
      id: String(r.id),
      ad: r.ad,
      slug: (r as unknown as { slug?: string }).slug,
      logo: r.logo,
      gorus: r.gorus,
    }))
  }, [])
}

export async function getFeaturedReferences() {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'referans',
      where: { anasayfada: { equals: true } },
      sort: 'ad',
      locale: 'all',
      depth: 2,
      limit: 100,
    })
    return docs.map((r) => ({
      id: String(r.id),
      ad: r.ad,
      slug: (r as unknown as { slug?: string }).slug,
      logo: r.logo,
    }))
  }, [])
}

export async function getReferenceProjectCounts() {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'project',
      depth: 0,
      limit: 0,
      pagination: false,
    })
    const counts: Record<string, number> = {}
    for (const r of docs) {
      const ref = (r as unknown as { referans?: string | number | { id?: string | number } }).referans
      if (ref == null) continue
      const id = String(typeof ref === 'object' ? ref.id : ref)
      if (!id || id === 'undefined') continue
      counts[id] = (counts[id] ?? 0) + 1
    }
    return counts
  }, {} as Record<string, number>)
}

export async function getReference(slug: string) {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'referans',
      where: { slug: { equals: slug } },
      locale: 'all',
      depth: 2,
      limit: 1,
    })
    const r = docs[0]
    if (!r) return null
    return {
      id: String(r.id),
      ad: r.ad,
      slug: (r as unknown as { slug?: string }).slug,
      logo: r.logo,
      gorus: r.gorus,
    }
  }, null)
}

export async function getProjectsByReference(refId: string) {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'project',
      where: { referans: { equals: refId } },
      sort: '-yil',
      locale: 'all',
      depth: 2,
      limit: 100,
    })
    return docs.map((r) => ({
      slug: r.slug,
      baslik: r.baslik,
      musteri: r.musteri,
      isKolu: r.isKolu,
      durum: r.durum,
      yil: r.yil,
      il: r.il,
      ozet: r.ozet,
    }))
  }, [])
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

export async function getFaqs() {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'faq',
      sort: 'sira',
      locale: 'all',
      depth: 2,
      limit: 100,
    })
    return docs.map((r) => ({
      kategori: r.kategori,
      soru: r.soru,
      cevap: r.cevap,
    }))
  }, [])
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export async function getPosts() {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'post',
      sort: '-tarih',
      locale: 'all',
      depth: 2,
      limit: 100,
    })
    return docs.map((r) => ({
      slug: r.slug,
      baslik: r.baslik,
      tarih: r.tarih,
      kapak: r.kapak,
      ozet: r.ozet,
    }))
  }, [])
}

export async function getPost(slug: string) {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'post',
      where: { slug: { equals: slug } },
      locale: 'all',
      depth: 2,
      limit: 1,
    })
    const r = docs[0]
    if (!r) return null
    return {
      baslik: r.baslik,
      tarih: r.tarih,
      kapak: r.kapak,
      icerik: r.icerik,
    }
  }, null)
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export async function getJobs() {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'job',
      where: { aktif: { equals: true } },
      locale: 'all',
      depth: 2,
      limit: 100,
    })
    return docs.map((r) => ({
      slug: r.slug,
      baslik: r.baslik,
      lokasyon: r.lokasyon,
      tip: r.tip,
    }))
  }, [])
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export async function getPage(slug: string) {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'page',
      where: { slug: { equals: slug } },
      locale: 'all',
      depth: 2,
      limit: 1,
    })
    const r = docs[0]
    if (!r) return null
    return {
      baslik: r.baslik,
      altBaslik: r.altBaslik,
      chips: unwrap(r.chips, 'etiket'),
      girisLead: r.girisLead,
      girisParagraflar: unwrap(r.girisParagraflar, 'paragraf'),
      vizyonBaslik: r.vizyonBaslik,
      vizyonMetin: r.vizyonMetin,
      misyonBaslik: r.misyonBaslik,
      misyonMetin: r.misyonMetin,
      kartlarEyebrow: r.kartlarEyebrow,
      kartlarBaslik: r.kartlarBaslik,
      kartlarAciklama: r.kartlarAciklama,
      kartlar: r.kartlar ?? [],
    }
  }, null)
}

// ---------------------------------------------------------------------------
// Rich Pages
// ---------------------------------------------------------------------------

export async function getRichPage(slug: string) {
  return safe(async () => {
    const p = await getPayloadClient()
    const r = (
      await p.find({
        collection: 'richPage',
        where: { slug: { equals: slug } },
        locale: 'all',
        depth: 1,
        limit: 1,
      })
    ).docs[0] as unknown as Record<string, unknown>
    if (!r) return null
    return {
      slug: r.slug,
      baslik: r.baslik,
      icerik: r.icerik,
      kategori: r.kategori,
      sonGuncelleme: r.sonGuncelleme,
    }
  }, null)
}


// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export async function getDocuments() {
  return safe(async () => {
    const p = await getPayloadClient()
    const { docs } = await p.find({
      collection: 'document',
      sort: 'sira',
      locale: 'all',
      depth: 2,
      limit: 100,
    })
    return docs.map((r) => ({
      baslik: r.baslik,
      aciklama: (r as unknown as Record<string, unknown>).aciklama,
      dosya: (r as unknown as Record<string, unknown>).dosya,
      kategori: (r as unknown as Record<string, unknown>).kategori,
    }))
  }, [])
}

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------

export async function getSiteSettings() {
  return safe(async () => {
    const p = await getPayloadClient()
    const r = await p.findGlobal({
      slug: 'siteSettings',
      locale: 'all',
      depth: 2,
    })
    return {
      sirketAdi: r.sirketAdi,
      iletisim: r.iletisim,
      sosyal: r.sosyal,
      calismaSaatleri: r.calismaSaatleri,
      istatistikler: r.istatistikler,
      seo: r.seo,
      kunye: r.kunye
        ? {
            mersisNo: r.kunye.mersisNo ?? null,
            ticaretSicilNo: r.kunye.ticaretSicilNo ?? null,
            kepAdresi: r.kunye.kepAdresi ?? null,
          }
        : null,
    }
  }, null)
}

export async function getNav() {
  return safe(async () => {
    const p = await getPayloadClient()
    const r = await p.findGlobal({
      slug: 'navigation',
      locale: 'all',
      depth: 2,
    })
    return {
      headerLinks: r.headerLinks,
      footerKolonlari: r.footerKolonlari,
    }
  }, null)
}

export async function getHome() {
  return safe(async () => {
    const p = await getPayloadClient()
    const r = await p.findGlobal({
      slug: 'homePage',
      locale: 'all',
      depth: 2,
    })
    const urun = r.oneCikanUrun as Record<string, unknown> | null | undefined
    return {
      heroBaslik: r.heroBaslik,
      heroAltMetin: r.heroAltMetin,
      heroBirincilCta: r.heroBirincilCta,
      heroIkincilCta: r.heroIkincilCta,
      yaklasim: r.yaklasim,
      oneCikanUrun: urun && typeof urun === 'object' && !Array.isArray(urun)
        ? { slug: urun.slug ?? null, ad: urun.ad ?? null, slogan: urun.slogan ?? null }
        : null,
    }
  }, null)
}
