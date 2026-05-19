# EcoinClass — 개발 상황 & 로드맵

> **버전:** 2.0 (재설계)  
> **작성일:** 2026-05-05  
> **목표:** Lovable + Supabase 기반 v1을 Cloudflare Pages + D1 기반 v2로 이전

---

## 1. 한눈에 보기

```
┌──────────────────────────────────────────────────────────────┐
│  v1 (운영 중)                  →  v2 (재설계)                 │
│  Lovable.app + Supabase           Cloudflare Pages + D1       │
│  React + shadcn/ui                React (HTML 프로토타입)     │
│  RLS + Realtime                   Hono 미들웨어 + 폴링        │
└──────────────────────────────────────────────────────────────┘
```

| 영역 | v1 상태 | v2 진행도 |
|---|---|---|
| 디자인 시스템 | shadcn/ui (Tailwind) | ✅ 신규 토큰 정의 (`tokens.css`) |
| UI 프로토타입 | 운영 중 | ✅ 14개 화면 완성 |
| DB 스키마 | Postgres 12 테이블 | ✅ **D1 스키마 + SQL 파일 작성 완료** (연구 로그·설문 모듈 포함, 16개 테이블) |
| API 레이어 | Supabase 자동 생성 | ⏳ Hono 라우터 미작성 |
| 인증 | Supabase Auth | ✅ 자체 JWT 결정 (구현 대기) |
| 배포 | Lovable 호스팅 | ⏳ Cloudflare Pages 미설정 |
| 연구 로그 | 없음 | ✅ `event_logs` 테이블 + `track()` 헬퍼 명세 |
| 설문/퀴즈 | 없음 | ✅ 4개 테이블 + 사전설문/환경퀴즈 시드 완료 |
| Claude Code 가이드 | — | ✅ `CLAUDE.md` 작성 완료 |

---

## 2. 디자인 진행 상황

### 2.1 완성된 프로토타입 (`EcoinClass.html`)

총 **14개 아트보드** — 디자인 캔버스에서 패닝/줌 + 풀스크린 포커스 가능

#### 학생 (모바일, 9종)
| # | 화면 | 핵심 |
|---|---|---|
| 01 | 랜딩 | 친근한 카피 + 추상 SVG 일러스트, 시작하기/체험 모드 |
| 02 | 학생 홈 | 코인 히어로 카드, 레벨 진행, 환경 행동 그리드, 학급 미션 미리보기 |
| 03 | 채굴 성공 | 큰 글리프 애니메이션, 코인/탄소 증감, 친근한 한 줄 설명 |
| 04 | 보상 교환소 | 카테고리 칩, 카드 그리드, 구매 가능 여부 표시 |
| 05 | 학급 리더보드 | Top 3 포디움 + 전체 순위 |
| 06 | 회원가입 | 학생/교사 역할 선택, 학급 코드 입력 |
| 07 | 내 요청 내역 | 대기/승인/거절 탭, 거절 사유 인라인 표시 |
| 08 | 뱃지 컬렉션 | 9종 뱃지, 획득/미획득 상태 |
| 09 | 월간 리포트 | 일별 막대 차트 + 카테고리 도넛 |

#### 교사 (모바일, 4종)
| # | 화면 | 핵심 |
|---|---|---|
| 10 | 교사 홈 | 4종 통계, 7일 스파크라인, 보상 승인 즉시 처리 카드 |
| 11 | 학급 관리 | 학급 코드 발급, 꼬마관리자 ★ 토글, 학생 목록 |
| 12 | 환경 행동 관리 | 토글/코인/탄소/한도 인라인 편집 |
| 13 | 학급 미션 관리 | 진행률, D-day, 완료 상태, 수정/종료 |

#### 교사 (데스크톱, 1종)
| # | 화면 | 핵심 |
|---|---|---|
| 14 | 풀 대시보드 | 사이드바 네비, 4종 통계, 승인 큐, 미니 리더보드, 14일 차트 |

### 2.2 디자인 시스템 토큰 (`tokens.css`)

- **타입:** Pretendard (한글 친화) + SF Pro Rounded (숫자)
- **컬러:** 그린 단일 chroma 계열 (`oklch`)
  - Primary: `oklch(0.62 0.14 150)` (leaf)
  - Soft / Tint / Deep / Moss / Lime
  - 액센트: 코인 골드, 베리(거절)
- **반경:** 10 / 14 / 20 / 28
- **그림자:** 3단계 (`--shadow-1/2/3`)

### 2.3 Tweaks 패널

- 강조 색상 Hue 슬라이더 (90°–200°)
- 폰트 크기 스케일

---

## 3. 백엔드 재설계 (D1)

### 3.1 결정 사항

