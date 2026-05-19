import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import { CoinIcon, Avatar, StatusPill } from '@/components/ui/primitives';

interface RewardRequest {
  id: string;
  userId: string;
  displayName: string;
  rewardTitle: string;
  rewardCategory: string;
  costCoins: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

const CATEGORY_GLYPHS: Record<string, string> = {
  privilege: '🪑', item: '🎁', experience: '⭐', donation: '🌳',
};

export default function RewardQueuePage() {
  const { primaryClassId } = useAuth();
  const [filter, setFilter] = useState<string>('pending');
  const { data: requests, refetch } = usePolling<RewardRequest[]>(
    primaryClassId ? `/reward-requests?classId=${primaryClassId}&status=${filter}` : '', 10000,
  );

  const handleApprove = async (id: string) => {
    await api.post(`/reward-requests/${id}/approve`);
    refetch();
  };
  const handleReject = async (id: string) => {
    await api.post(`/reward-requests/${id}/reject`, { reason: '' });
    refetch();
  };

  const tabs = ['pending', 'approved', 'rejected'] as const;
  const tabLabels: Record<string, string> = { pending: '대기', approved: '승인', rejected: '거절' };

  return (
    <>
      <div style={{ padding: '6px 0 14px' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>보상</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>승인 관리</div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {tabs.map((t) => (
          <div
            key={t}
            onClick={() => setFilter(t)}
            style={{
              flex: 1, padding: '8px 6px', borderRadius: 12,
              background: t === filter ? 'var(--ink)' : 'var(--surface)',
              color: t === filter ? 'white' : 'var(--ink-2)',
              border: `1px solid ${t === filter ? 'var(--ink)' : 'var(--line)'}`,
              fontSize: 12, fontWeight: 700, textAlign: 'center', cursor: 'pointer',
            }}
          >{tabLabels[t]}</div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(requests ?? []).map((r) => (
          <div key={r.id} className="eco-card" style={{
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-1)', padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--leaf-tint)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>{CATEGORY_GLYPHS[r.rewardCategory] ?? '🎁'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar name={r.displayName} size={20} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{r.displayName}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>· {r.rewardTitle}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CoinIcon size={11} /> <span className="num">{r.costCoins}</span>
              </div>
            </div>
            {r.status === 'pending' ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => handleApprove(r.id)} style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'var(--leaf)', color: 'white',
                  border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>✓</button>
                <button onClick={() => handleReject(r.id)} style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'var(--bg-soft)', color: 'var(--ink-3)',
                  border: '1px solid var(--line)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>✕</button>
              </div>
            ) : (
              <StatusPill status={r.status} />
            )}
          </div>
        ))}
        {(requests ?? []).length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>요청이 없어요</div>
        )}
      </div>
    </>
  );
}
