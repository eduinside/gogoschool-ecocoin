# 🌱 EcoinClass v2

> **친환경 학급 미시 경제 시스템** — 초등학생의 환경 행동을 Eco-Coin으로 보상하고 거래하는 교실 단위 플랫폼
>
> v1 (Lovable + Supabase) → **v2 (Cloudflare Pages + D1)** 재설계 진행 중

---

## ✨ 한 줄 소개

잔반 줄이기, 분리배출, 소등 같은 일상의 환경 행동을 **Eco-Coin**으로 환산해 보상하고, 학급 친구들과 함께 코인을 모으거나 보상으로 교환할 수 있는 **초등학교 친화 미시 경제 시뮬레이션**입니다.

---

## 📐 디자인 미리보기

`EcoinClass.html`을 브라우저에서 열면 **14개 화면**의 디자인 캔버스를 확인할 수 있습니다.

| 카테고리 | 화면 |
|---|---|
| 학생 (모바일) | 랜딩 · 홈/채굴 · 채굴 성공 · 보상 교환소 · 리더보드 · 회원가입 · 내 요청 · 뱃지 · 월간 리포트 |
| 교사 (모바일) | 홈/현황 · 학급 관리 · 환경 행동 관리 · 학급 미션 관리 |
| 교사 (데스크톱) | 풀 대시보드 |

**디자인 시스템:**
- 타입: Pretendard (한글)
- 색상: 그린 단일 chroma (`oklch(0.62 0.14 150)`)
- Tweaks 패널: 강조 색상 Hue / 폰트 크기 실시간 조정

---

