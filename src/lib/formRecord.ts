import type { FormBildirim } from './email'

// Form gönderim girdisi (istemci → server action). Saf modül: 'use server'
// içermez, böylece buildRecord birim test edilebilir.
export interface FormGonderimInput {
  tur: 'iletisim' | 'teklif' | 'demo' | 'kvkk'
  ad?: string
  email?: string
  telefon?: string
  kurum?: string
  isKolu?: string
  il?: string
  metrekare?: string
  urun?: string
  mesaj?: string
  // KVKK başvuru alanları
  iletisim?: string
  basvuruSahibiSifati?: string
  talepTuru?: string
  aciklama?: string
  kvkkOnay?: boolean
  // Honeypot
  hp?: string
}

/**
 * Doğrulanmış girdiyi saklanacak/e-postalanacak kayda dönüştürür (saf fonksiyon).
 * KVKK başvurusunda iletişim → email, yapısal alanlar (sıfat/talep/onay) ayrı
 * kolonlara, serbest açıklama → mesaj.
 */
export function buildRecord(input: FormGonderimInput): FormBildirim {
  if (input.tur === 'kvkk') {
    return {
      tur: 'kvkk',
      ad: (input.ad ?? '').trim(),
      email: (input.iletisim ?? '').trim(),
      basvuruSahibiSifati: input.basvuruSahibiSifati?.trim() || undefined,
      talepTuru: input.talepTuru?.trim() || undefined,
      kvkkOnay: !!input.kvkkOnay,
      mesaj: (input.aciklama ?? '').trim() || undefined,
    }
  }
  return {
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
}
