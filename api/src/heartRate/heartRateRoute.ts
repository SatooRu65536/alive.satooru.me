import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';

import { verifyHeartRateApiToken } from './heartRateApiToken';
import { parseHeartRateCsv } from './heartRateBatch';
import { getHeartRateBroadcaster } from './HeartRateBroadcaster';
import { HEART_RATE_RANGES, resolveHeartRateRangeKey } from './heartRateRange';
import {
  findHeartRateSummaries,
  findLatestMeasuredAt,
  saveHeartRateSamples,
} from './heartRateRepository';

export const heartRateRoute = new Hono<{ Bindings: CloudflareBindings }>();

heartRateRoute.post(
  '/',
  // シークレットは c.env 経由でリクエスト処理中にしか参照できないため，token ではなく verifyToken で照合する
  bearerAuth<{ Bindings: CloudflareBindings }>({
    verifyToken: (token, c) =>
      verifyHeartRateApiToken({ token, expectedToken: c.env.HEART_RATE_API_TOKEN }),
  }),
  async (c) => {
    const result = parseHeartRateCsv(await c.req.text());
    if (!result.ok) {
      return c.json({ error: result.error }, 400);
    }

    const savedCount = await saveHeartRateSamples({
      d1Database: c.env.DB,
      samples: result.samples,
    });
    if (savedCount > 0) {
      // 通知の完了を待たずに送信元へ応答する．通知に失敗しても保存は完了しているため，記録だけ残す
      c.executionCtx.waitUntil(
        getHeartRateBroadcaster(c.env)
          .notifySaved()
          .catch((error: unknown) => console.error('failed to notify heart rates saved', error)),
      );
    }
    return c.json({ receivedCount: result.samples.length, savedCount }, 201);
  },
);

heartRateRoute.get('/summaries', async (c) => {
  const { durationMs, bucketMs } =
    HEART_RATE_RANGES[resolveHeartRateRangeKey(c.req.query('range'))];
  const summaries = await findHeartRateSummaries({
    d1Database: c.env.DB,
    since: Date.now() - durationMs,
    bucketMs,
  });
  return c.json(summaries);
});

heartRateRoute.get('/latest', async (c) => {
  const latestMeasuredAt = await findLatestMeasuredAt(c.env.DB);
  // JSON では undefined を表せないため，心拍がない場合は null で返す
  return c.json({ latestMeasuredAt: latestMeasuredAt ?? null });
});

heartRateRoute.get('/stream', (c) => {
  // アップグレード要求以外で Durable Object を起動しないよう，ここで弾く
  if (c.req.header('Upgrade')?.toLowerCase() !== 'websocket') {
    return c.json({ error: 'expected websocket upgrade' }, 426, { Upgrade: 'websocket' });
  }
  return getHeartRateBroadcaster(c.env).fetch(c.req.raw);
});
