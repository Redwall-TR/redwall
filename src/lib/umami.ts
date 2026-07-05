/** Umami izleme script bilgisi — base + websiteId doluysa {src, websiteId}, yoksa null.
 *  Env-gating tek noktada; Analytics bileşeni bunu process.env ile çağırır. */
export function umamiScriptSrc(
  base: string | undefined,
  websiteId: string | undefined,
): { src: string; websiteId: string } | null {
  if (!base || !websiteId) return null;
  return { src: `${base.replace(/\/$/, '')}/script.js`, websiteId };
}
