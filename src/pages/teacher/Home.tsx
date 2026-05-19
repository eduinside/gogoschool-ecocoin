import React from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import { CoinIcon, CarbonIcon, StatTile, SectionTitle, Avatar, ProgressBar } from '@/components/ui/primitives';

interface ClassStats {
  memberCount: number;
  activeToday: number;
  totalCoins: number;
  totalCarbonG: number;
  todayMinings: number;
  trend: Array<{ date: string; count: number }>;
  pendingRequests: number;
}

interface PendingRequest {
  id: string;
  userId: string;
  displayName: string;
  rewardTitle: string;
  rewardCategory: string;
  costCoins: number;
  createdAt: number;
}

interface Mission {
  id: string;
  title: string;
  description: string | null;
  goalValue: number;
  currentValue: number;
  isCompleted: boolean;
}

const CATEGORY_GLYPHS: Record<string, string> = {
  privilege: '🪑', item: '🎁', experience: '⭐', donation: '🌳',
};

export default function TeacherHomePage() {
  const { user, primaryClassId } = useAuth();
  const { data: stats } = usePolling<ClassStats>(primaryClassId ? `/stats/class/${primaryClassId}` : '', 15000);
  const { data: pending, refetch: refetchPending } = usePolling<PendingRequest[]>(
    primaryClassId ? `/reward-requests?classId=${primaryClassId}&status=pending` : '', 15000,
  );
  const { data: missions } = usePolling<Mission[]>(primaryClassId ? `/classes/${primaryClassId}/missions` : '', 30000);

  const handleApprove = async (id: string) => {
    await api.post(`/reward-requests/${id}/approve`);
    refetchPending();
  };
  const handleReject = async (id: string) => {
    await api.post(`/reward-requests/${id}/reject`, { reason: '' });
    refetchPending();
  };

  const trend = stats?.trend ?? [];
  const maxTrend = Math.max(1, ...trend.map((t) => t.count));
  const activeMission = missions?.find((m) => !m.isCompleted);

  return (
    <>
      <div style={{ padding: '6px 0 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{user?.displayName} 선생님</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>오늘의 학급 현황</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatTile icon={<span style={{ fontSize: 13 }}>👥</span>} label="활성 학생" value={stats?.activeToday ?? 0} suffix={`/ ${stats?.memberCount ?? 0}`} />
        <StatTile icon={<CoinIcon size={13} />} label="학급 총 코인" value={stats?.totalCoins?.toLocaleString() ?? '0'} accent="var(--sun-deep)" />
        <StatTile icon={<CarbonIcon size={13} />} label="누적 절감" value={`${((stats?.totalCarbonG ?? 0) / 1000).toFixed(1)}`} suffix="kg" />
        <StatTile icon={<span style={{ fontSize: 13 }}>⚡</span>} label="오늘 채굴" value={stats?.todayMinings ?? 0} suffix="회" />
      </div>

      {trend.length > 1 && (
        <div className="eco-card" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-1)', marginTop: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>최근 채굴 추이</div>
          <svg width="100%" height="60" viewBox={`0 0 ${trend.length * 40} 60`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="tf" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.62 0.14 150)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="oklch(0.62 0.14 150)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {(() => {
              const w = trend.length * 40;
              const pts = trend.map((v, i) => `${(i / (trend.length - 1)) * w},${56 - (v.count / maxTrend) * 50}`).join(' ');
              return (
                <>
                  <polyline fill="none" stroke="oklch(0.62 0.14 150)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
                  <polygon fill="url(#tf)" points={`${pts} ${w},60 0,60`} />
                </>
              );
            })()}
          </svg>
        </div>
      )}

      {(pending?.length ?? 0) > 0 && (
        <div style={{ marginTop: 22 }}>
          <SectionTitle title="보상 승인 대기" hint={`${pending!.length}건`} />
          <div className="eco-card" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
            {pending!.slice(0, 5).map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                borderBottom: i < Math.min(pending!.length, 5) - 1 ? '1px solid var(--line)' : 'none',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'var(--leaf-tint)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}>{CATEGORY_GLYPHS[r.rewardCategory] ?? '🎁'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar name={r.displayName} size={20} />
                    <span>{r.displayName}</span>
                    <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>· {r.rewardTitle}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CoinIcon size={11} /> <span className="num">{r.costCoins}</span>
                  </div>
                </div>
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
              </div>
            ))}
          </div>
        </div>
      )}

      {activeMission && (
        <div style={{ marginTop: 22 }}>
          <SectionTitle title="학급 미션" />
          <div className="eco-card" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-1)', padding: '14px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{activeMission.title}</div>
            {activeMission.description && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{activeMission.description}</div>}
            <div className="num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--leaf-deep)', marginTop: 10 }}>
              {activeMission.currentValue.toLocaleString()} / {activeMission.goalValue.toLocaleString()}
            </div>
            <div style={{ marginTop: 8 }}><ProgressBar value={activeMission.currentValue} max={activeMission.goalValue} /></div>
          </div>
        </div>
      )}
    </>
  );
}
