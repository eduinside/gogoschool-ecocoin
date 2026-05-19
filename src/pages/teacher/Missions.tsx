import React from 'react';
import { useAuth } from '@/lib/auth';
import { usePolling } from '@/hooks/usePolling';
import { ProgressBar } from '@/components/ui/primitives';

interface Mission {
  id: string;
  title: string;
  description: string | null;
  goalValue: number;
  currentValue: number;
  isCompleted: boolean;
}

export default function MissionsPage() {
  const { primaryClassId } = useAuth();
  const { data: missions } = usePolling<Mission[]>(primaryClassId ? `/classes/${primaryClassId}/missions` : '', 30000);

  return (
    <>
      <div style={{ padding: '6px 0 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>설정</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>학급 미션</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(missions ?? []).map((m) => {
          const done = m.isCompleted;
          return (
            <div key={m.id} className="eco-card" style={{
              background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-1)', padding: '14px 16px',
              borderColor: done ? 'color-mix(in oklch, var(--leaf), white 60%)' : 'var(--line)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{m.title}</div>
                  {m.description && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{m.description}</div>}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 999,
                  background: done ? 'var(--leaf)' : 'var(--leaf-soft)',
                  color: done ? 'white' : 'var(--leaf-deep)',
                }}>{done ? '완료' : '진행 중'}</span>
              </div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--leaf-deep)' }}>
                  {m.currentValue.toLocaleString()} / {m.goalValue.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{done ? '✓ 달성' : ''}</div>
              </div>
              <div style={{ marginTop: 8 }}><ProgressBar value={m.currentValue} max={m.goalValue} /></div>
            </div>
          );
        })}
        {(missions ?? []).length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>미션이 없어요</div>
        )}
      </div>
    </>
  );
}
