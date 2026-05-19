import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EcoLogo } from '@/components/ui/primitives';
import { enterDemo } from '@/lib/demo';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showDemoModal, setShowDemoModal] = useState(false);

  const startDemo = (role: 'student' | 'teacher') => {
    enterDemo(role);
    window.location.href = role === 'teacher' ? '/teacher' : '/student';
  };

  return (
    <div style={{
      minHeight: '100vh', maxWidth: 480, margin: '0 auto',
      padding: '20px 24px 24px',
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, var(--leaf-tint) 0%, var(--bg) 38%)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <EcoLogo size={32} />
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>EcoinClass</span>
      </div>

      <div style={{ marginTop: 36 }}>
        <div style={{ fontSize: 13, color: 'var(--leaf-deep)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          🌱 우리 반 친환경 경제
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em',
          lineHeight: 1.15, margin: '12px 0 0',
        }}>
          작은 실천이<br />
          <span style={{ color: 'var(--leaf-deep)' }}>코인이 되어</span><br />
          돌아와요
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, marginTop: 14, maxWidth: 300 }}>
          잔반 줄이기, 분리배출, 소등 같은 일상의 환경 행동을
          Eco-Coin으로 보상받고, 학급 친구들과 함께 지구를 지켜요.
        </p>
      </div>

      <div style={{ flex: 1, position: 'relative', margin: '20px 0', minHeight: 180 }}>
        <svg width="100%" height="100%" viewBox="0 0 320 220" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="80" cy="110" r="70" fill="oklch(0.94 0.06 145)" />
          <circle cx="220" cy="120" r="50" fill="oklch(0.96 0.05 130)" />
          <path d="M40 140 C 40 80, 90 50, 140 50 C 140 110, 100 140, 40 140 Z" fill="oklch(0.62 0.14 150)" opacity="0.85" />
          <path d="M40 140 C 70 115, 110 85, 140 50" stroke="oklch(0.45 0.12 152)" strokeWidth="2" fill="none" />
          <circle cx="240" cy="80" r="32" fill="oklch(0.86 0.13 88)" stroke="oklch(0.62 0.14 75)" strokeWidth="2" />
          <text x="240" y="89" fontSize="28" textAnchor="middle" fill="oklch(0.32 0.10 80)" fontWeight="700">¢</text>
          <path d="M180 170 C 180 140, 210 125, 240 125 C 240 155, 215 170, 180 170 Z" fill="oklch(0.78 0.16 130)" opacity="0.85" />
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="eco-btn" style={{ width: '100%', padding: 16, fontSize: 15 }} onClick={() => navigate('/signup')}>
          시작하기
        </button>
        <button className="eco-btn ghost" style={{ width: '100%', padding: 16, fontSize: 15 }} onClick={() => setShowDemoModal(true)}>
          체험 모드로 둘러보기
        </button>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
          이미 계정이 있나요?{' '}
          <span style={{ color: 'var(--leaf-deep)', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/login')}>
            로그인
          </span>
        </div>
      </div>

      {/* 체험 모드 역할 선택 모달 */}
      {showDemoModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setShowDemoModal(false)}>
          <div
            style={{
              width: '100%', maxWidth: 480,
              background: 'var(--surface)', borderRadius: '24px 24px 0 0',
              padding: '24px 24px 36px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line-strong)', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>어떤 역할로 체험할까요?</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>
              로그인 없이 더미 데이터로 둘러볼 수 있어요
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => startDemo('student')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 18px', borderRadius: 16,
                  background: 'var(--leaf-tint)', border: '1.5px solid var(--leaf)',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
              >
                <span style={{ fontSize: 36 }}>🎒</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>학생으로 체험</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>채굴, 보상 신청, 리더보드, 리포트</div>
                </div>
              </button>
              <button
                onClick={() => startDemo('teacher')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 18px', borderRadius: 16,
                  background: 'var(--surface)', border: '1.5px solid var(--line)',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
              >
                <span style={{ fontSize: 36 }}>👩‍🏫</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>선생님으로 체험</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>학급 현황, 보상 승인, 학생 관리</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
