import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

let cached: Promise<Payload> | null = null
export function getPayloadClient(): Promise<Payload> {
  if (!cached) cached = getPayload({ config })
  return cached
}

export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    console.error('[cms] fetch failed:', e)
    return fallback
  }
}
