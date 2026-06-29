'use server'

import { headers } from 'next/headers'
import { getPayloadClient } from '@/lib/cms/client'
import { getSiteSettings } from '@/lib/cms/queries'
import { validateContact, validateQuote, validateDemo, validateKvkkBasvuru } from '@/lib/form'
import { sendFormBildirim } from '@/lib/email'
import { buildRecord, type FormGonderimInput } from '@/lib/formRecord'

export type { FormGonderimInput }

export interface FormGonderimSonuc {
  ok: boolean
  errors?: Record<string, string>
}

// ── Basit IP-bazlı hız sınırı (best-effort, replica başına bellek içi) ──────────
// Sağlam koruma için Cloudflare Turnstile/WAF rate-rule önerilir; bu, app
// katmanında ucuz bir ilk savunmadır (spam/SMTP kota tüketimini zorlaştırır).
const WINDOW_MS = 10 * 60 * 1000 // 10 dk
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (arr.length >= MAX_PER_WINDOW) {
    hits.set(ip, arr)
    return true
  }
  arr.push(now)
  hits.set(ip, arr)
  // Bellek sızıntısını önlemek için ara sıra eski IP'leri temizle
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k)
  }
  return false
}

function dogrula(input: FormGonderimInput): Record<string, string> {
  switch (input.tur) {
    case 'teklif':
      return validateQuote({ ad: input.ad, email: input.email, isKolu: input.isKolu })
    case 'demo':
      return validateDemo({ ad: input.ad, email: input.email, urun: input.urun })
    case 'kvkk':
      return validateKvkkBasvuru({
        adSoyad: input.ad,
        iletisim: input.iletisim,
        basvuruSahibiSifati: input.basvuruSahibiSifati,
        talepTuru: input.talepTuru,
        aciklama: input.aciklama,
        kvkkOnay: input.kvkkOnay,
      })
    case 'iletisim':
    default:
      return validateContact({ ad: input.ad, email: input.email, mesaj: input.mesaj })
  }
}

/**
 * Form gönderimini sunucu tarafında doğrular, Payload'a kaydeder ve
 * (yapılandırılmışsa) SMTP ile bildirim e-postası gönderir. E-posta hatası
 * kaydı etkilemez (best-effort).
 */
export async function submitForm(input: FormGonderimInput): Promise<FormGonderimSonuc> {
  // Honeypot: gizli alan doluysa bot kabul edilir — sessizce başarı döndür
  // (kaydetme/e-posta yok; bota ipucu vermemek için hata da göstermeyiz).
  if (input.hp && input.hp.trim()) return { ok: true }

  // Hız sınırı
  const h = await headers()
  const ip =
    h.get('cf-connecting-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  if (rateLimited(ip)) {
    return { ok: false, errors: { _genel: 'rate' } }
  }

  const errors = dogrula(input)
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  const data = buildRecord(input)

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'formGonderimi',
      data,
      overrideAccess: true,
    })
  } catch (err) {
    console.error('[form-gonderim] Payload kaydı başarısız:', err)
    return { ok: false, errors: { _genel: 'kaydedilemedi' } }
  }

  // Bildirim e-postası — best-effort (hata kaydı etkilemez). Alıcı, siteSettings'teki
  // iletişim e-postası (admin'den değiştirilebilir; yoksa FORM_NOTIFY_TO/SMTP_USER).
  const settings = (await getSiteSettings()) as { iletisim?: { email?: string } } | null
  await sendFormBildirim(data, settings?.iletisim?.email)

  return { ok: true }
}
