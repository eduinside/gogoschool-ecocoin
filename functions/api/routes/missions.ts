import { Hono } from 'hono';
import type { Env, Vars, MissionRow } from '../_lib/types';
import { newId, nowMs } from '../_lib/db';
import { inClass, isTeacherOf } from '../_lib/middleware';

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.get('/classes/:id/missions', async (c) => {
  const classId = c.req.param('id');
  if (!inClass(c, classId)) {
    return c.json({ error: { code: 'forbidden', message: '권한이 없습니다' } }, 403);
  }

  const missions = await c.env.DB.prepare(
    'SELECT * FROM missions WHERE class_id = ? AND is_active = 1 ORDER BY ends_at ASC',
  )
    .bind(classId)
    .all<MissionRow>();

  const results = [];
  for (const m of missions.results ?? []) {
    let currentValue = 0;

    if (m.goal_type === 'total_minings') {
      const r = await c.env.DB.prepare(
        `SELECT COUNT(*) as cnt FROM mining_records WHERE class_id = ? AND created_at >= ? AND created_at <= ?`,
      )
        .bind(classId, m.starts_at, m.ends_at)
        .first<{ cnt: number }>();
      currentValue = r?.cnt ?? 0;
    } else if (m.goal_type === 'class_total_carbon') {
      const r = await c.env.DB.prepare(
        `SELECT COALESCE(SUM(carbon_saved_g), 0) as total FROM mining_records WHERE class_id = ? AND created_at >= ? AND created_at <= ?`,
      )
        .bind(classId, m.starts_at, m.ends_at)
        .first<{ total: number }>();
      currentValue = r?.total ?? 0;
    } else if (m.goal_type === 'category_minings') {
      const meta = m.goal_meta ? JSON.parse(m.goal_meta) : {};
      const r = await c.env.DB.prepare(
        `SELECT COUNT(*) as cnt FROM mining_records mr
         JOIN eco_actions ea ON ea.id = mr.action_id
         WHERE mr.class_id = ? AND mr.created_at >= ? AND mr.created_at <= ? AND ea.category = ?`,
      )
        .bind(classId, m.starts_at, m.ends_at, meta.category ?? '')
        .first<{ cnt: number }>();
      currentValue = r?.cnt ?? 0;
    }

    results.push({
      id: m.id,
      title: m.title,
      description: m.description,
      goalType: m.goal_type,
      goalValue: m.goal_value,
      currentValue,
      rewardCoins: m.reward_coins,
      rewardBadge: m.reward_badge_id,
      startsAt: m.starts_at,
      endsAt: m.ends_at,
      isCompleted: currentValue >= m.goal_value,
    });
  }

  return c.json({ data: results });
});

app.post('/', async (c) => {
  const body = await c.req.json<{
    classId: string;
    title: string;
    description?: string;
    goalType: string;
    goalValue: number;
    goalMeta?: string;
    rewardCoins: number;
    rewardBadgeId?: string;
    startsAt: number;
    endsAt: number;
  }>();

  if (!isTeacherOf(c, body.classId)) {
    return c.json({ error: { code: 'forbidden', message: '담임 교사만 미션을 만들 수 있습니다' } }, 403);
  }

  const id = newId();
  await c.env.DB.prepare(
    `INSERT INTO missions (id, class_id, title, description, goal_type, goal_value, goal_meta, reward_coins, reward_badge_id, starts_at, ends_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id, body.classId, body.title, body.description ?? null, body.goalType,
      body.goalValue, body.goalMeta ?? null, body.rewardCoins, body.rewardBadgeId ?? null,
      body.startsAt, body.endsAt, nowMs(),
    )
    .run();

  return c.json({ data: { id } });
});

app.patch('/:id', async (c) => {
  const missionId = c.req.param('id');
  const mission = await c.env.DB.prepare('SELECT * FROM missions WHERE id = ?').bind(missionId).first<MissionRow>();
  if (!mission) return c.json({ error: { code: 'not_found', message: '미션을 찾을 수 없습니다' } }, 404);
  if (!isTeacherOf(c, mission.class_id)) {
    return c.json({ error: { code: 'forbidden', message: '권한이 없습니다' } }, 403);
  }

  const body = await c.req.json();
  const sets: string[] = [];
  const vals: unknown[] = [];

  for (const [key, col] of [
    ['title', 'title'],
    ['description', 'description'],
    ['goalValue', 'goal_value'],
    ['rewardCoins', 'reward_coins'],
    ['endsAt', 'ends_at'],
    ['isActive', 'is_active'],
  ] as const) {
    if (body[key] !== undefined) {
      sets.push(`${col} = ?`);
      vals.push(key === 'isActive' ? (body[key] ? 1 : 0) : body[key]);
    }
  }

  if (sets.length === 0) return c.json({ data: { ok: true } });
  vals.push(missionId);
  await c.env.DB.prepare(`UPDATE missions SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...vals)
    .run();

  return c.json({ data: { ok: true } });
});

app.delete('/:id', async (c) => {
  const missionId = c.req.param('id');
  const mission = await c.env.DB.prepare('SELECT * FROM missions WHERE id = ?').bind(missionId).first<MissionRow>();
  if (!mission) return c.json({ error: { code: 'not_found', message: '미션을 찾을 수 없습니다' } }, 404);
  if (!isTeacherOf(c, mission.class_id)) {
    return c.json({ error: { code: 'forbidden', message: '권한이 없습니다' } }, 403);
  }

  await c.env.DB.prepare('UPDATE missions SET is_active = 0 WHERE id = ?').bind(missionId).run();
  return c.json({ data: { ok: true } });
});

export default app;
