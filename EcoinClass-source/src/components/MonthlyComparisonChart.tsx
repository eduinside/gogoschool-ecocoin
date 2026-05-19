import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthlyData {
  month: string;
  coins: number;
  carbon: number;
}

interface MonthlyComparisonChartProps {
  isDemoMode?: boolean;
}

export function MonthlyComparisonChart({ isDemoMode = false }: MonthlyComparisonChartProps) {
  const { user } = useAuth();
  const [data, setData] = useState<MonthlyData[]>([]);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const fetchYearlyData = useCallback(async () => {
    if (isDemoMode) {
      // Demo data
      const now = new Date();
      const currentMonth = now.getMonth();
      const demoData: MonthlyData[] = [];
      for (let m = 0; m <= currentMonth; m++) {
        demoData.push({
          month: `${m + 1}월`,
          coins: Math.floor(Math.random() * 100 + 30),
          carbon: Math.floor(Math.random() * 30000 + 10000),
        });
      }
      setData(demoData);
      return;
    }

    if (!user) return;
    setLoading(true);

    const yearStart = new Date(year, 0, 1).toISOString();
    const yearEnd = new Date(year, 11, 31, 23, 59, 59).toISOString();

    const { data: records } = await supabase
      .from('mining_records')
      .select('coins_earned, carbon_saved, created_at')
      .eq('user_id', user.id)
      .gte('created_at', yearStart)
      .lte('created_at', yearEnd);

    const monthlyMap: Record<number, { coins: number; carbon: number }> = {};
    for (let m = 0; m < 12; m++) {
      monthlyMap[m] = { coins: 0, carbon: 0 };
    }

    (records || []).forEach(r => {
      const m = new Date(r.created_at).getMonth();
      monthlyMap[m].coins += r.coins_earned;
      monthlyMap[m].carbon += r.carbon_saved;
    });

    const now = new Date();
    const maxMonth = year === now.getFullYear() ? now.getMonth() : 11;
    const chartData: MonthlyData[] = [];
    for (let m = 0; m <= maxMonth; m++) {
      chartData.push({
        month: `${m + 1}월`,
        coins: monthlyMap[m].coins,
        carbon: Math.round(monthlyMap[m].carbon / 1000 * 10) / 10, // kg
      });
    }
    setData(chartData);
    setLoading(false);
  }, [user, year, isDemoMode]);

  useEffect(() => {
    fetchYearlyData();
  }, [fetchYearlyData]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">📊 월간 비교 차트</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setYear(y => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground min-w-[50px] text-center">{year}년</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setYear(y => y + 1)} disabled={year >= currentYear}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">데이터가 없습니다.</p>
      ) : (
        <>
          {/* Coins Chart */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">💰 월별 코인 획득</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => [`${value} 코인`, '획득 코인']}
                />
                <Bar dataKey="coins" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Carbon Chart */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">🌍 월별 탄소 절감 (kg)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => [`${value} kg`, '탄소 절감']}
                />
                <Bar dataKey="carbon" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
