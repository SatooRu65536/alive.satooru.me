// 端末の送信頻度を 5 分より長く設定すると，送信の合間にも生きていないと判定される点に注意する
export const ALIVE_THRESHOLD_MS = 5 * 60_000;

export type LatestMeasuredAtParseResult =
  | { readonly ok: true; readonly latestMeasuredAt: number | undefined }
  | { readonly ok: false; readonly error: string };

/**
 * 直近に心拍が届いているかどうかを判定する
 * @param latestMeasuredAt 保存されている最新の measuredAt epoch ms．心拍が 1 件もない場合は undefined
 * @param now 判定する時刻 epoch ms
 * @returns 最新の心拍が ALIVE_THRESHOLD_MS 以内に計測されていれば true
 */
export function isHeartRateAlive({
  latestMeasuredAt,
  now,
}: {
  latestMeasuredAt: number | undefined;
  now: number;
}): boolean {
  if (latestMeasuredAt === undefined) return false;
  return now - latestMeasuredAt <= ALIVE_THRESHOLD_MS;
}

/**
 * 最新の心拍の計測時刻を返す API のレスポンスを検証する
 * @param json レスポンスボディの JSON 文字列
 * @returns 検証に成功した場合は最新の measuredAt．心拍が 1 件もない場合は undefined．失敗した場合はエラーメッセージ
 */
export function parseLatestMeasuredAt(json: string): LatestMeasuredAtParseResult {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return { ok: false, error: 'response must be valid JSON' };
  }
  if (typeof value !== 'object' || value === null) {
    return { ok: false, error: 'response must be an object' };
  }
  const latestMeasuredAt: unknown = Reflect.get(value, 'latestMeasuredAt');
  if (latestMeasuredAt === null) return { ok: true, latestMeasuredAt: undefined };
  if (typeof latestMeasuredAt !== 'number' || !Number.isFinite(latestMeasuredAt)) {
    return { ok: false, error: 'latestMeasuredAt must be a finite number or null' };
  }
  return { ok: true, latestMeasuredAt };
}

/**
 * HTML の data 属性に埋め込まれた最新の計測時刻を読み取る
 * @param value data 属性の値．心拍が 1 件もない場合は属性自体が出力されない
 * @returns 有限の数値として読み取れた場合はその値，そうでなければ undefined
 */
export function parseLatestMeasuredAtAttribute(value: string | undefined): number | undefined {
  // Number('') は 0 になるため，空文字は数値として扱わない
  if (value === undefined || value === '') return undefined;
  const latestMeasuredAt = Number(value);
  return Number.isFinite(latestMeasuredAt) ? latestMeasuredAt : undefined;
}
