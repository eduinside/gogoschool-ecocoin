import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EcoLogo } from '@/components/ui/primitives';

export default function LandingPage() {
  const navigate = useNavigate();

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
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
          이미 계정이 있나요?{' '}
          <span style={{ color: 'var(--leaf-deep)', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/login')}>
            로그인
          </span>
        </div>
      </div>
    </div>
  );
}
