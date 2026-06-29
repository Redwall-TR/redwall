import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

let cached: Promise<Payload> | null = null
export function getPayloadClient(): Promise<Payload> {
  if (!cached) cached = getPayload({ config })
  return cached
}

/**
 * CMS sorgularını sarmalar: hata olursa prod'da fallback döner (kırık bir sorgu
 * tüm sayfayı 500 yapmasın), ama geliştirmede yeniden fırlatır ki şema
 * uyumsuzlukları "boş içerik" gibi sessizce gizlenmesin. `label` log'a yazılır.
 */
export async function safe<T>(fn: () => Promise<T>, fallback: T, label?: string): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    console.error(`[cms] fetch failed${label ? ` (${label})` : ''}:`, e)
    // Yalnız interaktif geliştirmede fırlat (şema uyumsuzlukları görünür olsun);
    // prod ve test ortamında zarifçe fallback döner.
    if (process.env.NODE_ENV === 'development') throw e
    return fallback
  }
}
