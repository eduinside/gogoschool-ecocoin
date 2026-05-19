# EcoinClass v2 — Claude Code 인계 패키지

> **목적:** 디자인·기획·DB 설계가 완료된 본 저장소를 Claude Code가 이어받아 백엔드/프론트엔드 구현을 시작할 수 있도록 안내합니다.  
> **작성일:** 2026-05-05  
> **인계 대상:** Claude Code (또는 다른 개발 에이전트/엔지니어)

---

## 0. 한 페이지 요약

| 항목 | 내용 |
|---|---|
| **프로젝트** | EcoinClass v2 — 초등학생용 친환경 학급 미시 경제 플랫폼 |
| **스택** | Cloudflare Pages + Functions (Hono) + D1 (SQLite) + KV |
| **인증** | 자체 JWT (HS256, PBKDF2 비밀번호) |
| **클라이언트** | React 18 + Vite |
| **DB** | 16개 테이블 (코어 12 + event_logs + 설문 4) |
| **API** | 25개 엔드포인트 명세 완료 |
| **연구 인프라** | event_logs append-only + 설문/퀴즈 모듈 |

---

## 1. 인계 산출물 목록

### 1.1 디자인 (✅ 완료)

| 파일 | 설명 |
|---|---|
| `EcoinClass.html` | 14개 화면 디자인 캔버스 (학생 9 + 교사 모바일 4 + 데스크톱 1) |
| `tokens.css` | 디자인 토큰 (Pretendard, oklch 그린 팔레트, radii, shadows) |
| `primitives.jsx` | 공유 컴포넌트 (로고/코인/스탯/아바타) |
| `student-screens.jsx` | 학생 모바일 5종 |
| `teacher-screens.jsx` | 교사 모바일 2 + 데스크톱 1 |
| `extra-screens.jsx` | 추가 6종 (회원가입/내역/뱃지/리포트/관리) |

### 1.2 기획 문서 (✅ 완료)

| 파일 | 우선 읽을 것 | 설명 |
|---|---|---|
| `README.md` | 1순위 | 프로젝트 소개, 빠른 시작 |
| `CLAUDE.md` | **필독** | 코드 컨벤션, 7개 절대 금지, 에러 코드 표, 로깅·설문 원칙 |
| `API-Spec.md` | **필독** | 25개 엔드포인트, 표준 이벤트 키 (~25개), 클라이언트 계약 |
| `D1-Migration-Plan.md` | 2순위 | RLS 대체 전략, 채굴 batch 패턴 |
| `Project-Status.md` | 3순위 | 진행 현황, 6일 로드맵, 미결정 사항 |
| `Handoff-Guide.md` | 본 문서 | 인계 안내 |

### 1.3 DB 마이그레이션 (✅ 완료)

| 파일 | 설명 |
|---|---|
| `migrations/0001_init.sql` | 16개 테이블 생성 (`users`, `profiles`, `user_roles`, `classes`, `class_members`, `eco_actions`, `mining_records`, `rewards`, `reward_requests`, `missions`, `badges`, `user_badges`, `transactions`, `event_logs`, `surveys`, `survey_questions`, `survey_responses`, `survey_answers`, `_migrations`) |
| `migrations/0002_seed.sql` | 환경행동 8 + 보상 6 + 뱃지 9 + 사전설문 4문항 + 환경퀴즈 5문항 |

### 1.4 인프라 스캐폴드 (✅ 완료)

| 파일 | 설명 |
|---|---|
| `wrangler.toml` | Pages + D1 + KV 바인딩 (3곳에 ID 채우기 필요) |
| `package.json` | Hono + React + Vite + 편의 스크립트 (db:reset:local 등) |
| `tsconfig.json` | strict + noUncheckedIndexedAccess + 경로 별칭 |
| `.env.example` | 시크릿/바인딩 ID 템플릿 |
| `.gitignore` | `.env`, `.wrangler/` 등 |

---

## 2. 인계 후 첫 명령 (Setup)

