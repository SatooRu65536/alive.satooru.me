import { describe, expect, it } from 'vitest';

import { parseHeartRateSummaries } from './heartRateSummary';

const SUMMARY = { bucketStartedAt: 1_790_000_000_000, averageBpm: 72.5, minBpm: 70, maxBpm: 75 };

describe('parseHeartRateSummaries', () => {
  it('集計結果の配列を返す', () => {
    expect(parseHeartRateSummaries(JSON.stringify([SUMMARY]))).toEqual({
      ok: true,
      summaries: [SUMMARY],
    });
  });

  it('空配列を受け付ける', () => {
    expect(parseHeartRateSummaries('[]')).toEqual({ ok: true, summaries: [] });
  });

  it('JSON として不正な文字列を拒否する', () => {
    expect(parseHeartRateSummaries('{').ok).toBe(false);
  });

  it('配列以外を拒否する', () => {
    expect(parseHeartRateSummaries(JSON.stringify(SUMMARY)).ok).toBe(false);
  });

  it.each([
    { name: 'プロパティの欠落', summary: { ...SUMMARY, maxBpm: undefined } },
    { name: '数値以外のプロパティ', summary: { ...SUMMARY, averageBpm: '72' } },
    { name: 'null の要素', summary: null },
  ])('$name を含む配列を拒否する', ({ summary }) => {
    expect(parseHeartRateSummaries(JSON.stringify([summary])).ok).toBe(false);
  });
});
