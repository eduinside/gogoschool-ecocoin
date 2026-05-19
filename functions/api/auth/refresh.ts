import { Hono } from 'hono';
import type { Env, Vars } from '../_lib/types';
import { verifyJwt, signJwt } from '../_lib/auth';

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.post('/', async (c) => {
  const { refreshToken } = await c.req.json<{ refreshToken: string }>();
  if (!refreshToken) {
    return c.json({ error: { code: 'validation_error', message: 'refreshToken이 필요합니다' } }, 400);
  }

  const payload = await verifyJwt(refreshToken, c.env.JWT_SECRET, {
    issuer: c.env.JWT_ISSUER,
    type: 'refresh',
  });

  if (!payload) {
    return c.json({ error: { code: 'unauthorized', message: '토큰이 유효하지 않습니다' } }, 401);
  }

  const stored = await c.env.SESSIONS.get(`refresh:${payload.sub}`);
  if (stored !== refreshToken) {
    return c.json({ error: { code: 'unauthorized', message: '토큰이 유효하지 않습니다' } }, 401);
  }

  const accessTtl = parseInt(c.env.JWT_ACCESS_TTL_SEC, 10);
  const refreshTtl = parseInt(c.env.JWT_REFRESH_TTL_SEC, 10);

  const [newToken, newRefresh] = await Promise.all([
    signJwt(payload.sub, c.env.JWT_SECRET, { issuer: c.env.JWT_ISSUER, ttlSec: accessTtl, type: 'access' }),
    signJwt(payload.sub, c.env.JWT_SECRET, { issuer: c.env.JWT_ISSUER, ttlSec: refreshTtl, type: 'refresh' }),
  ]);

  await c.env.SESSIONS.put(`refresh:${payload.sub}`, newRefresh, { expirationTtl: refreshTtl });

  return c.json({ data: { token: newToken, refreshToken: newRefresh } });
});

export default app;
