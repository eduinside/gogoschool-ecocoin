# 🌱 EcoinClass — 친환경 학급 미시 경제 시스템 종합 문서

> **버전:** 1.0  
> **작성일:** 2026-05-05  
> **서비스 URL:** https://ecoinclass.lovable.app  
> **대상:** 초등학교 교사, 학생, 학교 관리자

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [핵심 개념 — Eco-Coin 경제](#2-핵심-개념--eco-coin-경제)
3. [전체 시스템 아키텍처](#3-전체-시스템-아키텍처)
4. [백엔드 작동 방식](#4-백엔드-작동-방식)
5. [프론트엔드 작동 방식](#5-프론트엔드-작동-방식)
6. [사용자 권한 체계 (4단계)](#6-사용자-권한-체계-4단계)
7. [학생용 화면 상세 가이드](#7-학생용-화면-상세-가이드)
8. [교사용 화면 상세 가이드](#8-교사용-화면-상세-가이드)
9. [관리자(Super Admin) 화면](#9-관리자super-admin-화면)
10. [디자인 컨셉 & 디자인 시스템](#10-디자인-컨셉--디자인-시스템)
11. [기술 스택 & 사용된 라이브러리](#11-기술-스택--사용된-라이브러리)
12. [현재 이용 상황 (운영 데이터)](#12-현재-이용-상황-운영-데이터)
13. [처음 사용자를 위한 빠른 시작 가이드](#13-처음-사용자를-위한-빠른-시작-가이드)
14. [자주 묻는 질문 (FAQ)](#14-자주-묻는-질문-faq)

---

## 1. 프로젝트 개요

### 1.1 한 줄 소개

**EcoinClass**는 초등학생의 **생태 시민성(Eco-Citizenship)** 함양을 목적으로, 일상의 환경 행동(잔반 줄이기, 분리배출, 소등 등)을 **Eco-Coin**이라는 학급 내 가상 화폐로 환산해 보상하고 거래하는 **교실 단위 미시 경제 시뮬레이션 플랫폼**입니다.

### 1.2 기획 배경

- 환경 교육은 추상적 개념(탄소, 기후위기)이 많아 **실천과 동기부여**의 연결이 어려움
- 학생들의 작은 실천이 **수치화·시각화**되면 자기효능감(self-efficacy)이 크게 향상됨
- 학급 단위의 **경쟁·협력·기부** 메커니즘을 통해 사회적 학습이 동시에 이뤄짐

### 1.3 주요 가치

| 가치 | 구현 방식 |
|------|----------|
| **가시성(Visibility)** | 탄소 절감량을 g 단위로 환산 → 차트/리더보드로 시각화 |
| **즉각성(Immediacy)** | 행동 직후 채굴(Mining) 애니메이션 + 코인 즉시 지급 |
| **자율성(Autonomy)** | 학생이 직접 보상을 선택하고 코인을 어떻게 쓸지 결정 |
| **공동체성(Community)** | 학급 미션, 학급 나무, 리더보드, 기부권 |
| **권한 위임(Delegation)** | '꼬마관리자(Mini Admin)' 제도로 학생 자치 경험 |

---

## 2. 핵심 개념 — Eco-Coin 경제

### 2.1 환율 (Exchange Rate)

```
탄소 절감량 10g = 1 Eco-Coin
```

이 비율은 `src/data/eco-actions.ts`에서 `CARBON_TO_COIN_RATE = 10`으로 정의됩니다.

### 2.2 환경 행동 (Eco-Actions) — 채굴 가능한 활동

| 아이콘 | 행동 | 카테고리 | 탄소 절감 | 코인 |
|:---:|---|---|---:|---:|
| 🍽️ | 잔반 남기지 않기 | 음식 | 150g | 15 |
| 🥛 | 우유팩 분리배출 | 재활용 | 30g | 3 |
| 📄 | 이면지 활용 | 재활용 | 25g | 3 |
| 🥤 | 개인 컵 사용 | 재활용 | 50g | 5 |
| 💡 | 소등하기 | 에너지 | 40g | 4 |
| 💧 | 물 아껴쓰기 | 물 | 20g | 2 |
| 🚶 | 계단 이용하기 | 이동 | 35g | 4 |
| 🛍️ | 장바구니 사용 | 재활용 | 45g | 5 |

> 교사는 `환경 행동 관리(EcoActionManager)`에서 **항목 추가·수정·삭제·일일 한도 설정**이 가능합니다.

### 2.3 보상 (Rewards) — 코인 사용처

| 아이콘 | 보상 | 카테고리 | 비용 |
|:---:|---|---|---:|
| 🪑 | 자리 바꾸기권 | 권리(privilege) | 80 |
| 🍱 | 급식 우선권 | 권리 | 30 |
| 📝 | 숙제 면제권 | 권리 | 100 |
| 📚 | 자유 독서 시간 | 권리 | 20 |
| 🌳 | 나무 심기 기부 | 기부(donation) | 200 |
| ⭐ | 친환경 스티커 | 아이템(item) | 15 |

> 교육적 가치를 우선해 **권리형 보상**의 비중을 높였고, **고가치 권리(자리 바꾸기, 숙제 면제)**는 의도적으로 비싸게 설계되어 경제 균형을 유지합니다.

### 2.4 에코 레벨(Eco Level) — 누적 탄소 등급제

| 레벨 | 명칭 | 누적 탄소 절감 |
|:---:|---|---:|
| Lv.1 | 🌱 새싹 | 0g ~ |
| Lv.2 | 🌿 풀잎 | 10,000g (10kg) ~ |
| Lv.3 | 🌳 나무 | 30,000g (30kg) ~ |
| Lv.4 | 🌍 지구 지킴이 | 80,000g (80kg) ~ |
| Lv.5 | 🦸 에코 히어로 | 150,000g (150kg) ~ |

**중요:** 레벨은 누적 탄소 기준이므로 **코인을 사용해도 떨어지지 않습니다.**

---

## 3. 전체 시스템 아키텍처

```
┌────────────────────────────────────────────────────────────┐
│                      클라이언트 (브라우저)                    │
│   React 18 + Vite 5 + TypeScript 5 + Tailwind + shadcn/ui  │
│  ┌─────────────┬─────────────┬─────────────┬────────────┐  │
│  │  Landing    │   Auth      │  Dashboard  │   Admin    │  │
│  │  /          │  /auth      │  /dashboard │  /admin    │  │
│  └─────────────┴─────────────┴─────────────┴────────────┘  │
│              │ supabase-js (REST + Realtime)               │
└──────────────┼─────────────────────────────────────────────┘
               ▼
┌────────────────────────────────────────────────────────────┐
│              Lovable Cloud (Supabase 기반)                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │  Postgres    │ │     Auth     │ │  Edge Functions  │   │
│  │  + RLS       │ │  (이메일+OAuth)│ │  (서버리스)      │   │
│  └──────────────┘ └──────────────┘ └──────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │   RPC Functions: increment_profile_totals,          │ │
│  │   has_role, is_class_member, handle_new_user        │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 4. 백엔드 작동 방식

### 4.1 데이터베이스 스키마 (12개 테이블)

| 테이블 | 역할 | 주요 컬럼 |
|---|---|---|
| `profiles` | 사용자 프로필 | `user_id`, `name`, `email`, `total_coins`, `total_carbon_saved`, `class_name` |
| `user_roles` | 권한 (별도 테이블 필수) | `user_id`, `role` (enum: student/teacher/super_admin/mini_admin) |
| `classes` | 학급 | `teacher_id`, `name`, `join_code`(6자리) |
| `class_members` | 학급 소속 | `class_id`, `user_id` |
| `eco_actions` | 환경 행동 정의 | `action_key`, `name_ko`, `coin_value`, `carbon_reduction`, `daily_limit` |
| `mining_records` | 채굴 기록 (모든 통계의 원천) | `user_id`, `action_id`, `coins_earned`, `carbon_saved` |
| `transactions` | 거래 내역 | `type` (earn/spend/donate), `amount`, `status` |
| `rewards` | 보상 정의 | `name`, `cost`, `category`, `available` |
| `reward_requests` | 보상 신청 (교사 승인 대기) | `user_id`, `reward_id`, `status` (pending/approved/rejected) |
| `class_missions` | 학급 미션 | `title`, `target_value`, `current_value`, `status` |
| `badges` / `user_badges` | 업적 뱃지 | `condition_type`, `condition_value` |

### 4.2 보안 — RLS (Row Level Security)

모든 테이블에 RLS가 적용되며, **권한 검사는 `has_role()` 보안 정의자(SECURITY DEFINER) 함수**를 통해 무한 재귀를 방지합니다.

```sql
-- 핵심 권한 함수
CREATE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

**원칙:**
- 권한은 절대 `profiles` 테이블에 저장하지 않음 → 권한 상승(privilege escalation) 공격 방지
- 모든 권한 체크는 서버측 RLS에서 검증, 클라이언트 신뢰 금지

### 4.3 동시성 제어 — Atomic RPC

여러 학생이 동시에 채굴할 때 `profiles.total_coins`의 race condition을 방지하기 위해 원자적 증가 함수를 사용합니다.

```sql
CREATE FUNCTION increment_profile_totals(
  _user_id uuid, _coins integer, _carbon integer
) RETURNS void AS $$
  UPDATE profiles
  SET total_coins = total_coins + _coins,
      total_carbon_saved = total_carbon_saved + _carbon
  WHERE user_id = _user_id;
$$;
```

### 4.4 자동화 트리거

`handle_new_user()` — 신규 회원가입 시 자동으로:
1. `profiles` 레코드 생성 (이메일·이름 포함)
2. `user_roles`에 가입 시 선택한 역할(student/teacher) 자동 부여

### 4.5 데이터 일관성 원칙

- **모든 통계(차트, 리더보드, 학급 미션)는 `mining_records` 테이블을 직접 집계**
- `profiles.total_coins`는 빠른 조회용 캐시일 뿐, 신뢰 원본은 `mining_records`
- 이로써 잔액 불일치 디버깅이 쉬워지고 데이터 무결성이 확보됨

---

## 5. 프론트엔드 작동 방식

### 5.1 라우팅 구조 (`src/App.tsx`)

| 경로 | 컴포넌트 | 설명 |
|---|---|---|
| `/` | `Landing` | 첫 화면, 체험 모드 진입 |
| `/auth` | `Auth` | 로그인/회원가입 |
| `/dashboard` | `Index` | 역할에 따라 학생/교사 대시보드 분기 |
| `/admin` | `Admin` | 총관리자 전용 |
| `/my-requests` | `MyRequests` | 학생 보상 요청 내역 |
| `*` | `NotFound` | 404 |

### 5.2 핵심 훅 (Custom Hooks)

| Hook | 책임 |
|---|---|
| `useAuth` | 세션·프로필·역할(roles) 관리, signIn/signUp/signOut |
| `useEcoDatabase` | 채굴, 보상 신청, 학급 통계 집계, daily_limit 검증 |
| `useEcoCoin` | 데모 모드용 클라이언트 상태 |
| `useDemoMode` | 비로그인 체험 모드 플래그 |
| `useBadges` | 뱃지 획득 조건 평가 |
| `use-mobile` | 768px 미만 모바일 분기 |
| `use-toast` | 알림 토스트 |

### 5.3 인증 플로우

```
1. onAuthStateChange 리스너 등록 (먼저!)
2. getSession()으로 현재 세션 확인
3. 세션 있으면 setTimeout(0) → fetchUserData
   (Supabase deadlock 방지)
4. profiles + user_roles 병렬 조회
5. 역할 우선순위로 primaryRole 결정:
   super_admin > teacher > mini_admin > student
```

### 5.4 채굴 UX 최적화

```
canMine() → 일일 한도 빠른 체크 (DB read)
   ↓
mineAction() → mining_records insert (즉시 UI 반응)
   ↓
Promise.all([
  transactions insert,
  RPC: increment_profile_totals
]).then(refresh) ← 백그라운드 비동기
```

UI는 즉시 반응하고 부수 효과는 비동기로 처리해 **체감 지연 없는 채굴 경험**을 제공합니다.

---

## 6. 사용자 권한 체계 (4단계)

```
┌─────────────────────────────────────────────────────┐
│  1️⃣ Super Admin (총관리자)                          │
│     - 전체 시스템 조회                                │
│     - 교사 계정 승인/관리                              │
│     - 환경 행동/보상/뱃지 글로벌 설정                  │
├─────────────────────────────────────────────────────┤
│  2️⃣ Teacher (학급 관리자)                            │
│     - 담당 학급 운영                                 │
│     - 미션 설정, 보상 승인                             │
│     - 학생별 데이터 조회/초기화                         │
│     - 꼬마관리자 임명/해제                             │
├─────────────────────────────────────────────────────┤
│  3️⃣ Mini Admin (꼬마관리자)                          │
│     - 교사가 위임한 학생                              │
│     - 보상 요청 승인 가능                              │
│     - 미션 진행도 업데이트                             │
├─────────────────────────────────────────────────────┤
│  4️⃣ Student (학생)                                  │
│     - 환경 행동 채굴                                 │
│     - 보상 요청, 리더보드 조회                         │
└─────────────────────────────────────────────────────┘
```

---

## 7. 학생용 화면 상세 가이드

### 7.1 학생 대시보드 (`StudentDashboard.tsx`)

#### 상단 통계 카드 (`StatsCard`)
- 💰 **보유 코인** — 현재 사용 가능한 Eco-Coin
- 🌍 **누적 탄소 절감** — kg 단위 환산
- ⛏️ **총 채굴 횟수** — 활동 누계
- 🌱 **에코 레벨** — 현재 등급 + 다음 레벨까지 진행률

#### 채굴 영역 (`ActionCard`)
환경 행동 카드를 탭하면 → `MiningSuccess` 애니메이션 → 코인 + 탄소 표시
- **일일 한도(daily_limit)** 도달 시 카드 비활성화 + 안내 토스트

#### 학급 정보
- `Leaderboard` — 학급 내 코인 랭킹 (Top 10)
- `ClassMission` — 진행 중인 학급 미션 진행률 바
- `ClassChart` — 최근 5일 학급 채굴 추이 (라인 차트)

### 7.2 보상 교환소
- `RewardCard` — 코인으로 보상 신청
- 신청 시 코인 즉시 차감 → `pending` 상태로 교사 대기열에 진입
- **거절 시** 코인 자동 환불

### 7.3 내 아이템 / 요청 내역 (`/my-requests`, `MyRewards`)
- 승인된 보상은 "사용 가능 아이템"으로 보유
- pending / approved / rejected 상태별 탭

### 7.4 리포트 (`EcoReport`)
- 주간·월간 단위 개인 성취 리포트
- `MonthlyComparisonChart` — 월별 비교 (월간 vs 누적)
- `BadgeCollection` — 획득 뱃지 컬렉션

### 7.5 학생 사용 프로세스

```
회원가입(학생 선택) → 학급 코드 입력(JoinClass) → 대시보드
   ↓
환경 행동 실천 → 앱에서 채굴 → 코인 획득
   ↓
교환소에서 보상 신청 → 교사 승인 대기 → 보상 사용
```

---

## 8. 교사용 화면 상세 가이드

### 8.1 교사 대시보드 (`TeacherDashboard.tsx`)

#### 학급 통계 요약
- 학급 총 코인, 총 탄소 절감량, 활성 학생 수
- 보상 요청 대기 건수 알림 배지

#### 보상 요청 처리 (Pending Reward Requests)
- 학생명·요청 보상·요청 시각 표시
- ✅ 승인 / ❌ 거절(사유 입력) 즉시 처리
- 모바일에서는 카드 형태, 데스크톱에서는 테이블

#### 최근 활동 내역 (Recent History)
- 학급 내 최근 채굴/보상 거래 타임라인

### 8.2 학급 관리 (`ClassroomManager.tsx`)
- 학급 생성 → 6자리 `join_code` 자동 발급
- 학급원 목록: 이름, 이메일, 에코 레벨, 코인, 탄소 절감
- ⭐ 별 토글: 학생을 **꼬마관리자**로 임명/해제
- 학생 데이터 초기화(Reset) 기능

### 8.3 환경 행동 관리 (`EcoActionManager.tsx`)
- 행동 추가/수정/삭제
- 코인 가치, 탄소 절감, 카테고리, 일일 한도, 활성 토글 설정
- 모바일: 2행 카드(아이콘+이름 / 메타데이터) 레이아웃

### 8.4 학급 미션 관리 (`ClassMissionManager.tsx`)
- 미션 생성: 제목, 설명, 목표 코인/탄소, 보상 설명, 종료일
- 진행률 자동 집계 (mining_records 기반)
- 완료 시 학급 보상(예: 야외 수업, 영화 감상 등)

### 8.5 교사 사용 프로세스

```
회원가입(교사 선택) → 총관리자 승인 → 로그인
   ↓
학급 생성 → 학생에게 join_code 공유
   ↓
환경 행동 항목 커스터마이징 → 학급 미션 설정
   ↓
[일상 운영] 보상 요청 승인/거절, 학생 데이터 모니터링
   ↓
주기적으로 꼬마관리자 임명, 미션 종료/갱신
```

---

## 9. 관리자(Super Admin) 화면

`/admin` (`Admin.tsx`)

- **교사 계정 승인 큐** — 교사 회원가입 후 승인 대기 목록
- **전체 학급/학생/거래 통계**
- **글로벌 환경 행동·보상 설정**
- **뱃지 정의 관리**

---

## 10. 디자인 컨셉 & 디자인 시스템

### 10.1 컨셉 키워드
- 🌿 **자연 친화 (Eco-friendly)** — 그린 톤 그라디언트, 부드러운 곡선
- 👶 **초등학생 친화 (Kid-friendly)** — 큰 이모지, 둥근 모서리(rounded-xl), 직관적 아이콘
- ✨ **즉각적 피드백 (Delightful)** — 채굴 성공 애니메이션, 카운트업 효과
- 📱 **모바일 우선 (Mobile-first)** — 학생들의 주 사용 환경 고려

### 10.2 디자인 토큰 (`src/index.css`)

모든 색상은 **HSL 기반 시맨틱 토큰**으로 관리:

```css
:root {
  --background, --foreground
  --primary, --primary-foreground   /* 메인 그린 */
  --secondary, --muted, --accent
  --gradient-primary                /* 그라디언트 */
  --shadow-elegant                  /* 우아한 그림자 */
}
```

> 컴포넌트에서 `text-white`, `bg-black` 같은 직접 색상 사용 금지 → 항상 시맨틱 토큰 사용

### 10.3 컴포넌트 라이브러리
- **shadcn/ui** — Radix UI 기반 헤드리스 컴포넌트
- **Tailwind CSS** — 유틸리티 우선
- **Lucide React** — 아이콘
- **Recharts** — 차트

### 10.4 반응형 전략
- `sm:hidden` / `hidden sm:block` 패턴으로 모바일/데스크톱 레이아웃 분리
- 데이터 테이블 → 모바일에서 카드 스택으로 자동 변환
- `truncate`, `min-w-0`, `flex-wrap`으로 좁은 화면 대응

---

## 11. 기술 스택 & 사용된 라이브러리

### 11.1 핵심 스택

| 영역 | 기술 |
|---|---|
| **빌드** | Vite 5 |
| **언어** | TypeScript 5 |
| **프레임워크** | React 18 |
| **스타일** | Tailwind CSS v3 |
| **UI 컴포넌트** | shadcn/ui (Radix UI) |
| **백엔드** | Lovable Cloud (Supabase: Postgres + Auth + Edge Functions) |
| **상태 관리** | React Query (`@tanstack/react-query`) + Custom Hooks |
| **라우팅** | React Router DOM |
| **차트** | Recharts |
| **알림** | Sonner + shadcn Toaster |
| **아이콘** | Lucide React |
| **테스트** | Vitest |

### 11.2 디렉토리 구조

```
src/
├── components/        # 재사용 UI + 도메인 컴포넌트
│   ├── ui/           # shadcn/ui 원시 컴포넌트
│   ├── StudentDashboard.tsx
│   ├── TeacherDashboard.tsx
│   ├── ClassroomManager.tsx
│   ├── EcoActionManager.tsx
│   ├── ClassMissionManager.tsx
│   ├── ActionCard.tsx
│   ├── RewardCard.tsx
│   ├── Leaderboard.tsx
│   └── ...
├── pages/            # 라우트 페이지
├── hooks/            # 커스텀 훅
├── data/             # 정적 데이터 (기본 eco-actions, rewards)
├── types/            # TypeScript 타입 정의
├── integrations/
│   ├── supabase/     # 자동 생성 클라이언트 (편집 금지)
│   └── lovable/      # OAuth 헬퍼
└── lib/              # 유틸
```

---

## 12. 현재 이용 상황 (운영 데이터)

### 12.1 시스템 가동 현황
- ✅ **Lovable Cloud 활성** — Postgres + Auth + Realtime 동작 중
- ✅ **모바일 반응형 최적화 완료** (학생/교사 양 뷰)
- ✅ **랜딩 페이지 디자인 리뉴얼 완료**
- ✅ **꼬마관리자 권한 위임 시스템 가동 중**

### 12.2 콘텐츠 현황
- 기본 환경 행동: **8종**
- 기본 보상 항목: **6종** (권리 4 / 기부 1 / 아이템 1)
- 뱃지 카테고리: 마일스톤 / 카테고리별 / 특수 뱃지

### 12.3 보안 상태
- 모든 테이블 RLS 적용 완료
- 권한 분리(별도 `user_roles` 테이블) — 권한 상승 공격 방지
- 보안 정의자 함수로 무한 재귀 방지
- 세션 자동 갱신 활성

---

## 13. 처음 사용자를 위한 빠른 시작 가이드

### 13.1 학생용 (5분 안에 시작!)

#### Step 1 — 회원가입
1. https://ecoinclass.lovable.app 접속
2. **"시작하기"** 클릭 → **학생** 선택
3. 이메일 / 비밀번호 / 이름 입력 → 가입
4. (이메일 인증 필요 시) 메일함 확인

#### Step 2 — 학급 가입
1. 선생님께 받은 **6자리 학급 코드** 입력
2. 학급에 자동 합류

#### Step 3 — 첫 채굴!
1. 대시보드에서 오늘 실천한 **환경 행동 카드** 탭
2. 🎉 채굴 성공 애니메이션 → 코인 획득
3. 같은 행동은 하루 한도까지만 채굴 가능

#### Step 4 — 보상 받기
1. **교환소** 탭으로 이동
2. 원하는 보상 선택 → 신청
3. 선생님 승인 후 사용 가능 (`내 아이템` 탭에서 확인)

### 13.2 교사용

#### Step 1 — 회원가입 & 승인 대기
1. 가입 시 **교사** 역할 선택
2. 총관리자 승인 후 활성화 (학교 운영자에게 문의)

#### Step 2 — 학급 만들기
1. 로그인 → **학급 관리** 탭
2. **새 학급 만들기** → 학급 이름 입력
3. 생성된 **6자리 코드**를 학생들에게 공유

#### Step 3 — 환경 행동 커스터마이징 (선택)
- **환경 행동 관리**에서 우리 학급 상황에 맞게 조정
- 예: 우유급식이 없는 학급은 "우유팩 분리배출" 비활성화

#### Step 4 — 학급 미션 만들기 (선택)
- **학급 미션 관리**에서 공동 목표 설정
- 예: "한 달간 학급 전체 1만 코인 모으기 → 영화 감상"

#### Step 5 — 일상 운영
- 학생 보상 요청 **승인/거절** (대시보드 알림)
- 우수 학생을 **꼬마관리자**로 임명 (별 ⭐ 클릭) → 보상 승인 권한 위임

### 13.3 운영 팁

| 상황 | 권장 액션 |
|---|---|
| 학생들이 채굴에 흥미가 떨어질 때 | 새로운 환경 행동 추가, 학급 미션 갱신 |
| 코인 인플레이션이 발생할 때 | 보상 가격을 조금씩 인상 |
| 보상 승인이 부담될 때 | 꼬마관리자 임명으로 분산 |
| 학기 종료 시 | 학생 데이터 초기화, 누적 통계는 리포트로 보존 |

---

## 14. 자주 묻는 질문 (FAQ)

**Q1. 코인을 사용하면 에코 레벨이 떨어지나요?**  
A. 아니요. 레벨은 **누적 탄소 절감량** 기준이라 코인 소비와 무관합니다.

**Q2. 같은 행동을 하루에 여러 번 채굴할 수 있나요?**  
A. 행동별로 **일일 한도(daily_limit)**가 설정되어 있습니다. 한도 도달 시 다음 날까지 대기.

**Q3. 거절된 보상의 코인은 환불되나요?**  
A. 네, 자동 환불됩니다.

**Q4. 학생 데이터를 리셋해도 통계가 사라지나요?**  
A. `mining_records`는 보존되어 리포트에서 조회 가능합니다.

**Q5. 꼬마관리자도 보상 신청을 할 수 있나요?**  
A. 네, 학생 권한을 그대로 가지면서 일부 관리 기능이 추가됩니다.

**Q6. 모바일 앱이 있나요?**  
A. 별도 앱은 없지만 **모바일 웹**에 완전 최적화되어 있어 브라우저로 이용 가능합니다.

**Q7. 데이터는 안전한가요?**  
A. 모든 테이블에 **RLS(Row Level Security)**가 적용되어 본인 또는 권한이 있는 사용자만 데이터 접근 가능합니다.

---

## 📮 문의 & 피드백

- **서비스 URL:** https://ecoinclass.lovable.app
- **개발/운영:** Lovable Platform (Lovable Cloud 기반)

> 🌱 *"작은 실천이 모여 지구를 지킵니다. EcoinClass와 함께 우리 반의 친환경 경제를 시작해보세요!"*

---

*이 문서는 EcoinClass v1.0 기준으로 작성되었으며, 기능 업데이트에 따라 갱신될 수 있습니다.*