| 항목 | 선택 | 사유 |
|---|---|---|
| 호스팅 | **Cloudflare Pages** | 한국 latency, 무료 티어, D1과 통합 |
| DB | **Cloudflare D1 (SQLite)** | Pages와 같은 생태계, 비용 최소 |
| API 런타임 | **Pages Functions + Hono** | Workers 표준, 가벼움 |
| 세션 저장소 | **Cloudflare KV** | refresh token, 캐시 |
| 실시간 | **HTTP 폴링** (5–30초) | 학급당 30명 이하 → DO 불필요 |
| 인증 | **자체 JWT (MVP) → Clerk (운영)** | 결정 대기 중 |

### 3.2 D1 스키마 (12개 테이블)

작성 완료 (`D1-Migration-Plan.md` §3 참조). 핵심 변경:

- `uuid` → `TEXT PRIMARY KEY` + `crypto.randomUUID()`
- `timestamptz` → `INTEGER` (epoch ms)
- `enum` → `CHECK (col IN (...))`
- RLS → 미들웨어에서 `user.id`/`classIds` 컨텍스트 주입

### 3.3 RLS 대체 패턴

```ts
// 모든 보호된 라우트의 미들웨어
app.use('/api/*', authMiddleware);

// 라우트마다 inClass / hasRole 검사
app.get('/api/classes/:id/students', (c) => {
  if (!inClass(c, c.req.param('id'))) return c.json({error:'forbidden'}, 403);
  // ... WHERE class_id = ? 강제
});
```

### 3.4 채굴 원자성

Postgres `SECURITY DEFINER` RPC → D1 `batch()` 단일 트랜잭션:

```
mining_records INSERT
  + profiles UPDATE (코인/탄소 누적)
  + transactions INSERT (감사 로그)
```

---

## 4. 진행 중 / 차주 작업 (TODO)

### 4.1 즉시 필요 (P0 — 인프라)

- [ ] Cloudflare 계정 + Pages 프로젝트 생성
- [ ] D1 데이터베이스 생성 (`wrangler d1 create ecoinclass-db`)
- [ ] KV namespace 생성 (`SESSIONS`)
- [ ] `wrangler.toml` 작성
- [ ] **인증 방식 결정 (자체 JWT vs Clerk)**

### 4.2 백엔드 구현

#### ✅ P0 완료
- [x] **`CLAUDE.md`** — Claude Code 작업 가이드 (코드 컨벤션, 금지 사항, 로깅/설문 원칙)
- [x] **`migrations/0001_init.sql`** — 16개 테이블 (코어 12 + `event_logs` + 설문 4종)
- [x] **`migrations/0002_seed.sql`** — 환경행동 8 + 보상 6 + 뱃지 9 + 사전설문 4문항 + 환경퀴즈 5문항

#### ⏳ P1 (Claude Code로 진행 예정)
- [ ] `wrangler.toml` + `package.json` 스캐폴드
- [ ] `API-Spec.md` — 엔드포인트별 요청/응답/이벤트 키 표준 (~25개)
- [ ] `functions/api/_lib/` — auth/middleware/db/logger/types/validators
- [ ] `functions/api/auth/[signup|login|me].ts`
- [ ] `functions/api/mine.ts` — D1 batch() 트랜잭션
- [ ] `functions/api/classes/[id]/[students|missions].ts`
- [ ] `functions/api/rewards/[index|requests].ts`
- [ ] `functions/api/badges.ts`
- [ ] `functions/api/surveys/[index|[id]/responses].ts` — 설문/퀴즈 제출
- [ ] `functions/api/logs/batch.ts` — 클라이언트 이벤트 배치 수집
- [ ] `functions/api/analytics/*` — 교사용 집계 (응답률, 정답률, 카테고리별)

### 4.3 클라이언트 통합 (P1)

- [ ] `src/lib/api.ts` — fetch 래퍼, 토큰 자동 첨부
- [ ] 기존 `useEcoDatabase` 훅 → `lib/api.ts` 호출로 교체
- [ ] 에러 처리 (`429 daily_limit`, `403 forbidden` 토스트)
- [ ] 폴링 훅 (`usePollingQuery(key, interval)`)

### 4.4 운영 준비 (P2)

- [ ] 프로덕션 환경변수 (`JWT_SECRET` 등 `wrangler secret put`)
- [ ] 도메인 연결 (예: `ecoinclass.app`)
- [ ] 모니터링 (Cloudflare Analytics + Logs)
- [ ] 백업 전략 (D1 export 주간)
- [ ] 학교 1곳 대상 베타 테스트

### 4.5 v2 이후 추가 기능 (P3)

