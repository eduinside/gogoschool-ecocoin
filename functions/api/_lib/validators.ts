import { z } from 'zod';

export const emailSchema = z.string().email('올바른 이메일을 입력해주세요');
export const passwordSchema = z.string().min(8, '비밀번호는 8자 이상이어야 합니다');
export const displayNameSchema = z.string().min(1).max(20, '이름은 20자 이하로 입력해주세요');
export const joinCodeSchema = z.string().length(6, '학급 코드는 6자입니다');
export const uuidSchema = z.string().uuid();
export const gradeSchema = z.number().int().min(1).max(6);

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
  role: z.enum(['student', 'teacher']),
  joinCode: joinCodeSchema.optional(),
  grade: gradeSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const mineSchema = z.object({
  actionId: z.string().min(1),
  classId: z.string().min(1),
});

export const rewardRequestSchema = z.object({
  classId: z.string().min(1),
});

export const rejectSchema = z.object({
  reason: z.string().min(1).max(200),
});

export const helperToggleSchema = z.object({
  userId: z.string().min(1),
  isHelper: z.boolean(),
});

export const logBatchSchema = z.object({
  sessionId: z.string().min(1),
  events: z
    .array(
      z.object({
        eventKey: z.string().min(1),
        payload: z.record(z.unknown()).optional(),
        clientTs: z.number(),
      }),
    )
    .min(1)
    .max(100),
  appVersion: z.string().optional(),
  platform: z.string().optional(),
});

export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): { data: T } | { error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) return { data: result.data };
  return { error: result.error };
}
