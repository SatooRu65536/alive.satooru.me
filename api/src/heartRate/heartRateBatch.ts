export const BATCH_DURATION_MS = 60_000;

// 10Hz で 1 分間計測した場合の件数を上限とする
export const MAX_SAMPLE_COUNT = 600;

// 人の心拍として取りうる値の上限
const MAX_BPM = 300;

export interface HeartRateSample {
  readonly measuredAt: number;
  readonly bpm: number;
}

export type HeartRateBatchParseResult =
  | { readonly ok: true; readonly samples: readonly HeartRateSample[] }
  | { readonly ok: false; readonly error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isHeartRateSample(value: unknown): value is HeartRateSample {
  if (!isRecord(value)) return false;
  const { measuredAt, bpm } = value;
  if (typeof measuredAt !== 'number' || !Number.isSafeInteger(measuredAt) || measuredAt < 0)
    return false;
  return typeof bpm === 'number' && Number.isFinite(bpm) && bpm > 0 && bpm <= MAX_BPM;
}

/**
 * リクエストボディを 1 分間分の心拍サンプル列として検証する
 * @param body JSON としてパース済みのリクエストボディ
 * @returns 検証に成功した場合は measuredAt 昇順のサンプル列，失敗した場合はエラーメッセージ
 */
export function parseHeartRateBatch(body: unknown): HeartRateBatchParseResult {
  if (!isRecord(body) || !Array.isArray(body.samples)) {
    return { ok: false, error: 'samples must be an array' };
  }
  const { samples } = body;
  if (samples.length === 0) {
    return { ok: false, error: 'samples must not be empty' };
  }
  if (samples.length > MAX_SAMPLE_COUNT) {
    return { ok: false, error: `samples must not exceed ${MAX_SAMPLE_COUNT} items` };
  }
  if (!samples.every(isHeartRateSample)) {
    return { ok: false, error: 'each sample must have measuredAt (epoch ms) and bpm' };
  }

  const sortedSamples = samples.toSorted((a, b) => a.measuredAt - b.measuredAt);
  const firstMeasuredAt = sortedSamples[0]?.measuredAt ?? 0;
  const lastMeasuredAt = sortedSamples.at(-1)?.measuredAt ?? 0;
  if (lastMeasuredAt - firstMeasuredAt >= BATCH_DURATION_MS) {
    return { ok: false, error: `samples must be within ${BATCH_DURATION_MS} ms` };
  }

  return { ok: true, samples: sortedSamples.map(({ measuredAt, bpm }) => ({ measuredAt, bpm })) };
}
