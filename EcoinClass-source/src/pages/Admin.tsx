import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/hooks/useDemoMode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EcoCoin } from '@/components/EcoCoin';
import { ClassChart } from '@/components/ClassChart';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Users,
  Gift,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  ArrowLeft,
  Loader2,
  Shield,
  FlaskConical,
  MessageSquare,
  Trash2,
  RotateCcw,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface StudentProfile {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  total_coins: number;
  total_carbon_saved: number;
  class_name: string;
  created_at: string;
  mining_count?: number;
}

// 탄소 절감량(g) 기준 에코 레벨
const ECO_LEVELS = [
  { min: 0, label: '새싹', icon: '🌱' },
  { min: 10000, label: '풀잎', icon: '🌿' },
  { min: 30000, label: '나무', icon: '🌳' },
  { min: 80000, label: '지구 지킴이', icon: '🌏' },
  { min: 150000, label: '에코 히어로', icon: '⭐' },
];

function getEcoLevel(carbonSaved: number) {
  const level = [...ECO_LEVELS].reverse().find(l => carbonSaved >= l.min) || ECO_LEVELS[0];
  return level;
}

interface RewardRequest {
  id: string;
  user_id: string;
  reward_id: string;
  status: string;
  teacher_notes: string | null;
  created_at: string;
  profiles: { name: string } | null;
  rewards: { name: string; cost: number; icon: string } | null;
}

interface ClassStatsData {
  totalStudents: number;
  totalCoins: number;
  totalCarbonSaved: number;
  pendingRequests: number;
}

// Demo mock data
const DEMO_STUDENTS: StudentProfile[] = [
  { id: '0', user_id: 'demo-student-user-id', name: '테스트 학생', email: 'student@test.com', total_coins: 150, total_carbon_saved: 45000, class_name: '6학년 1반', created_at: '2026-01-20', mining_count: 32 },
  { id: '1', user_id: 'u1', name: '김민준', email: 'minjun@school.com', total_coins: 250, total_carbon_saved: 75000, class_name: '6학년 1반', created_at: '2026-01-16', mining_count: 58 },
  { id: '2', user_id: 'u2', name: '이서연', email: 'seoyeon@school.com', total_coins: 180, total_carbon_saved: 54000, class_name: '6학년 1반', created_at: '2026-01-17', mining_count: 41 },
  { id: '3', user_id: 'u3', name: '박지호', email: 'jiho@school.com', total_coins: 150, total_carbon_saved: 45000, class_name: '6학년 1반', created_at: '2026-01-18', mining_count: 35 },
  { id: '4', user_id: 'u4', name: '최예은', email: 'yeeun@school.com', total_coins: 120, total_carbon_saved: 36000, class_name: '6학년 1반', created_at: '2026-01-19', mining_count: 28 },
];

const DEMO_REWARD_REQUESTS: RewardRequest[] = [
  { id: 'r1', user_id: 'u1', reward_id: 'rw1', status: 'pending', teacher_notes: null, created_at: '2024-02-01', profiles: { name: '김민준' }, rewards: { name: '자리 바꾸기', cost: 50, icon: '🪑' } },
  { id: 'r2', user_id: 'u2', reward_id: 'rw2', status: 'pending', teacher_notes: null, created_at: '2024-02-02', profiles: { name: '이서연' }, rewards: { name: '숙제 면제권', cost: 100, icon: '📝' } },
  { id: 'r3', user_id: 'u3', reward_id: 'rw3', status: 'approved', teacher_notes: null, created_at: '2024-01-28', profiles: { name: '박지호' }, rewards: { name: '간식 쿠폰', cost: 30, icon: '🍪' } },
];

const DEMO_CLASS_STATS: ClassStatsData = {
  totalStudents: 5,
  totalCoins: 850,
  totalCarbonSaved: 255000,
  pendingRequests: 2,
};

