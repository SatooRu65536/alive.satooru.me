import type { HeartRateRangeKey } from './heartRateRange';

export interface HeartRateSummary {
  readonly bucketStartedAt: number;
  readonly averageBpm: number;
  readonly minBpm: number;
  readonly maxBpm: number;
}

export type HeartRateSummariesParseResult =
  | { readonly ok: true; readonly summaries: readonly HeartRateSummary[] }
  | { readonly ok: false; readonly error: string };

/**
 * 心拍の集計結果として扱える値かどうかを判定する
 * @param value JSON から復元した値
 * @returns 全プロパティが有限の数値であれば true
 */
function isHeartRateSummary(value: unknown): value is HeartRateSummary {
  if (typeof value !== 'object' || value === null) return false;
  return (['bucketStartedAt', 'averageBpm', 'minBpm', 'maxBpm'] as const).every((key) =>
    Number.isFinite(Reflect.get(value, key)),
  );
}

/**
 * JSON 文字列を心拍の集計結果の配列として検証する
 * @param json HTML の属性などで受け渡された JSON 文字列
 * @returns 検証に成功した場合は集計結果の配列，失敗した場合はエラーメッセージ
 */
export function parseHeartRateSummaries(json: string): HeartRateSummariesParseResult {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return { ok: false, error: 'summaries must be valid JSON' };
  }
  if (!Array.isArray(value) || !value.every(isHeartRateSummary)) {
    return { ok: false, error: 'summaries must be an array of heart rate summaries' };
  }
  return { ok: true, summaries: value };
}

/**
 * 表示期間の集計結果を取得する API のパスを作る
 * @param rangeKey 表示期間
 * @returns ページと同じオリジンへのパス
 */
export function buildHeartRateSummariesPath(rangeKey: HeartRateRangeKey): string {
  return `/api/heart-rates/summaries?range=${encodeURIComponent(rangeKey)}`;
}
