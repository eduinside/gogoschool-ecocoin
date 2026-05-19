import { Dialog, DialogContent } from '@/components/ui/dialog';
import { EcoCoin } from './EcoCoin';
import { Button } from './ui/button';
import { EcoAction } from '@/types/eco-coin';

interface MiningSuccessProps {
  open: boolean;
  onClose: () => void;
  action: EcoAction | null;
}

export function MiningSuccess({ open, onClose, action }: MiningSuccessProps) {
  if (!action) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center border-2 border-primary/20">
        <div className="py-6 space-y-6">
          {/* Success animation */}
          <div className="relative flex justify-center">
            <div className="animate-pulse-glow rounded-full">
              <EcoCoin size="xl" animated />
            </div>
            {/* Floating particles */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(6)].map((_, i) => (
                <span
                  key={i}
                  className="absolute text-2xl animate-float"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    transform: `rotate(${i * 60}deg) translateY(-50px)`,
                  }}
                >
                  ✨
                </span>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">채굴 성공! 🎉</h2>
            <p className="text-muted-foreground">{action.nameKo}</p>
          </div>

          {/* Rewards */}
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient-gold">+{action.coinValue}</p>
              <p className="text-sm text-muted-foreground">Eco-Coin</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient-eco">-{action.carbonReduction}g</p>
              <p className="text-sm text-muted-foreground">CO₂ 절감</p>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
            🌍 지구를 위한 작은 실천이 모여 큰 변화를 만들어요!
          </p>

          {/* Close button */}
          <Button variant="eco" size="lg" onClick={onClose} className="w-full">
            계속 채굴하기 ⛏️
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
