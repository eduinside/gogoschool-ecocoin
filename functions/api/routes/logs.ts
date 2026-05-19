import { Hono } from 'hono';
import type { Env, Vars } from '../_lib/types';
import { newId, nowMs } from '../_lib/db';
import { logBatchSchema, parseBody } from '../_lib/validators';

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.post('/batch', async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(logBatchSchema, body);
  if ('error' in parsed) {
    return c.json({ error: { code: 'validation_error', message: '입력값을 확인해주세요' } }, 400);
  }

  const { sessionId, events, appVersion, platform } = parsed.data;
  const userId = c.get('userId');
  const classIds = c.get('classIds');
  const userAgent = (c.req.header('User-Agent') ?? '').slice(0, 200);
  const now = nowMs();

  const stmts = events.map((e) =>
    c.env.DB.prepare(
      `INSERT INTO event_logs (id, user_id, class_id, session_id, event_key, payload, client_ts, server_ts, user_agent, app_version, platform)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      newId(),
      userId,
      classIds[0] ?? null,
      sessionId,
      e.eventKey,
      e.payload ? JSON.stringify(e.payload) : null,
      e.clientTs,
      now,
      userAgent,
      appVersion ?? c.env.APP_VERSION,
      platform ?? 'web',
    ),
  );

  await c.env.DB.batch(stmts);

  return c.json({ data: { received: events.length } });
});

export default app;
