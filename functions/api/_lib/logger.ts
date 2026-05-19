import type { Context } from 'hono';
import type { Env, Vars } from './types';
import { newId, nowMs } from './db';

export async function logEvent(
  c: Context<{ Bindings: Env; Variables: Vars }>,
  eventKey: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  const userId = c.get('userId') ?? null;
  const classIds = c.get('classIds') ?? [];

  await c.env.DB.prepare(
    `INSERT INTO event_logs (id, user_id, class_id, event_key, payload, server_ts, user_agent, app_version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      newId(),
      userId,
      classIds[0] ?? null,
      eventKey,
      payload ? JSON.stringify(payload) : null,
      nowMs(),
      (c.req.header('User-Agent') ?? '').slice(0, 200),
      c.env.APP_VERSION,
    )
    .run();
}
