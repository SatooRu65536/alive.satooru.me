import { Hono } from 'hono';

import { isHeartRateAlive } from '@/heartRate/heartRateLiveness';
import { HeartRatePage } from '@/heartRate/HeartRatePage';
import { HEART_RATE_RANGES, resolveHeartRateRangeKey } from '@/heartRate/heartRateRange';
import { findHeartRateSummaries, findLatestMeasuredAt } from '@/heartRate/heartRateRepository';
import { heartRateRoute } from '@/heartRate/heartRateRoute';

import { renderer } from './renderer';

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(renderer);

app.get('/', async (c) => {
  const rangeKey = resolveHeartRateRangeKey(c.req.query('range'));
  const { durationMs, bucketMs } = HEART_RATE_RANGES[rangeKey];
  const now = Date.now();
  const [summaries, latestMeasuredAt] = await Promise.all([
    findHeartRateSummaries({ d1Database: c.env.DB, since: now - durationMs, bucketMs }),
    findLatestMeasuredAt(c.env.DB),
  ]);
  return c.render(
    <HeartRatePage
      rangeKey={rangeKey}
      summaries={summaries}
      latestMeasuredAt={latestMeasuredAt}
      isAlive={isHeartRateAlive({ latestMeasuredAt, now })}
    />,
  );
});

app.route('/api/heart-rates', heartRateRoute);

// wrangler.jsonc の durable_objects で参照するクラスは，Worker のエントリーポイントから公開する
export { HeartRateBroadcaster } from '@/heartRate/HeartRateBroadcaster';

export default app;
