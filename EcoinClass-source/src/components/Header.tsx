import { EcoCoin } from './EcoCoin';
import { cn } from '@/lib/utils';

interface HeaderProps {
  totalCoins: number;
  studentName: string;
  className?: string;
}

export function Header({ totalCoins, studentName, className }: HeaderProps) {
  return (
    <div className={cn('flex items-center gap-2 sm:gap-3', className)}>
      {/* Logo */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="relative shrink-0">
          <EcoCoin size="sm" animated />
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-gradient-eco leading-tight">Eco-Coin</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">탄소 화폐 거래소</p>
        </div>
      </div>

      {/* Coin balance - compact on mobile */}
      <div className="flex items-center gap-1.5 bg-secondary/50 rounded-full px-2.5 py-1.5 sm:px-4 sm:py-2 ml-auto">
        <EcoCoin size="xs" />
        <span className="text-sm sm:text-lg font-bold text-foreground leading-none">{totalCoins}</span>
      </div>

      {/* User avatar */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-eco-gradient flex items-center justify-center text-primary-foreground font-bold text-sm sm:text-base">
          {studentName.charAt(0)}
        </div>
        <span className="hidden sm:block font-medium text-foreground text-sm">{studentName}</span>
      </div>
    </div>
  );
}
