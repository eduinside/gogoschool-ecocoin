import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EcoCoin } from '@/components/EcoCoin';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  id: string;
  name: string;
  total_coins: number;
  total_carbon_saved: number;
  avatar_url: string | null;
}

interface LeaderboardProps {
  currentUserId?: string;
  limit?: number;
  isDemoMode?: boolean;
}

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'u1', name: '김민준', total_coins: 250, total_carbon_saved: 75000, avatar_url: null },
  { id: 'u2', name: '이서연', total_coins: 180, total_carbon_saved: 54000, avatar_url: null },
  { id: 'demo-student-id', name: '테스트 학생', total_coins: 150, total_carbon_saved: 45000, avatar_url: null },
  { id: 'u3', name: '박지호', total_coins: 150, total_carbon_saved: 45000, avatar_url: null },
  { id: 'u4', name: '최예은', total_coins: 120, total_carbon_saved: 36000, avatar_url: null },
];

const DEMO_MONTHLY_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'u2', name: '이서연', total_coins: 85, total_carbon_saved: 25500, avatar_url: null },
  { id: 'demo-student-id', name: '테스트 학생', total_coins: 70, total_carbon_saved: 21000, avatar_url: null },
  { id: 'u4', name: '최예은', total_coins: 65, total_carbon_saved: 19500, avatar_url: null },
  { id: 'u1', name: '김민준', total_coins: 55, total_carbon_saved: 16500, avatar_url: null },
  { id: 'u3', name: '박지호', total_coins: 40, total_carbon_saved: 12000, avatar_url: null },
];

type Period = 'cumulative' | 'monthly';

export function Leaderboard({ currentUserId, limit = 10, isDemoMode = false }: LeaderboardProps) {
  const [period, setPeriod] = useState<Period>('cumulative');
  const [entries, setEntries] = useState<LeaderboardEntry[]>(isDemoMode ? DEMO_LEADERBOARD : []);
  const [loading, setLoading] = useState(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) {
      setEntries(period === 'cumulative' ? DEMO_LEADERBOARD : DEMO_MONTHLY_LEADERBOARD);
      return;
    }

    const fetchLeaderboard = async () => {
      setLoading(true);

      if (period === 'cumulative') {
        const { data } = await supabase
          .from('profiles')
          .select('id, name, total_coins, total_carbon_saved, avatar_url')
          .order('total_coins', { ascending: false })
          .limit(limit);
        setEntries(data || []);
      } else {
        // Monthly: aggregate from mining_records for current month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { data: records } = await supabase
          .from('mining_records')
          .select('user_id, coins_earned, carbon_saved')
          .gte('created_at', monthStart);

        if (records && records.length > 0) {
          const userMap = new Map<string, { coins: number; carbon: number }>();
          records.forEach(r => {
            const existing = userMap.get(r.user_id) || { coins: 0, carbon: 0 };
            userMap.set(r.user_id, {
              coins: existing.coins + r.coins_earned,
              carbon: existing.carbon + r.carbon_saved,
            });
          });

          const userIds = Array.from(userMap.keys());
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, user_id, name, avatar_url')
            .in('user_id', userIds);

          const monthlyEntries: LeaderboardEntry[] = (profiles || []).map(p => ({
            id: p.id,
            name: p.name,
            total_coins: userMap.get(p.user_id)?.coins || 0,
            total_carbon_saved: userMap.get(p.user_id)?.carbon || 0,
            avatar_url: p.avatar_url,
          }));

          monthlyEntries.sort((a, b) => b.total_coins - a.total_coins);
          setEntries(monthlyEntries.slice(0, limit));
        } else {
          setEntries([]);
        }
      }
      setLoading(false);
    };

    fetchLeaderboard();

    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit, isDemoMode, period]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-amber-600" />;
      default: return <span className="text-lg font-bold text-muted-foreground w-6 text-center">{rank}</span>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
      case 2: return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      case 3: return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200';
      default: return 'bg-card border-border';
    }
  };

  const currentMonth = new Date().toLocaleDateString('ko-KR', { month: 'long' });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            순위표
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            🏆 학급 순위표
          </CardTitle>
          <div className="flex rounded-lg bg-muted p-1 text-sm">
            <button
              onClick={() => setPeriod('cumulative')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all',
                period === 'cumulative'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              누적
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all',
                period === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              📅 {currentMonth}
            </button>
          </div>
        </div>
        {period === 'monthly' && (
          <p className="text-xs text-muted-foreground mt-1">
            {currentMonth} 활동 기준 순위입니다
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const isCurrentUser = entry.id === currentUserId;

          return (
            <div
              key={entry.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                getRankBgColor(rank),
                isCurrentUser && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              <div className="flex items-center justify-center w-8">
                {getRankIcon(rank)}
              </div>
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-primary-foreground',
                  rank === 1 ? 'bg-yellow-500' :
                  rank === 2 ? 'bg-gray-400' :
                  rank === 3 ? 'bg-amber-600' :
                  'bg-eco-gradient'
                )}
              >
                {entry.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-semibold text-foreground truncate',
                  isCurrentUser && 'text-primary'
                )}>
                  {entry.name}
                  {isCurrentUser && <span className="ml-2 text-xs">(나)</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  CO₂ {(entry.total_carbon_saved / 1000).toFixed(1)}kg 절감
                </p>
              </div>
              <div className="flex items-center gap-2">
                <EcoCoin size="sm" />
                <span className="font-bold text-lg">{entry.total_coins}</span>
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {period === 'monthly' ? '이번 달 활동 데이터가 없어요' : '아직 순위 데이터가 없어요'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
