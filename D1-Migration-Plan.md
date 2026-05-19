# EcoinClass — Cloudflare D1 재설계 계획서

> Supabase Postgres → Cloudflare D1 (SQLite) 마이그레이션 가이드
> 작성일: 2026-05-05

---

## 1. 아키텍처 요약

```
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Pages  ─ EcoinClass.html (정적 SPA)          │
│        │                                                 │
│        │ fetch /api/*                                    │
│        ▼                                                 │
│  Cloudflare Pages Functions (functions/api/*)           │
│   = Workers 런타임 + Hono 라우터                         │
│   ├─ 인증 미들웨어 (JWT 검증)                            │
│   ├─ 권한 체크 (RLS 대체)                                │
│   └─ 비즈니스 로직                                       │
│        │                                                 │
│        ▼                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ D1 (SQLite)  │  │ KV (세션)    │  │ R2 (이미지)  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**기술 스택:**
- 프레임워크: Hono (Cloudflare Workers용 경량 라우터)
- 인증: JWT(직접) 또는 **Clerk** (추천 — 학교 도메인 SSO 가능)
- 비밀번호 해싱: `crypto.subtle` PBKDF2 (Web Crypto API)
- 실시간: Durable Objects + WebSocket (옵션, MVP에서는 폴링)

---

## 2. Supabase → D1 호환성 매핑

| Supabase 기능 | D1/Workers 대체 | 작업량 |
|---|---|---|
| Postgres `enum` | `CHECK (role IN ('student','teacher',...))` | 낮음 |
| `uuid` PK | `TEXT` + `crypto.randomUUID()` | 낮음 |
| `timestamptz` | `TEXT` (ISO 8601) 또는 `INTEGER` (epoch ms) | 낮음 |
| Row Level Security (RLS) | Hono 미들웨어에서 `WHERE user_id=?` 강제 | **중간** |
| `SECURITY DEFINER` 함수 | Workers 내 헬퍼 함수 | 낮음 |
| `auth.users` 자동 트리거 | 회원가입 핸들러에서 명시적 INSERT | 낮음 |
| Realtime 구독 | Durable Objects WebSocket 또는 폴링 | **중간** |
| `EXTENSION pgcrypto` | Web Crypto API | 낮음 |
| JSONB 컬럼 | `TEXT` (JSON.stringify) + 앱 레벨 파싱 | 낮음 |
| `RETURNING *` | D1 `.run()` 후 별도 SELECT | 낮음 |

---

## 3. D1 스키마 (전체)

```sql
-- migrations/0001_init.sql

-- ─────────────────────────────────────────────
-- 사용자 & 권한
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id           TEXT PRIMARY KEY,                  -- uuid
  email        TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,                    -- PBKDF2
  email_verified INTEGER DEFAULT 0,
  created_at   INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE TABLE profiles (
  user_id              TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  email                TEXT NOT NULL,
  total_coins          INTEGER DEFAULT 0,
  total_carbon_saved   INTEGER DEFAULT 0,         -- grams
  class_id             TEXT REFERENCES classes(id) ON DELETE SET NULL,
  created_at           INTEGER DEFAULT (unixepoch() * 1000),
  updated_at           INTEGER DEFAULT (unixepoch() * 1000)
);

-- ❗ 권한은 절대 profiles에 두지 않음 (권한 상승 방지)
CREATE TABLE user_roles (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role    TEXT NOT NULL CHECK (role IN ('student','teacher','super_admin','mini_admin')),
  PRIMARY KEY (user_id, role)
);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- ─────────────────────────────────────────────
-- 학급
-- ─────────────────────────────────────────────
CREATE TABLE classes (
  id          TEXT PRIMARY KEY,
  teacher_id  TEXT NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  join_code   TEXT UNIQUE NOT NULL,               -- 6자리
  created_at  INTEGER DEFAULT (unixepoch() * 1000)
);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_classes_join_code ON classes(join_code);

-- 학급 멤버십 (다대다)
CREATE TABLE class_members (
  class_id  TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at INTEGER DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (class_id, user_id)
);
CREATE INDEX idx_class_members_user ON class_members(user_id);

