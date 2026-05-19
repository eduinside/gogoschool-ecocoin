import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EcoCoin } from '@/components/EcoCoin';
import { toast } from 'sonner';
import { Plus, Copy, Users, Trash2, School, Loader2, CalendarDays, Pickaxe, Mail, Star } from 'lucide-react';

interface ClassMember {
  user_id: string;
  name: string;
  email?: string;
  total_coins: number;
  total_carbon_saved: number;
  joined_at?: string;
  mining_count?: number;
  is_mini_admin?: boolean;
}

// 탄소 절감량(g) 기준 에코 레벨
const ECO_LEVELS = [
  { min: 0, label: '새싹', icon: '🌱' },
  { min: 10000, label: '풀잎', icon: '🌿' },       // 10kg
  { min: 30000, label: '나무', icon: '🌳' },       // 30kg
  { min: 80000, label: '지구 지킴이', icon: '🌏' }, // 80kg
  { min: 150000, label: '에코 히어로', icon: '⭐' }, // 150kg
];

function getEcoLevel(carbonSaved: number) {
  const level = [...ECO_LEVELS].reverse().find(l => carbonSaved >= l.min) || ECO_LEVELS[0];
  return level;
}

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
  teacher_id: string;
  created_at: string;
  memberCount?: number;
  members?: ClassMember[];
}

interface ClassroomManagerProps {
  isDemoMode?: boolean;
}

const DEMO_CLASSES: ClassData[] = [
  {
    id: 'demo-class-1',
    name: '6학년 1반',
    description: '2026년 1학기',
    join_code: 'ECO123',
    teacher_id: 'demo-teacher-user-id',
    created_at: '2026-01-15',
    memberCount: 5,
    members: [
      { user_id: 'demo-student-user-id', name: '테스트 학생', email: 'student@test.com', total_coins: 150, total_carbon_saved: 45000, joined_at: '2026-01-20', mining_count: 32 },
      { user_id: 'u1', name: '김민준', email: 'minjun@school.com', total_coins: 250, total_carbon_saved: 75000, joined_at: '2026-01-16', mining_count: 58 },
      { user_id: 'u2', name: '이서연', email: 'seoyeon@school.com', total_coins: 180, total_carbon_saved: 54000, joined_at: '2026-01-17', mining_count: 41 },
      { user_id: 'u3', name: '박지호', email: 'jiho@school.com', total_coins: 150, total_carbon_saved: 45000, joined_at: '2026-01-18', mining_count: 35 },
      { user_id: 'u4', name: '최예은', email: 'yeeun@school.com', total_coins: 120, total_carbon_saved: 36000, joined_at: '2026-01-19', mining_count: 28 },
    ],
  },
];

