import { describe, expect, it } from 'vitest';

import { BATCH_DURATION_MS, MAX_SAMPLE_COUNT, parseHeartRateBatch } from './heartRateBatch';

const BASE_TIME = 1_790_000_000_000;

describe('parseHeartRateBatch', () => {
  it('1 分以内のサンプル列を measuredAt 昇順で返す', () => {
    const result = parseHeartRateBatch({
      samples: [
        { measuredAt: BASE_TIME + 1000, bpm: 72 },
        { measuredAt: BASE_TIME, bpm: 70.5 },
      ],
    });
    expect(result).toEqual({
      ok: true,
      samples: [
        { measuredAt: BASE_TIME, bpm: 70.5 },
        { measuredAt: BASE_TIME + 1000, bpm: 72 },
      ],
    });
  });

  it('サンプルの余分なプロパティを取り除く', () => {
    const result = parseHeartRateBatch({
      samples: [{ measuredAt: BASE_TIME, bpm: 72, extra: 'x' }],
    });
    expect(result).toEqual({ ok: true, samples: [{ measuredAt: BASE_TIME, bpm: 72 }] });
  });

  it.each([undefined, null, 'text', [], {}, { samples: 'text' }])(
    'samples が配列でない場合はエラー: %o',
    (body) => {
      expect(parseHeartRateBatch(body).ok).toBe(false);
    },
  );

  it('samples が空の場合はエラー', () => {
    expect(parseHeartRateBatch({ samples: [] }).ok).toBe(false);
  });

  it('samples が上限件数を超える場合はエラー', () => {
    const samples = Array.from({ length: MAX_SAMPLE_COUNT + 1 }, (_, index) => ({
      measuredAt: BASE_TIME + index,
      bpm: 72,
    }));
    expect(parseHeartRateBatch({ samples }).ok).toBe(false);
  });

  it('samples が上限件数ちょうどの場合は成功', () => {
    const samples = Array.from({ length: MAX_SAMPLE_COUNT }, (_, index) => ({
      measuredAt: BASE_TIME + index,
      bpm: 72,
    }));
    expect(parseHeartRateBatch({ samples }).ok).toBe(true);
  });

  it.each([
    { measuredAt: BASE_TIME },
    { bpm: 72 },
    { measuredAt: String(BASE_TIME), bpm: 72 },
    { measuredAt: BASE_TIME + 0.5, bpm: 72 },
    { measuredAt: -1, bpm: 72 },
    { measuredAt: BASE_TIME, bpm: 0 },
    { measuredAt: BASE_TIME, bpm: 301 },
    { measuredAt: BASE_TIME, bpm: Number.NaN },
    { measuredAt: BASE_TIME, bpm: Number.POSITIVE_INFINITY },
    null,
  ])('不正なサンプルを含む場合はエラー: %o', (sample) => {
    expect(parseHeartRateBatch({ samples: [sample] }).ok).toBe(false);
  });

  it('bpm が上限ちょうどの場合は成功', () => {
    expect(parseHeartRateBatch({ samples: [{ measuredAt: BASE_TIME, bpm: 300 }] }).ok).toBe(true);
  });

  it('サンプルの時間幅が 1 分以上の場合はエラー', () => {
    const result = parseHeartRateBatch({
      samples: [
        { measuredAt: BASE_TIME, bpm: 72 },
        { measuredAt: BASE_TIME + BATCH_DURATION_MS, bpm: 72 },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it('サンプルの時間幅が 1 分未満の場合は成功', () => {
    const result = parseHeartRateBatch({
      samples: [
        { measuredAt: BASE_TIME, bpm: 72 },
        { measuredAt: BASE_TIME + BATCH_DURATION_MS - 1, bpm: 72 },
      ],
    });
    expect(result.ok).toBe(true);
  });
});
