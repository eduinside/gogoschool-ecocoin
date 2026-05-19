import React from 'react';
import { usePolling } from '@/hooks/usePolling';
import { ProgressBar } from '@/components/ui/primitives';

interface Badge {
  id: string;
  code: string;
  title: string;
  description: string | null;
  emoji: string | null;
  earnedAt: string | null;
}

export default function BadgesPage() {
  const { data: badges } = usePolling<Badge[]>('/badges', 30000);
  const list = badges ?? [];
  const earnedCount = list.filter((b) => b.earnedAt).length;
  const nextUnearned = list.find((b) => !b.earnedAt);

  return (
    <>
      <div style={{ padding: '6px 0 14px' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>나의 컬렉션</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>나의 뱃지</div>
      </div>

      <div className="eco-card" style={{
        background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-1)', padding: 16, display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--leaf), var(--leaf-deep))',
          color: 'white', fontSize: 22, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} className="num">{earnedCount}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{earnedCount} / {list.length} 획득</div>
          <div style={{ marginTop: 6 }}><ProgressBar value={earnedCount} max={Math.max(1, list.length)} /></div>
          {nextUnearned && (
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>다음 뱃지: {nextUnearned.title}</div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {list.map((b) => {
          const earned = !!b.earnedAt;
          return (
            <div key={b.id} style={{
              background: earned ? 'var(--surface)' : 'var(--bg-soft)',
              border: '1px solid var(--line)', borderRadius: 16,
              padding: '14px 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              opacity: earned ? 1 : 0.55,
              filter: earned ? 'none' : 'grayscale(0.7)',
            }}>
              <div style={{ fontSize: 36, lineHeight: 1 }}>{b.emoji ?? '🏅'}</div>
              <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', marginTop: 4 }}>{b.title}</div>
              <div style={{ fontSize: 9, color: 'var(--ink-3)', textAlign: 'center', lineHeight: 1.3 }}>{b.description}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
