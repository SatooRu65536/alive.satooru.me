import { describe, expect, it } from 'vitest';

import { buildHeartRateStatsText } from './heartRateStats';

describe('buildHeartRateStatsText', () => {
  it('集計結果が空の場合は undefined を返す', () => {
    expect(buildHeartRateStatsText([])).toBeUndefined();
  });

  it('最新の平均と期間全体の最小・最大を四捨五入して返す', () => {
    const summaries = [
      // 2026-10-02T15:00:00Z = 2026-10-03 00:00 JST
      { bucketStartedAt: Date.UTC(2026, 9, 2, 15, 0), averageBpm: 70, minBpm: 58.4, maxBpm: 80 },
      { bucketStartedAt: Date.UTC(2026, 9, 2, 15, 5), averageBpm: 65.5, minBpm: 60, maxBpm: 90.6 },
    ];

    expect(buildHeartRateStatsText(summaries)).toEqual({
      latestTime: '10/3 00:05',
      latestBpm: '66',
      minBpm: '58',
      maxBpm: '91',
    });
  });
});