## 🏗 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Pages  ─ 정적 SPA (React)                    │
│        │                                                 │
│        │ fetch /api/*                                    │
│        ▼                                                 │
│  Pages Functions = Workers + Hono 라우터                 │
│   ├─ JWT 미들웨어 (인증)                                 │
│   ├─ 권한 체크 (RLS 대체)                                │
│   └─ 비즈니스 로직                                       │
│        │                                                 │
│        ▼                                                 │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ D1 (SQLite)  │  │ KV (세션)    │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

| 영역 | 기술 |
|---|---|
| 배포 | **Cloudflare Pages** |
| API 런타임 | **Pages Functions + [Hono](https://hono.dev/)** |
| 데이터베이스 | **Cloudflare D1** (SQLite) |
| 세션/캐시 | **Cloudflare KV** |
| 인증 | **자체 JWT** (PBKDF2 + Web Crypto API) |
| 프론트엔드 | React 18 (HTML 프로토타입) → Vite 번들로 전환 예정 |
| 실시간 | HTTP 폴링 (5–30초) |

---

## 🚀 빠른 시작 (개발자용)

### 사전 요구
- Node.js 20+
- Cloudflare 계정 + Wrangler CLI (`npm i -g wrangler`)

### 셋업

```bash
# 1. 의존성 설치
npm install

# 2. D1 데이터베이스 생성 (최초 1회)
wrangler d1 create ecoinclass-db
# 출력된 database_id를 wrangler.toml에 붙여넣기

# 3. KV namespace 생성
wrangler kv:namespace create SESSIONS

# 4. 마이그레이션 적용
wrangler d1 execute ecoinclass-db --file=./migrations/0001_init.sql
wrangler d1 execute ecoinclass-db --file=./migrations/0002_seed.sql

# 5. JWT 시크릿 등록
wrangler secret put JWT_SECRET

# 6. 로컬 개발
wrangler pages dev ./dist --d1=DB --kv=SESSIONS

# 7. 프로덕션 배포
wrangler pages deploy ./dist
```

### 디자인 프로토타입만 보기
브라우저에서 `EcoinClass.html`을 직접 열면 됩니다 (서버 불필요).

---

## 📂 프로젝트 구조

```
ecoinclass/
├─ EcoinClass.html              # 디자인 캔버스 (14개 화면)
├─ tokens.css                   # 디자인 토큰
├─ primitives.jsx               # 공유 컴포넌트
├─ student-screens.jsx          # 학생 화면
├─ teacher-screens.jsx          # 교사 화면
├─ extra-screens.jsx            # 추가 화면 (회원가입, 뱃지 등)
├─ design-canvas.jsx            # 디자인 캔버스 래퍼
├─ tweaks-panel.jsx             # 실시간 토글 패널
│
├─ migrations/                  # 🚧 작업 예정
│  ├─ 0001_init.sql            # D1 스키마
│  └─ 0002_seed.sql            # 기본 환경 행동/보상/뱃지
│
├─ functions/api/               # 🚧 작업 예정 (Pages Functions)
│  ├─ _middleware.ts           # JWT + 권한
│  ├─ auth/[signup|login|me].ts
│  ├─ mine.ts                  # 채굴 (배치 트랜잭션)
│  ├─ classes/[id]/...
│  └─ rewards/[index|requests].ts
│
├─ src/                         # 🚧 클라이언트 (Vite로 전환 예정)
│  ├─ lib/api.ts               # fetch 래퍼
│  └─ ...
│
├─ wrangler.toml                # 🚧 Cloudflare 바인딩
├─ Project-Status.md            # 진행 상황 + TODO
├─ D1-Migration-Plan.md         # DB 재설계 상세 가이드
└─ README.md                    # (이 파일)
```

---

## 🔑 핵심 개념

### Eco-Coin 환율
```
탄소 절감량 10g = 1 Eco-Coin
```

### 환경 행동 (8종 기본)
🍽️ 잔반 남기지 않기 · 🥛 우유팩 분리배출 · 📄 이면지 활용 · 🥤 개인 컵 · 💡 소등 · 💧 절수 · 🚶 계단 · 🛍️ 장바구니

### 보상 (6종 기본)
🪑 자리 바꾸기권 · 🍱 급식 우선권 · 📝 숙제 면제권 · 📚 자유 독서 · 🌳 나무 심기 기부 · ⭐ 친환경 스티커

### 에코 레벨
🌱 새싹(0g) → 🌿 풀잎(10kg) → 🌳 나무(30kg) → 🌍 지구지킴이(80kg) → 🦸 에코히어로(150kg)

> 레벨은 누적 탄소 기준 — 코인을 사용해도 떨어지지 않습니다.

### 권한 4단계
**Super Admin** > **Teacher** > **Mini Admin (꼬마관리자)** > **Student**

---

## 🔒 보안 설계

### RLS 대체 — 미들웨어 권한 체크
Postgres RLS는 D1에 없으므로, Hono 미들웨어가 모든 요청에서:
1. JWT 검증 → `userId` 추출
2. `user_roles` + `class_members` 조회 → 컨텍스트 주입
3. 라우트마다 `inClass(classId)` / `hasRole('teacher')` 검사

### 권한 분리
권한은 **`profiles`가 아닌 별도 `user_roles` 테이블**에 저장 — 권한 상승(privilege escalation) 공격 방지.

### 채굴 원자성
`mining_records INSERT` + `profiles UPDATE` + `transactions INSERT`를 **D1 `batch()` 단일 트랜잭션**으로 처리.

---

## 📊 v2 진행 현황

| 영역 | 상태 |
|---|---|
| 디자인 시스템 + 토큰 | ✅ 완료 |
| 14개 UI 프로토타입 | ✅ 완료 |
| D1 스키마 설계 | ✅ 완료 |
| 인증 방식 결정 | ✅ 자체 JWT |
| `migrations/*.sql` 파일 작성 | ⏳ 다음 |
| `functions/api/*` 구현 | ⏳ 대기 |
| 클라이언트 통합 | ⏳ 대기 |
| Cloudflare Pages 배포 | ⏳ 대기 |

상세 TODO는 [`Project-Status.md`](./Project-Status.md) 참조.

---

## 🛣 로드맵 — 6일 풀타임

| 일차 | 작업 |
|---|---|
| **Day 1** | D1 스키마 적용 + 시드 데이터 + Wrangler 설정 |
| **Day 2** | 자체 JWT 인증 (signup/login/me) + 미들웨어 |
| **Day 3** | 채굴 + 학급/학생 조회 API |
| **Day 4** | 보상 요청/승인 + 학급 미션 |
| **Day 5** | 클라이언트 통합 + 폴링 + 에러 처리 |
| **Day 6** | 배포 + 도메인 + 베타 QA |

### v2 이후 (P3)
- 학부모 뷰 (자녀 활동 요약)
- 학급 간 챌린지
- CSV/PDF 리포트 내보내기
- PWA + 푸시 알림

---

## 📚 문서

| 문서 | 내용 |
|---|---|
| [`Project-Status.md`](./Project-Status.md) | 현재 진행 + 차주 TODO |
| [`D1-Migration-Plan.md`](./D1-Migration-Plan.md) | Supabase → D1 재설계 상세 |
| `EcoinClass.html` | 14개 화면 디자인 캔버스 |

---

## 💚 가치 키워드

- **가시성** — 탄소 절감을 g 단위로 환산해 차트로 보여줌
- **즉각성** — 행동 직후 채굴 애니메이션 + 코인 즉시 지급
- **자율성** — 학생이 직접 보상 선택, 코인 사용처 결정
- **공동체성** — 학급 미션, 리더보드, 기부권
- **권한 위임** — 꼬마관리자 제도로 학생 자치 경험

---

## 📮 문의

- v1 운영: https://ecoinclass.lovable.app
- v2 개발: 본 저장소

> 🌱 *"작은 실천이 모여 지구를 지킵니다."*
