import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/hooks/useDemoMode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EcoCoin } from '@/components/EcoCoin';
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Gift,
  FlaskConical,
} from 'lucide-react';

interface RewardRequest {
  id: string;
  reward_id: string;
  status: string;
  teacher_notes: string | null;
  created_at: string;
  updated_at: string;
  rewards: { name: string; cost: number; icon: string } | null;
}

// Demo mock data
const DEMO_REQUESTS: RewardRequest[] = [
  {
    id: 'dr1',
    reward_id: 'rw1',
    status: 'pending',
    teacher_notes: null,
    created_at: '2024-02-07T10:00:00Z',
    updated_at: '2024-02-07T10:00:00Z',
    rewards: { name: '자리 바꾸기', cost: 50, icon: '🪑' },
  },
  {
    id: 'dr2',
    reward_id: 'rw2',
    status: 'approved',
    teacher_notes: '수고했어요!',
    created_at: '2024-02-05T14:30:00Z',
    updated_at: '2024-02-06T09:00:00Z',
    rewards: { name: '간식 쿠폰', cost: 30, icon: '🍪' },
  },
  {
    id: 'dr3',
    reward_id: 'rw3',
    status: 'rejected',
    teacher_notes: '이번 주는 불가능해요',
    created_at: '2024-02-03T11:00:00Z',
    updated_at: '2024-02-04T08:00:00Z',
    rewards: { name: '숙제 면제권', cost: 100, icon: '📝' },
  },
];

export default function MyRequests() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isDemoMode, demoRole } = useDemoMode();
  const [requests, setRequests] = useState<RewardRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      // Use demo data
      setRequests(DEMO_REQUESTS);
      setLoading(false);
      return;
    }

    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchRequests();
    }
  }, [authLoading, user, isDemoMode, navigate]);

  const fetchRequests = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch user's reward requests
    const { data: requestsData, error } = await supabase
      .from('reward_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      setLoading(false);
      return;
    }

    // Fetch rewards to join
    const rewardIds = [...new Set(requestsData?.map(r => r.reward_id) || [])];
    
    let rewardsMap = new Map<string, { name: string; cost: number; icon: string }>();
    
    if (rewardIds.length > 0) {
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('id, name, cost, icon')
        .in('id', rewardIds);

      (rewardsData || []).forEach(r => {
        rewardsMap.set(r.id, { name: r.name, cost: r.cost, icon: r.icon });
      });
    }

    const enrichedRequests: RewardRequest[] = (requestsData || []).map(request => ({
      id: request.id,
      reward_id: request.reward_id,
      status: request.status,
      teacher_notes: request.teacher_notes,
      created_at: request.created_at,
      updated_at: request.updated_at,
      rewards: rewardsMap.get(request.reward_id) || null,
    }));

    setRequests(enrichedRequests);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
            <Clock className="h-3 w-3" /> 승인 대기중
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="gap-1 bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3" /> 승인됨
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> 거절됨
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return '선생님이 확인 중이에요. 조금만 기다려주세요!';
      case 'approved':
        return '축하해요! 선생님께 보상을 받으세요.';
      case 'rejected':
        return '이번에는 어려웠어요. 다음에 다시 도전해보세요!';
      default:
        return '';
    }
  };

  if (!isDemoMode && (authLoading || loading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold">내 요청 현황</h1>
              <p className="text-xs text-muted-foreground">보상 교환 요청 상태</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Demo mode indicator */}
        {isDemoMode && (
          <Badge variant="secondary" className="gap-1">
            <FlaskConical className="h-3 w-3" />
            {demoRole === 'teacher' ? '선생님' : '학생'} 테스트 모드
          </Badge>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <Clock className="h-6 w-6 mx-auto mb-1 text-amber-500" />
                <p className="text-2xl font-bold">{pendingCount}건</p>
                <p className="text-xs text-muted-foreground">승인 대기중</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-500" />
                <p className="text-2xl font-bold">{approvedCount}건</p>
                <p className="text-xs text-muted-foreground">승인 완료</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">요청 내역</CardTitle>
            <CardDescription>총 {requests.length}건의 요청</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">아직 요청한 보상이 없어요</p>
                <p className="text-sm mt-1">보상 교환소에서 원하는 보상을 교환해보세요!</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/')}
                >
                  보상 교환소 가기
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/30"
                  >
                    {/* Icon */}
                    <div className="text-3xl flex-shrink-0">
                      {request.rewards?.icon || '🎁'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">
                          {request.rewards?.name || '알 수 없는 보상'}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <EcoCoin size="xs" />
                        <span>{request.rewards?.cost || 0} 코인</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(request.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>

                      <p className="text-sm text-muted-foreground mt-2">
                        {getStatusMessage(request.status)}
                      </p>

                      {request.teacher_notes && (
                        <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="text-xs text-muted-foreground">선생님 메모</p>
                          <p className="text-sm text-foreground">{request.teacher_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
