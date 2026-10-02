// サーバー (UTC) とブラウザで表示がずれないよう，タイムゾーンを固定する
const DISPLAY_TIME_ZONE = 'Asia/Tokyo';

const TIME_FORMAT = new Intl.DateTimeFormat('ja-JP', {
  timeZone: DISPLAY_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('ja-JP', {
  timeZone: DISPLAY_TIME_ZONE,
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * epoch ms を日本時間の時刻文字列に変換する
 * @param epochMs 変換する時刻
 * @param includesDate 日付も含めるかどうか
 * @returns `HH:mm` または `M/D HH:mm` 形式の文字列
 */
export function formatDisplayTime({
  epochMs,
  includesDate,
}: {
  epochMs: number;
  includesDate: boolean;
}): string {
  return (includesDate ? DATE_TIME_FORMAT : TIME_FORMAT).format(epochMs);
}
