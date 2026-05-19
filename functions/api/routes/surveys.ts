import { Hono } from 'hono';
import type { Env, Vars, SurveyRow, SurveyQuestionRow } from '../_lib/types';
import { newId, nowMs } from '../_lib/db';
import { isTeacherOf } from '../_lib/middleware';
import { logEvent } from '../_lib/logger';

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.get('/', async (c) => {
  const userId = c.get('userId');
  const trigger = c.req.query('trigger');
  const type = c.req.query('type');
  const classIds = c.get('classIds');

  let query = `SELECT s.*, COUNT(sq.id) as question_count FROM surveys s
               LEFT JOIN survey_questions sq ON sq.survey_id = s.id
               WHERE s.is_active = 1 AND (s.class_id IS NULL${classIds.length > 0 ? ` OR s.class_id IN (${classIds.map(() => '?').join(',')})` : ''})`;
  const binds: unknown[] = [...classIds];

  if (trigger) {
    query += ' AND s.trigger_type = ?';
    binds.push(trigger);
  }
  if (type) {
    query += ' AND s.type = ?';
    binds.push(type);
  }

  query += ' GROUP BY s.id ORDER BY s.created_at DESC';

  const surveys = await c.env.DB.prepare(query).bind(...binds).all();

  const responseStatuses = await c.env.DB.prepare(
    `SELECT survey_id, status FROM survey_responses WHERE user_id = ? ORDER BY started_at DESC`,
  )
    .bind(userId)
    .all<{ survey_id: string; status: string }>();

  const statusMap = new Map<string, string>();
  for (const r of responseStatuses.results ?? []) {
    if (!statusMap.has(r.survey_id)) statusMap.set(r.survey_id, r.status);
  }

  return c.json({
    data: (surveys.results ?? []).map((s: Record<string, unknown>) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      description: s.description,
      triggerType: s.trigger_type,
      rewardCoins: s.reward_coins,
      rewardOnCorrect: s.reward_on_correct,
      questionCount: s.question_count,
      estimatedMinutes: Math.max(1, Math.ceil((s.question_count as number) * 0.5)),
      myStatus: statusMap.get(s.id as string) ?? 'not_started',
      canRetake: s.allow_retake === 1,
    })),
  });
});

app.get('/:id', async (c) => {
  const surveyId = c.req.param('id');
  const survey = await c.env.DB.prepare('SELECT * FROM surveys WHERE id = ? AND is_active = 1')
    .bind(surveyId)
    .first<SurveyRow>();

  if (!survey) return c.json({ error: { code: 'not_found', message: '설문을 찾을 수 없습니다' } }, 404);

  const questions = await c.env.DB.prepare(
    'SELECT * FROM survey_questions WHERE survey_id = ? ORDER BY display_order',
  )
    .bind(surveyId)
    .all<SurveyQuestionRow>();

  return c.json({
    data: {
      id: survey.id,
      type: survey.type,
      title: survey.title,
      description: survey.description,
      isAnonymous: survey.is_anonymous === 1,
      questions: (questions.results ?? []).map((q) => ({
        id: q.id,
        displayOrder: q.display_order,
        questionType: q.question_type,
        prompt: q.prompt,
        options: q.options ? JSON.parse(q.options) : null,
        isRequired: q.is_required === 1,
      })),
    },
  });
});

app.post('/:id/responses', async (c) => {
  const surveyId = c.req.param('id');
  const userId = c.get('userId');

  const survey = await c.env.DB.prepare('SELECT * FROM surveys WHERE id = ? AND is_active = 1')
    .bind(surveyId)
    .first<SurveyRow>();
  if (!survey) return c.json({ error: { code: 'not_found', message: '설문을 찾을 수 없습니다' } }, 404);

  if (!survey.allow_retake) {
    const existing = await c.env.DB.prepare(
      "SELECT id FROM survey_responses WHERE survey_id = ? AND user_id = ? AND status = 'submitted'",
    )
      .bind(surveyId, userId)
      .first();
    if (existing) {
      return c.json({ error: { code: 'forbidden', message: '이미 응답한 설문입니다' } }, 403);
    }
  }

  const responseId = newId();
  const now = nowMs();
  await c.env.DB.prepare(
    `INSERT INTO survey_responses (id, survey_id, user_id, class_id, status, started_at)
     VALUES (?, ?, ?, ?, 'in_progress', ?)`,
  )
    .bind(responseId, surveyId, survey.is_anonymous ? null : userId, c.get('classIds')[0] ?? null, now)
    .run();

  await logEvent(c, 'survey.opened', { surveyId, type: survey.type, trigger: survey.trigger_type });

  return c.json({ data: { responseId } });
});

