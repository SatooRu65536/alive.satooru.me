import { describe, expect, it } from 'vitest';

import { buildPoints } from './heartRateChartPoints';

describe('buildPoints', () => {
  const summaries = [
    { bucketStartedAt: 0, averageBpm: 70, minBpm: 60, maxBpm: 80 },
    { bucketStartedAt: 10_000, averageBpm: 72, minBpm: 65, maxBpm: 85 },
  ];

  it('bucketStartedAt を x，選んだ値を y にした点を順に返す', () => {
    expect(buildPoints({ summaries, selectBpm: (summary) => summary.maxBpm })).toEqual([
      { x: 0, y: 80 },
      { x: 10_000, y: 85 },
    ]);
  });

  it('集計結果が空の場合は空配列を返す', () => {
    expect(buildPoints({ summaries: [], selectBpm: (summary) => summary.averageBpm })).toEqual([]);
  });
});
