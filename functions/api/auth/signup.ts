import { Hono } from 'hono';
import type { Env, Vars, ClassRow } from '../_lib/types';
import { hashPassword, signJwt } from '../_lib/auth';
import { newId, nowMs } from '../_lib/db';
import { signupSchema, parseBody } from '../_lib/validators';
import { logEvent } from '../_lib/logger';

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = parseBody(signupSchema, body);
  if ('error' in parsed) {
    return c.json(
      { error: { code: 'validation_error', message: '입력값을 확인해주세요', details: parsed.error.flatten() } },
      400,
    );
  }

  const { email, password, displayName, role, joinCode, grade } = parsed.data;

  if (role === 'student' && !joinCode) {
    return c.json({ error: { code: 'validation_error', message: '학생은 학급 코드가 필요합니다' } }, 400);
  }

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return c.json({ error: { code: 'conflict', message: '이미 사용 중인 이메일입니다' } }, 409);
  }

  let classRow: ClassRow | null = null;
  if (role === 'student' && joinCode) {
    classRow = await c.env.DB.prepare('SELECT * FROM classes WHERE join_code = ? AND is_active = 1')
      .bind(joinCode)
      .first<ClassRow>();
    if (!classRow) {
      return c.json({ error: { code: 'invalid_join_code', message: '학급 코드가 올바르지 않습니다' } }, 400);
    }
  }

  const userId = newId();
  const now = nowMs();
  const { hash, salt } = await hashPassword(password);

  const stmts: D1PreparedStatement[] = [
    c.env.DB.prepare('INSERT INTO users (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(userId, email, hash, salt, now),
    c.env.DB.prepare(
      'INSERT INTO profiles (user_id, display_name, grade, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(userId, displayName, grade ?? null, now, now),
    c.env.DB.prepare('INSERT INTO user_roles (id, user_id, role, class_id, created_at) VALUES (?, ?, ?, ?, ?)').bind(
      newId(),
      userId,
      role,
      classRow?.id ?? null,
      now,
    ),
  ];

  if (classRow) {
    stmts.push(
      c.env.DB.prepare('INSERT INTO class_members (id, class_id, user_id, joined_at) VALUES (?, ?, ?, ?)').bind(
        newId(),
        classRow.id,
        userId,
        now,
      ),
    );
  }

  await c.env.DB.batch(stmts);

  const accessTtl = parseInt(c.env.JWT_ACCESS_TTL_SEC, 10);
  const refreshTtl = parseInt(c.env.JWT_REFRESH_TTL_SEC, 10);

  const [token, refreshToken] = await Promise.all([
    signJwt(userId, c.env.JWT_SECRET, { issuer: c.env.JWT_ISSUER, ttlSec: accessTtl, type: 'access' }),
    signJwt(userId, c.env.JWT_SECRET, { issuer: c.env.JWT_ISSUER, ttlSec: refreshTtl, type: 'refresh' }),
  ]);

  await c.env.SESSIONS.put(`refresh:${userId}`, refreshToken, { expirationTtl: refreshTtl });

  // Set context for logEvent
  c.set('userId', userId);
  c.set('roles', []);
  c.set('classIds', classRow ? [classRow.id] : []);

  await logEvent(c, 'auth.signup', { role });

  return c.json({
    data: {
      user: { id: userId, email, displayName },
      token,
      refreshToken,
    },
  });
});

export default app;
