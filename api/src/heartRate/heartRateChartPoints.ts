import type { HeartRateSummary } from './heartRateSummary';

export interface HeartRateChartPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * 集計結果からグラフの 1 系列分の点を作る
 * @param summaries bucketStartedAt 昇順の集計結果
 * @param selectBpm 系列として描く値を集計結果から選ぶ関数
 * @returns x が bucketStartedAt，y が選んだ値の点の配列
 */
export function buildPoints({
  summaries,
  selectBpm,
}: {
  summaries: readonly HeartRateSummary[];
  selectBpm: (summary: HeartRateSummary) => number;
}): HeartRateChartPoint[] {
  return summaries.map((summary) => ({ x: summary.bucketStartedAt, y: selectBpm(summary) }));
}
