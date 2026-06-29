// KVKK başvuru formu seçenekleri — tek kaynak. Hem form (etiket render) hem
// server action (e-posta/mesaj için TR etiket) bunu kullanır; böylece değer→etiket
// eşlemesi iki yerde tekrarlanmaz.

export interface KvkkOption {
  value: string;
  tr: string;
  en: string;
}

export const KVKK_SIFAT_OPTIONS: readonly KvkkOption[] = [
  { value: 'ilgili-kisi', tr: 'İlgili kişi', en: 'Data subject' },
  { value: 'vekil', tr: 'Vekil', en: 'Authorized representative' },
  { value: 'yasal-temsilci', tr: 'Yasal temsilci', en: 'Legal representative' },
];

export const KVKK_TALEP_OPTIONS: readonly KvkkOption[] = [
  { value: 'bilgi-talebi', tr: 'Bilgi talebi', en: 'Access request' },
  { value: 'duzeltme', tr: 'Düzeltme', en: 'Rectification' },
  { value: 'silme-yok-etme', tr: 'Silme/Yok etme', en: 'Erasure/Destruction' },
  { value: 'islemeye-itiraz', tr: 'İşlemeye itiraz', en: 'Objection to processing' },
  { value: 'diger', tr: 'Diğer', en: 'Other' },
];

/** Değere karşılık gelen TR etiketi döndürür (bulunamazsa değerin kendisi). */
export function kvkkLabelTr(options: readonly KvkkOption[], value: string | undefined): string {
  if (!value) return '-';
  return options.find((o) => o.value === value)?.tr ?? value;
}
