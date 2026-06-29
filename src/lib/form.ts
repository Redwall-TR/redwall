export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Alan uzunluk üst sınırları — saklanan veri ve e-posta gövdesi şişmesini
// (spam/DoS amplifikasyonu) engeller. Sunucu + istemci tarafında uygulanır.
export const MAX = {
  ad: 120,
  email: 200,
  kisa: 200, // tek satırlık alanlar (kurum, il, metrekare, isKolu, urun, telefon, iletisim, select değerleri)
  mesaj: 5000,
} as const;

function tooLong(v: string | undefined, max: number): boolean {
  return !!v && v.length > max;
}

export function validateContact(v: { ad?: string; email?: string; mesaj?: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.ad?.trim()) e.ad = 'zorunlu'; else if (tooLong(v.ad, MAX.ad)) e.ad = 'cokUzun';
  if (!v.email?.trim()) e.email = 'zorunlu'; else if (!isEmail(v.email)) e.email = 'gecersizEmail'; else if (tooLong(v.email, MAX.email)) e.email = 'cokUzun';
  if (!v.mesaj?.trim()) e.mesaj = 'zorunlu'; else if (tooLong(v.mesaj, MAX.mesaj)) e.mesaj = 'cokUzun';
  return e;
}
export function validateQuote(v: { ad?: string; email?: string; isKolu?: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.ad?.trim()) e.ad = 'zorunlu'; else if (tooLong(v.ad, MAX.ad)) e.ad = 'cokUzun';
  if (!v.email?.trim()) e.email = 'zorunlu'; else if (!isEmail(v.email)) e.email = 'gecersizEmail'; else if (tooLong(v.email, MAX.email)) e.email = 'cokUzun';
  if (!v.isKolu?.trim()) e.isKolu = 'zorunlu'; else if (tooLong(v.isKolu, MAX.kisa)) e.isKolu = 'cokUzun';
  return e;
}
export function validateDemo(v: { urun?: string; ad?: string; kurum?: string; email?: string; mesaj?: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.ad?.trim()) e.ad = 'zorunlu'; else if (tooLong(v.ad, MAX.ad)) e.ad = 'cokUzun';
  if (!v.email?.trim()) e.email = 'zorunlu'; else if (!isEmail(v.email)) e.email = 'gecersizEmail'; else if (tooLong(v.email, MAX.email)) e.email = 'cokUzun';
  if (!v.urun?.trim()) e.urun = 'zorunlu'; else if (tooLong(v.urun, MAX.kisa)) e.urun = 'cokUzun';
  if (tooLong(v.mesaj, MAX.mesaj)) e.mesaj = 'cokUzun';
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
  if (!v.adSoyad?.trim()) e.adSoyad = 'zorunlu'; else if (tooLong(v.adSoyad, MAX.ad)) e.adSoyad = 'cokUzun';
  if (!v.iletisim?.trim()) e.iletisim = 'zorunlu'; else if (tooLong(v.iletisim, MAX.kisa)) e.iletisim = 'cokUzun';
  if (!v.basvuruSahibiSifati?.trim()) e.basvuruSahibiSifati = 'zorunlu'; else if (tooLong(v.basvuruSahibiSifati, MAX.kisa)) e.basvuruSahibiSifati = 'cokUzun';
  if (!v.talepTuru?.trim()) e.talepTuru = 'zorunlu'; else if (tooLong(v.talepTuru, MAX.kisa)) e.talepTuru = 'cokUzun';
  if (!v.aciklama?.trim()) e.aciklama = 'zorunlu'; else if (tooLong(v.aciklama, MAX.mesaj)) e.aciklama = 'cokUzun';
  if (!v.kvkkOnay) e.kvkkOnay = 'zorunlu';
  return e;
}
