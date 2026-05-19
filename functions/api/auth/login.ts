import { Hono } from 'hono';
import type { Env, Vars, UserRow, ProfileRow, UserRoleRow } from '../_lib/types';
import { verifyPassword, signJwt } from '../_lib/auth';
import { nowMs } from '../_lib/db';
import { loginSchema, parseBody } from '../_lib/validators';
import { logEvent } from '../_lib/logger';

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(loginSchema, body);
  if ('error' in parsed) {
    return c.json(
      { error: { code: 'validation_error', message: '입력값을 확인해주세요', details: parsed.error.flatten() } },
      400,
    );
  }

  const { email, password } = parsed.data;

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
  if (!user) {
    return c.json({ error: { code: 'unauthorized', message: '이메일 또는 비밀번호가 올바르지 않습니다' } }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash, user.password_salt);
  if (!valid) {
    return c.json({ error: { code: 'unauthorized', message: '이메일 또는 비밀번호가 올바르지 않습니다' } }, 401);
  }

  const [profile, rolesResult] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM profiles WHERE user_id = ?').bind(user.id).first<ProfileRow>(),
    c.env.DB.prepare('SELECT * FROM user_roles WHERE user_id = ?').bind(user.id).all<UserRoleRow>(),
  ]);

  const roles = rolesResult.results ?? [];
  const classIds = [...new Set(roles.filter((r) => r.class_id).map((r) => r.class_id!))];

  await c.env.DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').bind(nowMs(), user.id).run();

  const accessTtl = parseInt(c.env.JWT_ACCESS_TTL_SEC, 10);
  const refreshTtl = parseInt(c.env.JWT_REFRESH_TTL_SEC, 10);

  const [token, refreshToken] = await Promise.all([
    signJwt(user.id, c.env.JWT_SECRET, { issuer: c.env.JWT_ISSUER, ttlSec: accessTtl, type: 'access' }),
    signJwt(user.id, c.env.JWT_SECRET, { issuer: c.env.JWT_ISSUER, ttlSec: refreshTtl, type: 'refresh' }),
  ]);

  await c.env.SESSIONS.put(`refresh:${user.id}`, refreshToken, { expirationTtl: refreshTtl });

  c.set('userId', user.id);
  c.set('roles', []);
  c.set('classIds', classIds);
  await logEvent(c, 'auth.login');

  return c.json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        displayName: profile?.display_name ?? '',
        roles: roles.map((r) => r.role),
        classIds,
      },
      token,
      refreshToken,
    },
  });
});

export default app;
