import { EcoAction } from '@/types/eco-coin';
import { getCategoryColor, getCategoryLabel } from '@/data/eco-actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  action: EcoAction;
  onMine: (action: EcoAction) => void;
  disabled?: boolean;
}

export function ActionCard({ action, onMine, disabled }: ActionCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-card border border-border p-5',
        'shadow-soft transition-all duration-300',
        'hover:shadow-card hover:-translate-y-1',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Category badge */}
      <span
        className={cn(
          'absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full border',
          getCategoryColor(action.category)
        )}
      >
        {getCategoryLabel(action.category)}
      </span>

      {/* Icon */}
      <div className="text-4xl mb-3">{action.icon}</div>

      {/* Content */}
      <h3 className="font-bold text-lg text-foreground mb-1">{action.nameKo}</h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {action.description}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-primary">🌍</span>
          <span className="text-muted-foreground">
            <strong className="text-foreground">{action.carbonReduction}g</strong> CO₂ 절감
          </span>
        </div>
      </div>

      {/* Action button */}
      <Button
        variant="gold"
        className="w-full"
        onClick={() => onMine(action)}
        disabled={disabled}
      >
        <span className="mr-2">⛏️</span>
        채굴하기 +{action.coinValue} 코인
      </Button>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
