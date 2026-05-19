import { Hono } from 'hono';
import type { Env, Vars } from '../_lib/types';
import { logEvent } from '../_lib/logger';

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.post('/', async (c) => {
  const userId = c.get('userId');
  await c.env.SESSIONS.delete(`refresh:${userId}`);
  await logEvent(c, 'auth.logout');
  return c.json({ data: { ok: true } });
});

export default app;
