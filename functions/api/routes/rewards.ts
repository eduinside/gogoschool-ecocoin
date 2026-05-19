import { Hono } from 'hono';
import type { Env, Vars, RewardRow, ProfileRow, RewardRequestRow } from '../_lib/types';
import { newId, nowMs } from '../_lib/db';
import { inClass, isTeacherOf, canApproveRewards } from '../_lib/middleware';
import { rewardRequestSchema, rejectSchema, parseBody } from '../_lib/validators';
import { logEvent } from '../_lib/logger';

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.get('/classes/:id/rewards', async (c) => {
  const classId = c.req.param('id');
  if (!inClass(c, classId)) {
    return c.json({ error: { code: 'forbidden', message: '권한이 없습니다' } }, 403);
  }

  const userId = c.get('userId');
  const profile = await c.env.DB.prepare('SELECT total_coins FROM profiles WHERE user_id = ?')
    .bind(userId)
    .first<{ total_coins: number }>();
  const myCoins = profile?.total_coins ?? 0;

  const rewards = await c.env.DB.prepare(
    `SELECT * FROM rewards WHERE (class_id = ? OR class_id IS NULL) AND is_active = 1 ORDER BY display_order`,
  )
    .bind(classId)
    .all<RewardRow>();

  return c.json({
    data: (rewards.results ?? []).map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      description: r.description,
      costCoins: r.cost_coins,
      stock: r.stock,
      isAffordable: myCoins >= r.cost_coins,
      isActive: r.is_active === 1,
    })),
  });
});

app.post('/:id/request', async (c) => {
  const rewardId = c.req.param('id');
  const body = await c.req.json();
  const parsed = parseBody(rewardRequestSchema, body);
  if ('error' in parsed) {
    return c.json({ error: { code: 'validation_error', message: '입력값을 확인해주세요' } }, 400);
  }

  const { classId } = parsed.data;
  const userId = c.get('userId');

  if (!inClass(c, classId)) {
    return c.json({ error: { code: 'forbidden', message: '권한이 없습니다' } }, 403);
  }

  const reward = await c.env.DB.prepare('SELECT * FROM rewards WHERE id = ? AND is_active = 1')
    .bind(rewardId)
    .first<RewardRow>();
  if (!reward) {
    return c.json({ error: { code: 'not_found', message: '보상을 찾을 수 없습니다' } }, 404);
  }

  const profile = await c.env.DB.prepare('SELECT * FROM profiles WHERE user_id = ?')
    .bind(userId)
    .first<ProfileRow>();
  if (!profile || profile.total_coins < reward.cost_coins) {
    return c.json({ error: { code: 'insufficient_coins', message: '코인이 부족합니다' } }, 400);
  }

  const requestId = newId();
  const now = nowMs();
  const newBalance = profile.total_coins - reward.cost_coins;

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO reward_requests (id, user_id, class_id, reward_id, cost_coins, status, requested_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    ).bind(requestId, userId, classId, rewardId, reward.cost_coins, now),

    c.env.DB.prepare('UPDATE profiles SET total_coins = ?, updated_at = ? WHERE user_id = ?').bind(
      newBalance,
      now,
      userId,
    ),

    c.env.DB.prepare(
      `INSERT INTO transactions (id, user_id, class_id, type, amount, balance_after, reference_type, reference_id, created_at)
       VALUES (?, ?, ?, 'spend', ?, ?, 'reward_request', ?, ?)`,
    ).bind(newId(), userId, classId, -reward.cost_coins, newBalance, requestId, now),
  ]);

  await logEvent(c, 'reward.requested', { rewardId, costCoins: reward.cost_coins, requestId });

  return c.json({ data: { requestId, status: 'pending', costCoins: reward.cost_coins } });
});

app.get('/reward-requests', async (c) => {
  const userId = c.get('userId');
  const status = c.req.query('status');
  const classId = c.req.query('classId');

  let query: string;
  const binds: unknown[] = [];

  if (classId && canApproveRewards(c as any, classId)) {
    query = `SELECT rr.*, p.display_name, rw.title as reward_title
             FROM reward_requests rr
             JOIN profiles p ON p.user_id = rr.user_id
             JOIN rewards rw ON rw.id = rr.reward_id
             WHERE rr.class_id = ?`;
    binds.push(classId);
  } else {
    query = `SELECT rr.*, p.display_name, rw.title as reward_title
             FROM reward_requests rr
             JOIN profiles p ON p.user_id = rr.user_id
             JOIN rewards rw ON rw.id = rr.reward_id
             WHERE rr.user_id = ?`;
    binds.push(userId);
  }

  if (status) {
    query += ' AND rr.status = ?';
    binds.push(status);
  }

  query += ' ORDER BY rr.requested_at DESC LIMIT 50';

  const result = await c.env.DB.prepare(query)
    .bind(...binds)
    .all();

  return c.json({
    data: (result.results ?? []).map((r: Record<string, unknown>) => ({
      id: r.id,
      userId: r.user_id,
      displayName: r.display_name,
      rewardTitle: r.reward_title,
      costCoins: r.cost_coins,
      status: r.status,
      rejectReason: r.reject_reason,
      requestedAt: r.requested_at,
      resolvedAt: r.resolved_at,
    })),
  });
});

