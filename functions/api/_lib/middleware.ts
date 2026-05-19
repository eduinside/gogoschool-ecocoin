import { Context, MiddlewareHandler } from 'hono';
import { verifyJwt } from './auth';
import type { Env, Vars, UserRole, UserRoleRow } from './types';

type AppContext = Context<{ Bindings: Env; Variables: Vars }>;

export const authMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: Vars }> = async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: { code: 'unauthorized', message: '인증이 필요합니다' } }, 401);
  }

  const token = header.slice(7);
  const payload = await verifyJwt(token, c.env.JWT_SECRET, {
    issuer: c.env.JWT_ISSUER,
    type: 'access',
  });

  if (!payload) {
    return c.json({ error: { code: 'unauthorized', message: '토큰이 유효하지 않습니다' } }, 401);
  }

  const userId = payload.sub;

  const rolesResult = await c.env.DB.prepare(
    'SELECT id, user_id, role, class_id, created_at FROM user_roles WHERE user_id = ?',
  )
    .bind(userId)
    .all<UserRoleRow>();

  const roles: UserRole[] = (rolesResult.results ?? []).map((r) => ({
    id: r.id,
    role: r.role,
    classId: r.class_id,
  }));

  const classIds = [...new Set(roles.filter((r) => r.classId).map((r) => r.classId!))];

  c.set('userId', userId);
  c.set('roles', roles);
  c.set('classIds', classIds);

  await next();
};

export function inClass(c: AppContext, classId: string): boolean {
  return c.get('classIds').includes(classId);
}

export function isTeacherOf(c: AppContext, classId: string): boolean {
  return c.get('roles').some((r) => r.role === 'teacher' && r.classId === classId);
}

export function isHelperOf(c: AppContext, classId: string): boolean {
  return c.get('roles').some((r) => r.role === 'helper' && r.classId === classId);
}

export function isStudentOf(c: AppContext, classId: string): boolean {
  return c.get('roles').some((r) => r.role === 'student' && r.classId === classId);
}

export function canApproveRewards(c: AppContext, classId: string): boolean {
  return isTeacherOf(c, classId) || isHelperOf(c, classId);
}

export function isAdmin(c: AppContext): boolean {
  return c.get('roles').some((r) => r.role === 'admin');
}
