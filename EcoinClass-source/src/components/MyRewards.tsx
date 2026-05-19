import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { EcoCoin } from './EcoCoin';
import { Package, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RewardRequest {
  id: string;
  status: string;
  created_at: string;
  reward: {
    id: string;
    name: string;
    icon: string;
    cost: number;
    category: string;
  };
}

const statusConfig = {
  approved: { label: '승인됨', icon: CheckCircle2, className: 'text-green-600 bg-green-50 dark:bg-green-950/30' },
  pending: { label: '대기 중', icon: Clock, className: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
  rejected: { label: '반려됨', icon: XCircle, className: 'text-red-600 bg-red-50 dark:bg-red-950/30' },
};

export function MyRewards() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RewardRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      const { data } = await supabase
        .from('reward_requests')
        .select('id, status, created_at, reward_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!data || data.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // Fetch reward details
      const rewardIds = [...new Set(data.map(r => r.reward_id))];
      const { data: rewards } = await supabase
        .from('rewards')
        .select('id, name, icon, cost, category')
        .in('id', rewardIds);

      const rewardMap = new Map(rewards?.map(r => [r.id, r]) || []);

      setRequests(
        data
          .filter(r => rewardMap.has(r.reward_id))
          .map(r => ({
            id: r.id,
            status: r.status,
            created_at: r.created_at,
            reward: rewardMap.get(r.reward_id)!,
          }))
      );
      setLoading(false);
    };

    fetchRequests();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const approved = requests.filter(r => r.status === 'approved');
  const pending = requests.filter(r => r.status === 'pending');
  const rejected = requests.filter(r => r.status === 'rejected');

  // Count approved rewards by type
  const approvedCounts = new Map<string, { reward: RewardRequest['reward']; count: number }>();
  approved.forEach(r => {
    const existing = approvedCounts.get(r.reward.id);
    if (existing) {
      existing.count++;
    } else {
      approvedCounts.set(r.reward.id, { reward: r.reward, count: 1 });
    }
  });

  return (
    <div className="space-y-6">
      {/* Approved inventory */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          내 보유 아이템
          <span className="text-sm font-normal text-muted-foreground">({approved.length}개)</span>
        </h3>
        {approvedCounts.size === 0 ? (
          <div className="text-center py-8 bg-muted/30 rounded-2xl">
            <p className="text-muted-foreground">아직 승인된 보상이 없어요</p>
            <p className="text-sm text-muted-foreground mt-1">보상을 교환하고 선생님의 승인을 기다려보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from(approvedCounts.values()).map(({ reward, count }) => (
              <div
                key={reward.id}
                className="relative flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-primary/20 shadow-soft"
              >
                {count > 1 && (
                  <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    ×{count}
                  </span>
                )}
                <span className="text-4xl">{reward.icon}</span>
                <span className="text-sm font-medium text-foreground text-center leading-tight">{reward.name}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <EcoCoin size="xs" />
                  <span>{reward.cost}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            승인 대기 중 ({pending.length}개)
          </h3>
          <div className="space-y-2">
            {pending.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                <span className="text-2xl">{r.reward.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.reward.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('ko-KR')} 요청
                  </p>
                </div>
                <span className="text-xs font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-full">
                  대기 중
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected requests */}
      {rejected.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <XCircle className="h-4 w-4" />
            반려됨 ({rejected.length}개)
          </h3>
          <div className="space-y-2">
            {rejected.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                <span className="text-2xl opacity-50">{r.reward.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground truncate">{r.reward.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('ko-KR')} 요청
                  </p>
                </div>
                <span className="text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded-full">
                  반려
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
