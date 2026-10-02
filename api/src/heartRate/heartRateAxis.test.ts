import { describe, expect, it } from 'vitest';

import { buildAlignedTickValues, isAlignedToStep } from './heartRateAxis';

const FIVE_MINUTES_MS = 300_000;
const ONE_DAY_MS = 86_400_000;

describe('buildAlignedTickValues', () => {
  it('5 分間隔では 0, 5, 10 分の時刻を列挙する', () => {
    // 2026-10-02T15:03:00Z = 2026-10-03 00:03 JST
    const min = Date.UTC(2026, 9, 2, 15, 3);
    const max = Date.UTC(2026, 9, 2, 15, 17);

    expect(buildAlignedTickValues({ min, max, stepMs: FIVE_MINUTES_MS })).toEqual([
      Date.UTC(2026, 9, 2, 15, 5),
      Date.UTC(2026, 9, 2, 15, 10),
      Date.UTC(2026, 9, 2, 15, 15),
    ]);
  });

  it('範囲の端が区切りに一致する場合は端も含める', () => {
    const min = Date.UTC(2026, 9, 2, 15, 0);
    const max = Date.UTC(2026, 9, 2, 15, 10);

    expect(buildAlignedTickValues({ min, max, stepMs: FIVE_MINUTES_MS })).toEqual([
      Date.UTC(2026, 9, 2, 15, 0),
      Date.UTC(2026, 9, 2, 15, 5),
      Date.UTC(2026, 9, 2, 15, 10),
    ]);
  });

  it('1 日間隔では日本時間の 0 時を列挙する', () => {
    const min = Date.UTC(2026, 9, 2, 0, 0);
    const max = Date.UTC(2026, 9, 4, 0, 0);

    // 2026-10-02T15:00:00Z = 2026-10-03 00:00 JST
    expect(buildAlignedTickValues({ min, max, stepMs: ONE_DAY_MS })).toEqual([
      Date.UTC(2026, 9, 2, 15, 0),
      Date.UTC(2026, 9, 3, 15, 0),
    ]);
  });

  it('範囲内に区切りがない場合は空配列を返す', () => {
    const min = Date.UTC(2026, 9, 2, 15, 1);
    const max = Date.UTC(2026, 9, 2, 15, 4);

    expect(buildAlignedTickValues({ min, max, stepMs: FIVE_MINUTES_MS })).toEqual([]);
  });
});

describe('isAlignedToStep', () => {
  it('日本時間の 0 時は 1 日の区切りに一致する', () => {
    expect(isAlignedToStep({ epochMs: Date.UTC(2026, 9, 2, 15, 0), stepMs: ONE_DAY_MS })).toBe(
      true,
    );
  });

  it('UTC の 0 時は 1 日の区切りに一致しない', () => {
    expect(isAlignedToStep({ epochMs: Date.UTC(2026, 9, 2, 0, 0), stepMs: ONE_DAY_MS })).toBe(
      false,
    );
  });
});
