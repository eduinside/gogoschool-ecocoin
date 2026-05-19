import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Leaf, Loader2 } from 'lucide-react';

interface EcoActionRow {
  id: string;
  action_key: string;
  name: string;
  name_ko: string;
  description: string;
  carbon_reduction: number;
  coin_value: number;
  icon: string;
  category: string;
  daily_limit: number | null;
  available: boolean;
}

const DEMO_ECO_ACTIONS: EcoActionRow[] = [
  {
    id: 'demo-action-1',
    action_key: 'tumbler_use',
    name: 'Bring Reusable Cup',
    name_ko: '텀블러 이용하기',
    description: '일회용 컵 대신 텀블러를 사용했어요!',
    carbon_reduction: 50,
    coin_value: 10,
    icon: '🥤',
    category: 'recycling',
    daily_limit: 1,
    available: true,
  },
  {
    id: 'demo-action-3',
    action_key: 'recycling',
    name: 'Recycle Materials',
    name_ko: '분리수거하기',
    description: '캔, 플라스틱, 종이를 분리수거했어요!',
    carbon_reduction: 100,
    coin_value: 15,
    icon: '♻️',
    category: 'recycling',
    daily_limit: 3,
    available: true,
  },
  {
    id: 'demo-action-4',
    action_key: 'no_leftover',
    name: 'No Food Waste',
    name_ko: '잔반 남기지 않기',
    description: '급식을 남기지 않고 깨끗이 먹었어요!',
    carbon_reduction: 80,
    coin_value: 12,
    icon: '🍱',
    category: 'food',
    daily_limit: 1,
    available: true,
  },
  {
    id: 'demo-action-5',
    action_key: 'walk_to_school',
    name: 'Walk to School',
    name_ko: '걸어서 등교하기',
    description: '자동차 대신 걸어서 등교했어요!',
    carbon_reduction: 200,
    coin_value: 25,
    icon: '🚶',
    category: 'transport',
    daily_limit: 1,
    available: true,
  },
];

const ICON_OPTIONS = [
  '🌱', '♻️', '🌍', '💧', '☀️', '🌿', '🍃', '🌳',
  '🚶', '🚲', '🧃', '☕', '🥤', '🍱', '🥗', '🧹',
  '💡', '🔌', '📄', '🛍️', '🌊', '🐾', '🦋', '⛏️',
  '🏃', '🧊', '🌻', '🍎', '🥛', '🧴', '🪥', '🧤',
];

const CATEGORIES = [
  { value: 'food', label: '음식' },
  { value: 'recycling', label: '재활용' },
  { value: 'energy', label: '에너지' },
  { value: 'water', label: '물' },
  { value: 'transport', label: '이동' },
];

const emptyForm: Omit<EcoActionRow, 'id'> = {
  action_key: '',
  name: '',
  name_ko: '',
  description: '',
  carbon_reduction: 0,
  coin_value: 0,
  icon: '🌱',
  category: 'recycling',
  daily_limit: 1,
  available: true,
};

interface EcoActionManagerProps {
  isDemoMode?: boolean;
}

