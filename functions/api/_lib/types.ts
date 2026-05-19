export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  JWT_ISSUER: string;
  JWT_ACCESS_TTL_SEC: string;
  JWT_REFRESH_TTL_SEC: string;
  LOG_BATCH_MAX_EVENTS: string;
  LOG_RATE_LIMIT_PER_MIN: string;
  APP_ENV: string;
  APP_VERSION: string;
}

export interface Vars {
  userId: string;
  roles: UserRole[];
  classIds: string[];
}

export interface UserRole {
  id: string;
  role: 'student' | 'teacher' | 'helper' | 'admin';
  classId: string | null;
}

// D1 Row types

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  created_at: number;
  last_login_at: number | null;
}

export interface ProfileRow {
  user_id: string;
  display_name: string;
  avatar_emoji: string | null;
  grade: number | null;
  total_coins: number;
  carbon_saved_g: number;
  level: number;
  created_at: number;
  updated_at: number;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: 'student' | 'teacher' | 'helper' | 'admin';
  class_id: string | null;
  created_at: number;
}

export interface ClassRow {
  id: string;
  name: string;
  school_name: string | null;
  grade: number | null;
  join_code: string;
  teacher_user_id: string;
  is_active: number;
  created_at: number;
}

export interface ClassMemberRow {
  id: string;
  class_id: string;
  user_id: string;
  joined_at: number;
}

export interface EcoActionRow {
  id: string;
  class_id: string | null;
  category: string;
  title: string;
  description: string | null;
  coin_reward: number;
  carbon_saved_g: number;
  daily_limit: number;
  is_active: number;
  display_order: number;
  created_at: number;
}

export interface MiningRecordRow {
  id: string;
  user_id: string;
  class_id: string;
  action_id: string;
  coin_reward: number;
  carbon_saved_g: number;
  created_at: number;
  date_key: string;
}

export interface RewardRow {
  id: string;
  class_id: string | null;
  category: string;
  title: string;
  description: string | null;
  cost_coins: number;
  stock: number | null;
  is_active: number;
  display_order: number;
  created_at: number;
}

export interface RewardRequestRow {
  id: string;
  user_id: string;
  class_id: string;
  reward_id: string;
  cost_coins: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'fulfilled';
  approver_user_id: string | null;
  reject_reason: string | null;
  requested_at: number;
  resolved_at: number | null;
}

export interface MissionRow {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  goal_type: string;
  goal_value: number;
  goal_meta: string | null;
  reward_coins: number;
  reward_badge_id: string | null;
  starts_at: number;
  ends_at: number;
  is_active: number;
  created_at: number;
}

export interface BadgeRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  emoji: string | null;
  rarity: string;
  created_at: number;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  class_id: string | null;
  type: 'earn' | 'spend' | 'refund' | 'adjust';
  amount: number;
  balance_after: number;
  reference_type: string;
  reference_id: string | null;
  note: string | null;
  created_at: number;
}

export interface EventLogRow {
  id: string;
  user_id: string | null;
  class_id: string | null;
  session_id: string | null;
  event_key: string;
  payload: string | null;
  client_ts: number | null;
  server_ts: number;
  user_agent: string | null;
  app_version: string | null;
  platform: string | null;
}

export interface SurveyRow {
  id: string;
  class_id: string | null;
  type: 'survey' | 'quiz';
  title: string;
  description: string | null;
  trigger_type: string;
  trigger_meta: string | null;
  reward_coins: number;
  reward_on_correct: number;
  is_anonymous: number;
  allow_retake: number;
  starts_at: number | null;
  ends_at: number | null;
  is_active: number;
  created_by: string | null;
  created_at: number;
}

export interface SurveyQuestionRow {
  id: string;
  survey_id: string;
  display_order: number;
  question_type: string;
  prompt: string;
  options: string | null;
  correct_value: string | null;
  is_required: number;
  meta: string | null;
}

// API response helpers
export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
