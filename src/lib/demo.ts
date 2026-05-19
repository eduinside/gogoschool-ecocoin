// 체험 모드 더미 데이터

export const DEMO_KEY = 'ecoin_demo';
export const DEMO_ROLE_KEY = 'ecoin_demo_role';

export function isDemoMode() {
  return localStorage.getItem(DEMO_KEY) === '1';
}

export function getDemoRole(): 'student' | 'teacher' {
  return (localStorage.getItem(DEMO_ROLE_KEY) as 'student' | 'teacher') ?? 'student';
}

export function enterDemo(role: 'student' | 'teacher') {
  localStorage.setItem(DEMO_KEY, '1');
  localStorage.setItem(DEMO_ROLE_KEY, role);
}

export function exitDemo() {
  localStorage.removeItem(DEMO_KEY);
  localStorage.removeItem(DEMO_ROLE_KEY);
}

// ─── 더미 데이터 ───────────────────────────────────────────────────────────────

const CLASS_ID = 'demo-class-01';

export const DEMO_STUDENT_USER = {
  id: 'demo-student-01',
  email: 'student@demo.test',
  displayName: '김지민',
  avatarEmoji: null,
  grade: 5,
  totalCoins: 142,
  carbonSavedG: 34200,
  level: 2,
  roles: [{ role: 'student', classId: CLASS_ID }],
  classes: [{ id: CLASS_ID, name: '5학년 3반', joinCode: 'DEMO01' }],
};

export const DEMO_TEACHER_USER = {
  id: 'demo-teacher-01',
  email: 'teacher@demo.test',
  displayName: '김선영',
  avatarEmoji: null,
  grade: null,
  totalCoins: 0,
  carbonSavedG: 0,
  level: 1,
  roles: [{ role: 'teacher', classId: CLASS_ID }],
  classes: [{ id: CLASS_ID, name: '5학년 3반', joinCode: 'DEMO01' }],
};

