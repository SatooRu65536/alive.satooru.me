import { Hono } from 'hono';

import { heartRateRoute } from '@/heartRate/heartRateRoute';

import { renderer } from './renderer';

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(renderer);

app.get('/', (c) => {
  return c.render(<h1>Hello!</h1>);
});

app.route('/heart-rates', heartRateRoute);

export default app;