```bash
# 1) 의존성 설치
npm install

# 2) Cloudflare 리소스 생성
wrangler d1 create ecoinclass-db
wrangler kv:namespace create SESSIONS
wrangler kv:namespace create SESSIONS --preview

# 3) 출력된 ID 3개를 wrangler.toml의 REPLACE_WITH_* 자리에 기입
#    - database_id (D1)
#    - id (KV SESSIONS)
#    - preview_id (KV SESSIONS preview)

# 4) JWT 시크릿 등록
openssl rand -base64 48 | wrangler secret put JWT_SECRET
# 운영에도: wrangler secret put JWT_SECRET --env production

# 5) 마이그레이션 + 시드 (로컬)
wrangler d1 execute ecoinclass-db --local --file=./migrations/0001_init.sql
wrangler d1 execute ecoinclass-db --local --file=./migrations/0002_seed.sql

# 6) 동작 확인
wrangler d1 execute ecoinclass-db --local --command "SELECT count(*) FROM eco_actions"
# → 8 (글로벌 환경 행동)

# 7) 개발 서버
npm run dev
```

---

## 3. 권장 구현 순서 (6일 로드맵)

| 일차 | 작업 | 산출 파일 |
|---|---|---|
| **Day 1** | `_lib` 헬퍼 6종 + 인증 3종 | `functions/api/_lib/{types,auth,middleware,db,logger,validators}.ts`, `functions/api/auth/{signup,login,me}.ts` |
| **Day 2** | 채굴 + 학급 + 환경행동 | `functions/api/mine.ts`, `functions/api/classes/...` |
| **Day 3** | 보상 신청/승인/거절 (escrow) + 미션 | `functions/api/rewards/...`, `functions/api/missions/...` |
| **Day 4** | 뱃지 + 통계 + 설문/퀴즈 | `functions/api/badges.ts`, `functions/api/stats/...`, `functions/api/surveys/...` |
| **Day 5** | 이벤트 로그 + 클라이언트 통합 (api.ts, track.ts, auth.ts) | `functions/api/logs/batch.ts`, `src/lib/...` |
| **Day 6** | 배포 + 도메인 + 베타 QA | — |

---

## 4. Claude Code 첫 프롬프트 (복붙)

```
CLAUDE.md, API-Spec.md, migrations/0001_init.sql 을 먼저 읽어줘.

그 다음 functions/api/_lib/ 디렉토리에 다음을 만들어줘:
- types.ts — Env(D1, KV, JWT_SECRET), Vars(userId, roles, classIds), 공통 타입
- auth.ts — JWT HS256 sign/verify, PBKDF2 hashPassword/verifyPassword (Web Crypto)
- middleware.ts — authMiddleware (Bearer 검증 → ctx 주입) + 권한 헬퍼 (inClass, isTeacherOf, isHelperOf, isStudentOf, canApproveRewards)
- db.ts — newId(), nowMs(), todayKey() (UTC+9 기준 "YYYY-MM-DD")
- logger.ts — logEvent(c, eventKey, payload?) — event_logs 단건 INSERT
- validators.ts — 공통 zod 스키마 (email, password, joinCode, uuid)

CLAUDE.md의 절대 금지 사항과 코드 컨벤션을 반드시 준수해줘.
```

이후 작업도 같은 패턴으로:

> `API-Spec.md` §1.1의 `POST /api/auth/signup` 을 `functions/api/auth/signup.ts`로 구현해줘. D1 batch로 users + profiles + user_roles + class_members(학생만) INSERT.

---

## 5. 미결정 사항 (인계받는 쪽이 결정 필요)

| # | 항목 | 옵션 | 추천 |
|---|---|---|---|
| 1 | 학급 생성 시 글로벌 환경행동 자동 복제 여부 | A: 학급 생성 시 fork / B: 글로벌만 사용 + 학급 추가 행동만 별도 | A (커스터마이징 자유도) |
| 2 | 꼬마관리자 권한 범위 | 보상 승인 ✅ / 미션 업데이트 ✅ / 학급 설정 ❌ | 좌측 그대로 |
| 3 | 데이터 보존 정책 | 학기 종료 시 `mining_records` 보존 + `total_*` 리셋 | 좌측 그대로 |
| 4 | IRB / 연구 동의 | 익명(`is_anonymous=1`) vs 식별 분리 정책 | 학교/학부모 동의서 별도 |
| 5 | event_logs 보존 기간 | 무기한 vs 학년도 단위 익명화 | 학년도 단위 익명화 권장 |
| 6 | 폴링 주기 | 보상 큐 5초 / 학급 통계 30초 | 좌측 그대로 |

---

## 6. 절대 잊지 말 것

CLAUDE.md에 명시된 7개 금지 사항 재확인:

