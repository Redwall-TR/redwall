import 'server-only'
import nodemailer from 'nodemailer'
import { isEmail } from './form'
import { KVKK_SIFAT_OPTIONS, KVKK_TALEP_OPTIONS, kvkkLabelTr } from './kvkk'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * SMTP üzerinden e-posta gönderimi (form bildirimleri için).
 *
 * Yapılandırma ortam değişkenlerinden okunur:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, FORM_NOTIFY_TO
 *
 * SMTP yapılandırılmamışsa gönderim sessizce atlanır (best-effort) — form
 * kaydı her durumda Payload'a yazıldığı için e-posta hatası veri kaybına
 * yol açmaz.
 */

function getTransport() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null
  const port = Number(process.env.SMTP_PORT || 587)
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = SSL; 587 = STARTTLS
    auth: { user, pass },
  })
}

export interface FormBildirim {
  tur: 'iletisim' | 'teklif' | 'demo' | 'kvkk'
  ad: string
  email: string
  telefon?: string
  kurum?: string
  isKolu?: string
  il?: string
  metrekare?: string
  urun?: string
  basvuruSahibiSifati?: string
  talepTuru?: string
  kvkkOnay?: boolean
  mesaj?: string
}

const TUR_ETIKET: Record<FormBildirim['tur'], string> = {
  iletisim: 'İletişim',
  teklif: 'Teklif Talebi',
  demo: 'Demo Talebi',
  kvkk: 'KVKK Başvurusu',
}

/**
 * Form gönderimini bildirim e-postası olarak iletir. Başarı/atlama durumunu
 * döndürür; hata durumunda fırlatmaz (best-effort), yalnızca loglar.
 */
export async function sendFormBildirim(
  data: FormBildirim,
  toOverride?: string,
): Promise<{ sent: boolean; skipped?: boolean }> {
  const transport = getTransport()
  if (!transport) {
    console.warn('[email] SMTP yapılandırılmadı; bildirim e-postası atlandı.')
    return { sent: false, skipped: true }
  }

  // Alıcı önceliği: çağıran (siteSettings iletişim e-postası) → env → SMTP kullanıcısı.
  const to = toOverride?.trim() || process.env.FORM_NOTIFY_TO || process.env.SMTP_USER
  const from = process.env.SMTP_FROM || process.env.SMTP_USER

  const satirlar: Array<[string, string | undefined]> = [
    ['Tür', TUR_ETIKET[data.tur]],
    ['Ad Soyad', data.ad],
    ['E-posta / İletişim', data.email],
    ['Telefon', data.telefon],
    ['Kurum', data.kurum],
    ['İlgili Hizmet', data.isKolu],
    ['İl', data.il],
    ['Bina m²', data.metrekare],
    ['Ürün', data.urun],
    ['Başvuru Sahibi Sıfatı', data.basvuruSahibiSifati ? kvkkLabelTr(KVKK_SIFAT_OPTIONS, data.basvuruSahibiSifati) : undefined],
    ['Talep Türü', data.talepTuru ? kvkkLabelTr(KVKK_TALEP_OPTIONS, data.talepTuru) : undefined],
    ['KVKK Onayı', data.tur === 'kvkk' ? (data.kvkkOnay ? 'Evet' : 'Hayır') : undefined],
    ['Mesaj', data.mesaj],
  ]
  const dolu = satirlar.filter(([, v]) => v && String(v).trim())

  const text = dolu.map(([k, v]) => `${k}: ${v}`).join('\n')
  const html = `
    <h2 style="font-family:sans-serif">Yeni ${TUR_ETIKET[data.tur]} formu</h2>
    <table style="font-family:sans-serif;border-collapse:collapse">
      ${dolu
        .map(
          ([k, v]) =>
            `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top"><strong>${escapeHtml(
              k,
            )}</strong></td><td style="padding:4px 0;white-space:pre-wrap">${escapeHtml(
              String(v),
            )}</td></tr>`,
        )
        .join('')}
    </table>`

  try {
    await transport.sendMail({
      from,
      to,
      // replyTo yalnızca geçerli e-posta ise (KVKK formunda iletişim telefon olabilir)
      replyTo: data.email && isEmail(data.email) ? data.email : undefined,
      subject: `[Redwall] Yeni ${TUR_ETIKET[data.tur]} — ${data.ad}`,
      text,
      html,
    })
    return { sent: true }
  } catch (err) {
    console.error('[email] Bildirim e-postası gönderilemedi:', err)
    return { sent: false }
  }
}
