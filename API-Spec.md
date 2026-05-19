# EcoinClass — API Specification (v2)

> **베이스 URL:** `/api`  
> **인증:** `Authorization: Bearer <JWT>` (지정된 엔드포인트 제외)  
> **응답 포맷:** 성공 `{ data: T }` / 실패 `{ error: { code, message } }`  
> **Content-Type:** `application/json`

---

## 0. 공통 사항

### 0.1 표준 에러 코드

| 코드 | HTTP | 의미 |
|---|---|---|
| `unauthorized` | 401 | 토큰 없음/만료/위조 |
| `forbidden` | 403 | 권한 없음 (역할/소속 학급 불일치) |
| `not_found` | 404 | 리소스 없음 |
| `validation_error` | 400 | zod 입력 검증 실패 (`details` 포함) |
| `daily_limit` | 429 | 일일 한도 초과 |
| `insufficient_coins` | 400 | 코인 부족 |
| `invalid_join_code` | 400 | 학급 코드 오류 |
| `conflict` | 409 | 중복 (이메일 등) |
| `rate_limited` | 429 | 호출 빈도 제한 |
| `internal` | 500 | 서버 오류 |

### 0.2 권한 표기

| 표기 | 의미 |
|---|---|
| 🌐 public | 인증 불필요 |
| 👤 auth | 모든 로그인 사용자 |
| 🎒 student | 해당 학급 학생 |
| 🧑‍🏫 teacher | 해당 학급 담임 |
| ⭐ helper | 해당 학급 꼬마관리자 |
| 🛡 admin | 시스템 관리자 |

미들웨어가 자동으로 `c.get('userId')`, `c.get('classIds')`, `c.get('roles')`를 주입합니다.

### 0.3 ID 규칙

- 모든 ID는 `crypto.randomUUID()` (TEXT)
- 시간은 `INTEGER` (Unix epoch ms)
- 응답에서 시간 필드는 ISO-8601 문자열로 변환 (`createdAt`, `updatedAt`)

---

## 1. 인증 (`/api/auth`)

### `POST /api/auth/signup` 🌐
회원가입.

**Request**
```json
{
  "email": "string (email)",
  "password": "string (min 8)",
  "displayName": "string (1-20)",
  "role": "student | teacher",
  "joinCode": "string (학생만, 6자)",
  "grade": "number (학생만, 1-6)"
}
```

**Response 200**
```json
{
  "data": {
    "user": { "id", "email", "displayName" },
    "token": "JWT",
    "refreshToken": "string"
  }
}
```

**Errors:** `validation_error`, `conflict` (이메일 중복), `invalid_join_code`

**Side effects:**
- `users` + `profiles` + `user_roles` INSERT (D1 batch)
- 학생: `class_members` INSERT
- `event_logs` INSERT (`auth.signup`)
- 학생: 자동으로 `srv_pre_signup` 응답 가능 상태로 진입 (클라이언트가 `GET /api/surveys?trigger=after_signup` 호출)

---

### `POST /api/auth/login` 🌐
로그인.

**Request**
```json
{ "email": "string", "password": "string" }
```

**Response 200**
```json
{
  "data": {
    "user": { "id", "email", "displayName", "roles": ["student"], "classIds": ["..."] },
    "token": "JWT",
    "refreshToken": "string"
  }
}
```

**Errors:** `validation_error`, `unauthorized` (비번 불일치)

**Logs:** `auth.login`

---

### `POST /api/auth/refresh` 🌐
**Request:** `{ "refreshToken": "string" }`  
**Response:** `{ data: { token, refreshToken } }`  
**Errors:** `unauthorized`

---

### `POST /api/auth/logout` 👤
**Response:** `{ data: { ok: true } }`  
**Side:** KV에서 refresh token 삭제, `event_logs` (`auth.logout`)

---

### `GET /api/auth/me` 👤
현재 사용자 + 프로필 + 역할 + 소속 학급.

**Response 200**
```json
{
  "data": {
    "user": { "id", "email" },
    "profile": { "displayName", "avatarEmoji", "grade", "totalCoins", "carbonSavedG", "level" },
    "roles": [{ "role": "student", "classId": "..." }],
    "classes": [{ "id", "name", "joinCode" }]
  }
}
```

---

## 2. 학급 (`/api/classes`)

