import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { EcoCoin } from '@/components/EcoCoin';
import { ClassChart } from '@/components/ClassChart';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportData {
  weeklyCoins: number;
  weeklyCarbonSaved: number;
  weeklyMiningCount: number;
  topAction: { name: string; icon: string; count: number } | null;
  dailyData: { date: string; coins: number; carbon: number }[];
  totalRank: number | null;
}

interface EcoReportProps {
  isDemoMode?: boolean;
  demoProfile?: { name: string; total_coins: number; total_carbon_saved: number } | null;
}

const DEMO_REPORT_DATA: ReportData = (() => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dailyData: { date: string; coins: number; carbon: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = days[d.getDay()];
    const coins = Math.floor(Math.random() * 15) + 5;
    dailyData.push({ date: dayName, coins, carbon: coins * 200 });
  }
  return {
    weeklyCoins: dailyData.reduce((s, d) => s + d.coins, 0),
    weeklyCarbonSaved: dailyData.reduce((s, d) => s + d.carbon, 0),
    weeklyMiningCount: dailyData.reduce((s, d) => s + Math.ceil(d.coins / 5), 0),
    topAction: { name: '텀블러 사용', icon: '☕', count: 7 },
    dailyData,
    totalRank: 3,
  };
})();

export function EcoReport({ isDemoMode = false, demoProfile }: EcoReportProps) {
  const { user, profile: authProfile } = useAuth();
  const profile = isDemoMode ? demoProfile : authProfile;
  const [data, setData] = useState<ReportData | null>(isDemoMode ? DEMO_REPORT_DATA : null);
  const [loading, setLoading] = useState(!isDemoMode);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    if (isDemoMode) return;
    if (!user) { setLoading(false); return; }
    fetchReport();
  }, [user, isDemoMode, selectedDate, periodType]);

  const fetchReport = async () => {
    if (!user) return;
    
    let startDate: Date, endDate: Date;
    
    if (periodType === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo;
      endDate = new Date();
    } else {
      // Monthly report
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);
    }

    const { data: records } = await supabase
      .from('mining_records')
      .select('action_id, coins_earned, carbon_saved, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: actions } = await supabase.from('eco_actions').select('id, name_ko, icon');

    const weeklyCoins = (records || []).reduce((s, r) => s + r.coins_earned, 0);
    const weeklyCarbonSaved = (records || []).reduce((s, r) => s + r.carbon_saved, 0);

    const actionCounts = new Map<string, number>();
    (records || []).forEach(r => actionCounts.set(r.action_id, (actionCounts.get(r.action_id) || 0) + 1));
    let topAction: ReportData['topAction'] = null;
    if (actionCounts.size > 0) {
      const [topId, topCount] = [...actionCounts.entries()].sort((a, b) => b[1] - a[1])[0];
      const actionInfo = (actions || []).find(a => a.id === topId);
      topAction = { name: actionInfo?.name_ko || topId, icon: actionInfo?.icon || '🌱', count: topCount };
    }

    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dailyArray: { date: string; coins: number; carbon: number }[] = [];
    
    if (periodType === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dailyArray.push({ date: days[d.getDay()], coins: 0, carbon: 0 });
      }
    } else {
      // Monthly: show all days in the month
      const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        dailyArray.push({ date: `${day}일`, coins: 0, carbon: 0 });
      }
    }

    (records || []).forEach(r => {
      const recordDate = new Date(r.created_at);
      if (periodType === 'weekly') {
        const dayName = days[recordDate.getDay()];
        const index = dailyArray.findIndex(d => d.date === dayName);
        if (index !== -1) {
          dailyArray[index].coins += r.coins_earned;
          dailyArray[index].carbon += r.carbon_saved;
        }
      } else {
        const day = recordDate.getDate();
        const index = dailyArray.findIndex(d => d.date === `${day}일`);
        if (index !== -1) {
          dailyArray[index].coins += r.coins_earned;
          dailyArray[index].carbon += r.carbon_saved;
        }
      }
    });

    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('user_id, total_coins')
      .order('total_coins', { ascending: false });
    const rank = allProfiles ? allProfiles.findIndex(p => p.user_id === user.id) + 1 : null;

    setData({
      weeklyCoins,
      weeklyCarbonSaved,
      weeklyMiningCount: (records || []).length,
      topAction,
      dailyData: dailyArray,
      totalRank: rank,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || !profile) return null;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">📊 나의 환경 리포트</h2>
        <p className="text-muted-foreground">
          {periodType === 'weekly' ? '이번 주' : `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월`}의 환경 활동을 돌아보세요
        </p>
      </div>

      {/* Period Toggle */}
      <div className="flex justify-center gap-2 mb-4">
        <Button
          variant={periodType === 'weekly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setPeriodType('weekly');
            setSelectedDate(new Date());
          }}
        >
          주간 리포트
        </Button>
        <Button
          variant={periodType === 'monthly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriodType('monthly')}
        >
          월간 리포트
        </Button>
      </div>

      {/* Month Navigation (Monthly only) */}
      {periodType === 'monthly' && (
        <div className="flex justify-between items-center mb-4 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const prev = new Date(selectedDate);
              prev.setMonth(prev.getMonth() - 1);
              setSelectedDate(prev);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-foreground">
            {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const next = new Date(selectedDate);
              next.setMonth(next.getMonth() + 1);
              setSelectedDate(next);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Report Card */}
      <div className="rounded-3xl bg-card border border-border p-6 shadow-soft space-y-6">
        {/* Header */}
         <div className="text-center border-b border-border pb-4">
           <p className="text-sm text-muted-foreground">📋 {periodType === 'weekly' ? '주간' : '월간'} 환경 리포트</p>
           <h3 className="text-xl font-bold text-foreground mt-1">{profile.name}님의 활동 요약</h3>
         </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
           <div className="text-center p-3 rounded-xl bg-muted/50">
             <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
               <EcoCoin size="sm" /> {data.weeklyCoins}
             </p>
             <p className="text-xs text-muted-foreground mt-1">{periodType === 'weekly' ? '이번 주' : '이번 달'} 획득 코인</p>
           </div>
           <div className="text-center p-3 rounded-xl bg-muted/50">
             <p className="text-2xl font-bold text-foreground">🌍 {(data.weeklyCarbonSaved / 1000).toFixed(1)}kg</p>
             <p className="text-xs text-muted-foreground mt-1">탄소 절감</p>
           </div>
           <div className="text-center p-3 rounded-xl bg-muted/50">
             <p className="text-2xl font-bold text-foreground">⛏️ {data.weeklyMiningCount}회</p>
             <p className="text-xs text-muted-foreground mt-1">채굴 횟수</p>
           </div>
           <div className="text-center p-3 rounded-xl bg-muted/50">
             <p className="text-2xl font-bold text-foreground">🏆 {data.totalRank || '--'}위</p>
             <p className="text-xs text-muted-foreground mt-1">전체 순위</p>
           </div>
        </div>

        {/* Top Action */}
         {data.topAction && (
           <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
             <span className="text-4xl">{data.topAction.icon}</span>
             <div>
               <p className="text-sm text-muted-foreground">{periodType === 'weekly' ? '이번 주' : '이번 달'} 가장 많이 실천한 행동</p>
               <p className="font-bold text-foreground">{data.topAction.name} ({data.topAction.count}회)</p>
             </div>
           </div>
         )}

        {/* Weekly Chart */}
        <div>
          <h4 className="font-semibold text-foreground mb-3">📈 일별 활동 추이</h4>
          <ClassChart data={data.dailyData} metric="coins" type="bar" />
        </div>

        {/* Cumulative Stats */}
        <div className="border-t border-border pt-4">
          <h4 className="font-semibold text-foreground mb-3">🌱 누적 성과</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{profile.total_coins}</p>
              <p className="text-sm text-muted-foreground">총 보유 코인</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{(profile.total_carbon_saved / 1000).toFixed(1)}kg</p>
              <p className="text-sm text-muted-foreground">총 탄소 절감</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
