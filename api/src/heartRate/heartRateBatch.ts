export const BATCH_DURATION_MS = 60_000;

// 10Hz で 1 分間計測した場合の件数を上限とする
export const MAX_SAMPLE_COUNT = 600;

// 人の心拍として取りうる値の上限
const MAX_BPM = 300;

// Number() は 16 進数・指数表記・空文字も数値に変換するため，10 進数表記のみに絞る
const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

export interface HeartRateSample {
  readonly measuredAt: number;
  readonly bpm: number;
}

export type HeartRateBatchParseResult =
  | { readonly ok: true; readonly samples: readonly HeartRateSample[] }
  | { readonly ok: false; readonly error: string };

/**
 * API が受け付ける心拍サンプルかどうかを判定する
 * @param value CSV の 1 行から変換したサンプル
 * @returns measuredAt が 0 以上の整数で bpm が 0 より大きく上限以下であれば true
 */
function isHeartRateSample(value: HeartRateSample | undefined): value is HeartRateSample {
  if (value === undefined) return false;
  const { measuredAt, bpm } = value;
  if (!Number.isSafeInteger(measuredAt) || measuredAt < 0) return false;
  return Number.isFinite(bpm) && bpm > 0 && bpm <= MAX_BPM;
}

/**
 * CSV のセルを数値に変換する
 * @param cell 前後の空白を含みうるセルの文字列
 * @returns 10 進数表記であればその数値，それ以外は NaN
 */
function parseCell(cell: string): number {
  const trimmedCell = cell.trim();
  return DECIMAL_PATTERN.test(trimmedCell) ? Number(trimmedCell) : Number.NaN;
}

/**
 * CSV の 1 行を心拍サンプルに変換する．値の範囲は検証しない
 * @param row `measuredAt,bpm` 形式の行
 * @returns 2 列の行であれば変換したサンプル，それ以外は undefined
 */
function parseRow(row: string): HeartRateSample | undefined {
  const cells = row.split(',');
  if (cells.length !== 2) return undefined;
  const [measuredAtCell = '', bpmCell = ''] = cells;
  return { measuredAt: parseCell(measuredAtCell), bpm: parseCell(bpmCell) };
}

/**
 * 1 行 1 サンプルの CSV を 1 分間分の心拍サンプル列として検証する．各行はヘッダーなしで `measuredAt,bpm` とし，空行は無視する
 * @param csv epoch ms の measuredAt と bpm をカンマで区切ったリクエストボディ
 * @returns 検証に成功した場合は measuredAt 昇順のサンプル列，失敗した場合はエラーメッセージ
 */
export function parseHeartRateCsv(csv: string): HeartRateBatchParseResult {
  const rows = csv.split(/\r?\n/).filter((row) => row.trim() !== '');
  if (rows.length === 0) {
    return { ok: false, error: 'csv must not be empty' };
  }
  if (rows.length > MAX_SAMPLE_COUNT) {
    return { ok: false, error: `csv must not exceed ${MAX_SAMPLE_COUNT} rows` };
  }
  const samples = rows.map(parseRow);
  if (!samples.every(isHeartRateSample)) {
    return { ok: false, error: 'each row must be "measuredAt,bpm" with measuredAt in epoch ms' };
  }

  const sortedSamples = samples.toSorted((a, b) => a.measuredAt - b.measuredAt);
  const firstMeasuredAt = sortedSamples[0]?.measuredAt ?? 0;
  const lastMeasuredAt = sortedSamples.at(-1)?.measuredAt ?? 0;
  if (lastMeasuredAt - firstMeasuredAt >= BATCH_DURATION_MS) {
    return { ok: false, error: `samples must be within ${BATCH_DURATION_MS} ms` };
  }

  return { ok: true, samples: sortedSamples };
}
