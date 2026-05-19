import React from 'react';
import { usePolling } from '@/hooks/usePolling';
import { CoinIcon, CarbonIcon, StatTile, SectionTitle } from '@/components/ui/primitives';

interface StatsData {
  totalMinings: number;
  totalCoins: number;
  carbonSavedG: number;
  byDay: Array<{ date: string; count: number; coins: number }>;
  byCategory: Array<{ category: string; count: number; coins: number }>;
  streakDays: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  energy: '에너지', water: '물', waste: '재활용', transport: '이동', food: '음식', other: '기타',
};
const CATEGORY_COLORS: Record<string, string> = {
  energy: 'var(--sun)', water: 'var(--sky)', waste: 'var(--leaf)', transport: 'var(--lime)', food: 'var(--berry)', other: 'var(--moss)',
};

export default function ReportPage() {
  const month = new Date().toISOString().slice(0, 7);
  const { data: stats } = usePolling<StatsData>(`/stats/me?month=${month}`, 60000);

  if (!stats) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>불러오는 중...</div>;

  const maxDayCount = Math.max(1, ...stats.byDay.map((d) => d.count));

  return (
    <>
      <div style={{ padding: '6px 0 14px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>월간 리포트</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{month}</div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <StatTile icon={<CoinIcon size={14} />} label="획득 코인" value={stats.totalCoins} suffix="코인" accent="var(--sun-deep)" />
        <StatTile icon={<CarbonIcon size={14} />} label="탄소 절감" value={`${(stats.carbonSavedG / 1000).toFixed(1)}`} suffix="kg" />
        <StatTile icon={<span style={{ fontSize: 13 }}>🔥</span>} label="연속" value={stats.streakDays} suffix="일" accent="var(--berry)" />
      </div>

      <div style={{ marginTop: 22 }}>
        <SectionTitle title="일별 채굴" hint={`${stats.totalMinings}회`} />
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)',
          padding: '16px 12px', display: 'flex', alignItems: 'flex-end', gap: 3, height: 140, overflow: 'hidden',
        }}>
          {stats.byDay.map((d) => (
            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: '100%', maxWidth: 16, borderRadius: 4,
                height: Math.max(4, (d.count / maxDayCount) * 80),
                background: 'var(--leaf)', transition: 'height 0.3s ease',
              }} />
              <div style={{ fontSize: 8, color: 'var(--ink-3)', fontWeight: 600 }}>{d.date.slice(8)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <SectionTitle title="카테고리별" />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: '14px 16px' }}>
          {stats.byCategory.map((cat) => (
            <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: CATEGORY_COLORS[cat.category] ?? 'var(--moss)',
              }} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{CATEGORY_LABELS[cat.category] ?? cat.category}</div>
              <div className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>{cat.count}회</div>
              <div className="num" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{cat.coins}c</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
