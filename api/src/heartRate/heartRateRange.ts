export const HEART_RATE_RANGE_KEYS = ['1h', '6h', '24h', '7d'] as const;

export type HeartRateRangeKey = (typeof HEART_RATE_RANGE_KEYS)[number];

export interface HeartRateRange {
  readonly label: string;
  readonly durationMs: number;
  readonly bucketMs: number;
  // 時刻だけでは何日のデータか判別しにくい長さの期間では日付を添える
  readonly includesDate: boolean;
  // 縦のグリッド線を引く間隔．日本時間の区切り (5 分間隔なら 0, 5, 10 分) に合わせて引く
  readonly gridStepMs: number;
  // 時刻のラベルを添える間隔．gridStepMs の倍数にする
  readonly labelStepMs: number;
}

// 各表示期間で点の数が 300 前後になるように集計単位を決める
// グリッド線は 5 分間隔を基本とし，線が密になりすぎる長い期間では広げる
export const HEART_RATE_RANGES: Readonly<Record<HeartRateRangeKey, HeartRateRange>> = {
  '1h': {
    label: '1時間',
    durationMs: 3_600_000,
    bucketMs: 10_000,
    includesDate: false,
    gridStepMs: 300_000,
    labelStepMs: 600_000,
  },
  '6h': {
    label: '6時間',
    durationMs: 21_600_000,
    bucketMs: 60_000,
    includesDate: false,
    gridStepMs: 300_000,
    labelStepMs: 3_600_000,
  },
  '24h': {
    label: '24時間',
    durationMs: 86_400_000,
    bucketMs: 300_000,
    includesDate: true,
    gridStepMs: 3_600_000,
    labelStepMs: 21_600_000,
  },
  '7d': {
    label: '7日間',
    durationMs: 604_800_000,
    bucketMs: 1_800_000,
    includesDate: true,
    gridStepMs: 21_600_000,
    labelStepMs: 86_400_000,
  },
};

export const DEFAULT_HEART_RATE_RANGE_KEY: HeartRateRangeKey = '1h';

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