### `POST /api/classes` 🧑‍🏫
**Request:** `{ name, schoolName?, grade? }`  
**Response:** `{ data: { id, name, joinCode, ... } }`  
**Side:** `classes` INSERT, 교사를 `user_roles(role='teacher', class_id)`로 등록, 글로벌 `eco_actions`/`rewards`를 학급 사본으로 복제 (선택적), `event_logs` (`class.created`)

---

### `GET /api/classes/:id` 🎒🧑‍🏫⭐
학급 상세 (소속 멤버만).

**Response:** `{ data: { id, name, schoolName, grade, joinCode, teacherUserId, memberCount } }`  
`joinCode`는 교사/꼬마관리자에게만 노출.

---

### `GET /api/classes/:id/students` 🧑‍🏫⭐
학생 목록 (코인/탄소/레벨 포함, 리더보드용).

**Query:** `?sort=coins|name|carbon&order=desc&limit=50`

**Response**
```json
{
  "data": [
    { "userId", "displayName", "avatarEmoji", "totalCoins", "carbonSavedG", "level", "isHelper": false }
  ]
}
```

---

### `POST /api/classes/:id/helpers` 🧑‍🏫
꼬마관리자 토글.

**Request:** `{ userId, isHelper: boolean }`  
**Response:** `{ data: { ok: true } }`  
**Side:** `user_roles` INSERT/DELETE (role='helper'), `event_logs` (`helper.toggled`)

---

### `POST /api/classes/join` 🌐
**Request:** `{ joinCode, userId }` (회원가입 후 별도 합류 시)  
**Errors:** `invalid_join_code`, `conflict` (이미 가입됨)

---

## 3. 환경 행동 + 채굴

### `GET /api/classes/:id/eco-actions` 🎒🧑‍🏫⭐
**Response**
```json
{
  "data": [
    { "id", "category", "title", "description", "coinReward", "carbonSavedG", "dailyLimit",
      "todayCount": 0, "remainingToday": 3, "isActive": true }
  ]
}
```

`todayCount`/`remainingToday`는 학생 본인 기준 (오늘 채굴 횟수).

---

### `POST /api/eco-actions` 🧑‍🏫
환경 행동 추가/수정.

**Request:** `{ classId, category, title, description?, coinReward, carbonSavedG, dailyLimit }`  
**Response:** `{ data: { id, ... } }`

### `PATCH /api/eco-actions/:id` 🧑‍🏫
부분 수정.

### `DELETE /api/eco-actions/:id` 🧑‍🏫
soft delete (`is_active=0`).

---

### `POST /api/mine` 🎒
**핵심 엔드포인트** — 환경 행동 인증.

**Request**
```json
{ "actionId": "string", "classId": "string" }
```

**Response 200**
```json
{
  "data": {
    "miningId": "string",
    "coinReward": 2,
    "carbonSavedG": 120,
    "newTotalCoins": 47,
    "newCarbonSavedG": 1840,
    "remainingToday": 1,
    "newBadges": [{ "id", "code", "title", "emoji" }]
  }
}
```

**Errors:** `daily_limit`, `not_found`, `forbidden` (학급 비소속)

**구현 (D1 batch):**
1. SELECT: 오늘 채굴 횟수 (`date_key = today`) + action 정의 + profile
2. 한도 체크 (앱에서 한도 초과면 즉시 429)
3. **batch:**
   - `mining_records` INSERT
   - `profiles` UPDATE (`total_coins += reward`, `carbon_saved_g += saved`, `level = floor(total/100)+1`)
   - `transactions` INSERT (`type='earn'`, `reference_type='mining'`)
4. 뱃지 평가 (별도 로직, 신규 획득 시 `user_badges` INSERT)
5. `event_logs` INSERT (`mine.success`)

---

## 4. 보상 (`/api/rewards`)

### `GET /api/classes/:id/rewards` 🎒🧑‍🏫⭐
**Response**
```json
{
  "data": [
    { "id", "category", "title", "description", "costCoins", "stock",
      "isAffordable": true, "isActive": true }
  ]
}
```

### `POST /api/rewards` 🧑‍🏫 / `PATCH /api/rewards/:id` / `DELETE /api/rewards/:id`
관리.

---

### `POST /api/rewards/:id/request` 🎒
보상 신청.

**Request:** `{ classId }`  
**Response:** `{ data: { requestId, status: "pending", costCoins } }`  
**Errors:** `insufficient_coins`, `not_found`

**Side (batch):**
- `reward_requests` INSERT (status=pending)
- `profiles` UPDATE (코인 즉시 차감 — escrow 방식)
- `transactions` INSERT (`type='spend'`, `reference_type='reward_request'`)
- `event_logs` (`reward.requested`)