-- ─────────────────────────────────────────────
-- 환경 행동 / 채굴
-- ─────────────────────────────────────────────
CREATE TABLE eco_actions (
  id                TEXT PRIMARY KEY,
  class_id          TEXT REFERENCES classes(id) ON DELETE CASCADE,  -- NULL이면 글로벌
  action_key        TEXT NOT NULL,
  name_ko           TEXT NOT NULL,
  category          TEXT NOT NULL,
  glyph             TEXT,
  coin_value        INTEGER NOT NULL,
  carbon_reduction  INTEGER NOT NULL,             -- grams
  daily_limit       INTEGER NOT NULL DEFAULT 1,
  active            INTEGER DEFAULT 1,
  created_at        INTEGER DEFAULT (unixepoch() * 1000)
);
CREATE INDEX idx_eco_actions_class ON eco_actions(class_id);

CREATE TABLE mining_records (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_id    TEXT NOT NULL REFERENCES eco_actions(id),
  class_id     TEXT NOT NULL REFERENCES classes(id),
  coins_earned INTEGER NOT NULL,
  carbon_saved INTEGER NOT NULL,
  mined_at     INTEGER DEFAULT (unixepoch() * 1000)
);
CREATE INDEX idx_mining_user_time ON mining_records(user_id, mined_at);
CREATE INDEX idx_mining_class_time ON mining_records(class_id, mined_at);
CREATE INDEX idx_mining_action_user_day ON mining_records(action_id, user_id, mined_at);

-- ─────────────────────────────────────────────
-- 보상
-- ─────────────────────────────────────────────
CREATE TABLE rewards (
  id          TEXT PRIMARY KEY,
  class_id    TEXT REFERENCES classes(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  glyph       TEXT,
  category    TEXT NOT NULL CHECK (category IN ('privilege','donation','item')),
  cost        INTEGER NOT NULL,
  available   INTEGER DEFAULT 1,
  created_at  INTEGER DEFAULT (unixepoch() * 1000)
);
CREATE INDEX idx_rewards_class ON rewards(class_id);

CREATE TABLE reward_requests (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id),
  reward_id    TEXT NOT NULL REFERENCES rewards(id),
  class_id     TEXT NOT NULL REFERENCES classes(id),
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected')),
  reject_reason TEXT,
  reviewed_by  TEXT REFERENCES users(id),
  requested_at INTEGER DEFAULT (unixepoch() * 1000),
  reviewed_at  INTEGER
);
CREATE INDEX idx_rr_class_status ON reward_requests(class_id, status);
CREATE INDEX idx_rr_user ON reward_requests(user_id);

-- ─────────────────────────────────────────────
-- 거래 내역 (감사 로그)
-- ─────────────────────────────────────────────
CREATE TABLE transactions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  type        TEXT NOT NULL CHECK (type IN ('earn','spend','refund','donate')),
  amount      INTEGER NOT NULL,
  reference   TEXT,                               -- mining_record id 또는 reward_request id
  reference_type TEXT,
  created_at  INTEGER DEFAULT (unixepoch() * 1000)
);
CREATE INDEX idx_tx_user_time ON transactions(user_id, created_at);

-- ─────────────────────────────────────────────
-- 학급 미션 / 뱃지
-- ─────────────────────────────────────────────
CREATE TABLE class_missions (
  id            TEXT PRIMARY KEY,
  class_id      TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  metric        TEXT NOT NULL CHECK (metric IN ('coins','carbon','count')),
  target_value  INTEGER NOT NULL,
  reward_text   TEXT,
  starts_at     INTEGER NOT NULL,
  ends_at       INTEGER NOT NULL,
  status        TEXT DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  created_at    INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE TABLE badges (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  glyph           TEXT,
  condition_type  TEXT NOT NULL,                  -- 'milestone_carbon','category_count','streak' 등
  condition_value INTEGER NOT NULL,
  category_filter TEXT
);

CREATE TABLE user_badges (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL REFERENCES badges(id),
  earned_at  INTEGER DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (user_id, badge_id)
);
```

---

## 4. RLS 대체 — 권한 미들웨어 패턴

Postgres RLS는 D1엔 없으므로, **모든 쿼리는 미들웨어에서 권한 검사 후 `WHERE` 절로 직접 필터**합니다.

```ts
// functions/api/_middleware.ts
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

type Env = { DB: D1Database; JWT_SECRET: string };
type Ctx = { user: { id: string; roles: string[] }; classIds: string[] };

const app = new Hono<{ Bindings: Env; Variables: Ctx }>();

// 1) JWT 검증
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = await verifyJwt(token, c.env.JWT_SECRET);

  // 2) 권한 + 학급 동기 조회
  const roles = await c.env.DB.prepare(
    'SELECT role FROM user_roles WHERE user_id = ?'
  ).bind(payload.sub).all();
  const classes = await c.env.DB.prepare(
    'SELECT class_id FROM class_members WHERE user_id = ?'
  ).bind(payload.sub).all();

  c.set('user', { id: payload.sub, roles: roles.results.map(r => r.role) });
  c.set('classIds', classes.results.map(c => c.class_id));
  await next();
});

