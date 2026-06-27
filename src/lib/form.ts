export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
export function validateContact(v: { ad?: string; email?: string; mesaj?: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.ad?.trim()) e.ad = 'zorunlu';
  if (!v.email?.trim()) e.email = 'zorunlu'; else if (!isEmail(v.email)) e.email = 'gecersizEmail';
  if (!v.mesaj?.trim()) e.mesaj = 'zorunlu';
  return e;
}
export function validateQuote(v: { ad?: string; email?: string; isKolu?: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.ad?.trim()) e.ad = 'zorunlu';
  if (!v.email?.trim()) e.email = 'zorunlu'; else if (!isEmail(v.email)) e.email = 'gecersizEmail';
  if (!v.isKolu?.trim()) e.isKolu = 'zorunlu';
  return e;
}
