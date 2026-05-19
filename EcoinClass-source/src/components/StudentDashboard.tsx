import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { JoinClass } from '@/components/JoinClass';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { StatsCard } from '@/components/StatsCard';
import { ActionCard } from '@/components/ActionCard';
import { RewardCard } from '@/components/RewardCard';
import { ClassChart } from '@/components/ClassChart';
import { MiningSuccess } from '@/components/MiningSuccess';
import { EcoCoin } from '@/components/EcoCoin';
import { Leaderboard } from '@/components/Leaderboard';
import { Navigation, TabType } from '@/components/Navigation';
import { BadgeCollection } from '@/components/BadgeCollection';
import { EcoReport } from '@/components/EcoReport';
import { ClassMission } from '@/components/ClassMission';
import { MyRewards } from '@/components/MyRewards';
import { MonthlyComparisonChart } from '@/components/MonthlyComparisonChart';
import { EcoAction } from '@/types/eco-coin';
import { DEMO_ALL_BADGES } from '@/hooks/useDemoMode';
import { Coins, Leaf, TrendingUp, Award, TreeDeciduous, Users, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useBadges } from '@/hooks/useBadges';

interface StudentDashboardProps {
  profile: {
    id: string;
    name: string;
    total_coins: number;
    total_carbon_saved: number;
  };
  actions: EcoAction[];
  rewards: { id: string; name: string; description: string; cost: number; icon: string; category: string; available: boolean }[];
  classStats: {
    totalCoins: number;
    totalCarbonSaved: number;
    dailyData: { date: string; coins: number; carbon: number }[];
    topActions: { actionId: string; count: number }[];
  };
  onMine: (action: EcoAction) => Promise<boolean>;
  onRedeem: (reward: any) => Promise<void>;
  getActionById: (id: string) => EcoAction | undefined;
  isDemoMode?: boolean;
  demoBadges?: any[];
  demoClassStats?: any;
}

