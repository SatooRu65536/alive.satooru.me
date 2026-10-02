import { splitIntoChunks } from '@/utils/splitIntoChunks';

import type { HeartRateSample } from './heartRateBatch';

// D1 の 1 クエリあたりのバインドパラメータ上限: https://developers.cloudflare.com/d1/platform/limits/
const MAX_BOUND_PARAMETERS_PER_QUERY = 100;
const HEART_RATE_COLUMN_COUNT = 2;
const ROWS_PER_STATEMENT = MAX_BOUND_PARAMETERS_PER_QUERY / HEART_RATE_COLUMN_COUNT;

/**
 * 心拍サンプルを DB に保存する．measuredAt が既存のものと重複するサンプルは無視する
 * @param database 保存先の D1 データベース
 * @param samples 保存する心拍サンプル列
 * @returns 新たに保存されたサンプルの件数
 * @throws D1 へのクエリが失敗した場合
 */
export async function saveHeartRateSamples({
  database,
  samples,
}: {
  database: D1Database;
  samples: readonly HeartRateSample[];
}): Promise<number> {
  if (samples.length === 0) return 0;

  // 1 Worker 呼び出しあたりのクエリ数にも上限があるため，1 行ずつではなく複数行 INSERT にまとめる
  const statements = splitIntoChunks({ items: samples, size: ROWS_PER_STATEMENT }).map((chunk) =>
    database
      .prepare(
        `INSERT OR IGNORE INTO heart_rates (measured_at, bpm) VALUES ${chunk.map(() => '(?, ?)').join(', ')}`,
      )
      .bind(...chunk.flatMap(({ measuredAt, bpm }) => [measuredAt, bpm])),
  );
  const results = await database.batch(statements);
  return results.reduce((savedCount, result) => savedCount + result.meta.changes, 0);
}