---

### `GET /api/reward-requests` 🎒🧑‍🏫⭐
내 요청(학생) 또는 학급 전체 요청(교사/꼬마관리자).

**Query:** `?status=pending|approved|rejected&classId=...`

**Response**
```json
{
  "data": [
    { "id", "userId", "displayName", "rewardTitle", "costCoins",
      "status", "rejectReason", "requestedAt", "resolvedAt" }
  ]
}
```

---

### `POST /api/reward-requests/:id/approve` 🧑‍🏫⭐
**Response:** `{ data: { ok: true } }`  
**Side:**
- `reward_requests` UPDATE (status=approved, approver_user_id, resolved_at)
- `event_logs` (`reward.approved`)

### `POST /api/reward-requests/:id/reject` 🧑‍🏫⭐
**Request:** `{ reason: string }`  
**Side (batch):**
- `reward_requests` UPDATE (status=rejected, reject_reason)
- `profiles` UPDATE (코인 환불)
- `transactions` INSERT (`type='refund'`)
- `event_logs` (`reward.rejected`)

### `POST /api/reward-requests/:id/cancel` 🎒
본인 요청 취소 (pending만).  
**Side:** 환불 + `transactions` (refund) + `event_logs` (`reward.cancelled`)

---

## 5. 미션 (`/api/missions`)

### `GET /api/classes/:id/missions` 🎒🧑‍🏫⭐
**Response**
```json
{
  "data": [
    { "id", "title", "description", "goalType", "goalValue",
      "currentValue": 47, "rewardCoins", "rewardBadge",
      "startsAt", "endsAt", "isCompleted": false }
  ]
}
```

### `POST /api/missions` / `PATCH /api/missions/:id` / `DELETE /api/missions/:id` 🧑‍🏫
관리.

---

## 6. 뱃지 (`/api/badges`)

### `GET /api/badges` 👤
모든 뱃지 정의 + 본인 획득 여부.

**Response**
```json
{
  "data": [
    { "id", "code", "title", "description", "emoji", "rarity",
      "isEarned": true, "earnedAt": "2026-04-12T..." }
  ]
}
```

---

## 7. 통계 / 리포트 (`/api/stats`)

### `GET /api/stats/me` 🎒
본인 월간 리포트.

**Query:** `?month=2026-05`

**Response**
```json
{
  "data": {
    "totalMinings": 47,
    "totalCoins": 94,
    "carbonSavedG": 1840,
    "byDay": [{ "date": "2026-05-01", "count": 3, "coins": 6 }],
    "byCategory": [{ "category": "energy", "count": 12, "coins": 24 }],
    "streakDays": 7
  }
}
```

### `GET /api/stats/class/:id` 🧑‍🏫⭐
학급 집계 + 14일 추이.

**Response**
```json
{
  "data": {
    "memberCount": 28,
    "activeToday": 22,
    "totalCoinsToday": 124,
    "totalCarbonSavedG": 18400,
    "pendingRequests": 3,
    "byDay": [{ "date", "minings", "carbonSavedG" }],
    "topStudents": [{ "userId", "displayName", "totalCoins" }]
  }
}
```

---

## 8. 설문/퀴즈 (`/api/surveys`)

### `GET /api/surveys` 🎒🧑‍🏫
사용 가능한 설문/퀴즈 목록 (트리거 조건 충족분).

**Query:** `?trigger=after_signup|always_available&type=survey|quiz`

**Response**
```json
{
  "data": [
    { "id", "type", "title", "description", "triggerType",
      "rewardCoins", "rewardOnCorrect",
      "questionCount": 4, "estimatedMinutes": 2,
      "myStatus": "not_started | in_progress | submitted",
      "canRetake": false }
  ]
}
```

---

### `GET /api/surveys/:id` 🎒🧑‍🏫
문항 포함 상세.

**Response**
```json
{
  "data": {
    "id", "type", "title", "description", "isAnonymous",
    "questions": [
      { "id", "displayOrder", "questionType", "prompt", "options", "isRequired" }
    ]
  }
}
```

⚠️ `correctValue`는 응답 제출 후에만 노출 (퀴즈 결과 화면).

---

### `POST /api/surveys/:id/responses` 🎒🧑‍🏫
응답 시작 (in_progress 생성). 또는 `start` + `submit`을 한 번에 처리하려면 바로 submit 호출.

**Response:** `{ data: { responseId } }`  
**Logs:** `survey.opened`

