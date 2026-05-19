import React from 'react';
import { useAuth } from '@/lib/auth';
import { usePolling } from '@/hooks/usePolling';
import { CoinIcon, Avatar, SectionTitle } from '@/components/ui/primitives';

interface StudentEntry {
  userId: string;
  displayName: string;
  avatarEmoji: string | null;
  totalCoins: number;
  carbonSavedG: number;
  level: number;
  isHelper: boolean;
}

export default function LeaderboardPage() {
  const { primaryClassId } = useAuth();
  const { data: students } = usePolling<StudentEntry[]>(
    primaryClassId ? `/classes/${primaryClassId}/students?sort=coins&order=desc` : '',
    15000,
  );

  const sorted = students ?? [];
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <>
      <div style={{ padding: '6px 0 14px' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>우리 반</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>리더보드</div>
      </div>

      {top3.length >= 3 && (
        <div style={{
          background: 'linear-gradient(180deg, var(--leaf-tint) 0%, var(--surface) 100%)',
          border: '1px solid var(--line)', borderRadius: 22, padding: '20px 16px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, height: 160 }}>
            {([1, 0, 2] as const).map((idx) => {
              const s = top3[idx]!;
              const rank = idx + 1;
              const heights = [120, 150, 100] as const;
              const colors = ['oklch(0.78 0.10 90)', 'oklch(0.62 0.14 150)', 'oklch(0.78 0.06 25)'] as const;
              const hues = [60, 145, 25] as const;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <Avatar name={s.displayName} size={44} hueSeed={hues[idx]} />
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{s.displayName}</div>
                  <div className="num" style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{s.totalCoins}c</div>
                  <div style={{
                    width: 64, height: heights[idx], background: colors[idx],
                    borderRadius: '12px 12px 0 0',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: 8, color: 'white', fontSize: 18, fontWeight: 800,
                    boxShadow: `0 6px 18px ${colors[idx].replace(')', ' / 0.30)')}`,
                  }}>
                    {rank}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <SectionTitle title="전체 순위" hint={`총 ${sorted.length}명 참여`} />
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-1)', padding: '4px 8px' }}>
            {rest.map((s, i) => (
              <div key={s.userId} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 8px',
                borderBottom: i < rest.length - 1 ? '1px solid var(--line)' : 'none',
              }}>
                <div className="num" style={{ width: 24, fontSize: 13, color: 'var(--ink-3)', fontWeight: 700 }}>{i + 4}</div>
                <Avatar name={s.displayName} size={32} />
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                  {s.displayName}
                  {s.isHelper && <span style={{ marginLeft: 4, color: 'var(--sun)' }}>★</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CoinIcon size={13} />
                  <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--leaf-deep)' }}>{s.totalCoins}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
