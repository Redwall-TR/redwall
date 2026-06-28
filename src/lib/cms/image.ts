export function mediaUrl(m: unknown): string | undefined {
  if (m && typeof m === 'object' && 'url' in m && typeof (m as { url: unknown }).url === 'string') return (m as { url: string }).url
  return undefined
}
