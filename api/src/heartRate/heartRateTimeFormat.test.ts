import { describe, expect, it } from 'vitest';

import { formatDisplayTime } from './heartRateTimeFormat';

// 2026-10-02T15:04:00Z = 2026-10-03 00:04 JST
const EPOCH_MS = Date.UTC(2026, 9, 2, 15, 4);

describe('formatDisplayTime', () => {
  it('日本時間の時刻を返す', () => {
    expect(formatDisplayTime({ epochMs: EPOCH_MS, includesDate: false })).toBe('00:04');
  });

  it('日付を含める場合は日本時間の日付も返す', () => {
    expect(formatDisplayTime({ epochMs: EPOCH_MS, includesDate: true })).toBe('10/3 00:04');
  });
});
