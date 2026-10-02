import { getTableColumns } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';

import { heartRates } from '@/db/schema';
import { splitIntoChunks } from '@/utils/splitIntoChunks';

import type { HeartRateSample } from './heartRateBatch';

// D1 の 1 クエリあたりのバインドパラメータ上限: https://developers.cloudflare.com/d1/platform/limits/
const MAX_BOUND_PARAMETERS_PER_QUERY = 100;
const HEART_RATE_COLUMN_COUNT = Object.keys(getTableColumns(heartRates)).length;
const ROWS_PER_STATEMENT = Math.floor(MAX_BOUND_PARAMETERS_PER_QUERY / HEART_RATE_COLUMN_COUNT);

/**
 * 心拍サンプルを DB に保存する．measuredAt が既存のものと重複するサンプルは無視する
 * @param d1Database 保存先の D1 データベース
 * @param samples 保存する心拍サンプル列
 * @returns 新たに保存されたサンプルの件数
 * @throws D1 へのクエリが失敗した場合
 */
export async function saveHeartRateSamples({
  d1Database,
  samples,
}: {
  d1Database: D1Database;
  samples: readonly HeartRateSample[];
}): Promise<number> {
  const database = drizzle(d1Database);
  // 1 Worker 呼び出しあたりのクエリ数にも上限があるため，1 行ずつではなく複数行 INSERT にまとめる
  const [firstQuery, ...restQueries] = splitIntoChunks({
    items: samples,
    size: ROWS_PER_STATEMENT,
  }).map((chunk) =>
    database
      .insert(heartRates)
      .values([...chunk])
      .onConflictDoNothing(),
  );
  // database.batch は空でないタプルを要求するため，先頭要素の有無で空配列を除外する
  if (firstQuery === undefined) return 0;

  const results = await database.batch([firstQuery, ...restQueries]);
  return results.reduce((savedCount, result) => savedCount + result.meta.changes, 0);
}
