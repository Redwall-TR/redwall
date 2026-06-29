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
export function validateKvkkBasvuru(v: {
  adSoyad?: string;
  iletisim?: string;
  basvuruSahibiSifati?: string;
  talepTuru?: string;
  aciklama?: string;
  kvkkOnay?: boolean;
}): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.adSoyad?.trim()) e.adSoyad = 'zorunlu';
  if (!v.iletisim?.trim()) e.iletisim = 'zorunlu';
  if (!v.basvuruSahibiSifati?.trim()) e.basvuruSahibiSifati = 'zorunlu';
  if (!v.talepTuru?.trim()) e.talepTuru = 'zorunlu';
  if (!v.aciklama?.trim()) e.aciklama = 'zorunlu';
  if (!v.kvkkOnay) e.kvkkOnay = 'zorunlu';
  return e;
}
