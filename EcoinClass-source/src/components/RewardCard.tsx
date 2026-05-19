import { Reward } from '@/types/eco-coin';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EcoCoin } from './EcoCoin';

interface RewardCardProps {
  reward: Reward;
  userCoins: number;
  onRedeem: (reward: Reward) => void;
}

const categoryStyles = {
  privilege: 'border-primary/30 bg-gradient-to-br from-primary/5 to-eco-leaf/5',
  item: 'border-accent/30 bg-gradient-to-br from-accent/5 to-eco-gold/5',
  donation: 'border-eco-earth/30 bg-gradient-to-br from-eco-earth/5 to-primary/5',
};

const categoryLabels = {
  privilege: '특권',
  item: '아이템',
  donation: '기부',
};

export function RewardCard({ reward, userCoins, onRedeem }: RewardCardProps) {
  const canAfford = userCoins >= reward.cost;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border-2 p-5',
        'shadow-soft transition-all duration-300',
        'hover:shadow-card hover:-translate-y-1',
        categoryStyles[reward.category],
        !canAfford && 'opacity-60'
      )}
    >
      {/* Category badge */}
      <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
        {categoryLabels[reward.category]}
      </span>

      {/* Icon */}
      <div className="text-4xl mb-3">{reward.icon}</div>

      {/* Content */}
      <h3 className="font-bold text-lg text-foreground mb-1">{reward.name}</h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {reward.description}
      </p>

      {/* Cost */}
      <div className="flex items-center gap-2 mb-4">
        <EcoCoin size="sm" />
        <span className="text-xl font-bold text-foreground">{reward.cost}</span>
        <span className="text-sm text-muted-foreground">코인</span>
      </div>

      {/* Action button */}
      <Button
        variant={canAfford ? 'eco' : 'secondary'}
        className="w-full"
        onClick={() => onRedeem(reward)}
        disabled={!canAfford || !reward.available}
      >
        {canAfford ? (
          <>
            <span className="mr-2">🎁</span>
            교환하기
          </>
        ) : (
          <>
            <span className="mr-2">🔒</span>
            코인 부족 ({reward.cost - userCoins}개 더 필요)
          </>
        )}
      </Button>
    </div>
  );
}
