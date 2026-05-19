import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EcoCoin } from '@/components/EcoCoin';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/hooks/useDemoMode';
import { toast } from 'sonner';
import { 
  Leaf, Pickaxe, Gift, BarChart3, Medal, Users, 
  ArrowRight, FlaskConical, User, Shield, Sparkles,
  TreePine, Droplets, Recycle
} from 'lucide-react';

const features = [
  {
    icon: Pickaxe,
    title: '에코 코인 채굴',
    description: '분리수거, 텀블러 사용 등 환경 행동을 하면 코인을 얻어요!',
    emoji: '⛏️',
  },
  {
    icon: Gift,
    title: '보상 교환소',
    description: '모은 코인으로 자리 바꾸기권, 숙제 면제권 등을 교환해요!',
    emoji: '🎁',
  },
  {
    icon: Medal,
    title: '뱃지 컬렉션',
    description: '꾸준한 실천으로 특별한 뱃지를 모아보세요!',
    emoji: '🏅',
  },
  {
    icon: BarChart3,
    title: '탄소 리포트',
    description: '내가 줄인 탄소량을 확인하고 성장을 추적해요!',
    emoji: '📊',
  },
  {
    icon: Users,
    title: '학급 미션',
    description: '반 친구들과 함께 환경 미션에 도전해요!',
    emoji: '🎯',
  },
  {
    icon: Sparkles,
    title: '리더보드',
    description: '학급에서 누가 가장 많이 실천했는지 확인해요!',
    emoji: '✨',
  },
];

const floatingIcons = [
  { icon: '🌿', delay: '0s', duration: '6s', left: '8%', top: '15%' },
  { icon: '🌍', delay: '1s', duration: '7s', left: '85%', top: '10%' },
  { icon: '♻️', delay: '2s', duration: '5s', left: '15%', top: '70%' },
  { icon: '🌱', delay: '0.5s', duration: '8s', left: '90%', top: '65%' },
  { icon: '💧', delay: '1.5s', duration: '6s', left: '50%', top: '5%' },
  { icon: '🍃', delay: '3s', duration: '7s', left: '75%', top: '80%' },
];

const stats = [
  { value: '12+', label: '환경 행동', icon: Leaf },
  { value: '10+', label: '보상 아이템', icon: Gift },
  { value: '15+', label: '뱃지 종류', icon: Medal },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { enterDemoMode } = useDemoMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleDemoMode = (role: 'student' | 'teacher') => {
    enterDemoMode(role);
    toast.success(`${role === 'student' ? '학생' : '선생님'} 테스트 모드로 진입합니다! 🧪`);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center">
        {/* Animated background */}
        <div className="absolute inset-0 bg-eco-gradient opacity-[0.06]" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingIcons.map((item, i) => (
            <span
              key={i}
              className="absolute text-2xl md:text-3xl opacity-20 animate-float select-none"
              style={{
                left: item.left,
                top: item.top,
                animationDelay: item.delay,
                animationDuration: item.duration,
              }}
            >
              {item.icon}
            </span>
          ))}
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />

        <div className="container relative z-10 flex flex-col items-center text-center gap-8 py-12">
          {/* Logo area */}
          <div
            className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-150" />
              <EcoCoin size="xl" animated />
            </div>
          </div>

          <div
            className={`space-y-4 transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-gradient-eco tracking-tight leading-tight">
              Eco-Coin
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-semibold">
              교실 속 탄소 화폐 거래소
            </p>
          </div>

          <p
            className={`text-base md:text-lg text-foreground/70 max-w-md leading-relaxed transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            환경을 지키는 작은 실천이 <strong className="text-primary font-bold">에코 코인</strong>이 되고,
            <br />
            코인으로 <strong className="text-accent-foreground font-bold">재미있는 보상</strong>을 교환해요!
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-3 mt-2 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <Button
              variant="eco"
              size="lg"
              className="gap-2 text-lg px-10 py-6 shadow-glow animate-pulse-glow rounded-2xl font-bold"
              onClick={() => navigate('/auth')}
            >
              <Leaf className="h-5 w-5" />
              시작하기
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 text-base px-8 py-6 rounded-2xl"
              onClick={() => navigate('/auth')}
            >
              이미 계정이 있어요
            </Button>
          </div>

          {/* Quick stats */}
          <div
            className={`flex items-center gap-6 md:gap-10 mt-6 transition-all duration-700 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-extrabold text-foreground">{s.value}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-16 md:py-20">
        <div className="absolute inset-0 bg-card/50" />
        <div className="container relative">
          <div className="text-center mb-12">
            <span className="inline-block text-4xl mb-3">🌱</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
              이렇게 활용해요
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Eco-Coin으로 교실에서 환경 교육을 재미있게!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {features.map((f, i) => (
              <Card
                key={f.title}
                className="group border-0 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 bg-card"
              >
                <CardContent className="p-6 text-center">
                  <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform duration-300">
                    {f.emoji}
                  </span>
                  <h3 className="font-bold text-foreground text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Flow */}
      <section className="container py-16 md:py-20">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center text-foreground mb-12">
          이용 방법 🚀
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 max-w-3xl mx-auto">
          {[
            { step: '1', icon: Recycle, label: '환경 행동 실천', sub: '분리수거, 텀블러 사용 등' },
            { step: '2', icon: Pickaxe, label: '코인 채굴', sub: '행동을 기록하면 코인 획득!' },
            { step: '3', icon: Gift, label: '보상 교환', sub: '코인으로 원하는 보상 교환!' },
          ].map((item, i) => (
            <div key={item.step} className="flex items-center">
              <div className="flex flex-col items-center text-center w-48">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 shadow-soft">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="bg-primary text-primary-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center mb-2">
                  {item.step}
                </div>
                <h3 className="font-bold text-foreground text-sm">{item.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.sub}</p>
              </div>
              {i < 2 && (
                <ArrowRight className="hidden md:block h-6 w-6 text-muted-foreground/40 mx-4 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Demo CTA */}
      <section className="container pb-20">
        <Card className="max-w-lg mx-auto overflow-hidden border-0 shadow-card">
          <div className="bg-eco-gradient p-6 text-center">
            <FlaskConical className="h-10 w-10 text-primary-foreground mx-auto mb-2 opacity-90" />
            <h3 className="text-xl font-bold text-primary-foreground mb-1">
              로그인 없이 체험하기
            </h3>
            <p className="text-sm text-primary-foreground/80">
              데모 데이터로 Eco-Coin을 미리 경험해보세요!
            </p>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-5 rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => handleDemoMode('student')}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-bold">학생으로 체험</span>
                <span className="text-[10px] text-muted-foreground">코인 채굴 & 교환</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-5 rounded-xl hover:border-accent hover:bg-accent/10 transition-all"
                onClick={() => handleDemoMode('teacher')}
              >
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-accent-foreground" />
                </div>
                <span className="text-sm font-bold">선생님으로 체험</span>
                <span className="text-[10px] text-muted-foreground">학급 관리 & 승인</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <EcoCoin size="xs" />
          <span className="font-bold text-sm text-foreground">Eco-Coin</span>
        </div>
        <p className="text-xs text-muted-foreground">
          🌱 작은 실천이 큰 변화를 만들어요
        </p>
      </footer>
    </div>
  );
}