---

### `POST /api/survey-responses/:id/submit` 🎒🧑‍🏫
응답 제출.

**Request**
```json
{
  "answers": [
    { "questionId": "...", "valueText": "b" },
    { "questionId": "...", "valueNumber": 4 },
    { "questionId": "...", "valueJson": ["a", "c"] },
    { "questionId": "...", "valueText": "자유 응답..." }
  ],
  "durationMs": 124000,
  "triggerContext": { "source": "after_signup" }
}
```

**Response 200**
```json
{
  "data": {
    "responseId",
    "type": "quiz",
    "correctCount": 4,
    "totalCount": 5,
    "coinsAwarded": 8,
    "newTotalCoins": 102,
    "perQuestion": [
      { "questionId", "isCorrect": true, "correctValue": "b" }
    ]
  }
}
```

설문(`survey`)은 `correctCount`/`perQuestion` 미포함.

**Side (batch):**
- `survey_responses` UPDATE (status=submitted, ...)
- `survey_answers` BULK INSERT
- 보상 있으면 `profiles` UPDATE + `transactions` INSERT (`reference_type='survey'` or `'quiz'`)
- `event_logs` (`survey.submitted` or `quiz.completed`)

**Errors:** `validation_error` (필수 문항 누락), `forbidden` (재응답 불가), `not_found`

---

### `GET /api/surveys/:id/analytics` 🧑‍🏫
교사용 응답 집계.

**Response**
```json
{
  "data": {
    "totalResponses": 24,
    "submittedCount": 22,
    "avgDurationMs": 98000,
    "perQuestion": [
      { "questionId", "prompt", "questionType",
        "distribution": [{ "value": "a", "count": 4, "pct": 18 }],
        "correctRate": 0.82,
        "shortTextSample": ["응답1", "응답2"] }
    ]
  }
}
```

⚠️ `is_anonymous=1` 설문은 개별 응답자 정보 절대 미노출.

---

### 설문/퀴즈 관리 (교사)

| 엔드포인트 | 설명 |
|---|---|
| `POST /api/surveys` 🧑‍🏫 | 신규 설문 생성 (문항 포함) |
| `PATCH /api/surveys/:id` 🧑‍🏫 | 메타 수정 (응답 시작 후엔 문항 변경 금지) |
| `POST /api/surveys/:id/send` 🧑‍🏫 | manual 트리거 설문 발송 (학급 학생들에게 알림) |
| `DELETE /api/surveys/:id` 🧑‍🏫 | soft delete |

---

## 9. 이벤트 로그 수집 (`/api/logs`)

### `POST /api/logs/batch` 👤
클라이언트가 5초/10건 단위로 배치 전송.

**Request**
```json
{
  "sessionId": "string (uuid)",
  "events": [
    { "eventKey": "screen.viewed", "payload": { "screen": "home" }, "clientTs": 1715000000000 },
    { "eventKey": "mine.attempted", "payload": { "actionId": "..." }, "clientTs": 1715000003000 }
  ],
  "appVersion": "2.0.1",
  "platform": "web"
}
```

**Response:** `{ data: { received: 2 } }`

**Errors:** `validation_error`, `rate_limited` (분당 N회 제한)

**구현 노트:**
- `event_logs`에 BULK INSERT
- `user_id`/`class_id`는 미들웨어 컨텍스트에서 자동 주입
- `user_agent`는 헤더에서 채취 (앞 200자만)
- 100건 이상 한 번에 들어오면 거부 (`validation_error`)

---

## 10. 표준 이벤트 키 (event_logs)

클라이언트에서 발생시켜야 하는 이벤트. **새 키 추가 시 본 표 업데이트 필수.**

### 인증
| 키 | payload | 발생 시점 |
|---|---|---|
| `auth.signup` | `{ role }` | 회원가입 성공 |
| `auth.login` | — | 로그인 성공 |
| `auth.logout` | — | 로그아웃 |

### 화면/내비게이션
| 키 | payload | 발생 시점 |
|---|---|---|
| `screen.viewed` | `{ screen, fromScreen?, params? }` | 모든 라우트 변경 |
| `app.opened` | `{ source }` | 앱 첫 진입 (PWA 실행 등) |
| `app.backgrounded` | `{ durationMs }` | 백그라운드 전환 |

### 채굴
| 키 | payload | 발생 시점 |
|---|---|---|
| `mine.attempted` | `{ actionId }` | 채굴 버튼 탭 |
| `mine.success` | `{ actionId, coinReward, carbonSavedG, miningId }` | 서버 200 |
| `mine.daily_limit_hit` | `{ actionId }` | 서버 429 |

