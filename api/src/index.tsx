import { Hono } from 'hono';

import { HeartRatePage } from '@/heartRate/HeartRatePage';
import {
  DEFAULT_HEART_RATE_RANGE_KEY,
  HEART_RATE_RANGES,
  isHeartRateRangeKey,
} from '@/heartRate/heartRateRange';
import { findHeartRateSummaries } from '@/heartRate/heartRateRepository';
import { heartRateRoute } from '@/heartRate/heartRateRoute';

import { renderer } from './renderer';

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(renderer);

app.get('/', async (c) => {
  const rangeParameter = c.req.query('range');
  const rangeKey = isHeartRateRangeKey(rangeParameter)
    ? rangeParameter
    : DEFAULT_HEART_RATE_RANGE_KEY;
  const { durationMs, bucketMs } = HEART_RATE_RANGES[rangeKey];
  const summaries = await findHeartRateSummaries({
    d1Database: c.env.DB,
    since: Date.now() - durationMs,
    bucketMs,
  });
  return c.render(<HeartRatePage rangeKey={rangeKey} summaries={summaries} />);
});

app.route('/api/heart-rates', heartRateRoute);

export default app;