app.post('/reward-requests/:id/approve', async (c) => {
  const requestId = c.req.param('id');
  const request = await c.env.DB.prepare('SELECT * FROM reward_requests WHERE id = ?')
    .bind(requestId)
    .first<RewardRequestRow>();

  if (!request) return c.json({ error: { code: 'not_found', message: '요청을 찾을 수 없습니다' } }, 404);
  if (request.status !== 'pending')
    return c.json({ error: { code: 'conflict', message: '이미 처리된 요청입니다' } }, 409);
  if (!canApproveRewards(c as any, request.class_id)) {
    return c.json({ error: { code: 'forbidden', message: '권한이 없습니다' } }, 403);
  }

  const userId = c.get('userId');
  const now = nowMs();

  await c.env.DB.prepare(
    `UPDATE reward_requests SET status = 'approved', approver_user_id = ?, resolved_at = ? WHERE id = ?`,
  )
    .bind(userId, now, requestId)
    .run();

  await logEvent(c, 'reward.approved', { requestId, approver: userId });
  return c.json({ data: { ok: true } });
});

app.post('/reward-requests/:id/reject', async (c) => {
  const requestId = c.req.param('id');
  const body = await c.req.json();
  const parsed = parseBody(rejectSchema, body);
  if ('error' in parsed) {
    return c.json({ error: { code: 'validation_error', message: '거절 사유를 입력해주세요' } }, 400);
  }

  const request = await c.env.DB.prepare('SELECT * FROM reward_requests WHERE id = ?')
    .bind(requestId)
    .first<RewardRequestRow>();

  if (!request) return c.json({ error: { code: 'not_found', message: '요청을 찾을 수 없습니다' } }, 404);
  if (request.status !== 'pending')
    return c.json({ error: { code: 'conflict', message: '이미 처리된 요청입니다' } }, 409);
  if (!canApproveRewards(c as any, request.class_id)) {
    return c.json({ error: { code: 'forbidden', message: '권한이 없습니다' } }, 403);
  }

  const profile = await c.env.DB.prepare('SELECT total_coins FROM profiles WHERE user_id = ?')
    .bind(request.user_id)
    .first<{ total_coins: number }>();

  const newBalance = (profile?.total_coins ?? 0) + request.cost_coins;
  const now = nowMs();

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE reward_requests SET status = 'rejected', reject_reason = ?, approver_user_id = ?, resolved_at = ? WHERE id = ?`,
    ).bind(parsed.data.reason, c.get('userId'), now, requestId),

    c.env.DB.prepare('UPDATE profiles SET total_coins = ?, updated_at = ? WHERE user_id = ?').bind(
      newBalance,
      now,
      request.user_id,
    ),

    c.env.DB.prepare(
      `INSERT INTO transactions (id, user_id, class_id, type, amount, balance_after, reference_type, reference_id, created_at)
       VALUES (?, ?, ?, 'refund', ?, ?, 'reward_request', ?, ?)`,
    ).bind(newId(), request.user_id, request.class_id, request.cost_coins, newBalance, requestId, now),
  ]);

  await logEvent(c, 'reward.rejected', { requestId, reason: parsed.data.reason });
  return c.json({ data: { ok: true } });
});

app.post('/reward-requests/:id/cancel', async (c) => {
  const requestId = c.req.param('id');
  const userId = c.get('userId');

  const request = await c.env.DB.prepare('SELECT * FROM reward_requests WHERE id = ? AND user_id = ?')
    .bind(requestId, userId)
    .first<RewardRequestRow>();

  if (!request) return c.json({ error: { code: 'not_found', message: '요청을 찾을 수 없습니다' } }, 404);
  if (request.status !== 'pending')
    return c.json({ error: { code: 'conflict', message: '대기 중인 요청만 취소할 수 있습니다' } }, 409);

  const profile = await c.env.DB.prepare('SELECT total_coins FROM profiles WHERE user_id = ?')
    .bind(userId)
    .first<{ total_coins: number }>();

  const newBalance = (profile?.total_coins ?? 0) + request.cost_coins;
  const now = nowMs();

  await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE reward_requests SET status = 'cancelled', resolved_at = ? WHERE id = ?`).bind(
      now,
      requestId,
    ),

    c.env.DB.prepare('UPDATE profiles SET total_coins = ?, updated_at = ? WHERE user_id = ?').bind(
      newBalance,
      now,
      userId,
    ),

    c.env.DB.prepare(
      `INSERT INTO transactions (id, user_id, class_id, type, amount, balance_after, reference_type, reference_id, created_at)
       VALUES (?, ?, ?, 'refund', ?, ?, 'reward_request', ?, ?)`,
    ).bind(newId(), userId, request.class_id, request.cost_coins, newBalance, requestId, now),
  ]);

  await logEvent(c, 'reward.cancelled', { requestId });
  return c.json({ data: { ok: true } });
});

export default app;
