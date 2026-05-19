import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, Vars } from './_lib/types';
import { authMiddleware } from './_lib/middleware';

import signupRoute from './auth/signup';
import loginRoute from './auth/login';
import refreshRoute from './auth/refresh';
import logoutRoute from './auth/logout';
import meRoute from './auth/me';
import mineRoute from './routes/mine';
import classesRoute from './routes/classes';
import ecoActionsRoute from './routes/eco-actions';
import rewardsRoute from './routes/rewards';
import missionsRoute from './routes/missions';
import badgesRoute from './routes/badges';
import statsRoute from './routes/stats';
import surveysRoute from './routes/surveys';
import logsRoute from './routes/logs';

const app = new Hono<{ Bindings: Env; Variables: Vars }>().basePath('/api');

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));

// Public routes
app.route('/auth/signup', signupRoute);
app.route('/auth/login', loginRoute);
app.route('/auth/refresh', refreshRoute);

// Protected routes
app.use('*', authMiddleware);

app.route('/auth/logout', logoutRoute);
app.route('/auth/me', meRoute);
app.route('/mine', mineRoute);
app.route('/classes', classesRoute);
app.route('/eco-actions', ecoActionsRoute);
app.route('/rewards', rewardsRoute);
app.route('/missions', missionsRoute);
app.route('/badges', badgesRoute);
app.route('/stats', statsRoute);
app.route('/surveys', surveysRoute);
app.route('/logs', logsRoute);

app.notFound((c) => c.json({ error: { code: 'not_found', message: '엔드포인트를 찾을 수 없습니다' } }, 404));

app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: { code: 'internal', message: '서버 오류가 발생했습니다' } }, 500);
});

export const onRequest: PagesFunction<Env> = async (context) => {
  return app.fetch(context.request, context.env, (context as unknown as { ctx: ExecutionContext }).ctx);
};
