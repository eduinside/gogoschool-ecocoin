import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { EcoCoin } from '@/components/EcoCoin';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/hooks/useDemoMode';
import { toast } from 'sonner';
import { Loader2, User, Shield, FlaskConical } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';
import { Separator } from '@/components/ui/separator';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);
  const { enterDemoMode } = useDemoMode();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'student' | 'teacher'>('student');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast.error('로그인 실패', { description: error.message });
    } else {
      toast.success('환영합니다! 🌱');
      navigate('/dashboard');
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupPassword !== signupConfirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다');
      return;
    }

    if (signupPassword.length < 6) {
      toast.error('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    setLoading(true);

    const { error } = await signUp(signupEmail, signupPassword, signupName, signupRole);

    if (error) {
      toast.error('회원가입 실패', { description: error.message });
    } else {
      toast.success('회원가입 성공! 이메일을 확인해주세요 📧');
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error('Google 로그인 실패', { description: String(error) });
      setGoogleLoading(false);
    }
  };

  const handleDemoMode = (role: 'student' | 'teacher') => {
    enterDemoMode(role);
    toast.success(`${role === 'student' ? '학생' : '선생님'} 테스트 모드로 진입합니다! 🧪`);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <EcoCoin size="lg" animated />
            <div>
              <h1 className="text-3xl font-bold text-gradient-eco">Eco-Coin</h1>
              <p className="text-sm text-muted-foreground">탄소 화폐 거래소</p>
            </div>
          </div>
          <p className="text-muted-foreground">
            환경 행동으로 코인을 모으고, 지구를 지켜요! 🌍
          </p>
        </div>

        <Card className="border-2 shadow-card">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">로그인</TabsTrigger>
                <TabsTrigger value="signup">회원가입</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Login Tab */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">이메일</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="student@school.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">비밀번호</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" variant="eco" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        로그인 중...
                      </>
                    ) : (
                      '로그인'
                    )}
                  </Button>

                  <div className="relative my-4">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      또는
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={googleLoading}
                    onClick={handleGoogleLogin}
                  >
                    {googleLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    )}
                    Google로 로그인
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label>가입 유형</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={signupRole === 'student' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                        onClick={() => setSignupRole('student')}
                      >
                        <User className="h-4 w-4" />
                        학생
                      </Button>
                      <Button
                        type="button"
                        variant={signupRole === 'teacher' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                        onClick={() => setSignupRole('teacher')}
                      >
                        <Shield className="h-4 w-4" />
                        선생님
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">이름</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="홍길동"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">이메일</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="student@school.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">비밀번호</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="6자 이상"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">비밀번호 확인</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="비밀번호 다시 입력"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" variant="eco" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        가입 중...
                      </>
                    ) : (
                      '회원가입'
                    )}
                  </Button>

                  <div className="relative my-4">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      또는
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={googleLoading}
                    onClick={handleGoogleLogin}
                  >
                    {googleLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    )}
                    Google로 가입
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Demo Mode Section */}
        <Card className="mt-4 border-dashed border-2 border-muted-foreground/30">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <FlaskConical className="h-4 w-4" />
              로그인 없이 테스트하기
            </CardTitle>
            <CardDescription className="text-xs">
              데모 데이터로 앱을 체험해보세요
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => handleDemoMode('student')}
              >
                <User className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">학생으로 체험</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => handleDemoMode('teacher')}
              >
                <Shield className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium">선생님으로 체험</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          🌱 작은 실천이 큰 변화를 만들어요
        </p>
      </div>
    </div>
  );
}