// 엔드포인트별 더미 응답
export function getDemoData(path: string): unknown {
  // 학생 홈 - 환경 행동
  if (path.includes('/eco-actions')) {
    return [
      { id: 'a1', category: 'waste',     title: '분리배출 실천',    description: null, coinReward: 10, carbonSavedG: 500,  dailyLimit: 3, todayCount: 1, remainingToday: 2 },
      { id: 'a2', category: 'food',      title: '잔반 줄이기',      description: null, coinReward: 8,  carbonSavedG: 300,  dailyLimit: 1, todayCount: 0, remainingToday: 1 },
      { id: 'a3', category: 'energy',    title: '소등 실천',        description: null, coinReward: 5,  carbonSavedG: 200,  dailyLimit: 2, todayCount: 0, remainingToday: 2 },
      { id: 'a4', category: 'water',     title: '절수 실천',        description: null, coinReward: 5,  carbonSavedG: 150,  dailyLimit: 2, todayCount: 2, remainingToday: 0 },
      { id: 'a5', category: 'transport', title: '걸어서 등교',      description: null, coinReward: 12, carbonSavedG: 800,  dailyLimit: 1, todayCount: 1, remainingToday: 0 },
      { id: 'a6', category: 'other',     title: '친환경 텀블러 사용', description: null, coinReward: 6, carbonSavedG: 250, dailyLimit: 1, todayCount: 0, remainingToday: 1 },
    ];
  }

  // 미션
  if (path.includes('/missions')) {
    return [
      { id: 'm1', title: '한 달간 1만 코인 모으기', description: '달성 시 야외 수업', goalValue: 10000, currentValue: 6842, isCompleted: false },
      { id: 'm2', title: '재활용 200회 챌린지',     description: '달성 시 영화 감상', goalValue: 200,   currentValue: 132,  isCompleted: false },
    ];
  }

  // 보상 목록
  if (path.includes('/rewards') && !path.includes('requests')) {
    return [
      { id: 'r1', category: 'privilege',   title: '자리 바꾸기권',  description: null, costCoins: 80,  stock: 3,  isAffordable: false },
      { id: 'r2', category: 'item',        title: '친환경 스티커',  description: null, costCoins: 15,  stock: 10, isAffordable: true  },
      { id: 'r3', category: 'experience',  title: '자유 독서',      description: null, costCoins: 20,  stock: 5,  isAffordable: true  },
      { id: 'r4', category: 'privilege',   title: '급식 우선권',    description: null, costCoins: 30,  stock: 2,  isAffordable: true  },
      { id: 'r5', category: 'item',        title: '숙제 면제권',    description: null, costCoins: 100, stock: 1,  isAffordable: false },
      { id: 'r6', category: 'donation',    title: '나무 심기',      description: null, costCoins: 50,  stock: null, isAffordable: false },
    ];
  }

  // 리더보드
  if (path.includes('/students')) {
    return [
      { userId: 's1', displayName: '김지민', avatarEmoji: null, totalCoins: 142, carbonSavedG: 34200, level: 2, isHelper: false },
      { userId: 's2', displayName: '이서준', avatarEmoji: null, totalCoins: 128, carbonSavedG: 28500, level: 2, isHelper: true  },
      { userId: 's3', displayName: '박소이', avatarEmoji: null, totalCoins: 115, carbonSavedG: 22100, level: 2, isHelper: true  },
      { userId: 's4', displayName: '최민준', avatarEmoji: null, totalCoins: 98,  carbonSavedG: 18700, level: 1, isHelper: false },
      { userId: 's5', displayName: '정하은', avatarEmoji: null, totalCoins: 87,  carbonSavedG: 15300, level: 1, isHelper: false },
      { userId: 's6', displayName: '강도윤', avatarEmoji: null, totalCoins: 76,  carbonSavedG: 12400, level: 1, isHelper: false },
      { userId: 's7', displayName: '윤시아', avatarEmoji: null, totalCoins: 65,  carbonSavedG: 9800,  level: 1, isHelper: false },
      { userId: 's8', displayName: '임지호', avatarEmoji: null, totalCoins: 54,  carbonSavedG: 7200,  level: 1, isHelper: false },
    ];
  }

  // 월간 리포트
  if (path.includes('/stats/me')) {
    const today = new Date();
    const byDay = Array.from({ length: 19 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), i + 1);
      return {
        date: d.toISOString().slice(0, 10),
        count: [0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 3, 4, 5, 6, 4, 7, 5, 6, 4][i] ?? 0,
        coins: [0, 16, 8, 24, 16, 32, 24, 40, 32, 48, 24, 32, 40, 48, 32, 56, 40, 48, 32][i] ?? 0,
      };
    });
    return {
      totalMinings: 68,
      totalCoins: 142,
      carbonSavedG: 34200,
      streakDays: 7,
      byDay,
      byCategory: [
        { category: 'waste',     count: 25, coins: 56 },
        { category: 'food',      count: 20, coins: 45 },
        { category: 'energy',    count: 14, coins: 24 },
        { category: 'transport', count: 5,  coins: 12 },
        { category: 'other',     count: 4,  coins: 5  },
      ],
    };
  }

  // 뱃지
  if (path.includes('/badges')) {
    return [
      { id: 'b1', code: 'first_mine',     title: '첫 걸음',       description: '첫 채굴',        emoji: '🌱', earnedAt: '2026-05-01' },
      { id: 'b2', code: 'streak_7',       title: '꾸준함',        description: '7일 연속',       emoji: '🔥', earnedAt: '2026-05-10' },
      { id: 'b3', code: '100_coins',      title: '백 코인',       description: '100코인 달성',   emoji: '💯', earnedAt: '2026-05-12' },
      { id: 'b4', code: 'level_tree',     title: '나무 등급',     description: '30kg 절감',      emoji: '🌳', earnedAt: '2026-05-15' },
      { id: 'b5', code: 'top_monthly',    title: '월간 1위',      description: '월간 리더보드 1위', emoji: '🏆', earnedAt: null },
      { id: 'b6', code: 'recycle_50',     title: '재활용 마스터', description: '재활용 50회',    emoji: '♻️', earnedAt: null },
      { id: 'b7', code: 'energy_30',      title: '절전왕',        description: '에너지 30회',    emoji: '💡', earnedAt: null },
      { id: 'b8', code: 'carbon_150kg',   title: '에코 히어로',   description: '150kg 절감',     emoji: '🦸', earnedAt: null },
      { id: 'b9', code: 'donation_5',     title: '기부천사',      description: '나무 심기 5회',  emoji: '🤝', earnedAt: null },
    ];
  }

  // 내 요청 내역
  if (path.includes('reward-requests')) {
    return [
      { id: 'rq1', rewardTitle: '자리 바꾸기권', rewardCategory: 'privilege',  costCoins: 80,  status: 'pending',  createdAt: Date.now() - 3600000,   teacherNote: null },
      { id: 'rq2', rewardTitle: '급식 우선권',   rewardCategory: 'privilege',  costCoins: 30,  status: 'approved', createdAt: Date.now() - 86400000,  teacherNote: null },
      { id: 'rq3', rewardTitle: '자유 독서',     rewardCategory: 'experience', costCoins: 20,  status: 'approved', createdAt: Date.now() - 172800000, teacherNote: null },
      { id: 'rq4', rewardTitle: '숙제 면제권',   rewardCategory: 'privilege',  costCoins: 100, status: 'rejected', createdAt: Date.now() - 259200000, teacherNote: '이번 주는 어려워요' },
    ];
  }

  // 학급 정보 (선생님)
  if (path.match(/\/classes\/[^/]+$/) && !path.includes('students')) {
    return { id: CLASS_ID, name: '5학년 3반', grade: 5, section: 3, joinCode: 'DEMO01', memberCount: 24 };
  }

  // 학급 통계 (선생님)
  if (path.includes('/stats/class')) {
    const trend = [12, 18, 15, 22, 28, 24, 32, 19, 25, 30, 28, 35, 22, 38].map((count, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return { date: d.toISOString().slice(0, 10), count };
    });
    return { memberCount: 24, activeToday: 22, totalCoins: 2148, totalCarbonG: 184000, todayMinings: 32, trend, pendingRequests: 4 };
  }

  return null;
}

// 더미 POST 응답
export function getDemoPostData(path: string): unknown {
  if (path === '/mine') {
    return {
      miningId: 'demo-mine-' + Date.now(),
      coinReward: 10,
      carbonSavedG: 500,
      newTotalCoins: 152,
      newCarbonSavedG: 34700,
      remainingToday: 1,
      newBadges: [],
    };
  }
  if (path.includes('/request')) {
    return { id: 'demo-req-' + Date.now(), status: 'pending' };
  }
  if (path.includes('/approve') || path.includes('/reject')) {
    return { success: true };
  }
  return { success: true };
}
