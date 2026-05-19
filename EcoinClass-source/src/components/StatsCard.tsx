import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'gold' | 'eco';
  className?: string;
}

const variantClasses = {
  default: 'bg-card border-border',
  primary: 'bg-eco-gradient text-primary-foreground border-transparent',
  gold: 'bg-gold-gradient text-accent-foreground border-transparent',
  eco: 'bg-gradient-to-br from-primary/10 to-eco-leaf/10 border-primary/20',
};

const iconVariantClasses = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary-foreground/20 text-primary-foreground',
  gold: 'bg-accent-foreground/20 text-accent-foreground',
  eco: 'bg-primary/20 text-primary',
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl sm:rounded-2xl border p-3 sm:p-6 shadow-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
        variantClasses[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            'text-sm font-medium',
            variant === 'default' ? 'text-muted-foreground' : 'opacity-80'
          )}>
            {title}
          </p>
          <p className="text-xl sm:text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className={cn(
              'text-sm',
              variant === 'default' ? 'text-muted-foreground' : 'opacity-70'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 text-sm font-medium',
              trend.isPositive ? 'text-eco-leaf' : 'text-destructive'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="opacity-60">vs 지난주</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'rounded-lg sm:rounded-xl p-2 sm:p-3',
            iconVariantClasses[variant]
          )}
        >
          <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-current opacity-5" />
      <div className="absolute -top-4 -right-8 h-16 w-16 rounded-full bg-current opacity-5" />
    </div>
  );
}
