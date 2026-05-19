import React from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';

interface EcoAction {
  id: string;
  category: string;
  title: string;
  coinReward: number;
  carbonSavedG: number;
  dailyLimit: number;
  isActive: boolean;
}

const CATEGORY_GLYPHS: Record<string, string> = {
  energy: '💡', water: '💧', waste: '♻️', transport: '🚶', food: '🍽️', other: '🌿',
};
const CATEGORY_LABELS: Record<string, string> = {
  energy: '에너지', water: '물', waste: '재활용', transport: '이동', food: '음식', other: '기타',
};

export default function EcoActionsPage() {
  const { primaryClassId } = useAuth();
  const { data: actions, refetch } = usePolling<EcoAction[]>(
    primaryClassId ? `/classes/${primaryClassId}/eco-actions` : '', 30000,
  );

  const toggleAction = async (action: EcoAction) => {
    await api.patch(`/eco-actions/${action.id}`, { isActive: !action.isActive });
    refetch();
  };

  return (
    <>
      <div style={{ padding: '6px 0 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>설정</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>환경 행동 관리</div>
        </div>
      </div>

      <div style={{
        padding: '10px 12px', background: 'var(--leaf-tint)',
        border: '1px solid color-mix(in oklch, var(--leaf), white 70%)',
        borderRadius: 10, fontSize: 12, color: 'var(--leaf-deep)',
        marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-start',
      }}>
        <span>💡</span>
        <span>우리 반 상황에 맞게 항목을 켜고 끄거나, 코인·일일 한도를 조정하세요.</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(actions ?? []).map((a) => (
          <div key={a.id} className="eco-card" style={{
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-1)', padding: '12px 14px', opacity: a.isActive ? 1 : 0.55,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11,
                background: 'var(--leaf-tint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>{CATEGORY_GLYPHS[a.category] ?? '🌿'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{a.title}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{CATEGORY_LABELS[a.category] ?? a.category}</div>
              </div>
              <div
                onClick={() => toggleAction(a)}
                style={{
                  width: 40, height: 24, borderRadius: 999,
                  background: a.isActive ? 'var(--leaf)' : 'var(--line-strong)',
                  position: 'relative', flexShrink: 0, cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2, left: a.isActive ? 18 : 2,
                  width: 20, height: 20, borderRadius: '50%', background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s',
                }} />
              </div>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-soft)', borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: 'var(--ink-3)', fontWeight: 600 }}>코인</div>
                <div className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--sun-deep)' }}>+{a.coinReward}</div>
              </div>
              <div style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-soft)', borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: 'var(--ink-3)', fontWeight: 600 }}>탄소 절감</div>
                <div className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--leaf-deep)' }}>{a.carbonSavedG}g</div>
              </div>
              <div style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-soft)', borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: 'var(--ink-3)', fontWeight: 600 }}>일일 한도</div>
                <div className="num" style={{ fontSize: 14, fontWeight: 700 }}>{a.dailyLimit}회</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
