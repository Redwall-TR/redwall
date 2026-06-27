import { describe, it, expect } from 'vitest';
import { isEmail, validateContact } from './form';
describe('isEmail', () => {
  it('geçerli/geçersiz', () => { expect(isEmail('a@b.com')).toBe(true); expect(isEmail('x')).toBe(false); });
});
describe('validateContact', () => {
  it('boş ad ve geçersiz email hata verir', () => {
    const e = validateContact({ ad: '', email: 'x', mesaj: 'merhaba' });
    expect(e.ad).toBe('zorunlu'); expect(e.email).toBe('gecersizEmail');
  });
  it('geçerli girişte hata yok', () => {
    expect(validateContact({ ad: 'Ali', email: 'a@b.com', mesaj: 'merhaba' })).toEqual({});
  });
});
