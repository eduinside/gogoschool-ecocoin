import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Target, Plus, Trash2, Loader2 } from 'lucide-react';

interface Mission {
  id: string;
  class_id: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  mission_type: string;
  reward_description: string | null;
  status: string;
  end_date: string | null;
}

interface ClassMissionManagerProps {
  isDemoMode?: boolean;
}

const DEMO_MISSIONS: Mission[] = [
  {
    id: 'demo-mission-1',
    class_id: 'demo-class-1',
    title: '이번 주 학급 500코인 달성!',
    description: '우리 반 전체가 힘을 합쳐 500코인을 모아봐요!',
    target_value: 500,
    current_value: 320,
    mission_type: 'total_coins',
    reward_description: '학급 전체 간식 파티!',
    status: 'active',
    end_date: '2026-02-20',
  },
];

const DEMO_CLASSES = [{ id: 'demo-class-1', name: '6학년 1반' }];

export function ClassMissionManager({ isDemoMode = false }: ClassMissionManagerProps) {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>(isDemoMode ? DEMO_MISSIONS : []);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>(isDemoMode ? DEMO_CLASSES : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    class_id: '',
    title: '',
    description: '',
    target_value: 100,
    mission_type: 'total_coins',
    reward_description: '',
    end_date: '',
  });

  const fetchData = useCallback(async () => {
    if (!user || isDemoMode) return;
    setLoading(true);

    const [missionsRes, classesRes] = await Promise.all([
      supabase.from('class_missions').select('*').eq('teacher_id', user.id).order('created_at', { ascending: false }),
      supabase.from('classes').select('id, name').eq('teacher_id', user.id),
    ]);

    if (missionsRes.data) setMissions(missionsRes.data);
    if (classesRes.data) setClasses(classesRes.data);
    setLoading(false);
  }, [user, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) return;
    if (user) fetchData();
    else setLoading(false);
  }, [user, fetchData, isDemoMode]);

  const handleCreate = async () => {
    if (!user || !form.class_id || !form.title) {
      toast.error('학급과 미션명을 입력해주세요');
      return;
    }

    const { error } = await supabase.from('class_missions').insert({
      class_id: form.class_id,
      teacher_id: user.id,
      title: form.title,
      description: form.description,
      target_value: form.target_value,
      mission_type: form.mission_type,
      reward_description: form.reward_description || null,
      end_date: form.end_date || null,
    });

    if (error) {
      toast.error('미션 생성에 실패했습니다');
      return;
    }

    toast.success('새 미션이 등록되었습니다! 🎯');
    setDialogOpen(false);
    setForm({ class_id: '', title: '', description: '', target_value: 100, mission_type: 'total_coins', reward_description: '', end_date: '' });
    fetchData();
  };

  const handleUpdateProgress = async (missionId: string, newValue: number) => {
    await supabase.from('class_missions').update({ current_value: newValue }).eq('id', missionId);
    toast.success('진행도가 업데이트되었습니다');
    fetchData();
  };

  const handleComplete = async (missionId: string) => {
    await supabase.from('class_missions').update({ status: 'completed' }).eq('id', missionId);
    toast.success('미션이 완료되었습니다! 🎉');
    fetchData();
  };

  const handleDelete = async (missionId: string) => {
    await supabase.from('class_missions').delete().eq('id', missionId);
    toast.success('미션이 삭제되었습니다');
    fetchData();
  };

  const missionTypes: Record<string, string> = {
    total_coins: '총 코인 달성',
    total_carbon: '총 탄소 절감 (g)',
    mining_count: '총 채굴 횟수',
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
    <>
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Target className="h-5 w-5" /> 학급 미션 관리
              </CardTitle>
              <CardDescription className="mt-3 text-xs sm:text-sm">학급 공동 목표를 설정하고 진행 상황을 관리하세요</CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-1 shrink-0 text-xs sm:text-sm" disabled={classes.length === 0}>
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">미션 추가</span><span className="sm:hidden">추가</span>
            </Button>
          </div>
          {classes.length === 0 && (
            <p className="text-sm text-muted-foreground">⚠️ 먼저 학급을 개설해주세요</p>
          )}
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
          {missions.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">등록된 미션이 없습니다</p>
          ) : (
            missions.map(mission => {
              const progress = mission.target_value > 0
                ? Math.min(100, (mission.current_value / mission.target_value) * 100)
                : 0;

              return (
                <div key={mission.id} className="p-3 sm:p-4 rounded-xl border border-border space-y-2 sm:space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-1.5 flex-wrap">
                        🎯 <span className="truncate">{mission.title}</span>
                        <Badge variant={mission.status === 'active' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                          {mission.status === 'active' ? '진행 중' : '완료'}
                        </Badge>
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{mission.description}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">유형: {missionTypes[mission.mission_type] || mission.mission_type}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" onClick={() => handleDelete(mission.id)}>
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                    </Button>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span>{mission.current_value} / {mission.target_value}</span>
                      <span className="font-semibold">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2.5 sm:h-3" />
                  </div>

                  {mission.status === 'active' && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="진행도"
                        className="w-24 sm:w-32 text-sm"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleUpdateProgress(mission.id, Number((e.target as HTMLInputElement).value));
                          }
                        }}
                      />
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => handleComplete(mission.id)}>
                        완료 처리
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 학급 미션 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div>
              <Label>학급 선택</Label>
              <Select value={form.class_id} onValueChange={v => setForm(f => ({ ...f, class_id: v }))}>
                <SelectTrigger><SelectValue placeholder="학급을 선택하세요" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>미션명</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="예: 이번 주 500코인 달성!" />
            </div>
            <div>
              <Label>설명</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="미션에 대한 설명을 입력하세요" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>미션 유형</Label>
                <Select value={form.mission_type} onValueChange={v => setForm(f => ({ ...f, mission_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_coins">총 코인 달성</SelectItem>
                    <SelectItem value="total_carbon">총 탄소 절감</SelectItem>
                    <SelectItem value="mining_count">총 채굴 횟수</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>목표 값</Label>
                <Input type="number" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <Label>달성 보상 (선택)</Label>
              <Input value={form.reward_description} onChange={e => setForm(f => ({ ...f, reward_description: e.target.value }))} placeholder="예: 학급 전체 간식 파티!" />
            </div>
            <div>
              <Label>마감일 (선택)</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleCreate}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
