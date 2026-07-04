import { describe, it, expect, vi, afterEach } from 'vitest';
import { verifyTurnstile } from './form-gonderim';

afterEach(() => { vi.unstubAllEnvs(); });

describe('verifyTurnstile — secret yok', () => {
  it('üretimde secret yoksa reddeder (fail-closed)', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    vi.stubEnv('NODE_ENV', 'production');
    expect(await verifyTurnstile('herhangi', '1.2.3.4')).toBe(false);
  });
  it('development ortamında secret yoksa atlar (izin verir)', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    vi.stubEnv('NODE_ENV', 'development');
    expect(await verifyTurnstile(undefined, 'unknown')).toBe(true);
  });
});