export function StudentDashboard({ profile, actions, rewards, classStats, onMine, onRedeem, getActionById, isDemoMode = false, demoBadges = [], demoClassStats }: StudentDashboardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [miningSuccess, setMiningSuccess] = useState<{ open: boolean; action: EcoAction | null }>({
    open: false,
    action: null,
  });
  const { allBadges: dbAllBadges, earnedBadges, checkAndAwardBadges } = useBadges();
  
  // 데모 모드 시 데모 데이터 사용
  const displayBadges = isDemoMode ? demoBadges : earnedBadges;
  const displayAllBadges = isDemoMode ? DEMO_ALL_BADGES : dbAllBadges;
  const displayClassStats = isDemoMode && demoClassStats ? demoClassStats : classStats;

  // Monthly stats state
  const [monthlyPeriod, setMonthlyPeriod] = useState<'cumulative' | 'monthly'>('cumulative');
  const [statsMonth, setStatsMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [monthlyStats, setMonthlyStats] = useState({ totalCoins: 0, totalCarbonSaved: 0 });
  const [monthlyDailyData, setMonthlyDailyData] = useState<{ date: string; coins: number; carbon: number }[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  // Badge period state
  const [badgePeriodType, setBadgePeriodType] = useState<'all' | 'monthly'>('all');
  const [badgeSelectedDate, setBadgeSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Filter badges by selected month
  const filteredMonthlyBadges = displayBadges.filter(badge => {
    const earnedDate = new Date(badge.earned_at);
    return (
      earnedDate.getFullYear() === badgeSelectedDate.getFullYear() &&
      earnedDate.getMonth() === badgeSelectedDate.getMonth()
    );
  });

  const fetchMonthlyData = useCallback(async () => {
    if (isDemoMode || !user) return;
    setLoadingMonthly(true);
    const monthStart = new Date(statsMonth.year, statsMonth.month, 1).toISOString();
    const monthEnd = new Date(statsMonth.year, statsMonth.month + 1, 0, 23, 59, 59).toISOString();

    const [{ data: allRecords }, { data: myRecords }] = await Promise.all([
      supabase.from('mining_records').select('coins_earned, carbon_saved, created_at').gte('created_at', monthStart).lte('created_at', monthEnd),
      supabase.from('mining_records').select('coins_earned, carbon_saved, created_at').eq('user_id', user.id).gte('created_at', monthStart).lte('created_at', monthEnd),
    ]);

    // Class monthly totals
    const classTotalCoins = (allRecords || []).reduce((s, r) => s + r.coins_earned, 0);
    const classTotalCarbon = (allRecords || []).reduce((s, r) => s + r.carbon_saved, 0);
    setMonthlyStats({ totalCoins: classTotalCoins, totalCarbonSaved: classTotalCarbon });

    // Daily data
    const daysInMonth = new Date(statsMonth.year, statsMonth.month + 1, 0).getDate();
    const dailyMap = new Map<string, { date: string; coins: number; carbon: number }>();
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap.set(String(d), { date: `${d}일`, coins: 0, carbon: 0 });
    }
    (allRecords || []).forEach(r => {
      const day = String(new Date(r.created_at).getDate());
      const existing = dailyMap.get(day);
      if (existing) { existing.coins += r.coins_earned; existing.carbon += r.carbon_saved; }
    });
    setMonthlyDailyData(Array.from(dailyMap.values()));
    setLoadingMonthly(false);
  }, [isDemoMode, user, statsMonth]);

  useEffect(() => {
    if (monthlyPeriod === 'monthly') fetchMonthlyData();
  }, [monthlyPeriod, fetchMonthlyData]);

  const changeMonth = (delta: number) => {
    setStatsMonth(prev => {
      let m = prev.month + delta, y = prev.year;
      if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
  };

  const isCurrentMonth = statsMonth.year === new Date().getFullYear() && statsMonth.month === new Date().getMonth();

  const handleMine = async (action: EcoAction) => {
    const success = await onMine(action);
    if (success) {
      setMiningSuccess({ open: true, action });
      checkAndAwardBadges();
      setRefreshKey(k => k + 1);
    }
  };

  const userRank = 3;

  return (
    <div className="pb-20 sm:pb-4">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="container py-4 sm:py-6 space-y-4 sm:space-y-6 px-3 sm:px-4">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-hero-gradient p-4 sm:p-8 text-primary-foreground">
              <div className="relative z-10">
                <h2 className="text-lg sm:text-3xl font-bold mb-1 sm:mb-2">
                  안녕, {profile.name}! 👋
                </h2>
                <p className="text-primary-foreground/80 mb-3 sm:mb-4 text-sm sm:text-base">
                  오늘도 지구를 위한 멋진 실천을 해볼까요?
                </p>
                <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-4">
                  <div className="bg-primary-foreground/20 backdrop-blur-sm rounded-xl px-2.5 py-2 sm:px-4 sm:py-3">
                    <p className="text-[10px] sm:text-sm opacity-80">나의 코인</p>
                    <p className="text-base sm:text-2xl font-bold flex items-center gap-1">
                      <EcoCoin size="xs" />
                      {profile.total_coins}
                    </p>
                  </div>
                  <div className="bg-primary-foreground/20 backdrop-blur-sm rounded-xl px-2.5 py-2 sm:px-4 sm:py-3">
                    <p className="text-[10px] sm:text-sm opacity-80">탄소 절감</p>
                    <p className="text-base sm:text-2xl font-bold">{(profile.total_carbon_saved / 1000).toFixed(1)}kg</p>
                  </div>
                  <div className="bg-primary-foreground/20 backdrop-blur-sm rounded-xl px-2.5 py-2 sm:px-4 sm:py-3">
                    <p className="text-[10px] sm:text-sm opacity-80">뱃지</p>
                    <p className="text-base sm:text-2xl font-bold">🏅 {displayBadges.length}</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-4 right-4 text-6xl opacity-20">🌱</div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary-foreground/10 rounded-full" />
              <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary-foreground/10 rounded-full" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <StatsCard title="보유 코인" value={profile.total_coins} subtitle="Eco-Coin" icon={Coins} variant="gold" />
              <StatsCard
                title="탄소 절감량"
                value={`${(profile.total_carbon_saved / 1000).toFixed(1)}kg`}
                subtitle="CO₂ 절감"
                icon={Leaf}
                variant="eco"
                trend={{ value: 12, isPositive: true }}
              />
               <StatsCard title="학급 총 코인" value={displayClassStats.totalCoins.toLocaleString()} subtitle="우리 반" icon={TrendingUp} />
               <StatsCard title="학급 순위" value={`${userRank}위`} subtitle="순위표 확인" icon={Award} />
            </div>

            {/* Class Mission */}
            <ClassMission isDemoMode={isDemoMode} />

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">⚡ 빠른 채굴</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {actions.slice(0, 4).map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleMine(action)}
                    className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-card transition-all duration-200"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">{action.icon}</span>
                    <span className="text-sm font-medium text-foreground text-center">{action.nameKo}</span>
                    <span className="text-xs text-muted-foreground">+{action.coinValue} 코인</span>
                  </button>
                ))}
              </div>
            </div>

            <JoinClass isDemoMode={isDemoMode} />

            {/* Recent Badges */}
            {displayBadges.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">🏅 최근 획득 뱃지</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {displayBadges.slice(0, 5).map((badge, idx) => {
                    const icon = badge.badge?.icon || badge.icon;
                    const name = badge.badge?.name || badge.name;
                    return (
                      <div key={badge.id || idx} className="flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-primary/20 min-w-[80px]">
                        <span className="text-3xl">{icon}</span>
                        <span className="text-xs font-medium text-foreground text-center">{name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Leaderboard key={`lb-${refreshKey}`} currentUserId={profile.id} limit={5} isDemoMode={isDemoMode} />
          </div>
        )}

        {/* Mining Tab */}
        {activeTab === 'mining' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">⛏️ 환경 행동 채굴하기</h2>
              <p className="text-muted-foreground">실천한 환경 행동을 선택하면 Eco-Coin을 획득할 수 있어요!</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {actions.map((action) => (
                <ActionCard key={action.id} action={action} onMine={handleMine} />
              ))}
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">🎁 보상 교환소</h2>
              <p className="text-muted-foreground">모은 Eco-Coin으로 다양한 보상을 교환해보세요!</p>
              <p className="text-sm text-muted-foreground mt-2">⚠️ 보상 교환은 선생님 승인 후 사용할 수 있습니다</p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <div className="inline-flex items-center gap-2 bg-secondary/50 rounded-full px-4 py-2">
                  <EcoCoin size="sm" />
                  <span className="font-bold text-foreground">{profile.total_coins}</span>
                  <span className="text-muted-foreground">코인 보유 중</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/my-requests')} className="gap-1">
                  <Clock className="h-4 w-4" />
                  내 요청 현황
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={{
                    id: reward.id,
                    name: reward.name,
                    description: reward.description,
                    cost: reward.cost,
                    icon: reward.icon,
                    category: reward.category as 'privilege' | 'item' | 'donation',
                    available: reward.available,
                  }}
                  userCoins={profile.total_coins}
                  onRedeem={() => onRedeem(reward)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">📦 내 아이템</h2>
              <p className="text-muted-foreground">교환하고 승인받은 보상을 확인해보세요!</p>
            </div>
            <MyRewards />
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="animate-fade-in space-y-4">
            {/* Period Toggle for Badges */}
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-muted rounded-lg p-1">
                <button
                  onClick={() => setBadgePeriodType('all')}
                  className={cn(
                    'px-4 py-2 rounded text-sm font-medium transition-colors',
                    badgePeriodType === 'all'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  )}
                >
                  전체 기간
                </button>
                <button
                  onClick={() => setBadgePeriodType('monthly')}
                  className={cn(
                    'px-4 py-2 rounded text-sm font-medium transition-colors',
                    badgePeriodType === 'monthly'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  )}
                >
                  이번 달
                </button>
              </div>
              {badgePeriodType === 'monthly' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBadgeSelectedDate(new Date(badgeSelectedDate.getFullYear(), badgeSelectedDate.getMonth() - 1, 1))}
                    className="p-1.5 hover:bg-muted rounded-md transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium min-w-fit">
                    {badgeSelectedDate.getFullYear()}년 {badgeSelectedDate.getMonth() + 1}월
                  </span>
                  <button
                    onClick={() => setBadgeSelectedDate(new Date(badgeSelectedDate.getFullYear(), badgeSelectedDate.getMonth() + 1, 1))}
                    className="p-1.5 hover:bg-muted rounded-md transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Badge Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">획득한 뱃지</p>
                <p className="text-xl font-bold text-foreground">
                  {badgePeriodType === 'monthly'
                    ? filteredMonthlyBadges.length
                    : displayBadges.length
                  } / {displayAllBadges.length}
                </p>
              </div>
              {badgePeriodType === 'monthly' && (
                <div className="bg-primary/10 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">이번 달 신규</p>
                  <p className="text-xl font-bold text-primary">
                    {filteredMonthlyBadges.length}
                  </p>
                </div>
              )}
            </div>
            
            <BadgeCollection allBadges={displayAllBadges} earnedBadges={badgePeriodType === 'monthly' ? filteredMonthlyBadges : displayBadges} />
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div className="animate-fade-in">
            <EcoReport key={`report-${refreshKey}`} isDemoMode={isDemoMode} demoProfile={isDemoMode ? profile : undefined} />
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">📈 학급 환경 현황</h2>
              <p className="text-muted-foreground">우리 반이 함께 만들어가는 환경 가치를 확인해보세요!</p>
            </div>

            {/* Period Toggle */}
            <div className="flex justify-center">
              <div className="flex rounded-lg bg-muted p-1 text-sm">
                <button
                  onClick={() => setMonthlyPeriod('cumulative')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${monthlyPeriod === 'cumulative' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  📊 누적
                </button>
                <button
                  onClick={() => setMonthlyPeriod('monthly')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${monthlyPeriod === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  📅 월별
                </button>
              </div>
            </div>

            {/* Class Mission */}
            <ClassMission isDemoMode={isDemoMode} />

            {monthlyPeriod === 'cumulative' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatsCard title="학급 총 코인" value={displayClassStats.totalCoins.toLocaleString()} icon={Coins} variant="gold" />
                  <StatsCard title="총 탄소 절감" value={`${(displayClassStats.totalCarbonSaved / 1000).toFixed(1)}kg`} icon={Leaf} variant="primary" />
                  <StatsCard title="참여 학생" value="--명" subtitle="전원 참여!" icon={Users} />
                  <StatsCard title="심은 나무 효과" value={`${Math.floor(displayClassStats.totalCarbonSaved / 22000)}그루`} subtitle="1년간 흡수량 기준" icon={TreeDeciduous} variant="eco" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-2xl bg-card border border-border p-6 shadow-soft">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">🌍 주간 탄소 절감 추이</h3>
                    <ClassChart data={displayClassStats.dailyData} metric="carbon" type="area" />
                  </div>
                  <div className="rounded-2xl bg-card border border-border p-6 shadow-soft">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">🌱 주간 코인 획득 추이</h3>
                    <ClassChart data={displayClassStats.dailyData} metric="coins" type="line" />
                  </div>
                </div>
                <div className="rounded-2xl bg-card border border-border p-6 shadow-soft">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">🏆 인기 환경 행동 TOP 3</h3>
                  <div className="space-y-3">
                    {classStats.topActions.slice(0, 3).map((item, index) => {
                      const action = getActionById(item.actionId);
                      if (!action) return null;
                      return (
                        <div key={item.actionId} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                          <span className="text-2xl font-bold text-muted-foreground w-8">{index + 1}</span>
                          <span className="text-3xl">{action.icon}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{action.nameKo}</p>
                            <p className="text-sm text-muted-foreground">{item.count}회 실천</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{(item.count * action.carbonReduction / 1000).toFixed(1)}kg</p>
                            <p className="text-xs text-muted-foreground">CO₂ 절감</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Monthly Comparison Chart */}
                <MonthlyComparisonChart isDemoMode={isDemoMode} />
              </>
            ) : (
              <>
                {/* Month Selector */}
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold text-foreground min-w-[100px] text-center">
                    {statsMonth.year}년 {statsMonth.month + 1}월
                  </span>
                  <Button variant="outline" size="icon" onClick={() => changeMonth(1)} disabled={isCurrentMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {loadingMonthly ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <StatsCard title="이달 학급 코인" value={monthlyStats.totalCoins.toLocaleString()} icon={Coins} variant="gold" />
                      <StatsCard title="이달 탄소 절감" value={`${(monthlyStats.totalCarbonSaved / 1000).toFixed(1)}kg`} icon={Leaf} variant="primary" />
                      <StatsCard title="심은 나무 효과" value={`${Math.floor(monthlyStats.totalCarbonSaved / 22000)}그루`} subtitle="1년간 흡수량 기준" icon={TreeDeciduous} variant="eco" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="rounded-2xl bg-card border border-border p-6 shadow-soft">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">🌍 {statsMonth.month + 1}월 탄소 절감 추이</h3>
                        <ClassChart data={monthlyDailyData} metric="carbon" type="area" />
                      </div>
                      <div className="rounded-2xl bg-card border border-border p-6 shadow-soft">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">🌱 {statsMonth.month + 1}월 코인 획득 추이</h3>
                        <ClassChart data={monthlyDailyData} metric="coins" type="line" />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <Leaderboard key={`lb2-${refreshKey}`} currentUserId={profile.id} limit={20} isDemoMode={isDemoMode} />
          </div>
        )}
      </main>

      <MiningSuccess
        open={miningSuccess.open}
        onClose={() => setMiningSuccess({ open: false, action: null })}
        action={miningSuccess.action}
      />
    </div>
  );
}
