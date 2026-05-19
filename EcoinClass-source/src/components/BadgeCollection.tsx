import { Badge as BadgeType, UserBadge } from '@/hooks/useBadges';
import { cn } from '@/lib/utils';

interface BadgeCollectionProps {
  allBadges: BadgeType[];
  earnedBadges: UserBadge[];
}

export function BadgeCollection({ allBadges, earnedBadges }: BadgeCollectionProps) {
  const earnedIds = new Set(earnedBadges.map(eb => eb.badge_id));

  const categories = [
    { key: 'milestone', label: '🏔️ 마일스톤' },
    { key: 'coins', label: '💰 코인' },
    { key: 'carbon', label: '🌍 탄소 절감' },
    { key: 'streak', label: '🔥 연속 채굴' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">🏅 나의 뱃지 컬렉션</h2>
        <p className="text-muted-foreground">
          환경 활동을 통해 뱃지를 모아보세요!{' '}
          <span className="font-semibold text-primary">{earnedBadges.length}</span> / {allBadges.length} 획득
        </p>
        {/* Progress bar */}
        <div className="w-full max-w-md mx-auto mt-3 bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-eco-gradient rounded-full transition-all duration-500"
            style={{ width: `${allBadges.length > 0 ? (earnedBadges.length / allBadges.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {categories.map(cat => {
        const catBadges = allBadges.filter(b => b.category === cat.key);
        if (catBadges.length === 0) return null;

        return (
          <div key={cat.key}>
            <h3 className="text-lg font-bold text-foreground mb-3">{cat.label}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {catBadges.map(badge => {
                const isEarned = earnedIds.has(badge.id);
                const earnedData = earnedBadges.find(eb => eb.badge_id === badge.id);

                return (
                  <div
                    key={badge.id}
                    className={cn(
                      'relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200',
                      isEarned
                        ? 'bg-card border-primary/30 shadow-card'
                        : 'bg-muted/30 border-border opacity-50 grayscale'
                    )}
                  >
                    <span className="text-4xl">{badge.icon}</span>
                    <p className="text-sm font-semibold text-foreground text-center">{badge.name}</p>
                    <p className="text-xs text-muted-foreground text-center leading-tight">{badge.description}</p>
                    {isEarned && earnedData && (
                      <p className="text-[10px] text-primary font-medium">
                        {new Date(earnedData.earned_at).toLocaleDateString('ko-KR')} 획득
                      </p>
                    )}
                    {!isEarned && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl opacity-30">🔒</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
