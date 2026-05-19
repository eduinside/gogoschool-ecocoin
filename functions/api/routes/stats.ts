import { Hono } from 'hono';
import type { Env, Vars } from '../_lib/types';
import { inClass, isTeacherOf, isHelperOf } from '../_lib/middleware';

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.get('/me', async (c) => {
  const userId = c.get('userId');
  const month = c.req.query('month') ?? new Date().toISOString().slice(0, 7);
  const startKey = `${month}-01`;
  const endKey = `${month}-31`;

  const [byDay, byCategory, totalResult, streakResult] = await Promise.all([
    c.env.DB.prepare(
      `SELECT date_key as date, COUNT(*) as count, SUM(coin_reward) as coins
       FROM mining_records WHERE user_id = ? AND date_key >= ? AND date_key <= ?
       GROUP BY date_key ORDER BY date_key`,
    )
      .bind(userId, startKey, endKey)
      .all(),

    c.env.DB.prepare(
      `SELECT ea.category, COUNT(*) as count, SUM(mr.coin_reward) as coins
       FROM mining_records mr JOIN eco_actions ea ON ea.id = mr.action_id
       WHERE mr.user_id = ? AND mr.date_key >= ? AND mr.date_key <= ?
       GROUP BY ea.category`,
    )
      .bind(userId, startKey, endKey)
      .all(),

    c.env.DB.prepare(
      `SELECT COUNT(*) as totalMinings, COALESCE(SUM(coin_reward), 0) as totalCoins, COALESCE(SUM(carbon_saved_g), 0) as carbonSavedG
       FROM mining_records WHERE user_id = ? AND date_key >= ? AND date_key <= ?`,
    )
      .bind(userId, startKey, endKey)
      .first<{ totalMinings: number; totalCoins: number; carbonSavedG: number }>(),

    c.env.DB.prepare(
      `SELECT DISTINCT date_key FROM mining_records WHERE user_id = ? ORDER BY date_key DESC LIMIT 60`,
    )
      .bind(userId)
      .all<{ date_key: string }>(),
  ]);

  let streakDays = 0;
  const dates = (streakResult.results ?? []).map((r) => r.date_key);
  if (dates.length > 0) {
    streakDays = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]!);
      const curr = new Date(dates[i]!);
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) streakDays++;
      else break;
    }
  }

  return c.json({
    data: {
      totalMinings: totalResult?.totalMinings ?? 0,
      totalCoins: totalResult?.totalCoins ?? 0,
      carbonSavedG: totalResult?.carbonSavedG ?? 0,
      byDay: byDay.results ?? [],
      byCategory: byCategory.results ?? [],
      streakDays,
    },
  });
});

app.get('/class/:id', async (c) => {
  const classId = c.req.param('id');
  if (!isTeacherOf(c, classId) && !isHelperOf(c, classId)) {
    return c.json({ error: { code: 'forbidden', message: '권한이 없습니다' } }, 403);
  }

  const today = new Date().toISOString().slice(0, 10);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);

  const [memberCount, activeToday, todayStats, byDay, topStudents, pendingCount] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM class_members WHERE class_id = ?')
      .bind(classId)
      .first<{ cnt: number }>(),

    c.env.DB.prepare(
      'SELECT COUNT(DISTINCT user_id) as cnt FROM mining_records WHERE class_id = ? AND date_key = ?',
    )
      .bind(classId, today)
      .first<{ cnt: number }>(),

    c.env.DB.prepare(
      `SELECT COALESCE(SUM(coin_reward), 0) as coins, COALESCE(SUM(carbon_saved_g), 0) as carbon
       FROM mining_records WHERE class_id = ? AND date_key = ?`,
    )
      .bind(classId, today)
      .first<{ coins: number; carbon: number }>(),

    c.env.DB.prepare(
      `SELECT date_key as date, COUNT(*) as minings, SUM(carbon_saved_g) as carbonSavedG
       FROM mining_records WHERE class_id = ? AND date_key >= ?
       GROUP BY date_key ORDER BY date_key`,
    )
      .bind(classId, fourteenDaysAgo)
      .all(),

    c.env.DB.prepare(
      `SELECT cm.user_id as userId, p.display_name as displayName, p.total_coins as totalCoins
       FROM class_members cm JOIN profiles p ON p.user_id = cm.user_id
       WHERE cm.class_id = ? ORDER BY p.total_coins DESC LIMIT 5`,
    )
      .bind(classId)
      .all(),

    c.env.DB.prepare(
      "SELECT COUNT(*) as cnt FROM reward_requests WHERE class_id = ? AND status = 'pending'",
    )
      .bind(classId)
      .first<{ cnt: number }>(),
  ]);

  return c.json({
    data: {
      memberCount: memberCount?.cnt ?? 0,
      activeToday: activeToday?.cnt ?? 0,
      totalCoinsToday: todayStats?.coins ?? 0,
      totalCarbonSavedG: todayStats?.carbon ?? 0,
      pendingRequests: pendingCount?.cnt ?? 0,
      byDay: byDay.results ?? [],
      topStudents: topStudents.results ?? [],
    },
  });
});

export default app;
