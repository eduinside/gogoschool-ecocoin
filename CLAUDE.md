# EcoinClass — Claude Code 작업 가이드

> 본 문서는 Claude Code가 본 저장소에서 작업할 때 자동으로 읽는 컨텍스트입니다.

---

## 프로젝트 개요

EcoinClass v2 — 초등학생용 친환경 학급 미시 경제 플랫폼.
- 배포: Cloudflare Pages
- DB: Cloudflare D1 (SQLite)
- API: Pages Functions + Hono
- 인증: 자체 JWT (PBKDF2 + Web Crypto API)
- 클라이언트: React 18 (Vite 빌드 예정)

상세 배경: `README.md`, `Project-Status.md`, `D1-Migration-Plan.md` 참조.

---

## 코드 컨벤션

### TypeScript
- `strict: true` 필수
- 모든 D1 쿼리 결과에 명시적 타입 (`as { id: string }` 금지 → `z.parse()` 또는 정의된 타입 사용)
- 함수 export는 named export 우선, default export 지양

### Hono 라우트 패턴
```ts
// functions/api/<route>.ts — 한 파일당 하나의 리소스
import { Hono } from 'hono';
import type { Env, Vars } from '../_lib/types';

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

app.get('/', async (c) => { /* 목록 */ });
app.post('/', async (c) => { /* 생성 */ });
app.get('/:id', async (c) => { /* 상세 */ });

export default app;
```

### 응답 포맷 (모든 API 통일)
```ts
// 성공
return c.json({ data: <T> });

// 에러 — 항상 code 키 포함
return c.json({ error: { code: 'daily_limit', message: '일일 한도 초과' } }, 429);
```

### 에러 코드 표준
| 코드 | HTTP | 의미 |
|---|---|---|
| `unauthorized` | 401 | 토큰 없음/만료 |
| `forbidden` | 403 | 권한 없음 |
| `not_found` | 404 | 리소스 없음 |
| `validation_error` | 400 | 입력값 오류 (zod) |
| `daily_limit` | 429 | 일일 한도 초과 |
| `insufficient_coins` | 400 | 코인 부족 |
| `invalid_join_code` | 400 | 학급 코드 오류 |
| `conflict` | 409 | 중복 (이메일 등) |
| `internal` | 500 | 서버 오류 |

---

## 절대 금지 사항 ❌

1. **권한을 `profiles`에 저장 금지** — 반드시 `user_roles` 테이블 사용 (권한 상승 공격 방지)
2. **클라이언트 권한 신뢰 금지** — 모든 권한 검사는 미들웨어에서
3. **`mining_records` 또는 `event_logs`를 직접 UPDATE/DELETE 금지** — 감사/연구용 append-only
4. **비밀번호 평문 저장/로깅 금지** — 항상 PBKDF2 해시
5. **JWT 시크릿 코드에 하드코딩 금지** — 항상 `c.env.JWT_SECRET`
6. **`profiles.total_coins`를 신뢰 원본으로 사용 금지** — `mining_records`/`transactions` 집계가 진실, total_*는 캐시
7. **D1 쿼리에 문자열 보간 금지** — 항상 `prepare(...).bind(...)` 사용

---

## 데이터 무결성 원칙

- **`mining_records`는 모든 통계의 진실** (리더보드, 미션 진행률, 리포트)
- **`profiles.total_coins`는 빠른 조회용 캐시** — 채굴/소비/환불 시 같은 트랜잭션에서 동기화
- **모든 코인 변동은 `transactions`에 로그** — 감사 추적용
- **연구/분석용 로그는 `event_logs`** — 채굴 외 모든 사용자 행동 (앱 진입, 화면 전환, 설문 응답 등)

---

## 자주 쓰는 명령어

```bash
# 로컬 개발 (D1 + KV 바인딩)
npm run dev

# D1 마이그레이션 적용 (로컬)
wrangler d1 execute ecoinclass-db --local --file=./migrations/0001_init.sql

# D1 마이그레이션 적용 (프로덕션)
wrangler d1 execute ecoinclass-db --remote --file=./migrations/0001_init.sql

# D1 SQL 콘솔
wrangler d1 execute ecoinclass-db --local --command "SELECT * FROM users LIMIT 5"

# 시크릿 등록
wrangler secret put JWT_SECRET

# 배포
wrangler pages deploy ./dist

# 타입 생성 (Cloudflare 바인딩)
wrangler types
```

---

## 디렉토리 구조

```
functions/api/
├─ _lib/
│  ├─ auth.ts           # JWT 발급/검증, PBKDF2
│  ├─ middleware.ts     # 인증 + 권한 컨텍스트
│  ├─ db.ts             # D1 헬퍼 (id 생성 등)
│  ├─ logger.ts         # event_logs 기록
│  ├─ types.ts          # Env, Vars, 공통 타입
│  └─ validators.ts     # zod 스키마
├─ auth/
│  ├─ signup.ts
│  ├─ login.ts
│  └─ me.ts
├─ mine.ts
├─ classes/[id]/...
├─ rewards/...
├─ missions/...
├─ surveys/...          # ⭐ 설문/퀴즈
├─ logs/...             # ⭐ 클라이언트 이벤트 수집
└─ analytics/...        # 교사용 집계 API

migrations/
├─ 0001_init.sql        # 핵심 테이블
├─ 0002_seed.sql        # 기본 환경 행동/보상/뱃지
└─ 0003_research.sql    # event_logs + surveys 테이블
```

