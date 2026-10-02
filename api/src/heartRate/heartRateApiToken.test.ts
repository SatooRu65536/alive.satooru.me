import { afterEach, describe, expect, it, vi } from 'vitest';

import { verifyHeartRateApiToken } from './heartRateApiToken';

describe('verifyHeartRateApiToken', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('設定したトークンと一致する場合は true を返す', async () => {
    expect(await verifyHeartRateApiToken({ token: 'secret', expectedToken: 'secret' })).toBe(true);
  });

  it('設定したトークンと一致しない場合は false を返す', async () => {
    expect(await verifyHeartRateApiToken({ token: 'wrong', expectedToken: 'secret' })).toBe(false);
  });

  it.each([undefined, ''])('トークンが未設定 (%j) の場合は false を返す', async (expectedToken) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await verifyHeartRateApiToken({ token: 'secret', expectedToken })).toBe(false);
  });
});