export function EcoActionManager({ isDemoMode = false }: EcoActionManagerProps) {
  const [actions, setActions] = useState<EcoActionRow[]>(isDemoMode ? DEMO_ECO_ACTIONS : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<EcoActionRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isDemoMode) return;
    fetchActions();
  }, [isDemoMode]);

  const fetchActions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('eco_actions')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setActions(data);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingAction(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (action: EcoActionRow) => {
    setEditingAction(action);
    setForm({
      action_key: action.action_key,
      name: action.name,
      name_ko: action.name_ko,
      description: action.description,
      carbon_reduction: action.carbon_reduction,
      coin_value: action.coin_value,
      icon: action.icon,
      category: action.category,
      daily_limit: action.daily_limit,
      available: action.available,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name_ko.trim() || !form.action_key.trim()) {
      toast.error('이름과 키를 입력해주세요');
      return;
    }
    setSaving(true);

    if (isDemoMode) {
      if (editingAction) {
        setActions(prev => prev.map(a => a.id === editingAction.id ? { ...a, ...form } : a));
        toast.success('환경 행동이 수정되었습니다 ✅');
      } else {
        const newAction: EcoActionRow = { ...form, id: `demo-action-${Date.now()}` };
        setActions(prev => [...prev, newAction]);
        toast.success('환경 행동이 추가되었습니다 🌱');
      }
      setSaving(false);
      setDialogOpen(false);
      return;
    }

    if (editingAction) {
      const { error } = await supabase
        .from('eco_actions')
        .update({
          action_key: form.action_key,
          name: form.name,
          name_ko: form.name_ko,
          description: form.description,
          carbon_reduction: form.carbon_reduction,
          coin_value: form.coin_value,
          icon: form.icon,
          category: form.category,
          daily_limit: form.daily_limit,
          available: form.available,
        })
        .eq('id', editingAction.id);
      if (error) toast.error('수정 실패', { description: error.message });
      else toast.success('환경 행동이 수정되었습니다 ✅');
    } else {
      const { error } = await supabase.from('eco_actions').insert({
        action_key: form.action_key,
        name: form.name,
        name_ko: form.name_ko,
        description: form.description,
        carbon_reduction: form.carbon_reduction,
        coin_value: form.coin_value,
        icon: form.icon,
        category: form.category,
        daily_limit: form.daily_limit,
        available: form.available,
      });
      if (error) toast.error('추가 실패', { description: error.message });
      else toast.success('환경 행동이 추가되었습니다 🌱');
    }

    setSaving(false);
    setDialogOpen(false);
    if (!isDemoMode) fetchActions();
  };

  const handleDelete = async (id: string) => {
    if (isDemoMode) {
      setActions(actions.filter(a => a.id !== id));
      toast.success('삭제되었습니다');
      return;
    }
    const { error } = await supabase.from('eco_actions').delete().eq('id', id);
    if (error) toast.error('삭제 실패');
    else { toast.success('삭제되었습니다'); fetchActions(); }
  };

  const handleToggleAvailable = async (action: EcoActionRow) => {
    if (isDemoMode) {
      setActions(actions.map(a => 
        a.id === action.id ? { ...a, available: !a.available } : a
      ));
      return;
    }
    await supabase
      .from('eco_actions')
      .update({ available: !action.available })
      .eq('id', action.id);
    fetchActions();
  };

  const getCategoryLabel = (cat: string) =>
    CATEGORIES.find(c => c.value === cat)?.label || cat;

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
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Leaf className="h-5 w-5" />
              환경 행동 관리
            </CardTitle>
            <CardDescription className="mt-3 text-xs sm:text-sm">환경 행동을 추가, 수정하고 1일 채굴 한도를 설정하세요</CardDescription>
          </div>
          <Button className="gap-1 sm:gap-2 shrink-0 text-xs sm:text-sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">행동 추가</span>
            <span className="sm:hidden">추가</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {/* Mobile card view */}
        <div className="space-y-2 sm:hidden">
          {actions.map((action) => (
            <div key={action.id} className="p-3 rounded-xl bg-muted/50 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">{action.icon}</span>
                  <span className="font-medium text-sm text-foreground truncate">{action.name_ko}</span>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Switch checked={action.available} className="scale-75" />
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(action)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(action.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground pl-8">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{getCategoryLabel(action.category)}</Badge>
                <span>💰 {action.coin_value}</span>
                <span>🌍 {action.carbon_reduction}g</span>
                <span>📊 {action.daily_limit ? `${action.daily_limit}회/일` : '무제한'}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>아이콘</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead className="text-right">코인</TableHead>
                <TableHead className="text-right">탄소(g)</TableHead>
                <TableHead className="text-right">1일 한도</TableHead>
                <TableHead className="text-center">활성</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell className="text-2xl">{action.icon}</TableCell>
                  <TableCell className="font-medium">{action.name_ko}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getCategoryLabel(action.category)}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">{action.coin_value}</TableCell>
                  <TableCell className="text-right">{action.carbon_reduction}g</TableCell>
                  <TableCell className="text-right">
                    {action.daily_limit ? `${action.daily_limit}회` : '무제한'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={action.available} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(action)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(action.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAction ? '환경 행동 수정' : '환경 행동 추가'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>아이콘</Label>
              <div className="grid grid-cols-8 gap-1.5 p-2 rounded-xl border border-border bg-muted/30 max-h-[120px] overflow-y-auto">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, icon }))}
                    className={`text-xl p-1.5 rounded-lg transition-all hover:bg-accent ${
                      form.icon === icon ? 'bg-primary/20 ring-2 ring-primary scale-110' : ''
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
                <Label>이름 (한국어)</Label>
                <Input
                  value={form.name_ko}
                  onChange={(e) => setForm(f => ({ ...f, name_ko: e.target.value }))}
                  placeholder="잔반 남기지 않기"
                />
              </div>
            <div className="space-y-2">
              <Label>키 (영문, 고유값)</Label>
              <Input
                value={form.action_key}
                onChange={(e) => setForm(f => ({ ...f, action_key: e.target.value }))}
                placeholder="no-leftover"
              />
            </div>
            <div className="space-y-2">
              <Label>이름 (영문)</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="No Food Waste"
              />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="급식을 남기지 않고 깨끗이 먹었어요!"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>코인 보상</Label>
                <Input
                  type="number"
                  value={form.coin_value}
                  onChange={(e) => setForm(f => ({ ...f, coin_value: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>탄소 절감량 (g)</Label>
                <Input
                  type="number"
                  value={form.carbon_reduction}
                  onChange={(e) => setForm(f => ({ ...f, carbon_reduction: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>카테고리</Label>
                <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>1일 채굴 한도</Label>
                <Input
                  type="number"
                  value={form.daily_limit ?? ''}
                  onChange={(e) => setForm(f => ({
                    ...f,
                    daily_limit: e.target.value ? parseInt(e.target.value) : null,
                  }))}
                  placeholder="무제한"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.available}
                onCheckedChange={(v) => setForm(f => ({ ...f, available: v }))}
              />
              <Label>활성화</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingAction ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
