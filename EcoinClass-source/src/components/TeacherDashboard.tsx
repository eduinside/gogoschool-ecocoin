import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClassroomManager } from '@/components/ClassroomManager';
import { EcoActionManager } from '@/components/EcoActionManager';
import { ClassMissionManager } from '@/components/ClassMissionManager';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EcoCoin } from '@/components/EcoCoin';
import { ClassChart } from '@/components/ClassChart';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  Shield,
  Loader2,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';

interface StudentProfile {
  id: string;
  user_id: string;
  name: string;
  total_coins: number;
  total_carbon_saved: number;
  class_name: string;
  created_at: string;
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

// Demo data
const DEMO_STUDENTS: StudentProfile[] = [
  { id: '0', user_id: 'demo-student-user-id', name: '테스트 학생', total_coins: 150, total_carbon_saved: 45000, class_name: '6학년 1반', created_at: '2026-01-20' },
  { id: '1', user_id: 'u1', name: '김민준', total_coins: 250, total_carbon_saved: 75000, class_name: '6학년 1반', created_at: '2026-01-16' },
  { id: '2', user_id: 'u2', name: '이서연', total_coins: 180, total_carbon_saved: 54000, class_name: '6학년 1반', created_at: '2026-01-17' },
  { id: '3', user_id: 'u3', name: '박지호', total_coins: 150, total_carbon_saved: 45000, class_name: '6학년 1반', created_at: '2026-01-18' },
  { id: '4', user_id: 'u4', name: '최예은', total_coins: 120, total_carbon_saved: 36000, class_name: '6학년 1반', created_at: '2026-01-19' },
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

interface TeacherDashboardProps {
  isDemoMode: boolean;
  teacherName: string;
}

export function TeacherDashboard({ isDemoMode, teacherName }: TeacherDashboardProps) {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
  const [classStats, setClassStats] = useState<ClassStatsData | null>(null);
  const [dailyData, setDailyData] = useState<{ date: string; coins: number; carbon: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RewardRequest | null>(null);
  const [teacherNote, setTeacherNote] = useState('');

  useEffect(() => {
    if (isDemoMode) {
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
    fetchAllData();
  }, [isDemoMode]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchStudents(), fetchRewardRequests(), fetchClassStats()]);
    setLoading(false);
  };

  const fetchStudents = async () => {
    // Filter to students only (exclude teachers)
    const { data: studentRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    if (!studentRoles || studentRoles.length === 0) {
      setStudents([]);
      return;
    }

    const studentUserIds = studentRoles.map(r => r.user_id);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', studentUserIds)
      .order('total_coins', { ascending: false });
    if (data) setStudents(data);
  };

  const fetchRewardRequests = async () => {
    const { data: requestsData } = await supabase.from('reward_requests').select('*').order('created_at', { ascending: false });
    if (!requestsData) return;

    const userIds = [...new Set(requestsData.map(r => r.user_id))];
    const rewardIds = [...new Set(requestsData.map(r => r.reward_id))];

    const [profilesResult, rewardsResult] = await Promise.all([
      userIds.length > 0 ? supabase.from('profiles').select('user_id, name').in('user_id', userIds) : { data: [] as { user_id: string; name: string }[] },
      rewardIds.length > 0 ? supabase.from('rewards').select('id, name, cost, icon').in('id', rewardIds) : { data: [] as { id: string; name: string; cost: number; icon: string }[] },
    ]);

    const profilesMap = new Map<string, { name: string }>();
    (profilesResult.data || []).forEach(p => profilesMap.set(p.user_id, { name: p.name }));

    const rewardsMap = new Map<string, { name: string; cost: number; icon: string }>();
    (rewardsResult.data || []).forEach(r => rewardsMap.set(r.id, { name: r.name, cost: r.cost, icon: r.icon }));

    setRewardRequests(requestsData.map(request => ({
      ...request,
      profiles: profilesMap.get(request.user_id) || null,
      rewards: rewardsMap.get(request.reward_id) || null,
    })));
  };

  const fetchClassStats = async () => {
    // Filter to students only for stats
    const { data: studentRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    const studentUserIds = studentRoles?.map(r => r.user_id) || [];

    const { data: profiles } = studentUserIds.length > 0
      ? await supabase.from('profiles').select('total_coins, total_carbon_saved').in('user_id', studentUserIds)
      : { data: [] as { total_coins: number; total_carbon_saved: number }[] };

    const { count: pendingCount } = await supabase.from('reward_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');

    if (profiles) {
      setClassStats({
        totalStudents: profiles.length,
        totalCoins: profiles.reduce((sum, p) => sum + p.total_coins, 0),
        totalCarbonSaved: profiles.reduce((sum, p) => sum + p.total_carbon_saved, 0),
        pendingRequests: pendingCount || 0,
      });
    }

    const days = ['월', '화', '수', '목', '금'];
    setDailyData(days.map((day, i) => ({
      date: day,
      coins: Math.floor(Math.random() * 100) + 50 + i * 20,
      carbon: Math.floor(Math.random() * 1000) + 500 + i * 200,
    })));
  };

  const handleApproveRequest = async (requestId: string) => {
    if (isDemoMode) {
      setRewardRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r));
      setClassStats(prev => prev ? { ...prev, pendingRequests: Math.max(0, prev.pendingRequests - 1) } : prev);
      toast.success('보상이 승인되었습니다 ✅');
      return;
    }
    const { error } = await supabase.from('reward_requests').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', requestId);
    if (error) toast.error('처리 중 오류가 발생했습니다');
    else { toast.success('보상이 승인되었습니다 ✅'); fetchRewardRequests(); fetchClassStats(); }
  };

  const openRejectDialog = (request: RewardRequest) => {
    setSelectedRequest(request);
    setTeacherNote('');
    setRejectDialogOpen(true);
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    if (isDemoMode) {
      setRewardRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: 'rejected', teacher_notes: teacherNote || null } : r));
      setClassStats(prev => prev ? { ...prev, pendingRequests: Math.max(0, prev.pendingRequests - 1) } : prev);
      toast.success('보상이 거절되었습니다');
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      return;
    }
    const { error } = await supabase.from('reward_requests').update({ status: 'rejected', teacher_notes: teacherNote || null, updated_at: new Date().toISOString() }).eq('id', selectedRequest.id);
    if (error) toast.error('처리 중 오류가 발생했습니다');
    else { toast.success('보상이 거절되었습니다'); fetchRewardRequests(); fetchClassStats(); }
    setRejectDialogOpen(false);
    setSelectedRequest(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> 대기중</Badge>;
      case 'approved': return <Badge className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> 승인</Badge>;
      case 'rejected': return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> 거절</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingRequests = rewardRequests.filter(r => r.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="container py-4 sm:py-6 space-y-4 sm:space-y-6 px-3 sm:px-4">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-hero-gradient p-4 sm:p-8 text-primary-foreground">
        <div className="relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8" />
            <h2 className="text-lg sm:text-3xl font-bold">
              {teacherName.replace(' 선생님', '')}, 안녕하세요! 🍎
            </h2>
          </div>
          <p className="text-primary-foreground/80 mb-3 sm:mb-4 text-sm sm:text-base">학급 환경 활동을 한눈에 관리하세요</p>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4">
            <div className="bg-primary-foreground/20 backdrop-blur-sm rounded-xl px-2.5 py-2 sm:px-4 sm:py-3">
              <p className="text-[10px] sm:text-sm opacity-80">전체 학생</p>
              <p className="text-base sm:text-2xl font-bold">{classStats?.totalStudents || 0}명</p>
            </div>
            <div className="bg-primary-foreground/20 backdrop-blur-sm rounded-xl px-2.5 py-2 sm:px-4 sm:py-3">
              <p className="text-[10px] sm:text-sm opacity-80">대기중 요청</p>
              <p className="text-base sm:text-2xl font-bold">{classStats?.pendingRequests || 0}건</p>
            </div>
            <div className="bg-primary-foreground/20 backdrop-blur-sm rounded-xl px-2.5 py-2 sm:px-4 sm:py-3">
              <p className="text-[10px] sm:text-sm opacity-80">총 발행 코인</p>
              <p className="text-base sm:text-2xl font-bold flex items-center gap-1">
                <EcoCoin size="xs" />
                {classStats?.totalCoins?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-primary-foreground/20 backdrop-blur-sm rounded-xl px-2.5 py-2 sm:px-4 sm:py-3">
              <p className="text-[10px] sm:text-sm opacity-80">총 탄소 절감</p>
              <p className="text-base sm:text-2xl font-bold">🌍 {((classStats?.totalCarbonSaved || 0) / 1000).toFixed(1)}kg</p>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 text-4xl sm:text-6xl opacity-20">🍎</div>
        <div className="absolute -bottom-4 -right-4 w-24 h-24 sm:w-32 sm:h-32 bg-primary-foreground/10 rounded-full" />
      </div>

      {/* Classroom Management */}
      <ClassroomManager isDemoMode={isDemoMode} />

      {/* Eco Action Management */}
      <EcoActionManager isDemoMode={isDemoMode} />

      {/* Class Mission Management */}
      <ClassMissionManager isDemoMode={isDemoMode} />

      {/* Pending Reward Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-2 border-amber-500/30">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Gift className="h-5 w-5 text-amber-500" />
              대기중인 보상 요청
              <Badge variant="destructive">{pendingRequests.length}</Badge>
            </CardTitle>
            <CardDescription className="mt-2 text-xs sm:text-sm">학생들의 보상 교환 요청을 승인하거나 거절하세요</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {/* Mobile card view */}
            <div className="space-y-3 sm:hidden">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{request.profiles?.name || '알 수 없음'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {request.rewards?.icon} {request.rewards?.name} · <span className="inline-flex items-center gap-0.5"><EcoCoin size="xs" />{request.rewards?.cost || 0}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">{new Date(request.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600" onClick={() => handleApproveRequest(request.id)}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600" onClick={() => openRejectDialog(request)}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table view */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학생</TableHead>
                    <TableHead>보상</TableHead>
                    <TableHead>비용</TableHead>
                    <TableHead>요청일</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.profiles?.name || '알 수 없음'}</TableCell>
                      <TableCell>
                        <span className="mr-2">{request.rewards?.icon}</span>
                        {request.rewards?.name || '알 수 없음'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1"><EcoCoin size="xs" />{request.rewards?.cost || 0}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(request.created_at).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700" onClick={() => handleApproveRequest(request.id)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => openRejectDialog(request)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Ranking & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Student Ranking */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-5 w-5" />
              학생 순위
            </CardTitle>
            <CardDescription className="mt-2 text-xs sm:text-sm">코인 보유량 기준 상위 학생</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-2 sm:space-y-3">
              {students.slice(0, 5).map((student, index) => (
                <div key={student.id} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-muted/50">
                  <span className="text-base sm:text-lg font-bold w-6 sm:w-8 text-center shrink-0">
                    {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-eco-gradient flex items-center justify-center text-primary-foreground text-xs sm:text-sm font-bold shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm sm:text-base truncate">{student.name}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{(student.total_carbon_saved / 1000).toFixed(1)}kg 절감</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <EcoCoin size="xs" />
                    <span className="font-bold text-foreground text-sm">{student.total_coins}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 text-sm" onClick={() => navigate('/admin')}>
              전체 학생 관리 →
            </Button>
          </CardContent>
        </Card>

        {/* Weekly Chart */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart3 className="h-5 w-5" />
              주간 활동 추이
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <ClassChart data={dailyData} metric="coins" type="bar" />
            <div className="mt-4">
              <ClassChart data={dailyData} metric="carbon" type="area" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent All Requests */}
      {rewardRequests.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">최근 보상 요청 내역</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {/* Mobile card view */}
            <div className="space-y-2 sm:hidden">
              {rewardRequests.slice(0, 10).map((request) => (
                <div key={request.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{request.profiles?.name || '알 수 없음'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {request.rewards?.icon} {request.rewards?.name} · <EcoCoin size="xs" />{request.rewards?.cost || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{new Date(request.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <div className="shrink-0">{getStatusBadge(request.status)}</div>
                </div>
              ))}
            </div>
            {/* Desktop table view */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학생</TableHead>
                    <TableHead>보상</TableHead>
                    <TableHead>비용</TableHead>
                    <TableHead>요청일</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewardRequests.slice(0, 10).map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.profiles?.name || '알 수 없음'}</TableCell>
                      <TableCell>
                        <span className="mr-2">{request.rewards?.icon}</span>
                        {request.rewards?.name || '알 수 없음'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1"><EcoCoin size="xs" />{request.rewards?.cost || 0}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(request.created_at).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

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
            <p className="text-sm text-muted-foreground">
              {selectedRequest?.profiles?.name}님의 "{selectedRequest?.rewards?.name}" 요청을 거절합니다.
            </p>
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
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={handleRejectRequest}>거절하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
