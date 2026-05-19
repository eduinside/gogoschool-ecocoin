import { Hono } from 'hono';
import type { Env, Vars, EcoActionRow, ProfileRow, MiningRecordRow } from '../_lib/types';
import { newId, nowMs, todayKey, computeLevel } from '../_lib/db';
import { mineSchema, parseBody } from '../_lib/validators';
import { logEvent } from '../_lib/logger';
import { inClass } from '../_lib/middleware';

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(mineSchema, body);
  if ('error' in parsed) {
    return c.json({ error: { code: 'validation_error', message: '입력값을 확인해주세요' } }, 400);
  }

  const { actionId, classId } = parsed.data;
  const userId = c.get('userId');

  if (!inClass(c, classId)) {
    return c.json({ error: { code: 'forbidden', message: '해당 학급에 소속되어 있지 않습니다' } }, 403);
  }

  const action = await c.env.DB.prepare(
    'SELECT * FROM eco_actions WHERE id = ? AND is_active = 1 AND (class_id = ? OR class_id IS NULL)',
  )
    .bind(actionId, classId)
    .first<EcoActionRow>();

  if (!action) {
    return c.json({ error: { code: 'not_found', message: '환경 행동을 찾을 수 없습니다' } }, 404);
  }

  const dateKey = todayKey();
  const todayResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM mining_records WHERE user_id = ? AND action_id = ? AND date_key = ?',
  )
    .bind(userId, actionId, dateKey)
    .first<{ cnt: number }>();

  const todayCount = todayResult?.cnt ?? 0;
  if (todayCount >= action.daily_limit) {
    await logEvent(c, 'mine.daily_limit_hit', { actionId });
    return c.json({ error: { code: 'daily_limit', message: '오늘 이 행동의 채굴 한도에 도달했습니다' } }, 429);
  }

  const profile = await c.env.DB.prepare('SELECT * FROM profiles WHERE user_id = ?')
    .bind(userId)
    .first<ProfileRow>();

  if (!profile) {
    return c.json({ error: { code: 'not_found', message: '프로필을 찾을 수 없습니다' } }, 404);
  }

  const miningId = newId();
  const now = nowMs();
  const newTotalCoins = profile.total_coins + action.coin_reward;
  const newCarbonSaved = profile.carbon_saved_g + action.carbon_saved_g;
  const newLevel = computeLevel(newCarbonSaved);

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO mining_records (id, user_id, class_id, action_id, coin_reward, carbon_saved_g, created_at, date_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(miningId, userId, classId, actionId, action.coin_reward, action.carbon_saved_g, now, dateKey),

    c.env.DB.prepare(
      `UPDATE profiles SET total_coins = ?, carbon_saved_g = ?, level = ?, updated_at = ? WHERE user_id = ?`,
    ).bind(newTotalCoins, newCarbonSaved, newLevel, now, userId),

    c.env.DB.prepare(
      `INSERT INTO transactions (id, user_id, class_id, type, amount, balance_after, reference_type, reference_id, created_at)
       VALUES (?, ?, ?, 'earn', ?, ?, 'mining', ?, ?)`,
    ).bind(newId(), userId, classId, action.coin_reward, newTotalCoins, miningId, now),
  ]);

  // Badge evaluation
  const newBadges = await evaluateBadges(c, userId, newTotalCoins, newCarbonSaved, todayCount + 1);

  await logEvent(c, 'mine.success', {
    actionId,
    coinReward: action.coin_reward,
    carbonSavedG: action.carbon_saved_g,
    miningId,
  });

  return c.json({
    data: {
      miningId,
      coinReward: action.coin_reward,
      carbonSavedG: action.carbon_saved_g,
      newTotalCoins,
      newCarbonSavedG: newCarbonSaved,
      remainingToday: action.daily_limit - todayCount - 1,
      newBadges,
    },
  });
});

async function evaluateBadges(
  c: { env: Env; get: (k: string) => unknown },
  userId: string,
  totalCoins: number,
  carbonSavedG: number,
  _todayMiningCount: number,
): Promise<Array<{ id: string; code: string; title: string; emoji: string | null }>> {
  const env = c.env;
  const earnedResult = await env.DB.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?')
    .bind(userId)
    .all<{ badge_id: string }>();
  const earnedIds = new Set((earnedResult.results ?? []).map((r) => r.badge_id));

  const totalMiningsResult = await env.DB.prepare('SELECT COUNT(*) as cnt FROM mining_records WHERE user_id = ?')
    .bind(userId)
    .first<{ cnt: number }>();
  const totalMinings = totalMiningsResult?.cnt ?? 0;

  const checks: Array<{ code: string; condition: boolean }> = [
    { code: 'first_mine', condition: totalMinings >= 1 },
    { code: '10_minings', condition: totalMinings >= 10 },
    { code: '50_minings', condition: totalMinings >= 50 },
    { code: '100_coins', condition: totalCoins >= 100 },
    { code: '500_coins', condition: totalCoins >= 500 },
    { code: 'carbon_10kg', condition: carbonSavedG >= 10_000 },
  ];

  const newBadges: Array<{ id: string; code: string; title: string; emoji: string | null }> = [];
  const now = nowMs();

  for (const check of checks) {
    if (!check.condition) continue;

    const badge = await env.DB.prepare('SELECT * FROM badges WHERE code = ?').bind(check.code).first<{
      id: string;
      code: string;
      title: string;
      emoji: string | null;
    }>();
    if (!badge || earnedIds.has(badge.id)) continue;

    await env.DB.prepare('INSERT INTO user_badges (id, user_id, badge_id, earned_at) VALUES (?, ?, ?, ?)').bind(
      newId(),
      userId,
      badge.id,
      now,
    ).run();

    newBadges.push(badge);
  }

  return newBadges;
}

export default app;
