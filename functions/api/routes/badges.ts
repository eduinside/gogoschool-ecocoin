import { Hono } from 'hono';
import type { Env, Vars } from '../_lib/types';

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.get('/', async (c) => {
  const userId = c.get('userId');

  const result = await c.env.DB.prepare(
    `SELECT b.id, b.code, b.title, b.description, b.emoji, b.rarity,
            ub.earned_at
     FROM badges b
     LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ?
     ORDER BY b.created_at`,
  )
    .bind(userId)
    .all();

  return c.json({
    data: (result.results ?? []).map((r: Record<string, unknown>) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      description: r.description,
      emoji: r.emoji,
      rarity: r.rarity,
      isEarned: r.earned_at != null,
      earnedAt: r.earned_at,
    })),
  });
});

export default app;