- [ ] Google Workspace SSO (학교 계정 로그인)
- [ ] 학부모 뷰 (자녀 활동 요약)
- [ ] 학급 간 챌린지
- [ ] 데이터 내보내기 (CSV/PDF 리포트)
- [ ] PWA + 푸시 알림 (보상 승인 시)

---

## 5. 작업 추정 — 6일 풀타임

| 일차 | 작업 |
|---|---|
| Day 1 | D1 스키마 적용 + 시드 + Wrangler 설정 |
| Day 2 | 인증 (signup/login/me) + 미들웨어 |
| Day 3 | 채굴 + 학급/학생 조회 API |
| Day 4 | 보상 요청/승인 + 학급 미션 |
| Day 5 | 클라이언트 통합 + 폴링 + 에러 처리 |
| Day 6 | 배포 + 도메인 + 베타 QA |

---

## 6. 산출물 위치

### 디자인
| 파일 | 설명 |
|---|---|
| `EcoinClass.html` | 14개 화면 디자인 캔버스 |
| `tokens.css` | 디자인 토큰 |
| `primitives.jsx` | 공유 컴포넌트 (로고/코인/스탯/아바타 등) |
| `student-screens.jsx` | 학생 모바일 5종 |
| `teacher-screens.jsx` | 교사 모바일 2종 + 데스크톱 1종 |
| `extra-screens.jsx` | 추가 6종 (회원가입/내역/뱃지/리포트/관리) |

### 개발 문서 (Claude Code 입력)
| 파일 | 설명 |
|---|---|
| `CLAUDE.md` | **Claude Code 자동 컨텍스트** — 코드 컨벤션, 금지 사항, 로깅·설문 원칙 |
| `README.md` | GitHub 루트 README |
| `Project-Status.md` | 본 문서 |
| `D1-Migration-Plan.md` | DB 마이그레이션 상세 가이드 |
| `migrations/0001_init.sql` | **16개 테이블 생성 SQL** (연구 로그·설문 포함) |
| `migrations/0002_seed.sql` | **시드 데이터** (환경행동·보상·뱃지·기본 설문/퀴즈) |

---

## 7. 미결정 사항

1. ~~**인증 방식**~~ — ✅ 자체 JWT (PBKDF2 + Web Crypto API)로 결정
2. **학급별 vs 글로벌 환경 행동** — readme는 "교사가 커스터마이징" 명시 → `eco_actions.class_id`로 fork 권장
3. **꼬마관리자 권한 범위** — 보상 승인 OK / 학급 미션 업데이트 OK / 학급 설정 변경 NO
4. **데이터 보존 정책** — 학기 종료 시 `mining_records` 보존 + `profiles.total_*` 리셋 (readme FAQ Q4)
5. **연구 동의(IRB)** — 익명 설문(`is_anonymous=1`)과 식별 설문(`=0`) 분리됨. 동의 플로우/보호자 동의서 필요 여부 검토
6. **이벤트 로그 보존 기간** — 무기한 vs 학년도 단위 익명화

---

## 8. 연구/분석 인프라 (신규)

### 8.1 이벤트 로그 (`event_logs`)
- **append-only**, PII는 `user_id`만 저장 (조인으로 해결)
- 클라이언트 `track()` 헬퍼 → 5초/10건 배치로 `POST /api/logs/batch` 전송
- 표준 이벤트 키: `<domain>.<action>` (`mine.success`, `survey.submitted`, `screen.viewed` 등)
- 분석 컬럼: `client_ts` + `server_ts` + `session_id` + `app_version` + `platform`

### 8.2 설문/퀴즈 (`surveys` / `survey_questions` / `survey_responses` / `survey_answers`)
- **유형:** survey(정답 없음) / quiz(정답 + 정답당 보상)
- **트리거:** `after_signup` / `after_n_minings` / `after_reward_used` / `weekly` / `manual` / `always_available`
- **문항 유형:** single/multi choice, likert 5/7, short/long text, number
- **익명 옵션:** `is_anonymous=1` 시 `user_id` 미기록 (사전·사후 비교용은 `=0`)
- **메트릭:** `duration_ms`, `correct_count/total_count`, `coins_awarded`, `trigger_context`
- **보상 흐름:** 채굴과 동일하게 `transactions(reference_type='survey')`로 기록

### 8.3 시드된 기본 설문
- `srv_pre_signup` — 가입 직후 사전 설문 (4문항: 환경 인식 2 + 행동 1 + 자유응답 1, 5코인)
- `qz_eco_basics` — 환경 상식 퀴즈 (5문항, 정답당 2코인, 재응답 가능)

---

> 📌 다음 액션: `API-Spec.md` 작성 → `wrangler.toml` 스캐폴드 → Claude Code 인계