1. ❌ 권한을 `profiles`에 저장 금지 — 반드시 `user_roles`
2. ❌ 클라이언트 권한 신뢰 금지 — 미들웨어에서만 검사
3. ❌ `mining_records`/`event_logs` UPDATE/DELETE 금지 (append-only)
4. ❌ 비밀번호 평문 저장/로깅 금지
5. ❌ JWT 시크릿 하드코딩 금지 — `c.env.JWT_SECRET`
6. ❌ `profiles.total_coins`를 신뢰 원본 금지 — 집계가 진실
7. ❌ D1 쿼리 문자열 보간 금지 — `prepare().bind()`

---

## 7. 디자인 → 구현 매핑

각 화면이 어떤 API를 사용하는지:

| 화면 | 주요 API |
|---|---|
| 01 랜딩 | — |
| 02 학생 홈 | `GET /api/auth/me`, `GET /api/classes/:id/eco-actions`, `GET /api/classes/:id/missions` |
| 03 채굴 성공 | `POST /api/mine` (응답 그대로 표시) |
| 04 보상 교환소 | `GET /api/classes/:id/rewards`, `POST /api/rewards/:id/request` |
| 05 리더보드 | `GET /api/classes/:id/students?sort=coins` |
| 06 회원가입 | `POST /api/auth/signup`, `POST /api/auth/login` |
| 07 내 요청 내역 | `GET /api/reward-requests?userId=me`, `POST /api/reward-requests/:id/cancel` |
| 08 뱃지 컬렉션 | `GET /api/badges` |
| 09 월간 리포트 | `GET /api/stats/me?month=...` |
| 10 교사 홈 | `GET /api/stats/class/:id`, `GET /api/reward-requests?status=pending` |
| 11 학급 관리 | `GET /api/classes/:id/students`, `POST /api/classes/:id/helpers` |
| 12 환경행동 관리 | `GET/POST/PATCH/DELETE /api/eco-actions` |
| 13 학급 미션 관리 | `GET/POST/PATCH/DELETE /api/missions` |
| 14 데스크톱 대시보드 | 위 교사용 API 통합 |

추가 (디자인 미작성, 구현 시 만들 화면):
- **설문/퀴즈 진행 화면** — `GET /api/surveys/:id` → `POST /api/survey-responses/:id/submit`
- **퀴즈 결과 화면** — submit 응답으로 정답·점수·획득 코인 표시
- **교사용 설문 분석** — `GET /api/surveys/:id/analytics`

---

## 8. 테스트 우선순위

새 API 추가 시 **최소 2개**:

1. Happy path (정상 응답 + 사이드 이펙트 검증)
2. 권한 거부 (403) 또는 검증 실패 (400)

추가 권장:
- `POST /api/mine` — 일일 한도 초과 (429)
- `POST /api/rewards/:id/request` — 코인 부족 (400)
- `POST /api/surveys/:id/submit` — 재응답 불가 케이스 (403)
- `event_logs` BULK INSERT — 100건 초과 거부

---

## 9. 배포 체크리스트

운영 전 확인:

- [ ] `wrangler.toml`의 `[env.production]` 섹션 완성
- [ ] `wrangler secret put JWT_SECRET --env production` 실행
- [ ] `wrangler d1 execute ecoinclass-db --remote --file=./migrations/0001_init.sql`
- [ ] `wrangler d1 execute ecoinclass-db --remote --file=./migrations/0002_seed.sql`
- [ ] 도메인 연결 (Cloudflare Pages 대시보드)
- [ ] Cloudflare Analytics 활성화
- [ ] 백업: D1 export 주간 cron 설정
- [ ] CORS / CSP 헤더 (`functions/_middleware.ts`)
- [ ] Rate limiting (특히 `/api/auth/login`, `/api/logs/batch`)

---

## 10. 연락 / 컨텍스트

- **디자인 의도/제약:** `EcoinClass.html` 의 디자인 캔버스 — 풀스크린 포커스 모드로 각 화면 확인 가능
- **운영 중 v1:** Lovable + Supabase (참고만, 마이그레이션 데이터는 별도 ETL 필요)
- **타깃 사용자:** 초등학교 4–6학년 + 담임교사
- **연구 목적:** 학생 활동 로그 + 사전·사후 설문으로 환경 인식 변화 측정

---

> 📌 **핵심 한 줄:** `CLAUDE.md` + `API-Spec.md` + `migrations/0001_init.sql` 세 파일이면 80% 구현 가능합니다. 나머지는 디자인 캔버스를 보면서 클라이언트만 붙이면 됩니다.
