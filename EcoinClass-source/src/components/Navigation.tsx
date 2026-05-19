import { cn } from '@/lib/utils';
import { LayoutDashboard, Pickaxe, Gift, BarChart3, Medal, Target, Package } from 'lucide-react';

export type TabType = 'dashboard' | 'mining' | 'rewards' | 'inventory' | 'stats' | 'badges' | 'report';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  className?: string;
}

const tabs: { id: TabType; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: '홈', icon: LayoutDashboard },
  { id: 'mining', label: '채굴', icon: Pickaxe },
  { id: 'rewards', label: '교환', icon: Gift },
  { id: 'inventory', label: '아이템', icon: Package },
  { id: 'badges', label: '뱃지', icon: Medal },
  { id: 'report', label: '리포트', icon: BarChart3 },
  { id: 'stats', label: '학급', icon: Target },
];

export function Navigation({ activeTab, onTabChange, className }: NavigationProps) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom',
        'sm:relative sm:border-t-0 sm:border-b sm:bg-transparent sm:backdrop-blur-none',
        className
      )}
    >
      <div className="container px-1 sm:px-4">
        <div className="flex items-center justify-around sm:justify-center sm:gap-1 py-1.5 sm:py-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-1.5 sm:px-4 py-1.5 sm:py-2 rounded-xl',
                  'transition-all duration-200 font-medium min-w-0 shrink-0',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[9px] sm:text-sm leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