// 헬퍼
export function hasRole(c: Context, role: string) {
  return c.get('user').roles.includes(role);
}
export function inClass(c: Context, classId: string) {
  return c.get('classIds').includes(classId) || hasRole(c, 'super_admin');
}
```

### 권한 정책 예시

```ts
// GET /api/classes/:id/students — 교사 또는 같은 학급 학생만
app.get('/api/classes/:id/students', async (c) => {
  const cid = c.req.param('id');
  if (!inClass(c, cid)) return c.json({ error: 'forbidden' }, 403);

  const rows = await c.env.DB.prepare(`
    SELECT p.user_id, p.name, p.total_coins, p.total_carbon_saved
    FROM class_members cm
    JOIN profiles p ON p.user_id = cm.user_id
    WHERE cm.class_id = ?
    ORDER BY p.total_coins DESC
  `).bind(cid).all();
  return c.json(rows.results);
});
```

---

## 5. 핵심 RPC 대체 — 원자적 채굴

Supabase의 `increment_profile_totals` RPC를 D1 트랜잭션으로 대체:

```ts
// POST /api/mine
app.post('/api/mine', async (c) => {
  const { actionId } = await c.req.json();
  const userId = c.get('user').id;

  // 1) 액션 조회 + 일일 한도 체크 (오늘 0시 epoch)
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const startMs = todayStart.getTime();

  const action = await c.env.DB.prepare(
    'SELECT id, class_id, coin_value, carbon_reduction, daily_limit FROM eco_actions WHERE id = ? AND active = 1'
  ).bind(actionId).first();
  if (!action) return c.json({ error: 'action_not_found' }, 404);
  if (!inClass(c, action.class_id)) return c.json({ error: 'forbidden' }, 403);

  const usedRow = await c.env.DB.prepare(
    'SELECT COUNT(*) AS n FROM mining_records WHERE user_id = ? AND action_id = ? AND mined_at >= ?'
  ).bind(userId, actionId, startMs).first();
  if (usedRow.n >= action.daily_limit) return c.json({ error: 'daily_limit' }, 429);

  // 2) D1 batch — 원자적 처리
  const recordId = crypto.randomUUID();
  const txId = crypto.randomUUID();
  await c.env.DB.batch([
    c.env.DB.prepare(`INSERT INTO mining_records
      (id, user_id, action_id, class_id, coins_earned, carbon_saved)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(recordId, userId, actionId, action.class_id, action.coin_value, action.carbon_reduction),
    c.env.DB.prepare(`UPDATE profiles
      SET total_coins = total_coins + ?,
          total_carbon_saved = total_carbon_saved + ?,
          updated_at = unixepoch() * 1000
      WHERE user_id = ?`)
      .bind(action.coin_value, action.carbon_reduction, userId),
    c.env.DB.prepare(`INSERT INTO transactions
      (id, user_id, type, amount, reference, reference_type)
      VALUES (?, ?, 'earn', ?, ?, 'mining')`)
      .bind(txId, userId, action.coin_value, recordId),
  ]);

  return c.json({ ok: true, coins: action.coin_value, carbon: action.carbon_reduction });
});
```

> ⚠️ D1의 `batch()`는 단일 트랜잭션으로 실행됩니다(SQLite WAL).
> Postgres의 row-level lock은 없지만, D1는 단일-라이터 모델이라 race condition이 거의 없습니다.

---

## 6. 인증 전략

### 옵션 A: 자체 JWT (간단, 무료)
- `crypto.subtle`로 PBKDF2 비밀번호 해싱
- HS256 JWT, KV에 refresh token 저장
- 이메일 인증은 Resend(이메일 발송 API) 무료 티어 사용
- 작업량: ~200줄

### 옵션 B: Clerk (추천 — 학교 환경)
- Google Workspace SSO (학교 계정으로 로그인)
- 비밀번호 분실 처리, 이메일 인증 자동
- 무료 10,000 MAU
- Workers와 통합: `@clerk/backend` 사용
- 작업량: ~30줄

**제안: MVP는 옵션 A로 출발 → 학교 단위 도입 시 Clerk로 전환**

---

## 7. 회원가입 플로우 (auth trigger 대체)

Supabase의 `handle_new_user()` 트리거를 핸들러에서 명시적으로 처리:

```ts
app.post('/api/auth/signup', async (c) => {
  const { email, password, name, role, joinCode } = await c.req.json();

  // 1) 비밀번호 해시
  const hash = await pbkdf2(password);
  const userId = crypto.randomUUID();

  const stmts = [
    c.env.DB.prepare(`INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`)
      .bind(userId, email, hash),
    c.env.DB.prepare(`INSERT INTO profiles (user_id, name, email) VALUES (?, ?, ?)`)
      .bind(userId, name, email),
    c.env.DB.prepare(`INSERT INTO user_roles (user_id, role) VALUES (?, ?)`)
      .bind(userId, role === 'teacher' ? 'teacher' : 'student'),
  ];

  // 2) 학생이면 학급 자동 가입
  if (role === 'student' && joinCode) {
    const cls = await c.env.DB.prepare(
      'SELECT id FROM classes WHERE join_code = ?'
    ).bind(joinCode.toUpperCase()).first();
    if (!cls) return c.json({ error: 'invalid_join_code' }, 400);
    stmts.push(
      c.env.DB.prepare(`INSERT INTO class_members (class_id, user_id) VALUES (?, ?)`)
        .bind(cls.id, userId),
      c.env.DB.prepare(`UPDATE profiles SET class_id = ? WHERE user_id = ?`)
        .bind(cls.id, userId)
    );
  }

  await c.env.DB.batch(stmts);
  const token = await signJwt({ sub: userId }, c.env.JWT_SECRET);
  return c.json({ token, userId });
});
```

---

## 8. 실시간 (Realtime) 대체

| 사용처 | 권장 방식 | 비용 |
|---|---|---|
| 보상 요청 알림 (교사) | **5초 폴링** (`useEffect` + `setInterval`) | 무료 |
| 학급 미션 진행률 | 폴링 30초 또는 채굴 후 invalidate | 무료 |
| 채굴 성공 애니메이션 | 클라이언트 즉시 응답 (서버 응답 후) | 무료 |
| 라이브 리더보드 | Durable Objects + WebSocket (선택) | 유료 (월 $5~) |

> **MVP에서는 폴링으로 충분.** 학급당 동시접속 30명 미만이라 부하 무시 가능.

---

## 9. 마이그레이션 단계

```bash
# 1. D1 DB 생성
wrangler d1 create ecoinclass-db
# wrangler.toml에 binding 추가

# 2. 마이그레이션 적용
wrangler d1 execute ecoinclass-db --file=./migrations/0001_init.sql
wrangler d1 execute ecoinclass-db --file=./migrations/0002_seed.sql

# 3. 시드 데이터 (기본 환경 행동 + 보상)
# migrations/0002_seed.sql 에 8개 액션 + 6개 보상 INSERT

# 4. 로컬 개발
wrangler pages dev ./dist --d1=DB

# 5. 배포
wrangler pages deploy ./dist
```

### `wrangler.toml`

```toml
name = "ecoinclass"
compatibility_date = "2026-05-01"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "ecoinclass-db"
database_id = "<생성 시 받는 UUID>"

[[kv_namespaces]]
binding = "SESSIONS"
id = "<KV namespace id>"

[vars]
JWT_SECRET = "<secret>"   # wrangler secret put JWT_SECRET 권장
```

---

## 10. 작업 일정 추정

| 단계 | 작업량 |
|---|---|
| D1 스키마 적용 + 시드 | 0.5일 |
| 인증 (자체 JWT) | 1일 |
| `/api/mine` + 학급/학생 조회 API | 1일 |
| 보상 요청/승인 API | 0.5일 |
| 학급 미션 + 뱃지 평가 | 1일 |
| 클라이언트 통합 (Supabase 클라이언트 → fetch) | 1.5일 |
| 배포 + QA | 0.5일 |
| **합계** | **~6일** |

---

## 11. 다음 액션

1. **확인 받을 것:** 인증 방식 (자체 JWT vs Clerk)
2. **만들 것:**
   - `migrations/0001_init.sql` (위 스키마 그대로)
   - `migrations/0002_seed.sql` (기본 환경 행동/보상)
   - `functions/api/[[route]].ts` (Hono 라우터)
   - 클라이언트 `lib/api.ts` (fetch 래퍼)
3. **검토할 것:**
   - 학급 단위로 환경 행동/보상을 fork할지, 글로벌 default를 쓸지
   - 꼬마관리자(mini_admin) 권한 범위 (현재 readme는 "보상 승인 + 미션 업데이트")
