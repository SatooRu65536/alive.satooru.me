import { getTableColumns, gte, max, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';

import { heartRates } from '@/db/schema';
import { splitIntoChunks } from '@/utils/splitIntoChunks';

import type { HeartRateSample } from './heartRateBatch';
import type { HeartRateSummary } from './heartRateSummary';

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

/**
 * 指定時刻以降の心拍を一定時間ごとに集計する
 * @param d1Database 取得元の D1 データベース
 * @param since 集計対象とする measuredAt の下限 epoch ms
 * @param bucketMs 集計単位の長さ ms．正の整数であること
 * @returns サンプルが存在する集計単位ごとの平均・最小・最大値．bucketStartedAt 昇順
 * @throws D1 へのクエリが失敗した場合
 */
export async function findHeartRateSummaries({
  d1Database,
  since,
  bucketMs,
}: {
  d1Database: D1Database;
  since: number;
  bucketMs: number;
}): Promise<HeartRateSummary[]> {
  const database = drizzle(d1Database);
  // バインド値の型に左右されず整数除算になるよう，整数リテラルとして SQL に埋め込む
  const bucketMsLiteral = sql.raw(String(Math.trunc(bucketMs)));
  const bucketStartedAt = sql`(${heartRates.measuredAt} / ${bucketMsLiteral}) * ${bucketMsLiteral}`;
  return database
    .select({
      bucketStartedAt: bucketStartedAt.mapWith(Number),
      averageBpm: sql`avg(${heartRates.bpm})`.mapWith(Number),
      minBpm: sql`min(${heartRates.bpm})`.mapWith(Number),
      maxBpm: sql`max(${heartRates.bpm})`.mapWith(Number),
    })
    .from(heartRates)
    .where(gte(heartRates.measuredAt, since))
    .groupBy(bucketStartedAt)
    .orderBy(bucketStartedAt);
}

/**
 * 保存されている心拍のうち最新の計測時刻を取得する
 * @param d1Database 取得元の D1 データベース
 * @returns 最新の measuredAt epoch ms．心拍が 1 件もない場合は undefined
 * @throws D1 へのクエリが失敗した場合
 */
export async function findLatestMeasuredAt(d1Database: D1Database): Promise<number | undefined> {
  const database = drizzle(d1Database);
  const [row] = await database
    .select({ latestMeasuredAt: max(heartRates.measuredAt) })
    .from(heartRates);
  return row?.latestMeasuredAt ?? undefined;
}
