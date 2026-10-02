import { describe, expect, it } from 'vitest';

import { isHeartRateRangeKey } from './heartRateRange';

describe('isHeartRateRangeKey', () => {
  it.each(['1h', '6h', '24h', '7d'])('定義済みのキー %s を受け付ける', (value) => {
    expect(isHeartRateRangeKey(value)).toBe(true);
  });

  it.each([undefined, '', '12h', '1H'])('未定義の値 %s を拒否する', (value) => {
    expect(isHeartRateRangeKey(value)).toBe(false);
  });

  it('Object.prototype のプロパティ名を拒否する', () => {
    expect(isHeartRateRangeKey('toString')).toBe(false);
    expect(isHeartRateRangeKey('constructor')).toBe(false);
  });
});
