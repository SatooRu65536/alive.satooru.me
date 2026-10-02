export const HEART_RATE_RANGE_KEYS = ['1h', '6h', '24h', '7d'] as const;

export type HeartRateRangeKey = (typeof HEART_RATE_RANGE_KEYS)[number];

export interface HeartRateRange {
  readonly label: string;
  readonly durationMs: number;
  readonly bucketMs: number;
  // 時刻だけでは何日のデータか判別しにくい長さの期間では日付を添える
  readonly includesDate: boolean;
}

// 各表示期間で点の数が 300 前後になるように集計単位を決める
export const HEART_RATE_RANGES: Readonly<Record<HeartRateRangeKey, HeartRateRange>> = {
  '1h': { label: '1時間', durationMs: 3_600_000, bucketMs: 10_000, includesDate: false },
  '6h': { label: '6時間', durationMs: 21_600_000, bucketMs: 60_000, includesDate: false },
  '24h': { label: '24時間', durationMs: 86_400_000, bucketMs: 300_000, includesDate: true },
  '7d': { label: '7日間', durationMs: 604_800_000, bucketMs: 1_800_000, includesDate: true },
};

export const DEFAULT_HEART_RATE_RANGE_KEY: HeartRateRangeKey = '24h';

/**
 * 心拍グラフの表示期間を表すキーかどうかを判定する
 * @param value クエリパラメータなどから受け取った値
 * @returns HEART_RATE_RANGE_KEYS に含まれる値であれば true
 */
export function isHeartRateRangeKey(value: string | undefined): value is HeartRateRangeKey {
  return HEART_RATE_RANGE_KEYS.some((key) => key === value);
}

/**
 * クエリパラメータなどで指定された表示期間を解決する
 * @param value 表示期間のキーとして受け取った値
 * @returns 有効なキーであればその値，そうでなければ DEFAULT_HEART_RATE_RANGE_KEY
 */
export function resolveHeartRateRangeKey(value: string | undefined): HeartRateRangeKey {
  return isHeartRateRangeKey(value) ? value : DEFAULT_HEART_RATE_RANGE_KEY;
}
