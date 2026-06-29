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
