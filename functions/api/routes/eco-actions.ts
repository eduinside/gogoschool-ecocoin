import { Hono } from 'hono';
import type { Env, Vars, EcoActionRow } from '../_lib/types';
import { newId, nowMs, todayKey } from '../_lib/db';
import { inClass, isTeacherOf } from '../_lib/middleware';

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.get('/classes/:id/eco-actions', async (c) => {
  const classId = c.req.param('id');
  if (!inClass(c, classId)) {
    return c.json({ error: { code: 'forbidden', message: '권한이 없습니다' } }, 403);
  }

  const userId = c.get('userId');
  const dateKey = todayKey();

  const actions = await c.env.DB.prepare(
    `SELECT * FROM eco_actions WHERE (class_id = ? OR class_id IS NULL) AND is_active = 1 ORDER BY display_order`,
  )
    .bind(classId)
    .all<EcoActionRow>();

  const todayCounts = await c.env.DB.prepare(
    `SELECT action_id, COUNT(*) as cnt FROM mining_records
     WHERE user_id = ? AND date_key = ? GROUP BY action_id`,
  )
    .bind(userId, dateKey)
    .all<{ action_id: string; cnt: number }>();

  const countMap = new Map((todayCounts.results ?? []).map((r) => [r.action_id, r.cnt]));

  return c.json({
    data: (actions.results ?? []).map((a) => {
      const todayCount = countMap.get(a.id) ?? 0;
      return {
        id: a.id,
        category: a.category,
        title: a.title,
        description: a.description,
        coinReward: a.coin_reward,
        carbonSavedG: a.carbon_saved_g,
        dailyLimit: a.daily_limit,
        todayCount,
        remainingToday: Math.max(0, a.daily_limit - todayCount),
        isActive: a.is_active === 1,
      };
    }),
  });
});

app.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{
    classId: string;
    category: string;
    title: string;
    description?: string;
    coinReward: number;
    carbonSavedG: number;
    dailyLimit: number;
  }>();

  if (!isTeacherOf(c, body.classId)) {
    return c.json({ error: { code: 'forbidden', message: '담임 교사만 추가할 수 있습니다' } }, 403);
  }

  const id = newId();
  await c.env.DB.prepare(
    `INSERT INTO eco_actions (id, class_id, category, title, description, coin_reward, carbon_saved_g, daily_limit, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, body.classId, body.category, body.title, body.description ?? null, body.coinReward, body.carbonSavedG, body.dailyLimit, nowMs())
    .run();

  return c.json({ data: { id } });
});

app.patch('/:id', async (c) => {
  const actionId = c.req.param('id');
  const action = await c.env.DB.prepare('SELECT * FROM eco_actions WHERE id = ?').bind(actionId).first<EcoActionRow>();
  if (!action) return c.json({ error: { code: 'not_found', message: '행동을 찾을 수 없습니다' } }, 404);
  if (action.class_id && !isTeacherOf(c, action.class_id)) {
    return c.json({ error: { code: 'forbidden', message: '권한이 없습니다' } }, 403);
  }

  const body = await c.req.json();
  const sets: string[] = [];
  const vals: unknown[] = [];

  for (const [key, col] of [
    ['title', 'title'],
    ['description', 'description'],
    ['coinReward', 'coin_reward'],
    ['carbonSavedG', 'carbon_saved_g'],
    ['dailyLimit', 'daily_limit'],
    ['isActive', 'is_active'],
    ['displayOrder', 'display_order'],
  ] as const) {
    if (body[key] !== undefined) {
      sets.push(`${col} = ?`);
      vals.push(key === 'isActive' ? (body[key] ? 1 : 0) : body[key]);
    }
  }

  if (sets.length === 0) return c.json({ data: { ok: true } });

  vals.push(actionId);
  await c.env.DB.prepare(`UPDATE eco_actions SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...vals)
    .run();

  return c.json({ data: { ok: true } });
});

app.delete('/:id', async (c) => {
  const actionId = c.req.param('id');
  const action = await c.env.DB.prepare('SELECT * FROM eco_actions WHERE id = ?').bind(actionId).first<EcoActionRow>();
  if (!action) return c.json({ error: { code: 'not_found', message: '행동을 찾을 수 없습니다' } }, 404);
  if (action.class_id && !isTeacherOf(c, action.class_id)) {
    return c.json({ error: { code: 'forbidden', message: '권한이 없습니다' } }, 403);
  }

  await c.env.DB.prepare('UPDATE eco_actions SET is_active = 0 WHERE id = ?').bind(actionId).run();
  return c.json({ data: { ok: true } });
});

export default app;
