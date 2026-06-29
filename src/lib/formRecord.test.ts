import { describe, it, expect } from 'vitest'
import { buildRecord } from './formRecord'

describe('buildRecord', () => {
  it('KVKK: iletişim→email, yapısal alanlar ayrı, açıklama→mesaj', () => {
    const r = buildRecord({
      tur: 'kvkk',
      ad: '  Ada Lovelace  ',
      iletisim: 'ada@example.com',
      basvuruSahibiSifati: 'vekil',
      talepTuru: 'silme-yok-etme',
      aciklama: '  Verilerimin silinmesini talep ediyorum.  ',
      kvkkOnay: true,
    })
    expect(r).toEqual({
      tur: 'kvkk',
      ad: 'Ada Lovelace',
      email: 'ada@example.com',
      basvuruSahibiSifati: 'vekil',
      talepTuru: 'silme-yok-etme',
      kvkkOnay: true,
      mesaj: 'Verilerimin silinmesini talep ediyorum.',
    })
  })

  it('KVKK: onay false ise kvkkOnay=false', () => {
    const r = buildRecord({ tur: 'kvkk', ad: 'X', iletisim: 'x@y.z' })
    expect(r.kvkkOnay).toBe(false)
    expect(r.tur).toBe('kvkk')
  })

  it('iletişim: standart alanlar, boşlar undefined', () => {
    const r = buildRecord({ tur: 'iletisim', ad: 'Test', email: 'a@b.c', mesaj: 'Merhaba' })
    expect(r).toMatchObject({ tur: 'iletisim', ad: 'Test', email: 'a@b.c', mesaj: 'Merhaba' })
    expect(r.telefon).toBeUndefined()
    expect(r.basvuruSahibiSifati).toBeUndefined()
  })

  it('teklif: isKolu/il/metrekare taşınır', () => {
    const r = buildRecord({ tur: 'teklif', ad: 'T', email: 'a@b.c', isKolu: 'yazilim', il: 'Sakarya', metrekare: '500' })
    expect(r).toMatchObject({ tur: 'teklif', isKolu: 'yazilim', il: 'Sakarya', metrekare: '500' })
  })
})
