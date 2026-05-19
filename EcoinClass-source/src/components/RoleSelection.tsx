import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EcoCoin } from '@/components/EcoCoin';
import { User, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RoleSelectionProps {
  userId: string;
  onRoleSelected: () => void;
}

export function RoleSelection({ userId, onRoleSelected }: RoleSelectionProps) {
  const [loading, setLoading] = useState(false);

  const handleSelectRole = async (role: 'student' | 'teacher') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role }, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success(`${role === 'teacher' ? '선생님' : '학생'}으로 설정되었습니다! 🎉`);
      onRoleSelected();
    } catch (error: any) {
      toast.error('역할 설정 실패', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <EcoCoin size="lg" animated />
            <div>
              <h1 className="text-3xl font-bold text-gradient-eco">Eco-Coin</h1>
              <p className="text-sm text-muted-foreground">탄소 화폐 거래소</p>
            </div>
          </div>
          <p className="text-muted-foreground">
            역할을 선택해주세요! 🌱
          </p>
        </div>

        <Card className="border-2 shadow-card">
          <CardHeader className="text-center">
            <CardTitle>역할 선택</CardTitle>
            <CardDescription>
              처음 가입하셨네요! 학생인지 선생님인지 선택해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-3 h-auto py-8 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => handleSelectRole('student')}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <>
                    <User className="h-10 w-10 text-primary" />
                    <span className="text-lg font-semibold">학생</span>
                    <span className="text-xs text-muted-foreground text-center">
                      에코 코인을 채굴하고<br />보상을 교환해요
                    </span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-3 h-auto py-8 hover:border-amber-500 hover:bg-amber-500/5 transition-all"
                onClick={() => handleSelectRole('teacher')}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <>
                    <Shield className="h-10 w-10 text-amber-500" />
                    <span className="text-lg font-semibold">선생님</span>
                    <span className="text-xs text-muted-foreground text-center">
                      학급을 관리하고<br />보상을 승인해요
                    </span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