export default function Admin() {
  const navigate = useNavigate();
  const { user, isTeacher: authIsTeacher, isSuperAdmin: authIsSuperAdmin, isMiniAdmin: authIsMiniAdmin, loading: authLoading, signOut } = useAuth();
  const { isDemoMode, isTeacher: demoIsTeacher, exitDemoMode } = useDemoMode();
  
  const isTeacher = isDemoMode ? demoIsTeacher : authIsTeacher;
  const isSuperAdmin = isDemoMode ? false : authIsSuperAdmin;
  const isMiniAdmin = isDemoMode ? false : authIsMiniAdmin;
  const canAccess = isTeacher || isMiniAdmin;
  
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
  const [classStats, setClassStats] = useState<ClassStatsData | null>(null);
  const [dailyData, setDailyData] = useState<{ date: string; coins: number; carbon: number }[]>([]);
  const [teachers, setTeachers] = useState<{ user_id: string; name: string; email: string; created_at: string }[]>([]);

  // Monthly stats state
  const [statsMonth, setStatsMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [monthlyStudentStats, setMonthlyStudentStats] = useState<{ name: string; coins: number; carbon: number; count: number }[]>([]);
  const [monthlyClassStats, setMonthlyClassStats] = useState({ totalCoins: 0, totalCarbonSaved: 0, totalMining: 0 });
  const [monthlyDailyData, setMonthlyDailyData] = useState<{ date: string; coins: number; carbon: number }[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RewardRequest | null>(null);
  const [teacherNote, setTeacherNote] = useState('');

  // Reset dialog state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<'single' | 'all'>('all');
  const [resetTargetStudent, setResetTargetStudent] = useState<StudentProfile | null>(null);
  const [resetOptions, setResetOptions] = useState({ coins: true, carbon: true, mining: true });
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    // For demo mode, skip auth checks
    if (isDemoMode) {
      if (!demoIsTeacher) {
        toast.error('선생님 계정으로만 접근 가능합니다');
        navigate('/');
        return;
      }
      setStudents(DEMO_STUDENTS);
      setRewardRequests(DEMO_REWARD_REQUESTS);
      setClassStats(DEMO_CLASS_STATS);
      setDailyData([
        { date: '월', coins: 120, carbon: 3600 },
        { date: '화', coins: 150, carbon: 4500 },
        { date: '수', coins: 180, carbon: 5400 },
        { date: '목', coins: 200, carbon: 6000 },
        { date: '금', coins: 140, carbon: 4200 },
      ]);
      setLoading(false);
      return;
    }

    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && user && !canAccess) {
      toast.error('접근 권한이 없습니다');
      navigate('/');
      return;
    }

    if (canAccess) {
      fetchAllData();
    }
  }, [authLoading, user, canAccess, isDemoMode, demoIsTeacher, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStudents(),
      fetchRewardRequests(),
      fetchClassStats(),
      fetchWeeklyData(),
      ...(isSuperAdmin ? [fetchTeachers()] : []),
    ]);
    setLoading(false);
  };

  const fetchTeachers = async () => {
    const { data: teacherRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'teacher');

    if (!teacherRoles || teacherRoles.length === 0) {
      setTeachers([]);
      return;
    }

    const teacherIds = teacherRoles.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name, email, created_at')
      .in('user_id', teacherIds);

    setTeachers((profiles || []).map(p => ({
      user_id: p.user_id,
      name: p.name,
      email: p.email || '',
      created_at: p.created_at,
    })));
  };

  const handleRemoveTeacher = async (teacherUserId: string) => {
    // Remove teacher role (they become just a student or lose access)
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', teacherUserId)
      .eq('role', 'teacher');

    if (error) {
      toast.error('선생님 역할 삭제에 실패했습니다');
      return;
    }
    toast.success('선생님 역할이 삭제되었습니다');
    fetchTeachers();
  };

  const openResetDialog = (target: 'single' | 'all', student?: StudentProfile) => {
    setResetTarget(target);
    setResetTargetStudent(student || null);
    setResetOptions({ coins: true, carbon: true, mining: true });
    setResetDialogOpen(true);
  };

  const handleResetData = async () => {
    setResetting(true);
    try {
      const targetUserIds = resetTarget === 'single' && resetTargetStudent
        ? [resetTargetStudent.user_id]
        : students.map(s => s.user_id);

      if (targetUserIds.length === 0) { setResetting(false); return; }

      const promises: Promise<any>[] = [];

      // Reset profile coins and carbon
      if (resetOptions.coins || resetOptions.carbon) {
        const updateData: Record<string, number> = {};
        if (resetOptions.coins) updateData.total_coins = 0;
        if (resetOptions.carbon) updateData.total_carbon_saved = 0;

        for (const uid of targetUserIds) {
          promises.push(
            Promise.resolve(supabase.from('profiles').update(updateData).eq('user_id', uid))
          );
        }
      }

      // Delete mining records
      if (resetOptions.mining) {
        for (const uid of targetUserIds) {
          promises.push(
            Promise.resolve(supabase.from('mining_records').delete().eq('user_id', uid))
          );
        }
      }

      await Promise.all(promises);

      toast.success(
        resetTarget === 'single'
          ? `${resetTargetStudent?.name}님의 데이터가 초기화되었습니다`
          : `전체 학생 ${targetUserIds.length}명의 데이터가 초기화되었습니다`
      );
      setResetDialogOpen(false);
      await fetchAllData();
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('초기화 중 오류가 발생했습니다');
    } finally {
      setResetting(false);
    }
  };

  const fetchStudents = async () => {
    // Get student user_ids from user_roles
    const { data: studentRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    if (!studentRoles || studentRoles.length === 0) {
      setStudents([]);
      return;
    }

    const studentUserIds = studentRoles.map(r => r.user_id);

    const [{ data: profiles, error }, { data: miningRecords }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .in('user_id', studentUserIds)
        .order('total_coins', { ascending: false }),
      supabase
        .from('mining_records')
        .select('user_id')
        .in('user_id', studentUserIds),
    ]);

    if (error) {
      console.error('Error fetching students:', error);
      return;
    }

    const miningCountMap = new Map<string, number>();
    miningRecords?.forEach(r => miningCountMap.set(r.user_id, (miningCountMap.get(r.user_id) || 0) + 1));

    setStudents((profiles || []).map(p => ({
      ...p,
      mining_count: miningCountMap.get(p.user_id) || 0,
    })));
  };

  const fetchRewardRequests = async () => {
    // Fetch reward requests
    const { data: requestsData, error: requestsError } = await supabase
      .from('reward_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching reward requests:', requestsError);
      return;
    }

    // Fetch profiles and rewards to join manually
    const userIds = [...new Set(requestsData?.map(r => r.user_id) || [])];
    const rewardIds = [...new Set(requestsData?.map(r => r.reward_id) || [])];

    const [profilesResult, rewardsResult] = await Promise.all([
      userIds.length > 0 
        ? supabase.from('profiles').select('user_id, name').in('user_id', userIds)
        : { data: [] as { user_id: string; name: string }[] },
      rewardIds.length > 0
        ? supabase.from('rewards').select('id, name, cost, icon').in('id', rewardIds)
        : { data: [] as { id: string; name: string; cost: number; icon: string }[] },
    ]);

    const profilesMap = new Map<string, { name: string }>();
    (profilesResult.data || []).forEach(p => {
      profilesMap.set(p.user_id, { name: p.name });
    });

    const rewardsMap = new Map<string, { name: string; cost: number; icon: string }>();
    (rewardsResult.data || []).forEach(r => {
      rewardsMap.set(r.id, { name: r.name, cost: r.cost, icon: r.icon });
    });

    const enrichedRequests: RewardRequest[] = (requestsData || []).map(request => ({
      id: request.id,
      user_id: request.user_id,
      reward_id: request.reward_id,
      status: request.status,
      teacher_notes: request.teacher_notes,
      created_at: request.created_at,
      profiles: profilesMap.get(request.user_id) || null,
      rewards: rewardsMap.get(request.reward_id) || null,
    }));

    setRewardRequests(enrichedRequests);
  };

  const fetchClassStats = async () => {
    // Filter to students only
    const { data: studentRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    const studentUserIds = studentRoles?.map(r => r.user_id) || [];

    const { data: profiles } = studentUserIds.length > 0
      ? await supabase.from('profiles').select('total_coins, total_carbon_saved').in('user_id', studentUserIds)
      : { data: [] as { total_coins: number; total_carbon_saved: number }[] };

    const { count: pendingCount } = await supabase
      .from('reward_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (profiles) {
      const totalCoins = profiles.reduce((sum, p) => sum + p.total_coins, 0);
      const totalCarbonSaved = profiles.reduce((sum, p) => sum + p.total_carbon_saved, 0);

      setClassStats({
        totalStudents: profiles.length,
        totalCoins,
        totalCarbonSaved,
        pendingRequests: pendingCount || 0,
      });
    }

  };

  const fetchWeeklyData = async () => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6);

    const { data: records } = await supabase
      .from('mining_records')
      .select('coins_earned, carbon_saved, created_at')
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: true });

    if (!records || records.length === 0) {
      setDailyData([]);
      return;
    }

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dailyMap = new Map<string, { date: string; coins: number; carbon: number }>();

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, { date: dayNames[d.getDay()], coins: 0, carbon: 0 });
    }

    records.forEach(r => {
      const key = new Date(r.created_at).toISOString().split('T')[0];
      const existing = dailyMap.get(key);
      if (existing) {
        existing.coins += r.coins_earned;
        existing.carbon += r.carbon_saved;
      }
    });

    setDailyData(Array.from(dailyMap.values()));
  };

  // Fetch monthly stats
  const fetchMonthlyStats = async (year: number, month: number) => {
    setLoadingMonthly(true);
    const monthStart = new Date(year, month, 1).toISOString();
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const { data: records } = await supabase
      .from('mining_records')
      .select('user_id, coins_earned, carbon_saved, created_at')
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd);

    // Per-student aggregation
    const userMap = new Map<string, { coins: number; carbon: number; count: number }>();
    (records || []).forEach(r => {
      const existing = userMap.get(r.user_id) || { coins: 0, carbon: 0, count: 0 };
      userMap.set(r.user_id, {
        coins: existing.coins + r.coins_earned,
        carbon: existing.carbon + r.carbon_saved,
        count: existing.count + 1,
      });
    });

    const userIds = Array.from(userMap.keys());
    let profileMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', userIds);
      (profiles || []).forEach(p => profileMap.set(p.user_id, p.name));
    }

    const studentStats = Array.from(userMap.entries()).map(([uid, stats]) => ({
      name: profileMap.get(uid) || '알 수 없음',
      ...stats,
    })).sort((a, b) => b.coins - a.coins);

    setMonthlyStudentStats(studentStats);
    setMonthlyClassStats({
      totalCoins: studentStats.reduce((s, st) => s + st.coins, 0),
      totalCarbonSaved: studentStats.reduce((s, st) => s + st.carbon, 0),
      totalMining: studentStats.reduce((s, st) => s + st.count, 0),
    });

    // Daily data for the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyMap = new Map<string, { date: string; coins: number; carbon: number }>();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${d}일`;
      dailyMap.set(String(d), { date: key, coins: 0, carbon: 0 });
    }
    (records || []).forEach(r => {
      const day = String(new Date(r.created_at).getDate());
      const existing = dailyMap.get(day);
      if (existing) {
        existing.coins += r.coins_earned;
        existing.carbon += r.carbon_saved;
      }
    });
    setMonthlyDailyData(Array.from(dailyMap.values()));
    setLoadingMonthly(false);
  };

  useEffect(() => {
    if (!isDemoMode && canAccess) {
      fetchMonthlyStats(statsMonth.year, statsMonth.month);
    }
  }, [statsMonth, isDemoMode, canAccess]);

  const changeMonth = (delta: number) => {
    setStatsMonth(prev => {
      let newMonth = prev.month + delta;
      let newYear = prev.year;
      if (newMonth < 0) { newMonth = 11; newYear--; }
      if (newMonth > 11) { newMonth = 0; newYear++; }
      return { year: newYear, month: newMonth };
    });
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return statsMonth.year === now.getFullYear() && statsMonth.month === now.getMonth();
  };

  const handleApproveRequest = async (requestId: string) => {
    if (isDemoMode) {
      // Demo mode - update local state
      setRewardRequests(prev => 
        prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r)
      );
      setClassStats(prev => prev ? { ...prev, pendingRequests: Math.max(0, prev.pendingRequests - 1) } : prev);
      toast.success('보상이 승인되었습니다 ✅');
      return;
    }

    const { error } = await supabase
      .from('reward_requests')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      toast.error('처리 중 오류가 발생했습니다');
    } else {
      toast.success('보상이 승인되었습니다 ✅');
      fetchRewardRequests();
      fetchClassStats();
    }
  };

  const openRejectDialog = (request: RewardRequest) => {
    setSelectedRequest(request);
    setTeacherNote('');
    setRejectDialogOpen(true);
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    if (isDemoMode) {
      // Demo mode - update local state
      setRewardRequests(prev => 
        prev.map(r => r.id === selectedRequest.id 
          ? { ...r, status: 'rejected', teacher_notes: teacherNote || null } 
          : r
        )
      );
      setClassStats(prev => prev ? { ...prev, pendingRequests: Math.max(0, prev.pendingRequests - 1) } : prev);
      toast.success('보상이 거절되었습니다');
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      return;
    }

    const { error } = await supabase
      .from('reward_requests')
      .update({ 
        status: 'rejected',
        teacher_notes: teacherNote || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedRequest.id);

    if (error) {
      toast.error('처리 중 오류가 발생했습니다');
    } else {
      toast.success('보상이 거절되었습니다');
      fetchRewardRequests();
      fetchClassStats();
    }
    setRejectDialogOpen(false);
    setSelectedRequest(null);
  };

  const handleLogout = async () => {
    if (isDemoMode) {
      exitDemoMode();
    } else {
      await signOut();
    }
    navigate('/auth');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> 대기중</Badge>;
      case 'approved':
        return <Badge className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> 승인</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> 거절</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-lg font-bold">관리자 페이지</h1>
                <p className="text-xs text-muted-foreground">
                  {isSuperAdmin ? '👑 총관리자' : isMiniAdmin ? '⭐ 꼬마관리자' : '🏫 학급 관리자'}
                </p>
              </div>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </header>

      <main className="container py-6">
        <Tabs defaultValue={isMiniAdmin && !isTeacher ? 'rewards' : 'students'} className="space-y-6">
          <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {isTeacher && (
              <TabsTrigger value="students" className="gap-2">
                <Users className="h-4 w-4" />
                학생 관리
              </TabsTrigger>
            )}
            <TabsTrigger value="rewards" className="gap-2">
              <Gift className="h-4 w-4" />
              보상 승인
              {classStats && classStats.pendingRequests > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {classStats.pendingRequests}
                </Badge>
              )}
            </TabsTrigger>
            {isTeacher && (
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                통계
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="teachers" className="gap-2">
                <Shield className="h-4 w-4" />
                선생님 관리
              </TabsTrigger>
            )}
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>전체 학생 목록</CardTitle>
                  <CardDescription>총 {students.length}명의 학생</CardDescription>
                </div>
                {isTeacher && students.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-destructive hover:text-destructive"
                    onClick={() => openResetDialog('all')}
                  >
                    <RotateCcw className="h-4 w-4" />
                    전체 초기화
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>순위</TableHead>
                        <TableHead>이름</TableHead>
                        <TableHead>계정</TableHead>
                        <TableHead>에코 레벨</TableHead>
                        <TableHead className="text-right">보유 코인</TableHead>
                        <TableHead className="text-right">탄소 절감량</TableHead>
                        <TableHead className="text-right">채굴 횟수</TableHead>
                        <TableHead>가입일</TableHead>
                        {isTeacher && <TableHead className="text-right">관리</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => {
                        const level = getEcoLevel(student.total_carbon_saved);
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                            </TableCell>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {student.email || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="gap-1">
                                <span>{level.icon}</span>
                                {level.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <EcoCoin size="xs" />
                                {student.total_coins}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {(student.total_carbon_saved / 1000).toFixed(1)}kg
                            </TableCell>
                            <TableCell className="text-right">
                              {student.mining_count ?? 0}회
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(student.created_at).toLocaleDateString('ko-KR')}
                            </TableCell>
                            {isTeacher && (
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => openResetDialog('single', student)}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>보상 교환 요청</CardTitle>
                <CardDescription>학생들의 보상 교환 요청을 승인하거나 거절하세요</CardDescription>
              </CardHeader>
              <CardContent>
                {rewardRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    보상 요청이 없습니다
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>학생</TableHead>
                        <TableHead>보상</TableHead>
                        <TableHead>비용</TableHead>
                        <TableHead>요청일</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead className="text-right">액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rewardRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.profiles?.name || '알 수 없음'}
                          </TableCell>
                          <TableCell>
                            <span className="mr-2">{request.rewards?.icon}</span>
                            {request.rewards?.name || '알 수 없음'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <EcoCoin size="xs" />
                              {request.rewards?.cost || 0}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString('ko-KR')}
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-right">
                            {request.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleApproveRequest(request.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => openRejectDialog(request)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {request.status === 'rejected' && request.teacher_notes && (
                              <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                                <MessageSquare className="h-3 w-3" />
                                <span className="max-w-[100px] truncate">{request.teacher_notes}</span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">📊 누적 통계</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{classStats?.totalStudents || 0}명</p>
                    <p className="text-sm text-muted-foreground">전체 학생</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <EcoCoin size="md" />
                    <p className="text-2xl font-bold mt-2">{classStats?.totalCoins?.toLocaleString() || 0}</p>
                    <p className="text-sm text-muted-foreground">총 발행 코인</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <span className="text-3xl">🌍</span>
                    <p className="text-2xl font-bold mt-2">
                      {((classStats?.totalCarbonSaved || 0) / 1000).toFixed(1)}kg
                    </p>
                    <p className="text-sm text-muted-foreground">총 탄소 절감량</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Gift className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold">{classStats?.pendingRequests || 0}건</p>
                    <p className="text-sm text-muted-foreground">대기중인 보상</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>주간 코인 획득 추이</CardTitle></CardHeader>
                <CardContent>
                  <ClassChart data={dailyData} metric="coins" type="bar" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>주간 탄소 절감 추이</CardTitle></CardHeader>
                <CardContent>
                  <ClassChart data={dailyData} metric="carbon" type="area" />
                </CardContent>
              </Card>
            </div>

            {/* Monthly Stats */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  📅 월별 통계
                </h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold text-foreground min-w-[100px] text-center">
                    {statsMonth.year}년 {statsMonth.month + 1}월
                  </span>
                  <Button variant="outline" size="icon" onClick={() => changeMonth(1)} disabled={isCurrentMonth()}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {loadingMonthly ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <EcoCoin size="md" />
                          <p className="text-2xl font-bold mt-2">{monthlyClassStats.totalCoins.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">이달 획득 코인</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <span className="text-3xl">🌍</span>
                          <p className="text-2xl font-bold mt-2">{(monthlyClassStats.totalCarbonSaved / 1000).toFixed(1)}kg</p>
                          <p className="text-sm text-muted-foreground">이달 탄소 절감</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <span className="text-3xl">⛏️</span>
                          <p className="text-2xl font-bold mt-2">{monthlyClassStats.totalMining}회</p>
                          <p className="text-sm text-muted-foreground">이달 총 채굴</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader><CardTitle>{statsMonth.month + 1}월 일별 코인 추이</CardTitle></CardHeader>
                      <CardContent>
                        <ClassChart data={monthlyDailyData} metric="coins" type="bar" />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle>{statsMonth.month + 1}월 일별 탄소 절감 추이</CardTitle></CardHeader>
                      <CardContent>
                        <ClassChart data={monthlyDailyData} metric="carbon" type="area" />
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>🏆 {statsMonth.month + 1}월 학생별 순위</CardTitle>
                      <CardDescription>이달 활동 기준 학생 순위입니다</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {monthlyStudentStats.length === 0 ? (
                        <p className="text-center text-muted-foreground py-6">이달 활동 데이터가 없습니다</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>순위</TableHead>
                              <TableHead>이름</TableHead>
                              <TableHead className="text-right">이달 코인</TableHead>
                              <TableHead className="text-right">이달 탄소 절감</TableHead>
                              <TableHead className="text-right">채굴 횟수</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {monthlyStudentStats.map((s, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">
                                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                                </TableCell>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <EcoCoin size="xs" />
                                    {s.coins}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{(s.carbon / 1000).toFixed(1)}kg</TableCell>
                                <TableCell className="text-right">{s.count}회</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
          {/* Teachers Tab (Super Admin only) */}
          {isSuperAdmin && (
            <TabsContent value="teachers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>선생님 계정 관리</CardTitle>
                  <CardDescription>등록된 학급 관리자(선생님) 목록입니다</CardDescription>
                </CardHeader>
                <CardContent>
                  {teachers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">등록된 선생님이 없습니다</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>이름</TableHead>
                          <TableHead>계정</TableHead>
                          <TableHead>가입일</TableHead>
                          <TableHead className="text-right">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teachers.map(teacher => (
                          <TableRow key={teacher.user_id}>
                            <TableCell className="font-medium">{teacher.name}</TableCell>
                            <TableCell className="text-muted-foreground">{teacher.email}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(teacher.created_at).toLocaleDateString('ko-KR')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleRemoveTeacher(teacher.user_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

        </Tabs>
      </main>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              보상 거절
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedRequest?.profiles?.name}님의 "{selectedRequest?.rewards?.name}" 요청을 거절합니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher-note">학생에게 전달할 메모 (선택)</Label>
              <Textarea
                id="teacher-note"
                placeholder="거절 사유나 다음에 도움이 될 메시지를 작성해주세요..."
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleRejectRequest}>
              거절하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resetTarget === 'single'
                ? `${resetTargetStudent?.name}님의 데이터 초기화`
                : `전체 학생 (${students.length}명) 데이터 초기화`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              초기화된 데이터는 복구할 수 없습니다. 초기화할 항목을 선택하세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reset-coins"
                checked={resetOptions.coins}
                onCheckedChange={(checked) => setResetOptions(prev => ({ ...prev, coins: !!checked }))}
              />
              <label htmlFor="reset-coins" className="text-sm font-medium">
                보유 코인 초기화 (0으로 리셋)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reset-carbon"
                checked={resetOptions.carbon}
                onCheckedChange={(checked) => setResetOptions(prev => ({ ...prev, carbon: !!checked }))}
              />
              <label htmlFor="reset-carbon" className="text-sm font-medium">
                탄소 절감량 초기화 (0으로 리셋)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reset-mining"
                checked={resetOptions.mining}
                onCheckedChange={(checked) => setResetOptions(prev => ({ ...prev, mining: !!checked }))}
              />
              <label htmlFor="reset-mining" className="text-sm font-medium">
                채굴 기록 삭제 (모든 채굴 내역 삭제)
              </label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetData}
              disabled={resetting || (!resetOptions.coins && !resetOptions.carbon && !resetOptions.mining)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  초기화 중...
                </>
              ) : '초기화 실행'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
