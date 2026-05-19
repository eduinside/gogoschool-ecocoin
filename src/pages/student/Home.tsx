import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { track } from '@/lib/track';
import { usePolling } from '@/hooks/usePolling';
import { CoinIcon, CarbonIcon, StatTile, SectionTitle, ProgressBar, getLevel, LEVELS } from '@/components/ui/primitives';

interface EcoAction {
  id: string;
  category: string;
  title: string;
  description: string | null;
  coinReward: number;
  carbonSavedG: number;
  dailyLimit: number;
  todayCount: number;
  remainingToday: number;
}

interface Mission {
  id: string;
  title: string;
  description: string | null;
  goalValue: number;
  currentValue: number;
  isCompleted: boolean;
}

interface MineResult {
  miningId: string;
  coinReward: number;
  carbonSavedG: number;
  newTotalCoins: number;
  newCarbonSavedG: number;
  remainingToday: number;
  newBadges: Array<{ id: string; code: string; title: string; emoji: string | null }>;
}

const CATEGORY_GLYPHS: Record<string, string> = {
  energy: '💡', water: '💧', waste: '♻️', transport: '🚶', food: '🍽️', other: '🌿',
};

export default function StudentHome() {
  const { user, primaryClassId, refreshUser } = useAuth();
  const [miningResult, setMiningResult] = useState<MineResult | null>(null);
  const [miningAction, setMiningAction] = useState<string>('');

  const { data: actions, refetch: refetchActions } = usePolling<EcoAction[]>(
    primaryClassId ? `/classes/${primaryClassId}/eco-actions` : '',
    30000,
  );

  const { data: missions } = usePolling<Mission[]>(
    primaryClassId ? `/classes/${primaryClassId}/missions` : '',
    30000,
  );

  if (!user) return null;

  const lv = getLevel(user.carbonSavedG);
  const nextLv = LEVELS.find((l) => l.lv === lv.lv + 1);
  const toNext = nextLv ? nextLv.min - user.carbonSavedG : 0;
  const lvProgress = nextLv ? ((user.carbonSavedG - lv.min) / (nextLv.min - lv.min)) * 100 : 100;

  const handleMine = async (action: EcoAction) => {
    if (!primaryClassId || action.remainingToday <= 0) return;
    track('mine.attempted', { actionId: action.id });

    try {
      const result = await api.post<MineResult>('/mine', { actionId: action.id, classId: primaryClassId });
      setMiningResult(result);
      setMiningAction(action.title);
      track('mine.success', { actionId: action.id, coinReward: result.coinReward, carbonSavedG: result.carbonSavedG });
      await Promise.all([refreshUser(), refetchActions()]);
    } catch (e: unknown) {
      if (e instanceof Error && 'code' in e && (e as { code: string }).code === 'daily_limit') {
        track('mine.daily_limit_hit', { actionId: action.id });
      }
    }
  };

  if (miningResult) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, oklch(0.94 0.03 145) 0%, oklch(0.86 0.06 145) 100%)' }} />
        {[...Array(14)].map((_, i) => {
          const colors = ['var(--leaf)', 'var(--lime)', 'var(--sun)', 'var(--leaf-deep)'];
          return (
            <div key={i} style={{
              position: 'absolute', left: `${(i * 73) % 100}%`, top: `${15 + (i * 47) % 70}%`,
              width: 8, height: 8, borderRadius: 2, background: colors[i % colors.length],
              transform: `rotate(${i * 31}deg)`, opacity: 0.7,
            }} />
          );
        })}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 30px', textAlign: 'center' }}>
          <div style={{
            width: 140, height: 140, borderRadius: '50%', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 60px oklch(0.62 0.14 150 / 0.30), inset 0 0 0 6px var(--leaf-soft)',
            animation: 'coinPop 0.6s ease',
          }}>
            <span style={{ fontSize: 64, animation: 'leafSway 2s ease-in-out infinite' }}>🎉</span>
          </div>
          <div style={{ marginTop: 24, fontSize: 13, color: 'var(--moss)', fontWeight: 600, letterSpacing: '0.04em' }}>채굴 성공</div>
          <div style={{ marginTop: 6, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{miningAction}</div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <div style={{ padding: '10px 18px', borderRadius: 14, background: 'white', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CoinIcon size={20} />
              <span className="num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--sun-deep)' }}>+{miningResult.coinReward}</span>
            </div>
            <div style={{ padding: '10px 18px', borderRadius: 14, background: 'white', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CarbonIcon size={20} />
              <span className="num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--leaf-deep)' }}>-{miningResult.carbonSavedG}g</span>
            </div>
          </div>
          {miningResult.newBadges.length > 0 && (
            <div style={{ marginTop: 16, padding: '10px 16px', background: 'white', borderRadius: 14, border: '1px solid var(--line)' }}>
              {miningResult.newBadges.map((b) => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
                  <span style={{ fontSize: 24 }}>{b.emoji}</span>
                  <span>{b.title} 획득!</span>
                </div>
              ))}
            </div>
          )}
          <button
            className="eco-btn"
            style={{ marginTop: 28, width: '100%', padding: '14px 20px', fontSize: 15 }}
            onClick={() => setMiningResult(null)}
          >
            계속 실천하기
          </button>
        </div>
      </div>
    );
  }

  const activeMission = missions?.find((m) => !m.isCompleted);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0 14px' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}>안녕, {user.displayName}!</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>오늘도 한 걸음 🌱</div>
        </div>
      </div>

      {/* Hero balance card */}
      <div style={{
        borderRadius: 24, background: 'linear-gradient(150deg, oklch(0.62 0.14 150) 0%, oklch(0.50 0.13 155) 100%)',
        color: 'white', padding: '20px 20px 22px', position: 'relative', overflow: 'hidden',
        boxShadow: '0 12px 28px oklch(0.62 0.14 150 / 0.25)',
      }}>
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ position: 'absolute', right: -30, top: -30, opacity: 0.18 }}>
          <path d="M40 130 C 40 60, 90 25, 140 25 C 140 90, 100 130, 40 130 Z" fill="white" />
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, opacity: 0.9 }}>
          <CoinIcon size={14} /> 보유 Eco-Coin
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <span className="num" style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {user.totalCoins}
          </span>
          <span style={{ fontSize: 14, opacity: 0.85, fontWeight: 600 }}>코인</span>
        </div>
        <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(255,255,255,0.16)', borderRadius: 12, backdropFilter: 'blur(8px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 600 }}>
            <span>{lv.glyph} Lv.{lv.lv} {lv.name}</span>
            <span style={{ opacity: 0.85 }}>{nextLv ? `다음까지 ${(toNext / 1000).toFixed(1)}kg` : '최고 레벨!'}</span>
          </div>
          <div style={{ marginTop: 8, height: 6, background: 'rgba(255,255,255,0.22)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${lvProgress}%`, background: 'white', borderRadius: 999 }} />
          </div>
        </div>
      </div>

      {/* Stat row */}
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <StatTile icon={<CarbonIcon size={14} />} label="누적 절감" value={`${(user.carbonSavedG / 1000).toFixed(1)}`} suffix="kg CO₂" />
        <StatTile icon={<span style={{ fontSize: 13 }}>⛏️</span>} label="레벨" value={lv.lv} suffix={lv.name} />
      </div>

      {/* Eco actions grid */}
      <div style={{ marginTop: 22 }}>
        <SectionTitle title="오늘의 환경 행동" hint="실천한 항목을 탭하세요" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(actions ?? []).map((a) => {
            const exhausted = a.remainingToday <= 0;
            return (
              <div
                key={a.id}
                onClick={() => handleMine(a)}
                style={{
                  background: exhausted ? 'var(--bg-soft)' : 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 16, padding: '12px 12px',
                  opacity: exhausted ? 0.55 : 1,
                  display: 'flex', flexDirection: 'column', gap: 6,
                  cursor: exhausted ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.1s ease',
                }}
              >
                <div style={{ fontSize: 28, lineHeight: 1 }}>{CATEGORY_GLYPHS[a.category] ?? '🌿'}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{a.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    background: 'var(--leaf-soft)', color: 'var(--leaf-deep)',
                    padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                  }}>
                    <CoinIcon size={11} /> +{a.coinReward}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600 }}>
                    {a.todayCount}/{a.dailyLimit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission peek */}
      {activeMission && (
        <div style={{ marginTop: 20 }}>
          <SectionTitle title="우리 반 미션" />
          <div className="eco-card" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-1)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{activeMission.title}</div>
                {activeMission.description && (
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{activeMission.description}</div>
                )}
              </div>
              <div className="num" style={{ fontSize: 13, color: 'var(--leaf-deep)', fontWeight: 700 }}>
                {activeMission.currentValue.toLocaleString()} / {activeMission.goalValue.toLocaleString()}
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <ProgressBar value={activeMission.currentValue} max={activeMission.goalValue} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