app.post('/responses/:id/submit', async (c) => {
  const responseId = c.req.param('id');
  const userId = c.get('userId');

  const response = await c.env.DB.prepare('SELECT * FROM survey_responses WHERE id = ?')
    .bind(responseId)
    .first<{ id: string; survey_id: string; user_id: string | null; status: string }>();

  if (!response) return c.json({ error: { code: 'not_found', message: '응답을 찾을 수 없습니다' } }, 404);
  if (response.status === 'submitted')
    return c.json({ error: { code: 'conflict', message: '이미 제출된 응답입니다' } }, 409);

  const body = await c.req.json<{
    answers: Array<{
      questionId: string;
      valueText?: string;
      valueNumber?: number;
      valueJson?: unknown;
    }>;
    durationMs?: number;
    triggerContext?: Record<string, unknown>;
  }>();

  const survey = await c.env.DB.prepare('SELECT * FROM surveys WHERE id = ?')
    .bind(response.survey_id)
    .first<SurveyRow>();
  if (!survey) return c.json({ error: { code: 'not_found', message: '설문을 찾을 수 없습니다' } }, 404);

  const questions = await c.env.DB.prepare('SELECT * FROM survey_questions WHERE survey_id = ?')
    .bind(survey.id)
    .all<SurveyQuestionRow>();
  const questionMap = new Map((questions.results ?? []).map((q) => [q.id, q]));

  let correctCount = 0;
  let totalCount = 0;
  const stmts: D1PreparedStatement[] = [];
  const perQuestion: Array<{ questionId: string; isCorrect?: boolean; correctValue?: string }> = [];
  const now = nowMs();

  for (const ans of body.answers) {
    const q = questionMap.get(ans.questionId);
    if (!q) continue;

    let isCorrect: number | null = null;
    if (survey.type === 'quiz' && q.correct_value) {
      totalCount++;
      const userAnswer = ans.valueText ?? (ans.valueJson ? JSON.stringify(ans.valueJson) : '');
      isCorrect = userAnswer === q.correct_value ? 1 : 0;
      if (isCorrect === 1) correctCount++;
      perQuestion.push({ questionId: q.id, isCorrect: isCorrect === 1, correctValue: q.correct_value });
    }

    stmts.push(
      c.env.DB.prepare(
        `INSERT INTO survey_answers (id, response_id, question_id, value_text, value_number, value_json, is_correct, answered_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        newId(),
        responseId,
        ans.questionId,
        ans.valueText ?? null,
        ans.valueNumber ?? null,
        ans.valueJson ? JSON.stringify(ans.valueJson) : null,
        isCorrect,
        now,
      ),
    );
  }

  let coinsAwarded = 0;
  if (survey.type === 'quiz') {
    coinsAwarded = correctCount * survey.reward_on_correct;
  } else {
    coinsAwarded = survey.reward_coins;
  }

  stmts.push(
    c.env.DB.prepare(
      `UPDATE survey_responses SET status = 'submitted', submitted_at = ?, duration_ms = ?,
       correct_count = ?, total_count = ?, coins_awarded = ?, trigger_context = ? WHERE id = ?`,
    ).bind(
      now,
      body.durationMs ?? null,
      survey.type === 'quiz' ? correctCount : null,
      survey.type === 'quiz' ? totalCount : null,
      coinsAwarded,
      body.triggerContext ? JSON.stringify(body.triggerContext) : null,
      responseId,
    ),
  );

  if (coinsAwarded > 0) {
    const profile = await c.env.DB.prepare('SELECT total_coins FROM profiles WHERE user_id = ?')
      .bind(userId)
      .first<{ total_coins: number }>();
    const newBalance = (profile?.total_coins ?? 0) + coinsAwarded;

    stmts.push(
      c.env.DB.prepare('UPDATE profiles SET total_coins = ?, updated_at = ? WHERE user_id = ?').bind(
        newBalance,
        now,
        userId,
      ),
    );
    stmts.push(
      c.env.DB.prepare(
        `INSERT INTO transactions (id, user_id, class_id, type, amount, balance_after, reference_type, reference_id, created_at)
         VALUES (?, ?, ?, 'earn', ?, ?, ?, ?, ?)`,
      ).bind(
        newId(),
        userId,
        c.get('classIds')[0] ?? null,
        coinsAwarded,
        newBalance,
        survey.type === 'quiz' ? 'quiz' : 'survey',
        responseId,
        now,
      ),
    );
  }

  await c.env.DB.batch(stmts);

  const eventKey = survey.type === 'quiz' ? 'quiz.completed' : 'survey.submitted';
  await logEvent(c, eventKey, { surveyId: survey.id, responseId, durationMs: body.durationMs });

  const result: Record<string, unknown> = {
    responseId,
    type: survey.type,
    coinsAwarded,
    newTotalCoins: coinsAwarded > 0
      ? ((await c.env.DB.prepare('SELECT total_coins FROM profiles WHERE user_id = ?')
          .bind(userId)
          .first<{ total_coins: number }>())?.total_coins ?? 0)
      : undefined,
  };

  if (survey.type === 'quiz') {
    result.correctCount = correctCount;
    result.totalCount = totalCount;
    result.perQuestion = perQuestion;
  }

  return c.json({ data: result });
});

app.get('/:id/analytics', async (c) => {
  const surveyId = c.req.param('id');
  const survey = await c.env.DB.prepare('SELECT * FROM surveys WHERE id = ?').bind(surveyId).first<SurveyRow>();
  if (!survey) return c.json({ error: { code: 'not_found', message: '설문을 찾을 수 없습니다' } }, 404);

  if (survey.class_id && !isTeacherOf(c, survey.class_id)) {
    return c.json({ error: { code: 'forbidden', message: '권한이 없습니다' } }, 403);
  }

  const [totalResult, questions, answers] = await Promise.all([
    c.env.DB.prepare(
      `SELECT COUNT(*) as total, SUM(CASE WHEN status='submitted' THEN 1 ELSE 0 END) as submitted,
              AVG(CASE WHEN status='submitted' THEN duration_ms END) as avgDuration
       FROM survey_responses WHERE survey_id = ?`,
    )
      .bind(surveyId)
      .first<{ total: number; submitted: number; avgDuration: number | null }>(),

    c.env.DB.prepare('SELECT * FROM survey_questions WHERE survey_id = ? ORDER BY display_order')
      .bind(surveyId)
      .all<SurveyQuestionRow>(),

    c.env.DB.prepare(
      `SELECT sa.question_id, sa.value_text, sa.value_number, sa.value_json, sa.is_correct
       FROM survey_answers sa
       JOIN survey_responses sr ON sr.id = sa.response_id
       WHERE sr.survey_id = ? AND sr.status = 'submitted'`,
    )
      .bind(surveyId)
      .all<{ question_id: string; value_text: string | null; value_number: number | null; value_json: string | null; is_correct: number | null }>(),
  ]);

  const answersByQ = new Map<string, Array<typeof answers.results[0]>>();
  for (const a of answers.results ?? []) {
    const arr = answersByQ.get(a.question_id) ?? [];
    arr.push(a);
    answersByQ.set(a.question_id, arr);
  }

  const perQuestion = (questions.results ?? []).map((q) => {
    const qAnswers = answersByQ.get(q.id) ?? [];
    const distribution = new Map<string, number>();
    const shortTexts: string[] = [];
    let correctTotal = 0;

    for (const a of qAnswers) {
      const val = a.value_text ?? String(a.value_number ?? '');
      distribution.set(val, (distribution.get(val) ?? 0) + 1);
      if (q.question_type.includes('text') && a.value_text) {
        if (shortTexts.length < 5) shortTexts.push(a.value_text);
      }
      if (a.is_correct === 1) correctTotal++;
    }

    return {
      questionId: q.id,
      prompt: q.prompt,
      questionType: q.question_type,
      distribution: Array.from(distribution.entries()).map(([value, count]) => ({
        value,
        count,
        pct: qAnswers.length > 0 ? Math.round((count / qAnswers.length) * 100) : 0,
      })),
      correctRate: qAnswers.length > 0 ? correctTotal / qAnswers.length : null,
      shortTextSample: shortTexts,
    };
  });

  return c.json({
    data: {
      totalResponses: totalResult?.total ?? 0,
      submittedCount: totalResult?.submitted ?? 0,
      avgDurationMs: totalResult?.avgDuration ?? null,
      perQuestion,
    },
  });
});

export default app;