### 보상
| 키 | payload | 발생 시점 |
|---|---|---|
| `reward.viewed` | `{ rewardId }` | 보상 카드 상세 진입 |
| `reward.requested` | `{ rewardId, costCoins, requestId }` | 신청 성공 |
| `reward.cancelled` | `{ requestId }` | 본인 취소 |
| `reward.approved` | `{ requestId, approver }` | 교사/꼬마관리자 승인 |
| `reward.rejected` | `{ requestId, reason }` | 거절 |

### 설문/퀴즈
| 키 | payload | 발생 시점 |
|---|---|---|
| `survey.opened` | `{ surveyId, type, trigger }` | 설문 시작 |
| `survey.question_answered` | `{ surveyId, questionId, durationMs }` | 문항 답변 (선택적) |
| `survey.submitted` | `{ surveyId, responseId, durationMs }` | 제출 |
| `survey.skipped` | `{ surveyId, reason }` | 건너뛰기 |
| `quiz.started` | `{ surveyId }` | 퀴즈 시작 |
| `quiz.answered` | `{ surveyId, questionId, isCorrect }` | 퀴즈 문항 답변 |
| `quiz.completed` | `{ surveyId, score, total, coinsAwarded }` | 퀴즈 완료 |

### 미션 / 뱃지
| 키 | payload | 발생 시점 |
|---|---|---|
| `mission.viewed` | `{ missionId }` | 미션 상세 진입 |
| `mission.completed` | `{ missionId, rewardCoins }` | 목표 달성 (서버 발행) |
| `badge.earned` | `{ badgeId, code }` | 뱃지 획득 (서버 발행) |

### 오류 / 진단
| 키 | payload | 발생 시점 |
|---|---|---|
| `error.client` | `{ message, stack?, screen? }` | 클라이언트 예외 |
| `error.api` | `{ endpoint, status, code }` | API 비2xx |

---

## 11. 미들웨어 / 권한 헬퍼

### `authMiddleware` (모든 보호 라우트)
```ts
// JWT 검증 → c.set('userId', ...), c.set('roles', [...]), c.set('classIds', [...])
// 실패: 401 unauthorized
```

### 권한 헬퍼
```ts
inClass(c, classId): boolean         // 학생 또는 교사 또는 꼬마관리자
isTeacherOf(c, classId): boolean
isHelperOf(c, classId): boolean
isStudentOf(c, classId): boolean
canApproveRewards(c, classId): boolean  // teacher OR helper
```

---

## 12. 클라이언트 헬퍼 계약

### `src/lib/api.ts` (fetch 래퍼)
```ts
const api = {
  get<T>(path, params?): Promise<T>,
  post<T>(path, body?): Promise<T>,
  patch<T>(path, body?): Promise<T>,
  delete<T>(path): Promise<T>,
};
// - 자동으로 Authorization 헤더 첨부
// - 401 시 refresh 1회 시도, 실패 시 로그아웃
// - 비2xx 시 ApiError 발생 (code 포함)
```

### `src/lib/track.ts` (이벤트 로깅)
```ts
function track(eventKey: string, payload?: object): void
// - 메모리 큐에 push
// - 5초 타이머 OR 큐 길이 ≥ 10이면 flush
// - flush: POST /api/logs/batch
// - 실패 시 localStorage에 보관, 다음 부팅에 재전송
// - sessionId는 sessionStorage에 영속 (탭 단위)
```

### `src/lib/auth.ts`
```ts
function getToken(): string | null      // localStorage
function setSession(token, refresh): void
function clearSession(): void
const useAuth = () => ({ user, login, logout, signup })
```

---

## 13. 페이징 / 정렬 표준

목록 엔드포인트는 다음 쿼리 파라미터를 따릅니다:

| 파라미터 | 기본 | 의미 |
|---|---|---|
| `limit` | 50 | 1–200 |
| `cursor` | — | 다음 페이지 토큰 (서버 발급) |
| `sort` | 엔드포인트별 | 허용 필드 명시 |
| `order` | `desc` | `asc | desc` |

응답에 `nextCursor` 포함, 더 이상 없으면 null.

---

> 📌 본 문서는 Claude Code의 1차 입력 명세입니다. 신규 엔드포인트 추가 시 본 문서 갱신 → 마이그레이션 → 구현 순서를 따릅니다.
