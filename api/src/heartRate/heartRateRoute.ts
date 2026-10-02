import { Hono } from 'hono';

import { parseHeartRateCsv } from './heartRateBatch';
import { saveHeartRateSamples } from './heartRateRepository';

export const heartRateRoute = new Hono<{ Bindings: CloudflareBindings }>();

heartRateRoute.post('/', async (c) => {
  const result = parseHeartRateCsv(await c.req.text());
  if (!result.ok) {
    return c.json({ error: result.error }, 400);
  }

  const savedCount = await saveHeartRateSamples({ d1Database: c.env.DB, samples: result.samples });
  return c.json({ receivedCount: result.samples.length, savedCount }, 201);
});
