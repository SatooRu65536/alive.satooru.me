// 日本時間は夏時間がなく UTC+9 で固定のため，時刻の区切りを epoch ms から求めるときはこの分ずらす
const DISPLAY_TIME_ZONE_OFFSET_MS = 9 * 3_600_000;

/**
 * 日本時間の時刻が間隔の区切り (5 分間隔なら 0, 5, 10 分) に一致するかを判定する
 * @param epochMs 判定する時刻
 * @param stepMs 区切りの間隔
 * @returns 区切りに一致すれば true
 */
export function isAlignedToStep({ epochMs, stepMs }: { epochMs: number; stepMs: number }): boolean {
  return (epochMs + DISPLAY_TIME_ZONE_OFFSET_MS) % stepMs === 0;
}

/**
 * 表示範囲に含まれる日本時間の区切りの時刻を列挙する
 * @param min 表示範囲の始まり
 * @param max 表示範囲の終わり
 * @param stepMs 区切りの間隔
 * @returns min 以上 max 以下の区切りの時刻の昇順の配列
 */
export function buildAlignedTickValues({
  min,
  max,
  stepMs,
}: {
  min: number;
  max: number;
  stepMs: number;
}): number[] {
  const firstTickValue =
    Math.ceil((min + DISPLAY_TIME_ZONE_OFFSET_MS) / stepMs) * stepMs - DISPLAY_TIME_ZONE_OFFSET_MS;
  const tickValues: number[] = [];
  for (let tickValue = firstTickValue; tickValue <= max; tickValue += stepMs) {
    tickValues.push(tickValue);
  }
  return tickValues;
}
