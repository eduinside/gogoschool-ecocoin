import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { Loader2, Target } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  mission_type: string;
  reward_description: string | null;
  status: string;
  end_date: string | null;
}

interface ClassMissionProps {
  isDemoMode?: boolean;
}

const DEMO_MISSIONS: Mission[] = [
  {
    id: 'demo-mission-1',
    title: '이번 주 학급 500코인 달성!',
    description: '우리 반 전체가 힘을 합쳐 500코인을 모아봐요!',
    target_value: 500,
    current_value: 320,
    mission_type: 'total_coins',
    reward_description: '학급 전체 간식 파티!',
    status: 'active',
    end_date: '2026-02-20',
  },
  {
    id: 'demo-mission-2',
    title: '탄소 100kg 절감 도전',
    description: '학급 전체가 100kg의 탄소를 절감해봅시다',
    target_value: 100000,
    current_value: 45000,
    mission_type: 'total_carbon',
    reward_description: '학급 영화 관람',
    status: 'active',
    end_date: null,
  },
];

export function ClassMission({ isDemoMode = false }: ClassMissionProps) {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>(isDemoMode ? DEMO_MISSIONS : []);
  const [loading, setLoading] = useState(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) return;
    if (!user) { setLoading(false); return; }
    fetchMissions();
  }, [user, isDemoMode]);

  const fetchMissions = async () => {
    const { data } = await supabase
      .from('class_missions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (data) setMissions(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 text-center">
        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-bold text-foreground mb-1">아직 진행 중인 미션이 없어요</h3>
        <p className="text-sm text-muted-foreground">선생님이 미션을 등록하면 여기에 표시됩니다!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" /> 학급 미션
      </h3>
      {missions.map(mission => {
        const progress = mission.target_value > 0
          ? Math.min(100, (mission.current_value / mission.target_value) * 100)
          : 0;
        const isComplete = mission.current_value >= mission.target_value;

        return (
          <div
            key={mission.id}
            className={`rounded-2xl border p-5 transition-all ${
              isComplete ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-bold text-foreground flex items-center gap-2">
                  {isComplete ? '🎉' : '🎯'} {mission.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
              </div>
              {mission.end_date && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  ~{new Date(mission.end_date).toLocaleDateString('ko-KR')}
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">
                  {mission.current_value.toLocaleString()} / {mission.target_value.toLocaleString()}
                </span>
                <span className="font-semibold text-primary">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
            {mission.reward_description && (
              <p className="text-xs text-primary mt-2">🎁 달성 보상: {mission.reward_description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
