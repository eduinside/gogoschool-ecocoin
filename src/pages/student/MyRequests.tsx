import React, { useState } from 'react';
import { usePolling } from '@/hooks/usePolling';
import { CoinIcon, StatusPill } from '@/components/ui/primitives';

interface RewardRequest {
  id: string;
  rewardTitle: string;
  rewardCategory: string;
  costCoins: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: number;
  teacherNote: string | null;
}

const CATEGORY_GLYPHS: Record<string, string> = {
  privilege: '🪑', item: '🎁', experience: '⭐', donation: '🌳',
};

const TAB_KEYS = ['all', 'pending', 'approved', 'rejected'] as const;
const TAB_LABELS: Record<string, string> = { all: '전체', pending: '대기', approved: '승인', rejected: '거절' };

export default function MyRequestsPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const { data: requests } = usePolling<RewardRequest[]>('/reward-requests?mine=true', 15000);
  const list = requests ?? [];

  const counts: Record<string, number> = { all: list.length, pending: 0, approved: 0, rejected: 0 };
  list.forEach((r) => { if (r.status in counts) counts[r.status]!++; });

  const filtered = activeTab === 'all' ? list : list.filter((r) => r.status === activeTab);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return `오늘 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (diff < 172800000) return `어제 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <>
      <div style={{ padding: '6px 0 14px' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>내 활동</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>요청 내역</div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {TAB_KEYS.map((k) => (
          <div
            key={k}
            onClick={() => setActiveTab(k)}
            style={{
              flex: 1, padding: '8px 6px', borderRadius: 12,
              background: k === activeTab ? 'var(--ink)' : 'var(--surface)',
              color: k === activeTab ? 'white' : 'var(--ink-2)',
              border: `1px solid ${k === activeTab ? 'var(--ink)' : 'var(--line)'}`,
              fontSize: 12, fontWeight: 700, textAlign: 'center', cursor: 'pointer',
            }}
          >
            {TAB_LABELS[k]} <span style={{ opacity: 0.7, marginLeft: 2 }}>{counts[k]}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((r) => (
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
                <span style={{ fontSize: 14, fontWeight: 700 }}>{r.rewardTitle}</span>
                <StatusPill status={r.status} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CoinIcon size={11} /> <span className="num">{r.costCoins}</span>
                <span>·</span><span>{formatDate(r.createdAt)}</span>
              </div>
              {r.teacherNote && (
                <div style={{ fontSize: 11, color: 'var(--berry)', marginTop: 6, padding: '4px 8px', background: 'oklch(0.97 0.02 25)', borderRadius: 6 }}>
                  선생님: {r.teacherNote}
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>요청 내역이 없어요</div>
        )}
      </div>
    </>
  );
}
