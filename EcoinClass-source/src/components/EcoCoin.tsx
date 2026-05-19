import { cn } from '@/lib/utils';

interface EcoCoinProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
  showValue?: number;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[8px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-xl',
};

export function EcoCoin({ size = 'md', animated = false, className, showValue }: EcoCoinProps) {
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <div
        className={cn(
          'rounded-full bg-gold-gradient flex items-center justify-center shadow-coin',
          'border-4 border-eco-gold-dark/30',
          sizeClasses[size],
          animated && 'animate-coin-bounce'
        )}
      >
        <div className="flex flex-col items-center justify-center">
          <span className="font-bold text-accent-foreground leading-none">🌱</span>
        </div>
      </div>
      {showValue !== undefined && (
        <span className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
          +{showValue}
        </span>
      )}
    </div>
  );
}
