import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { StudentDashboard } from '@/components/StudentDashboard';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { RoleSelection } from '@/components/RoleSelection';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode, DEMO_STUDENT_BADGES, DEMO_CLASS_STATS } from '@/hooks/useDemoMode';
import { useEcoDatabase } from '@/hooks/useEcoDatabase';
import { EcoAction } from '@/types/eco-coin';
import { Loader2, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Index() {
  const navigate = useNavigate();
  const { user, profile, role, isTeacher: authIsTeacher, isMiniAdmin: authIsMiniAdmin, loading: authLoading, signOut, refreshProfile } = useAuth();
  const { isDemoMode, demoRole, demoProfile, isTeacher: demoIsTeacher, exitDemoMode, updateDemoCoins, spendDemoCoins } = useDemoMode();
  const { classStats, canMine, mineAction, requestReward, actions, rewards, getActionById, loading: dataLoading } = useEcoDatabase();

  const isTeacher = isDemoMode ? demoIsTeacher : authIsTeacher;
  const isMiniAdmin = isDemoMode ? false : authIsMiniAdmin;
  const currentProfile = isDemoMode ? demoProfile : profile;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Redirect to auth if not logged in and not in demo mode
  useEffect(() => {
    if (!authLoading && !user && !isDemoMode) {
      navigate('/auth');
    }
  }, [authLoading, user, isDemoMode, navigate]);

  const handleMine = async (action: EcoAction): Promise<boolean> => {
    if (isDemoMode) {
      updateDemoCoins(action.coinValue, action.carbonReduction);
      toast.success(`⛏️ ${action.nameKo} 채굴 완료! +${action.coinValue} 코인`);
      return true;
    }
    if (!user) { toast.error('로그인이 필요합니다'); return false; }
    
    // Quick limit check first
    const allowed = await canMine(action.id);
    if (!allowed) {
      toast.error('오늘 채굴 한도에 도달했습니다', {
        description: `${action.nameKo}은(는) 1일 한도에 도달했습니다.`,
      });
      return false;
    }
    
    // Return true immediately, mine in background
    mineAction(action).then(() => refreshProfile());
    return true;
  };

  const handleRedeem = async (reward: typeof rewards[0]) => {
    if (isDemoMode) {
      if ((demoProfile?.total_coins || 0) < reward.cost) { toast.error('코인이 부족합니다'); return; }
      spendDemoCoins(reward.cost);
      toast.success(`🎉 ${reward.name} 교환 요청 완료!`, { description: '선생님 승인 후 사용할 수 있습니다.' });
      return;
    }
    if (!user) { toast.error('로그인이 필요합니다'); return; }
    const result = await requestReward(reward);
    if (result && 'success' in result) {
      toast.success(`🎉 ${reward.name} 교환을 요청했어요!`, { description: '선생님 승인 후 사용할 수 있습니다.' });
      await refreshProfile();
    } else if (result && 'error' in result) {
      toast.error('교환 실패', { description: result.error });
    }
  };

  const handleLogout = async () => {
    if (isDemoMode) { exitDemoMode(); } else { await signOut(); }
    navigate('/');
  };

  if (!isDemoMode && (authLoading || dataLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isDemoMode && (!user || !profile)) return null;

  // Show role selection for users without a role (e.g., Google OAuth signups)
  if (!isDemoMode && user && !role) {
    return <RoleSelection userId={user.id} onRoleSelected={refreshProfile} />;
  }

  const displayProfile = currentProfile;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with logout */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-lg">
        <div className="container flex h-14 sm:h-16 items-center justify-between gap-2 px-3 sm:px-4">
          <Header totalCoins={displayProfile?.total_coins || 0} studentName={displayProfile?.name || '사용자'} />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground text-xs sm:text-sm shrink-0 px-2 sm:px-3">
            {isDemoMode ? '종료' : '로그아웃'}
          </Button>
        </div>
      </header>

      {/* Demo mode indicator */}
      {isDemoMode && (
        <div className="container py-2">
          <Badge variant="secondary" className="gap-1">
            <FlaskConical className="h-3 w-3" />
            {demoRole === 'teacher' ? '선생님' : '학생'} 테스트 모드
          </Badge>
        </div>
      )}

      {/* Mini admin notice */}
      {isMiniAdmin && !isTeacher && (
        <div className="container py-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => navigate('/admin')}
          >
            ⭐ 꼬마관리자 페이지
          </Button>
        </div>
      )}

      {/* Role-based dashboard */}
      {isTeacher ? (
        <TeacherDashboard
          isDemoMode={isDemoMode}
          teacherName={displayProfile?.name || '선생님'}
        />
      ) : (
        <StudentDashboard
          profile={{
            id: displayProfile?.id || '',
            name: displayProfile?.name || '학생',
            total_coins: displayProfile?.total_coins || 0,
            total_carbon_saved: displayProfile?.total_carbon_saved || 0,
          }}
          actions={actions}
          rewards={rewards}
          classStats={classStats}
          onMine={handleMine}
          onRedeem={handleRedeem}
          getActionById={getActionById}
          isDemoMode={isDemoMode}
          demoBadges={isDemoMode ? DEMO_STUDENT_BADGES : undefined}
          demoClassStats={isDemoMode ? DEMO_CLASS_STATS : undefined}
        />
      )}
    </div>
  );
}
