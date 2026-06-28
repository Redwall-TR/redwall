/**
 * Unwraps a named field from an array of objects.
 * Maps [{[key]:v}] → [v], safely handles null/undefined, filters falsy values.
 */
export function unwrap<T>(arr: unknown, key: string): T[] {
  if (!arr || !Array.isArray(arr)) {
    return []
  }
  return arr.map((r) => r?.[key]).filter(Boolean)
}

/**
 * Transforms a Payload upload field into a normalized media reference.
 * - Object with .url string → { url }
 * - Unresolved numeric id or any other value → null
 */
export function mediaRef(m: unknown): { url: string } | null {
  if (!m || typeof m !== 'object') {
    return null
  }

  const obj = m as Record<string, unknown>
  if (typeof obj.url === 'string') {
    return { url: obj.url }
  }

  return null
}

/**
 * Locale pass-through helper.
 * Payload 'locale: all' output already contains {tr, en}, so this is a type convenience.
 */
export function loc<T extends Record<string, unknown>>(field: T): T {
  return field
}
