import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { School, Loader2, CheckCircle } from 'lucide-react';

interface JoinedClass {
  id: string;
  name: string;
  description: string | null;
}

interface JoinClassProps {
  onJoined?: () => void;
  isDemoMode?: boolean;
}

const DEMO_JOINED_CLASSES: JoinedClass[] = [
  { id: 'demo-class-1', name: '6학년 1반', description: '2026년 1학기' },
];

export function JoinClass({ onJoined, isDemoMode = false }: JoinClassProps) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinedClasses, setJoinedClasses] = useState<JoinedClass[]>(isDemoMode ? DEMO_JOINED_CLASSES : []);
  const [loadingClasses, setLoadingClasses] = useState(!isDemoMode);

  // Fetch joined classes on mount
  useEffect(() => {
    if (isDemoMode) return;
    if (!user) { setLoadingClasses(false); return; }
    (async () => {
      setLoadingClasses(true);
      const { data: memberships } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('user_id', user.id);

      if (memberships && memberships.length > 0) {
        const classIds = memberships.map(m => m.class_id);
        const { data: classData } = await supabase
          .from('classes')
          .select('id, name, description')
          .in('id', classIds);
        setJoinedClasses(classData || []);
      }
      setLoadingClasses(false);
    })();
  }, [user, isDemoMode]);

  const handleJoin = async () => {
    if (!user || !code.trim()) return;
    setLoading(true);

    // Find class by join code
    const { data: classData, error: findError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('join_code', code.trim().toLowerCase())
      .maybeSingle();

    if (findError || !classData) {
      toast.error('학급을 찾을 수 없습니다', { description: '참여 코드를 다시 확인해주세요' });
      setLoading(false);
      return;
    }

    // Check if already joined
    const { data: existing } = await supabase
      .from('class_members')
      .select('id')
      .eq('class_id', classData.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      toast.error('이미 참여한 학급입니다');
      setLoading(false);
      return;
    }

    // Join class
    const { error: joinError } = await supabase
      .from('class_members')
      .insert({ class_id: classData.id, user_id: user.id });

    if (joinError) {
      toast.error('학급 참여 실패', { description: joinError.message });
    } else {
      toast.success(`"${classData.name}" 학급에 참여했습니다! 🎉`);
      setCode('');
      setJoinedClasses(prev => [...prev, { id: classData.id, name: classData.name, description: null }]);
      onJoined?.();
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <School className="h-5 w-5" />
          내 학급
        </CardTitle>
        <CardDescription>참여 코드를 입력하여 학급에 참여하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Join form */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="참여 코드 입력 (예: a1b2c3)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              className="font-mono"
            />
          </div>
          <Button onClick={handleJoin} disabled={loading || !code.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '참여'}
          </Button>
        </div>

        {/* Joined classes */}
        {loadingClasses ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : joinedClasses.length > 0 ? (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">참여 중인 학급</Label>
            <div className="flex flex-wrap gap-2">
              {joinedClasses.map((cls) => (
                <Badge key={cls.id} variant="secondary" className="gap-1 px-3 py-1.5">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {cls.name}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            아직 참여한 학급이 없습니다. 선생님에게 참여 코드를 받으세요!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
