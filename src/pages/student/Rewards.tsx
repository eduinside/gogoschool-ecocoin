import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { track } from '@/lib/track';
import { usePolling } from '@/hooks/usePolling';
import { CoinIcon } from '@/components/ui/primitives';

interface Reward {
  id: string;
  category: string;
  title: string;
  description: string | null;
  costCoins: number;
  stock: number | null;
  isAffordable: boolean;
}

const CATEGORY_GLYPHS: Record<string, string> = {
  privilege: '🪑', item: '🎁', experience: '⭐', donation: '🌳',
};

export default function RewardsPage() {
  const { user, primaryClassId, refreshUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('전체');

  const { data: rewards, refetch } = usePolling<Reward[]>(
    primaryClassId ? `/classes/${primaryClassId}/rewards` : '',
    30000,
  );

  const categories = ['전체', ...new Set((rewards ?? []).map((r) => r.category))];
  const filtered = activeCategory === '전체' ? rewards : rewards?.filter((r) => r.category === activeCategory);

  const handleRequest = async (reward: Reward) => {
    if (!primaryClassId || !reward.isAffordable) return;
    track('reward.requested', { rewardId: reward.id, costCoins: reward.costCoins });
    try {
      await api.post(`/rewards/${reward.id}/request`, { classId: primaryClassId });
      await Promise.all([refreshUser(), refetch()]);
    } catch { /* toast would go here */ }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0 14px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>교환소</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--leaf-soft)', padding: '8px 12px', borderRadius: 999,
          border: '1px solid color-mix(in oklch, var(--leaf), white 70%)',
        }}>
          <CoinIcon size={16} />
          <span className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--leaf-deep)' }}>{user?.totalCoins ?? 0}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto' }} className="no-scrollbar">
        {categories.map((c) => (
          <div
            key={c}
            onClick={() => setActiveCategory(c)}
            style={{
              padding: '8px 14px', borderRadius: 999,
              background: c === activeCategory ? 'var(--ink)' : 'var(--surface)',
              color: c === activeCategory ? 'white' : 'var(--ink-2)',
              border: `1px solid ${c === activeCategory ? 'var(--ink)' : 'var(--line)'}`,
              fontSize: 13, fontWeight: 600, flexShrink: 0, cursor: 'pointer',
            }}
          >
            {c}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {(filtered ?? []).map((r) => (
          <div key={r.id} style={{
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18,
            padding: '16px 14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: 'var(--leaf-tint)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>
              {CATEGORY_GLYPHS[r.category] ?? '🎁'}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', lineHeight: 1.25 }}>{r.title}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600 }}>{r.category}</div>
            <button
              onClick={() => handleRequest(r)}
              style={{
                width: '100%', marginTop: 4, padding: '8px 0', borderRadius: 10,
                background: r.isAffordable ? 'var(--leaf)' : 'var(--bg-soft)',
                color: r.isAffordable ? 'white' : 'var(--ink-3)',
                border: r.isAffordable ? 'none' : '1px solid var(--line)',
                fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                cursor: r.isAffordable ? 'pointer' : 'not-allowed',
              }}
            >
              <CoinIcon size={13} />
              <span className="num">{r.costCoins}</span>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
