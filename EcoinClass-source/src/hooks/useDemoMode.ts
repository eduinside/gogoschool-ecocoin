import { useState, useEffect, useCallback } from 'react';

export type DemoRole = 'student' | 'teacher' | null;

interface DemoProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  class_name: string;
  total_coins: number;
  total_carbon_saved: number;
}

const INITIAL_DEMO_STUDENT_PROFILE: DemoProfile = {
  id: 'demo-student-id',
  user_id: 'demo-student-user-id',
  name: '테스트 학생',
  avatar_url: null,
  class_name: '6학년 1반',
  total_coins: 150,
  total_carbon_saved: 45000,
};

// Demo all badges (전체 뱃지 목록)
export const DEMO_ALL_BADGES = [
  { id: 'demo-b-1', key: 'first_miner', name: '채굴 입문자', icon: '⛏️', category: 'milestone', description: '첫 채굴 완료', condition_type: 'mining_count', condition_value: 1 },
  { id: 'demo-b-2', key: 'eco_enthusiast', name: '환경 애호가', icon: '🌱', category: 'milestone', description: '총 코인 50 획득', condition_type: 'total_coins', condition_value: 50 },
  { id: 'demo-b-3', key: 'carbon_warrior', name: '탄소 전사', icon: '🌍', category: 'milestone', description: '탄소 30kg 이상 절감', condition_type: 'total_carbon', condition_value: 30000 },
  { id: 'demo-b-4', key: 'coin_master', name: '코인 마스터', icon: '💰', category: 'coins', description: '총 코인 500 획득', condition_type: 'total_coins', condition_value: 500 },
  { id: 'demo-b-5', key: 'eco_hero', name: '에코 히어로', icon: '🦸', category: 'carbon', description: '탄소 100kg 이상 절감', condition_type: 'total_carbon', condition_value: 100000 },
  { id: 'demo-b-6', key: 'streak_3', name: '3일 연속', icon: '🔥', category: 'streak', description: '3일 연속 채굴', condition_type: 'streak_days', condition_value: 3 },
];

// Demo badges - 테스트 학생이 획득한 뱃지 (badge_id로 매칭)
export const DEMO_STUDENT_BADGES = [
  { id: 'demo-ub-1', badge_id: 'demo-b-1', earned_at: new Date(Date.now() - 86400000 * 5).toISOString(), badge: DEMO_ALL_BADGES[0] },
  { id: 'demo-ub-2', badge_id: 'demo-b-2', earned_at: new Date(Date.now() - 86400000 * 3).toISOString(), badge: DEMO_ALL_BADGES[1] },
  { id: 'demo-ub-3', badge_id: 'demo-b-3', earned_at: new Date(Date.now() - 86400000 * 1).toISOString(), badge: DEMO_ALL_BADGES[2] },
];

// Demo class stats - 학급 환경 현황
export const DEMO_CLASS_STATS = {
  totalCoins: 450,
  totalCarbonSaved: 135000,
  dailyData: [
    { date: '월', coins: 80, carbon: 24000 },
    { date: '화', coins: 95, carbon: 28500 },
    { date: '수', coins: 110, carbon: 33000 },
    { date: '목', coins: 85, carbon: 25500 },
    { date: '금', coins: 80, carbon: 24000 },
  ],
  topActions: [
    { actionId: 'tumbler_use', count: 15 },
    { actionId: 'tree_planting', count: 12 },
    { actionId: 'recycling', count: 10 },
  ],
};

const DEMO_TEACHER_PROFILE: DemoProfile = {
  id: 'demo-teacher-id',
  user_id: 'demo-teacher-user-id',
  name: '테스트 선생님',
  avatar_url: null,
  class_name: '6학년 1반',
  total_coins: 0,
  total_carbon_saved: 0,
};

const DEMO_MODE_KEY = 'eco-coin-demo-mode';
const DEMO_PROFILE_KEY = 'eco-coin-demo-profile';

export function useDemoMode() {
  const [demoRole, setDemoRole] = useState<DemoRole>(() => {
    const stored = localStorage.getItem(DEMO_MODE_KEY);
    return stored as DemoRole;
  });

  const [demoStudentProfile, setDemoStudentProfile] = useState<DemoProfile>(() => {
    const stored = localStorage.getItem(DEMO_PROFILE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return INITIAL_DEMO_STUDENT_PROFILE;
      }
    }
    return INITIAL_DEMO_STUDENT_PROFILE;
  });

  const isDemoMode = demoRole !== null;

  const enterDemoMode = (role: 'student' | 'teacher') => {
    localStorage.setItem(DEMO_MODE_KEY, role);
    setDemoRole(role);
    // Reset demo profile when entering
    if (role === 'student') {
      localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(INITIAL_DEMO_STUDENT_PROFILE));
      setDemoStudentProfile(INITIAL_DEMO_STUDENT_PROFILE);
    }
  };

  const exitDemoMode = () => {
    localStorage.removeItem(DEMO_MODE_KEY);
    localStorage.removeItem(DEMO_PROFILE_KEY);
    setDemoRole(null);
    setDemoStudentProfile(INITIAL_DEMO_STUDENT_PROFILE);
  };

  const updateDemoCoins = useCallback((coinsToAdd: number, carbonToAdd: number) => {
    setDemoStudentProfile(prev => {
      const updated = {
        ...prev,
        total_coins: prev.total_coins + coinsToAdd,
        total_carbon_saved: prev.total_carbon_saved + carbonToAdd,
      };
      localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const spendDemoCoins = useCallback((coinsToSpend: number) => {
    setDemoStudentProfile(prev => {
      if (prev.total_coins < coinsToSpend) return prev;
      const updated = {
        ...prev,
        total_coins: prev.total_coins - coinsToSpend,
      };
      localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getDemoProfile = (): DemoProfile | null => {
    if (demoRole === 'student') return demoStudentProfile;
    if (demoRole === 'teacher') return DEMO_TEACHER_PROFILE;
    return null;
  };

  return {
    isDemoMode,
    demoRole,
    demoProfile: getDemoProfile(),
    isTeacher: demoRole === 'teacher',
    enterDemoMode,
    exitDemoMode,
    updateDemoCoins,
    spendDemoCoins,
  };
}
