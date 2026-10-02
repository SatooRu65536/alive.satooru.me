import { Hono } from 'hono';

import { parseHeartRateBatch } from './heartRateBatch';
import { saveHeartRateSamples } from './heartRateRepository';

const INVALID_JSON = Symbol('INVALID_JSON');

export const heartRateRoute = new Hono<{ Bindings: CloudflareBindings }>();

heartRateRoute.post('/', async (c) => {
  // JSON の構文エラーは例外ではなくクライアントの入力誤りとして 400 を返す
  const body: unknown = await c.req.json().catch(() => INVALID_JSON);
  if (body === INVALID_JSON) {
    return c.json({ error: 'request body must be valid JSON' }, 400);
  }
  const result = parseHeartRateBatch(body);
  if (!result.ok) {
    return c.json({ error: result.error }, 400);
  }

  const savedCount = await saveHeartRateSamples({ d1Database: c.env.DB, samples: result.samples });
  return c.json({ receivedCount: result.samples.length, savedCount }, 201);
});
