import { Hono } from 'hono';
import type { Env, Vars, ProfileRow, ClassRow } from '../_lib/types';

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.get('/', async (c) => {
  const userId = c.get('userId');

  const [user, profile, classesResult] = await Promise.all([
    c.env.DB.prepare('SELECT id, email FROM users WHERE id = ?').bind(userId).first(),
    c.env.DB.prepare('SELECT * FROM profiles WHERE user_id = ?').bind(userId).first<ProfileRow>(),
    c.env.DB.prepare(
      `SELECT c.id, c.name, c.join_code, c.school_name, c.grade
       FROM classes c
       JOIN class_members cm ON cm.class_id = c.id
       WHERE cm.user_id = ? AND c.is_active = 1
       UNION
       SELECT c.id, c.name, c.join_code, c.school_name, c.grade
       FROM classes c
       WHERE c.teacher_user_id = ? AND c.is_active = 1`,
    )
      .bind(userId, userId)
      .all<ClassRow>(),
  ]);

  if (!user || !profile) {
    return c.json({ error: { code: 'not_found', message: '사용자를 찾을 수 없습니다' } }, 404);
  }

  const roles = c.get('roles');

  return c.json({
    data: {
      user: { id: user.id, email: user.email },
      profile: {
        displayName: profile.display_name,
        avatarEmoji: profile.avatar_emoji,
        grade: profile.grade,
        totalCoins: profile.total_coins,
        carbonSavedG: profile.carbon_saved_g,
        level: profile.level,
      },
      roles: roles.map((r) => ({ role: r.role, classId: r.classId })),
      classes: (classesResult.results ?? []).map((cls) => ({
        id: cls.id,
        name: cls.name,
        joinCode: cls.join_code,
        schoolName: cls.school_name,
        grade: cls.grade,
      })),
    },
  });
});

export default app;