---

## 연구/분석 로그 시스템 (중요)

본 프로젝트는 **학생 활동 데이터를 추후 교육 연구용으로 분석**합니다. 모든 의미 있는 사용자 행동은 `event_logs`에 기록되어야 합니다.

### 로그 원칙
- **Append-only** — 한 번 기록된 로그는 절대 수정/삭제 금지
- **PII 최소화** — `user_id`만 저장, 이름/이메일은 logs에 직접 넣지 않음 (조인으로 해결)
- **타임스탬프** — 클라이언트 시간(`client_ts`)과 서버 수신 시간(`server_ts`) 둘 다 저장
- **이벤트 키 표준화** — `<domain>.<action>` 형식 (예: `mine.success`, `survey.submitted`, `screen.viewed`)
- **확장 가능한 페이로드** — `payload TEXT` 컬럼에 JSON 문자열로 저장

### 클라이언트 로깅 헬퍼 (필수 구현)
```ts
// src/lib/track.ts
import { api } from './api';
import { batchQueue } from './batch';

export function track(eventKey: string, payload?: Record<string, unknown>) {
  batchQueue.push({ eventKey, payload, clientTs: Date.now() });
  // 5초 또는 10건마다 batch flush → POST /api/logs/batch
}
```

### 자동 로깅해야 하는 이벤트 (목록은 API-Spec.md에서 관리)
- `auth.login`, `auth.signup`, `auth.logout`
- `screen.viewed` (모든 라우트 변경)
- `mine.attempted`, `mine.success`, `mine.daily_limit_hit`
- `reward.viewed`, `reward.requested`, `reward.approved`, `reward.rejected`
- `survey.opened`, `survey.submitted`, `survey.skipped`
- `quiz.started`, `quiz.answered`, `quiz.completed`
- `mission.viewed`, `badge.earned`

---

## 설문/퀴즈 모듈 (중요)

학생 활동 도중 **개입 시점에 설문 또는 퀴즈가 삽입**됩니다.

### 모델
- `surveys` — 설문/퀴즈 정의 (제목, 유형, 트리거 조건)
- `survey_questions` — 문항 (유형: 객관식/리커트/단답)
- `survey_responses` — 응답 (학생 × 설문)
- `survey_answers` — 개별 문항 응답

### 트리거 시점 (예시)
- `after_signup` — 가입 직후 사전 설문
- `after_n_minings` — N회 채굴 후 자기효능감 측정
- `after_reward_used` — 보상 사용 후 만족도
- `weekly` — 주간 정기 설문
- `manual` — 교사가 수동 발송

### 퀴즈 vs 설문
- **퀴즈** (`type='quiz'`): 정답 존재, 정답 시 코인 보상 가능 (`reward_on_correct`)
- **설문** (`type='survey'`): 정답 없음, 응답 자체에 코인 보상 가능 (`reward_on_complete`)

### 보상 처리
설문/퀴즈 보상은 채굴과 동일한 `transactions` 흐름 (`type='earn'`, `reference_type='survey'`)을 따릅니다.

---

## 코딩 시 점검 체크리스트

새 API 라우트 추가 시:
- [ ] zod로 입력값 검증
- [ ] 미들웨어로 권한 체크
- [ ] D1 쿼리는 `prepare().bind()` 사용
- [ ] 멀티-write는 `db.batch([...])` 사용
- [ ] 의미 있는 행동은 `event_logs`에 기록
- [ ] 응답 포맷 `{ data }` / `{ error: { code, message } }` 준수
- [ ] 에러 코드는 위 표 사용
- [ ] 타입 추론 가능 — 클라이언트가 import 가능하게 export

새 테이블 추가 시:
- [ ] `created_at INTEGER DEFAULT (unixepoch() * 1000)`
- [ ] PII는 최소화
- [ ] 인덱스 — 자주 조회되는 외래키 + 시간순 정렬
- [ ] `CHECK` 제약으로 enum 표현
- [ ] FK에 `ON DELETE CASCADE` 적절히

---

## 테스트

```bash
npm test                # vitest
npm run test:e2e        # 주요 플로우
```

새 API는 최소 happy path + 권한 거부 케이스 1개씩.

---

## 마지막 — Claude Code 작업 시 우선순위

1. `migrations/*.sql` 변경 시 → **항상 새 마이그레이션 파일** (`0004_*.sql`)로 추가, 기존 파일 수정 금지
2. `event_logs`에 새 이벤트 키 추가 시 → `API-Spec.md`의 이벤트 목록도 업데이트
3. 클라이언트에서 새 화면/플로우 추가 시 → `track('screen.viewed', { screen: 'xxx' })` 자동 호출
