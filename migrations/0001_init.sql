-- ============================================================================
-- EcoinClass v2 — D1 (SQLite) Initial Schema
-- ============================================================================
-- 설계 원칙:
--   1) 권한은 user_roles 테이블에 격리 (profiles에 두지 않음)
--   2) 모든 코인 변동은 transactions에 기록 (감사 추적)
--   3) mining_records / event_logs / survey_responses는 append-only
--   4) profiles.total_coins/carbon_saved는 캐시 — 진실은 mining_records 집계
--   5) PII 최소화 — logs/responses는 user_id만 보관
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. 사용자 + 인증
-- ----------------------------------------------------------------------------

-- 인증 정보 (이메일/비번 — PII 격리용 별도 테이블)
CREATE TABLE users (
  id            TEXT PRIMARY KEY,                    -- uuid v4
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,                       -- PBKDF2(SHA-256, 100k iter)
  password_salt TEXT NOT NULL,                       -- base64
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  last_login_at INTEGER
);

CREATE INDEX idx_users_email ON users(email);

-- 프로필 (표시 정보 + 캐시 통계)
CREATE TABLE profiles (
  user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name   TEXT NOT NULL,
  avatar_emoji   TEXT,                                -- nullable
  grade          INTEGER,                             -- 1~6 (학생만)
  -- 캐시 통계 (진실은 집계)
  total_coins    INTEGER NOT NULL DEFAULT 0,
  carbon_saved_g INTEGER NOT NULL DEFAULT 0,          -- grams
  level          INTEGER NOT NULL DEFAULT 1,
  -- 메타
  created_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- 권한 (학교/학급 단위 역할)
CREATE TABLE user_roles (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'helper', 'admin')),
  class_id   TEXT REFERENCES classes(id) ON DELETE CASCADE,    -- admin은 NULL 가능
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE(user_id, role, class_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_class ON user_roles(class_id);

-- ----------------------------------------------------------------------------
-- 2. 학급
-- ----------------------------------------------------------------------------

CREATE TABLE classes (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,                     -- "5학년 3반"
  school_name     TEXT,
  grade           INTEGER,
  join_code       TEXT NOT NULL UNIQUE,              -- 6자 영숫자
  teacher_user_id TEXT NOT NULL REFERENCES users(id),
  is_active       INTEGER NOT NULL DEFAULT 1,        -- boolean
  created_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX idx_classes_join_code ON classes(join_code);
CREATE INDEX idx_classes_teacher ON classes(teacher_user_id);

-- 학급 멤버십 (학생 ↔ 학급)
CREATE TABLE class_members (
  id         TEXT PRIMARY KEY,
  class_id   TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE(class_id, user_id)
);

CREATE INDEX idx_class_members_class ON class_members(class_id);
CREATE INDEX idx_class_members_user ON class_members(user_id);

-- ----------------------------------------------------------------------------
-- 3. 환경 행동 + 채굴
-- ----------------------------------------------------------------------------

CREATE TABLE eco_actions (
  id              TEXT PRIMARY KEY,
  class_id        TEXT REFERENCES classes(id) ON DELETE CASCADE,   -- NULL = 글로벌 기본
  category        TEXT NOT NULL CHECK (category IN ('energy', 'water', 'waste', 'transport', 'food', 'other')),
  title           TEXT NOT NULL,
  description     TEXT,
  coin_reward     INTEGER NOT NULL DEFAULT 1,
  carbon_saved_g  INTEGER NOT NULL DEFAULT 0,        -- 1회당 절감량
  daily_limit     INTEGER NOT NULL DEFAULT 3,        -- 일 최대 인정 횟수
  is_active       INTEGER NOT NULL DEFAULT 1,
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX idx_eco_actions_class ON eco_actions(class_id, is_active);

-- 채굴 기록 (append-only, 모든 통계의 진실)
CREATE TABLE mining_records (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id),
  class_id       TEXT NOT NULL REFERENCES classes(id),
  action_id      TEXT NOT NULL REFERENCES eco_actions(id),
  coin_reward    INTEGER NOT NULL,                   -- 행동 정의 변경에 영향받지 않게 스냅샷
  carbon_saved_g INTEGER NOT NULL,                   -- 스냅샷
  created_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  -- 일일 한도 체크용 (date(created_at)을 매번 계산하지 않게)
  date_key       TEXT NOT NULL                       -- "2026-05-05" (UTC+9)
);

CREATE INDEX idx_mining_user_date ON mining_records(user_id, action_id, date_key);
CREATE INDEX idx_mining_class_date ON mining_records(class_id, created_at DESC);
CREATE INDEX idx_mining_user_created ON mining_records(user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. 보상
-- ----------------------------------------------------------------------------

CREATE TABLE rewards (
  id              TEXT PRIMARY KEY,
  class_id        TEXT REFERENCES classes(id) ON DELETE CASCADE,   -- NULL = 글로벌
  category        TEXT NOT NULL CHECK (category IN ('privilege', 'item', 'experience', 'donation')),
  title           TEXT NOT NULL,
  description     TEXT,
  cost_coins      INTEGER NOT NULL,
  stock           INTEGER,                            -- NULL = 무제한
  is_active       INTEGER NOT NULL DEFAULT 1,
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX idx_rewards_class ON rewards(class_id, is_active);

CREATE TABLE reward_requests (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  class_id      TEXT NOT NULL REFERENCES classes(id),
  reward_id     TEXT NOT NULL REFERENCES rewards(id),
  cost_coins    INTEGER NOT NULL,                    -- 요청 시점 스냅샷
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'fulfilled')),
  approver_user_id TEXT REFERENCES users(id),
  reject_reason TEXT,
  requested_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  resolved_at   INTEGER
);

CREATE INDEX idx_reward_requests_user ON reward_requests(user_id, requested_at DESC);
CREATE INDEX idx_reward_requests_class_pending ON reward_requests(class_id, status, requested_at DESC);

-- ----------------------------------------------------------------------------
-- 5. 미션 + 뱃지
-- ----------------------------------------------------------------------------

CREATE TABLE missions (
  id            TEXT PRIMARY KEY,
  class_id      TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  goal_type     TEXT NOT NULL CHECK (goal_type IN ('total_minings', 'category_minings', 'class_total_carbon', 'streak_days')),
  goal_value    INTEGER NOT NULL,                    -- 목표 수치
  goal_meta     TEXT,                                -- JSON (category 지정 등)
  reward_coins  INTEGER NOT NULL DEFAULT 0,
  reward_badge_id TEXT REFERENCES badges(id),
  starts_at     INTEGER NOT NULL,
  ends_at       INTEGER NOT NULL,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX idx_missions_class_active ON missions(class_id, is_active, ends_at);

CREATE TABLE badges (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,                -- "first_mine", "100_coins"
  title         TEXT NOT NULL,
  description   TEXT,
  emoji         TEXT,
  rarity        TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE user_badges (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL REFERENCES badges(id),
  earned_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- ----------------------------------------------------------------------------
-- 6. 거래 원장 (감사 추적)
-- ----------------------------------------------------------------------------

CREATE TABLE transactions (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id),
  class_id       TEXT REFERENCES classes(id),
  type           TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'refund', 'adjust')),
  amount         INTEGER NOT NULL,                   -- 부호 포함 (earn=+, spend=-)
  balance_after  INTEGER NOT NULL,                   -- 거래 직후 잔액 (정합성 검증용)
  reference_type TEXT NOT NULL CHECK (reference_type IN ('mining', 'reward_request', 'mission_complete', 'survey', 'quiz', 'admin_adjust')),
  reference_id   TEXT,                                -- mining_records.id 등
  note           TEXT,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_ref ON transactions(reference_type, reference_id);

-- ----------------------------------------------------------------------------
-- 7. 연구/분석용 이벤트 로그 (append-only, 절대 수정 금지)
-- ----------------------------------------------------------------------------

CREATE TABLE event_logs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,   -- 익명 이벤트 허용
  class_id    TEXT REFERENCES classes(id) ON DELETE SET NULL,
  session_id  TEXT,                                  -- 클라이언트 세션 식별자
  event_key   TEXT NOT NULL,                         -- "mine.success", "screen.viewed"
  payload     TEXT,                                  -- JSON 문자열
  client_ts   INTEGER,                               -- 클라이언트 시각 (오프라인 재전송 대비)
  server_ts   INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  -- 환경 정보 (분석용)
  user_agent  TEXT,
  app_version TEXT,
  platform    TEXT                                   -- "web", "ios_pwa", "android_pwa"
);

CREATE INDEX idx_event_logs_user_time ON event_logs(user_id, server_ts DESC);
CREATE INDEX idx_event_logs_class_time ON event_logs(class_id, server_ts DESC);
CREATE INDEX idx_event_logs_event ON event_logs(event_key, server_ts DESC);
CREATE INDEX idx_event_logs_session ON event_logs(session_id, server_ts);

-- ----------------------------------------------------------------------------
-- 8. 설문/퀴즈 모듈
-- ----------------------------------------------------------------------------

-- 설문/퀴즈 정의
CREATE TABLE surveys (
  id                TEXT PRIMARY KEY,
  class_id          TEXT REFERENCES classes(id) ON DELETE CASCADE,    -- NULL = 전체 대상
  type              TEXT NOT NULL CHECK (type IN ('survey', 'quiz')),
  title             TEXT NOT NULL,
  description       TEXT,
  -- 트리거 조건
  trigger_type      TEXT NOT NULL CHECK (trigger_type IN ('after_signup', 'after_n_minings', 'after_reward_used', 'weekly', 'manual', 'always_available')),
  trigger_meta      TEXT,                            -- JSON: {"n": 10} 등
  -- 보상
  reward_coins      INTEGER NOT NULL DEFAULT 0,      -- 완료 시 (설문) 또는 정답 1개당 (퀴즈)
  reward_on_correct INTEGER NOT NULL DEFAULT 0,      -- 퀴즈 정답 1개당 추가 코인
  -- 응답 정책
  is_anonymous      INTEGER NOT NULL DEFAULT 0,      -- 1=user_id 저장 안 함 (연구 동의용)
  allow_retake      INTEGER NOT NULL DEFAULT 0,
  starts_at         INTEGER,
  ends_at           INTEGER,
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_by        TEXT REFERENCES users(id),
  created_at        INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX idx_surveys_class_active ON surveys(class_id, is_active, trigger_type);

-- 문항
CREATE TABLE survey_questions (
  id            TEXT PRIMARY KEY,
  survey_id     TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  question_type TEXT NOT NULL CHECK (question_type IN ('single_choice', 'multi_choice', 'likert_5', 'likert_7', 'short_text', 'long_text', 'number')),
  prompt        TEXT NOT NULL,
  -- 선택지 (single/multi/likert): JSON 배열 [{"value":"a","label":"매우 그렇다"}]
  options       TEXT,
  -- 퀴즈용 정답
  correct_value TEXT,                                 -- single_choice: 옵션 value, multi: JSON 배열
  is_required   INTEGER NOT NULL DEFAULT 1,
  meta          TEXT                                  -- JSON (min/max, placeholder 등)
);

CREATE INDEX idx_survey_questions_survey ON survey_questions(survey_id, display_order);

-- 응답 헤더 (설문 1회분)
CREATE TABLE survey_responses (
  id              TEXT PRIMARY KEY,
  survey_id       TEXT NOT NULL REFERENCES surveys(id),
  user_id         TEXT REFERENCES users(id) ON DELETE SET NULL,    -- is_anonymous=1이면 NULL
  class_id        TEXT REFERENCES classes(id),
  status          TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'abandoned')),
  -- 메트릭
  started_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  submitted_at    INTEGER,
  duration_ms     INTEGER,                            -- 제출 시 계산
  correct_count   INTEGER,                            -- 퀴즈만
  total_count     INTEGER,                            -- 퀴즈만 (점수 = correct/total)
  coins_awarded   INTEGER NOT NULL DEFAULT 0,
  -- 컨텍스트 (트리거 정보)
  trigger_context TEXT                                -- JSON
);

CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id, submitted_at DESC);
CREATE INDEX idx_survey_responses_user ON survey_responses(user_id, submitted_at DESC);

-- 개별 문항 답변
CREATE TABLE survey_answers (
  id           TEXT PRIMARY KEY,
  response_id  TEXT NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id  TEXT NOT NULL REFERENCES survey_questions(id),
  -- 답변 값 (유형별 사용)
  value_text   TEXT,                                  -- short/long/single 옵션값
  value_number INTEGER,                               -- likert/number
  value_json   TEXT,                                  -- multi_choice 배열
  -- 퀴즈
  is_correct   INTEGER,                               -- 0/1, 설문은 NULL
  answered_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE(response_id, question_id)
);

CREATE INDEX idx_survey_answers_response ON survey_answers(response_id);
CREATE INDEX idx_survey_answers_question ON survey_answers(question_id);

-- ----------------------------------------------------------------------------
-- 9. 시스템 메타
-- ----------------------------------------------------------------------------

-- 마이그레이션 버전 추적
CREATE TABLE _migrations (
  version    INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  applied_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

INSERT INTO _migrations (version, name) VALUES (1, '0001_init');
