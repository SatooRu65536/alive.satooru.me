import type { HeartRateSummary } from './heartRateSummary';
import { formatDisplayTime } from './heartRateTimeFormat';

export interface HeartRateStatsText {
  readonly latestTime: string;
  readonly latestBpm: string;
  readonly minBpm: string;
  readonly maxBpm: string;
}

/**
 * 集計結果から最新・最小・最大の表示用文字列を作る．サーバーでの初期表示とブラウザでの更新で同じ表示にするため共有する
 * @param summaries bucketStartedAt 昇順の集計結果
 * @returns 表示用の文字列．集計結果が空の場合は undefined
 */
export function buildHeartRateStatsText(
  summaries: readonly HeartRateSummary[],
): HeartRateStatsText | undefined {
  const latestSummary = summaries.at(-1);
  if (latestSummary === undefined) return undefined;
  return {
    latestTime: formatDisplayTime({ epochMs: latestSummary.bucketStartedAt, includesDate: true }),
    latestBpm: String(Math.round(latestSummary.averageBpm)),
    minBpm: String(Math.round(Math.min(...summaries.map((summary) => summary.minBpm)))),
    maxBpm: String(Math.round(Math.max(...summaries.map((summary) => summary.maxBpm)))),
  };
}
