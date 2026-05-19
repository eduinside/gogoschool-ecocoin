import { Hono } from 'hono';
import type { Env, Vars, ClassRow, ProfileRow } from '../_lib/types';
import { newId, nowMs, generateJoinCode } from '../_lib/db';
import { inClass, isTeacherOf } from '../_lib/middleware';
import { helperToggleSchema, parseBody } from '../_lib/validators';
import { logEvent } from '../_lib/logger';

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.post('/', async (c) => {
  const userId = c.get('userId');
  const { name, schoolName, grade } = await c.req.json<{ name: string; schoolName?: string; grade?: number }>();

  if (!name) {
    return c.json({ error: { code: 'validation_error', message: '학급 이름이 필요합니다' } }, 400);
  }

  const classId = newId();
  const joinCode = generateJoinCode();
  const now = nowMs();

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO classes (id, name, school_name, grade, join_code, teacher_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(classId, name, schoolName ?? null, grade ?? null, joinCode, userId, now),

    c.env.DB.prepare('INSERT INTO user_roles (id, user_id, role, class_id, created_at) VALUES (?, ?, ?, ?, ?)').bind(
      newId(),
      userId,
      'teacher',
      classId,
      now,
    ),
  ]);

  await logEvent(c, 'class.created', { classId, name });

  return c.json({
    data: { id: classId, name, schoolName: schoolName ?? null, grade: grade ?? null, joinCode },
  });
});

app.get('/:id', async (c) => {
  const classId = c.req.param('id');
  if (!inClass(c, classId)) {
    return c.json({ error: { code: 'forbidden', message: '권한이 없습니다' } }, 403);
  }

  const cls = await c.env.DB.prepare('SELECT * FROM classes WHERE id = ?').bind(classId).first<ClassRow>();
  if (!cls) {
    return c.json({ error: { code: 'not_found', message: '학급을 찾을 수 없습니다' } }, 404);
  }

  const countResult = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM class_members WHERE class_id = ?')
    .bind(classId)
    .first<{ cnt: number }>();

  return c.json({
    data: {
      id: cls.id,
      name: cls.name,
      schoolName: cls.school_name,
      grade: cls.grade,
      joinCode: cls.join_code,
      teacherUserId: cls.teacher_user_id,
      memberCount: countResult?.cnt ?? 0,
    },
  });
});

app.get('/:id/students', async (c) => {
  const classId = c.req.param('id');
  if (!inClass(c, classId)) {
    return c.json({ error: { code: 'forbidden', message: '권한이 없습니다' } }, 403);
  }

  const sort = c.req.query('sort') ?? 'coins';
  const order = c.req.query('order') ?? 'desc';
  const orderCol =
    sort === 'name' ? 'p.display_name' : sort === 'carbon' ? 'p.carbon_saved_g' : 'p.total_coins';
  const orderDir = order === 'asc' ? 'ASC' : 'DESC';

  const result = await c.env.DB.prepare(
    `SELECT cm.user_id, p.display_name, p.avatar_emoji, p.total_coins, p.carbon_saved_g, p.level,
            CASE WHEN ur.id IS NOT NULL THEN 1 ELSE 0 END as is_helper
     FROM class_members cm
     JOIN profiles p ON p.user_id = cm.user_id
     LEFT JOIN user_roles ur ON ur.user_id = cm.user_id AND ur.class_id = ? AND ur.role = 'helper'
     WHERE cm.class_id = ?
     ORDER BY ${orderCol} ${orderDir}
     LIMIT 50`,
  )
    .bind(classId, classId)
    .all();

  return c.json({
    data: (result.results ?? []).map((r: Record<string, unknown>) => ({
      userId: r.user_id,
      displayName: r.display_name,
      avatarEmoji: r.avatar_emoji,
      totalCoins: r.total_coins,
      carbonSavedG: r.carbon_saved_g,
      level: r.level,
      isHelper: r.is_helper === 1,
    })),
  });
});

app.post('/:id/helpers', async (c) => {
  const classId = c.req.param('id');
  if (!isTeacherOf(c, classId)) {
    return c.json({ error: { code: 'forbidden', message: '담임 교사만 관리할 수 있습니다' } }, 403);
  }

  const body = await c.req.json();
  const parsed = parseBody(helperToggleSchema, body);
  if ('error' in parsed) {
    return c.json({ error: { code: 'validation_error', message: '입력값을 확인해주세요' } }, 400);
  }

  const { userId, isHelper } = parsed.data;

  if (isHelper) {
    const existing = await c.env.DB.prepare(
      'SELECT id FROM user_roles WHERE user_id = ? AND role = ? AND class_id = ?',
    )
      .bind(userId, 'helper', classId)
      .first();

    if (!existing) {
      await c.env.DB.prepare('INSERT INTO user_roles (id, user_id, role, class_id, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(newId(), userId, 'helper', classId, nowMs())
        .run();
    }
  } else {
    await c.env.DB.prepare('DELETE FROM user_roles WHERE user_id = ? AND role = ? AND class_id = ?')
      .bind(userId, 'helper', classId)
      .run();
  }

  await logEvent(c, 'helper.toggled', { userId, isHelper, classId });
  return c.json({ data: { ok: true } });
});

app.post('/join', async (c) => {
  const userId = c.get('userId');
  const { joinCode } = await c.req.json<{ joinCode: string }>();

  if (!joinCode) {
    return c.json({ error: { code: 'validation_error', message: '학급 코드가 필요합니다' } }, 400);
  }

  const cls = await c.env.DB.prepare('SELECT * FROM classes WHERE join_code = ? AND is_active = 1')
    .bind(joinCode)
    .first<ClassRow>();

  if (!cls) {
    return c.json({ error: { code: 'invalid_join_code', message: '학급 코드가 올바르지 않습니다' } }, 400);
  }

  const existing = await c.env.DB.prepare('SELECT id FROM class_members WHERE class_id = ? AND user_id = ?')
    .bind(cls.id, userId)
    .first();

  if (existing) {
    return c.json({ error: { code: 'conflict', message: '이미 가입된 학급입니다' } }, 409);
  }

  const now = nowMs();
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO class_members (id, class_id, user_id, joined_at) VALUES (?, ?, ?, ?)').bind(
      newId(),
      cls.id,
      userId,
      now,
    ),
    c.env.DB.prepare('INSERT INTO user_roles (id, user_id, role, class_id, created_at) VALUES (?, ?, ?, ?, ?)').bind(
      newId(),
      userId,
      'student',
      cls.id,
      now,
    ),
  ]);

  return c.json({ data: { classId: cls.id, name: cls.name } });
});

export default app;
