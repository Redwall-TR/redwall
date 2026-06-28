export function mediaUrl(m: unknown): string | undefined {
  if (m && typeof m === 'object' && 'url' in m && typeof (m as any).url === 'string') return (m as any).url
  return undefined
}
