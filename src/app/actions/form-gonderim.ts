'use server'

import { getPayloadClient } from '@/lib/cms/client'
import { validateContact, validateQuote, validateDemo } from '@/lib/form'
import { sendFormBildirim, type FormBildirim } from '@/lib/email'

export interface FormGonderimInput {
  tur: 'iletisim' | 'teklif' | 'demo'
  ad?: string
  email?: string
  telefon?: string
  kurum?: string
  isKolu?: string
  il?: string
  metrekare?: string
  urun?: string
  mesaj?: string
}

export interface FormGonderimSonuc {
  ok: boolean
  errors?: Record<string, string>
}

function dogrula(input: FormGonderimInput): Record<string, string> {
  switch (input.tur) {
    case 'teklif':
      return validateQuote({ ad: input.ad, email: input.email, isKolu: input.isKolu })
    case 'demo':
      return validateDemo({ ad: input.ad, email: input.email, urun: input.urun })
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
  const errors = dogrula(input)
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  const data = {
    tur: input.tur,
    ad: (input.ad ?? '').trim(),
    email: (input.email ?? '').trim(),
    telefon: input.telefon?.trim() || undefined,
    kurum: input.kurum?.trim() || undefined,
    isKolu: input.isKolu?.trim() || undefined,
    il: input.il?.trim() || undefined,
    metrekare: input.metrekare?.trim() || undefined,
    urun: input.urun?.trim() || undefined,
    mesaj: input.mesaj?.trim() || undefined,
  }

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

  // Bildirim e-postası — best-effort (hata kaydı etkilemez).
  await sendFormBildirim(data as FormBildirim)

  return { ok: true }
}