export function ClassroomManager({ isDemoMode = false }: ClassroomManagerProps) {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>(isDemoMode ? DEMO_CLASSES : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [createOpen, setCreateOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(isDemoMode ? DEMO_CLASSES[0] : null);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    if (isDemoMode) return;
    if (user) fetchClasses();
    else setLoading(false);
  }, [user, isDemoMode]);

  const fetchClasses = async () => {
    setLoading(true);
    const { data: classData } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });

    if (classData) {
      // Fetch member counts
      const classIds = classData.map(c => c.id);
      const { data: members } = await supabase
        .from('class_members')
        .select('class_id')
        .in('class_id', classIds);

      const countMap = new Map<string, number>();
      members?.forEach(m => countMap.set(m.class_id, (countMap.get(m.class_id) || 0) + 1));

      setClasses(classData.map(c => ({ ...c, memberCount: countMap.get(c.id) || 0 })));
    }
    setLoading(false);
  };

  const handleCreateClass = async () => {
    if (!user || !newClassName.trim()) return;
    setCreating(true);

    const { error } = await supabase.from('classes').insert({
      name: newClassName.trim(),
      description: newClassDesc.trim() || null,
      teacher_id: user.id,
    });

    if (error) {
      toast.error('학급 생성 실패', { description: error.message });
    } else {
      toast.success('학급이 생성되었습니다! 🎉');
      setCreateOpen(false);
      setNewClassName('');
      setNewClassDesc('');
      fetchClasses();
    }
    setCreating(false);
  };

  const handleDeleteClass = async (classId: string) => {
    const { error } = await supabase.from('classes').delete().eq('id', classId);
    if (error) toast.error('삭제 실패');
    else { toast.success('학급이 삭제되었습니다'); fetchClasses(); setSelectedClass(null); }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('참여 코드가 복사되었습니다! 📋');
  };

  const handleSelectClass = async (cls: ClassData) => {
    if (isDemoMode) {
      setSelectedClass(cls);
      return;
    }
    setSelectedClass(cls);
    setMembersLoading(true);

    const { data: memberData } = await supabase
      .from('class_members')
      .select('user_id, joined_at')
      .eq('class_id', cls.id);

    if (memberData && memberData.length > 0) {
      const userIds = memberData.map(m => m.user_id);
      const joinedMap = new Map(memberData.map(m => [m.user_id, m.joined_at]));

      const [{ data: profiles }, { data: miningRecords }, { data: miniAdminRoles }] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, name, email, total_coins, total_carbon_saved')
          .in('user_id', userIds),
        supabase
          .from('mining_records')
          .select('user_id')
          .in('user_id', userIds),
        supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'mini_admin')
          .in('user_id', userIds),
      ]);

      const miningCountMap = new Map<string, number>();
      miningRecords?.forEach(r => miningCountMap.set(r.user_id, (miningCountMap.get(r.user_id) || 0) + 1));

      const miniAdminSet = new Set((miniAdminRoles || []).map(r => r.user_id));

      setSelectedClass(prev => prev ? {
        ...prev,
        members: (profiles || []).map(p => ({
          user_id: p.user_id,
          name: p.name,
          email: p.email || undefined,
          total_coins: p.total_coins,
          total_carbon_saved: p.total_carbon_saved,
          joined_at: joinedMap.get(p.user_id) || undefined,
          mining_count: miningCountMap.get(p.user_id) || 0,
          is_mini_admin: miniAdminSet.has(p.user_id),
        })),
      } : null);
    } else {
      setSelectedClass(prev => prev ? { ...prev, members: [] } : null);
    }
    setMembersLoading(false);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedClass) return;
    const { error } = await supabase
      .from('class_members')
      .delete()
      .eq('class_id', selectedClass.id)
      .eq('user_id', userId);

    if (error) toast.error('학생 제거 실패');
    else {
      toast.success('학생이 학급에서 제거되었습니다');
      handleSelectClass(selectedClass);
      fetchClasses();
    }
  };

  const handleToggleMiniAdmin = async (userId: string, currentlyMiniAdmin: boolean) => {
    if (currentlyMiniAdmin) {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'mini_admin');
      if (error) { toast.error('꼬마관리자 해제 실패'); return; }
      toast.success('꼬마관리자 권한이 해제되었습니다');
    } else {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'mini_admin' });
      if (error) { toast.error('꼬마관리자 지정 실패'); return; }
      toast.success('꼬마관리자로 지정되었습니다! ⭐');
    }
    if (selectedClass) handleSelectClass(selectedClass);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Class List */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <School className="h-5 w-5" />
                학급 관리
              </CardTitle>
              <CardDescription className="mt-3 text-xs sm:text-sm">학급을 개설하고 학생을 관리하세요</CardDescription>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1 sm:gap-2 shrink-0 text-xs sm:text-sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">학급 개설</span>
                  <span className="sm:hidden">개설</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 학급 개설</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="class-name">학급 이름</Label>
                    <Input
                      id="class-name"
                      placeholder="예: 6학년 1반"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class-desc">설명 (선택)</Label>
                    <Input
                      id="class-desc"
                      placeholder="예: 2026년 1학기"
                      value={newClassDesc}
                      onChange={(e) => setNewClassDesc(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>취소</Button>
                  <Button onClick={handleCreateClass} disabled={creating || !newClassName.trim()}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    개설하기
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {classes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <School className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>아직 개설된 학급이 없습니다</p>
              <p className="text-sm">위의 "학급 개설" 버튼을 눌러 시작하세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedClass?.id === cls.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleSelectClass(cls)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-foreground">{cls.name}</h3>
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {cls.memberCount}명
                    </Badge>
                  </div>
                  {cls.description && (
                    <p className="text-sm text-muted-foreground mb-3">{cls.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">참여 코드:</span>
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono font-bold text-foreground">
                      {cls.join_code}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); handleCopyCode(cls.join_code); }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Class Details */}
      {selectedClass && (
        <Card>
        <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg truncate">{selectedClass.name} 학생 목록</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  참여 코드: <code className="font-mono font-bold">{selectedClass.join_code}</code>
                </CardDescription>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1 shrink-0 text-xs sm:text-sm"
                onClick={() => handleDeleteClass(selectedClass.id)}
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">학급 삭제</span>
                <span className="sm:hidden">삭제</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !selectedClass.members || selectedClass.members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>아직 참여한 학생이 없습니다</p>
                <p className="text-sm mt-1">
                  참여 코드 <code className="font-mono font-bold">{selectedClass.join_code}</code>를 학생들에게 공유하세요
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 sm:gap-4 mb-3 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary fill-primary" />
                    = 꼬마관리자
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                    클릭하여 지정/해제
                  </span>
                </div>

                {/* Mobile card view */}
                <div className="space-y-2 sm:hidden">
                  {selectedClass.members.map((member) => {
                    const level = getEcoLevel(member.total_carbon_saved);
                    return (
                      <div key={member.user_id} className="p-3 rounded-xl bg-muted/50 border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-sm text-foreground truncate">{member.name}</span>
                            {member.is_mini_admin && (
                              <Badge variant="outline" className="text-[10px] gap-0.5 shrink-0">⭐</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 w-7 p-0 ${member.is_mini_admin ? 'text-amber-500' : 'text-muted-foreground'}`}
                              onClick={() => handleToggleMiniAdmin(member.user_id, !!member.is_mini_admin)}
                            >
                              <Star className={`h-3.5 w-3.5 ${member.is_mini_admin ? 'fill-current' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive"
                              onClick={() => handleRemoveMember(member.user_id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                          <Badge variant="secondary" className="gap-0.5 text-[10px]">
                            <span>{level.icon}</span>{level.label}
                          </Badge>
                          <span className="flex items-center gap-0.5"><EcoCoin size="xs" />{member.total_coins}</span>
                          <span>🌍 {(member.total_carbon_saved / 1000).toFixed(1)}kg</span>
                          <span>⛏️ {member.mining_count ?? 0}회</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table view */}
                <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>계정</TableHead>
                      <TableHead>에코 레벨</TableHead>
                      <TableHead className="text-right">보유 코인</TableHead>
                      <TableHead className="text-right">탄소 절감량</TableHead>
                      <TableHead className="text-right">채굴 횟수</TableHead>
                      <TableHead>가입일</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedClass.members.map((member) => {
                      const level = getEcoLevel(member.total_carbon_saved);
                      return (
                        <TableRow key={member.user_id}>
                          <TableCell className="font-medium">
                            {member.name}
                            {member.is_mini_admin && (
                              <Badge variant="outline" className="ml-2 text-xs gap-0.5">⭐ 꼬마관리자</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email || '-'}
                            </div>
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
                              {member.total_coins}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {(member.total_carbon_saved / 1000).toFixed(1)}kg
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Pickaxe className="h-3 w-3 text-muted-foreground" />
                              {member.mining_count ?? 0}회
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {member.joined_at
                              ? new Date(member.joined_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={member.is_mini_admin ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground hover:text-amber-500'}
                                onClick={() => handleToggleMiniAdmin(member.user_id, !!member.is_mini_admin)}
                                title={member.is_mini_admin ? '꼬마관리자 해제' : '꼬마관리자 지정'}
                              >
                                <Star className={`h-4 w-4 ${member.is_mini_admin ? 'fill-current' : ''}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleRemoveMember(member.user_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
