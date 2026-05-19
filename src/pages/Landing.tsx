import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EcoLogo } from '@/components/ui/primitives';
import { enterDemo } from '@/lib/demo';

const FEATURES = [
  { emoji: '⛏️', title: '에코 코인 채굴', desc: '분리수거, 텀블러 사용 등 환경 행동을 하면 코인을 얻어요!' },
  { emoji: '🎁', title: '보상 교환소', desc: '모은 코인으로 자리 바꾸기권, 숙제 면제권 등을 교환해요!' },
  { emoji: '🏅', title: '뱃지 컬렉션', desc: '꾸준한 실천으로 특별한 뱃지를 모아보세요!' },
  { emoji: '📊', title: '탄소 리포트', desc: '내가 줄인 탄소량을 확인하고 성장을 추적해요!' },
  { emoji: '🎯', title: '학급 미션', desc: '반 친구들과 함께 환경 미션에 도전해요!' },
  { emoji: '🏆', title: '리더보드', desc: '학급에서 누가 가장 많이 실천했는지 확인해요!' },
];

const STEPS = [
  { num: 1, emoji: '🌿', title: '환경 행동 실천', desc: '분리수거, 텀블러 사용 등' },
  { num: 2, emoji: '⛏️', title: '코인 채굴', desc: '행동을 기록하면 코인 획득!' },
  { num: 3, emoji: '🎁', title: '보상 교환', desc: '코인으로 원하는 보상 교환!' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const startDemo = (role: 'student' | 'teacher') => {
    enterDemo(role);
    window.location.href = role === 'teacher' ? '/teacher' : '/student';
  };

  return (
    <>
      <style>{`
        .landing-page { min-height: 100vh; }

        /* ── Navbar ── */
        .landing-nav {
          max-width: 1100px; margin: 0 auto;
          padding: 16px 24px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .landing-nav-logo { display: flex; align-items: center; gap: 8px; }
        .landing-nav-logo span { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
        .landing-nav-btns { display: flex; gap: 10px; }
        .landing-nav-btns .eco-btn { padding: 10px 20px; font-size: 14px; border-radius: 12px; }

        /* ── Hero ── */
        .landing-hero {
          position: relative;
          padding: 60px 24px 80px;
          text-align: center;
          overflow: hidden;
          background: linear-gradient(180deg, var(--leaf-tint) 0%, var(--bg) 100%);
        }
        .landing-hero-content { position: relative; z-index: 1; max-width: 700px; margin: 0 auto; }
        .landing-hero-icon { margin-bottom: 20px; }
        .landing-hero-icon .coin-circle {
          width: 88px; height: 88px; border-radius: 50%;
          background: oklch(0.86 0.13 88); border: 3px solid oklch(0.62 0.14 75);
          display: inline-flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 30px rgba(180, 140, 30, 0.2);
          animation: coinPop 0.6s ease-out;
        }
        .landing-hero-icon .coin-inner {
          font-size: 40px; line-height: 1;
          color: oklch(0.32 0.10 80); font-weight: 700;
        }
        .landing-hero h1 {
          font-size: 42px; font-weight: 800; letter-spacing: -0.03em;
          line-height: 1.2; margin: 0 0 8px; color: var(--ink);
        }
        .landing-hero h1 .brand { color: var(--leaf); }
        .landing-hero .subtitle {
          font-size: 16px; color: var(--ink-2); margin-bottom: 8px; font-weight: 500;
        }
        .landing-hero .desc {
          font-size: 15px; color: var(--ink-3); line-height: 1.6;
          max-width: 480px; margin: 0 auto 32px;
        }
        .landing-hero-cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .landing-hero-cta .eco-btn { padding: 14px 32px; font-size: 16px; border-radius: 14px; }

        .landing-stats {
          display: flex; gap: 40px; justify-content: center;
          margin-top: 40px;
        }
        .landing-stat { text-align: center; }
        .landing-stat .num {
          font-size: 28px; font-weight: 800; color: var(--leaf-deep);
          font-family: var(--font-num);
        }
        .landing-stat .label { font-size: 13px; color: var(--ink-3); margin-top: 2px; }

        /* decorative leaves */
        .landing-hero .deco {
          position: absolute; opacity: 0.25; font-size: 28px;
          pointer-events: none; animation: leafSway 4s ease-in-out infinite;
        }
        .deco-1 { top: 15%; left: 8%; animation-delay: 0s; }
        .deco-2 { top: 10%; right: 6%; font-size: 18px; animation-delay: 1s; }
        .deco-3 { bottom: 20%; left: 12%; font-size: 20px; animation-delay: 2s; }
        .deco-4 { bottom: 15%; right: 10%; font-size: 24px; animation-delay: 0.5s; }
        .deco-5 { top: 50%; right: 4%; font-size: 16px; animation-delay: 1.5s; }

        /* ── Features ── */
        .landing-features {
          max-width: 1100px; margin: 0 auto;
          padding: 80px 24px;
        }
        .landing-section-header { text-align: center; margin-bottom: 48px; }
        .landing-section-header .icon { font-size: 32px; margin-bottom: 8px; }
        .landing-section-header h2 {
          font-size: 28px; font-weight: 800; letter-spacing: -0.02em;
        }
        .landing-section-header p { font-size: 15px; color: var(--ink-3); margin-top: 8px; }
        .landing-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .feature-card {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: var(--r-lg); padding: 28px 24px;
          text-align: center; box-shadow: var(--shadow-1);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .feature-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-2); }
        .feature-card .emoji { font-size: 36px; margin-bottom: 14px; }
        .feature-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .feature-card p { font-size: 13px; color: var(--ink-2); line-height: 1.55; }

        /* ── Steps ── */
        .landing-steps {
          max-width: 1100px; margin: 0 auto;
          padding: 0 24px 80px;
        }
        .landing-steps-row {
          display: flex; align-items: center; justify-content: center; gap: 20px;
          flex-wrap: wrap;
        }
        .step-item { text-align: center; flex: 0 0 200px; }
        .step-icon {
          width: 72px; height: 72px; border-radius: 50%;
          background: var(--leaf-soft); display: inline-flex;
          align-items: center; justify-content: center;
          font-size: 32px; margin-bottom: 12px;
        }
        .step-num {
          display: inline-flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 50%;
          background: var(--leaf); color: white;
          font-size: 13px; font-weight: 700;
          margin-top: -8px; position: relative;
        }
        .step-item h3 { font-size: 16px; font-weight: 700; margin: 10px 0 4px; }
        .step-item p { font-size: 13px; color: var(--ink-3); }
        .step-arrow {
          font-size: 24px; color: var(--leaf);
          flex-shrink: 0; margin-top: -30px;
        }

        /* ── Demo CTA ── */
        .landing-demo {
          max-width: 800px; margin: 0 auto;
          padding: 0 24px 80px;
        }
        .demo-banner {
          border-radius: var(--r-xl); overflow: hidden;
          box-shadow: var(--shadow-2);
        }
        .demo-banner-top {
          background: linear-gradient(135deg, var(--leaf) 0%, var(--leaf-deep) 100%);
          padding: 36px 32px 28px; text-align: center; color: white;
        }
        .demo-banner-top .icon { font-size: 36px; margin-bottom: 10px; }
        .demo-banner-top h2 { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
        .demo-banner-top p { font-size: 14px; opacity: 0.85; }
        .demo-cards {
          display: flex; gap: 16px; padding: 24px 24px 28px;
          background: var(--surface);
        }
        .demo-card {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          gap: 8px; padding: 24px 16px; border-radius: var(--r-lg);
          border: 1.5px solid var(--line); cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
          background: var(--surface);
        }
        .demo-card:hover {
          border-color: var(--leaf); box-shadow: var(--shadow-1);
          transform: translateY(-1px);
        }
        .demo-card .emoji { font-size: 28px; }
        .demo-card .role { font-size: 15px; font-weight: 700; color: var(--leaf-deep); }
        .demo-card .role-desc { font-size: 12px; color: var(--ink-3); }

        /* ── Footer ── */
        .landing-footer {
          padding: 32px 24px; text-align: center;
          border-top: 1px solid var(--line);
        }
        .landing-footer .logo-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 6px; }
        .landing-footer .logo-row span { font-size: 15px; font-weight: 700; }
        .landing-footer .slogan { font-size: 13px; color: var(--ink-3); }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .landing-hero { padding: 40px 20px 60px; }
          .landing-hero h1 { font-size: 30px; }
          .landing-hero .desc { font-size: 14px; }
          .landing-hero-cta .eco-btn { padding: 14px 24px; font-size: 15px; }
          .landing-stats { gap: 24px; }
          .landing-stat .num { font-size: 24px; }
          .landing-features { padding: 48px 20px; }
          .landing-features-grid { grid-template-columns: 1fr 1fr; gap: 14px; }
          .landing-steps-row { flex-direction: column; gap: 16px; }
          .step-arrow { transform: rotate(90deg); margin: 0; }
          .demo-cards { flex-direction: column; }
          .landing-nav-btns .nav-login { display: none; }
        }
        @media (max-width: 480px) {
          .landing-features-grid { grid-template-columns: 1fr; }
          .landing-hero-icon .coin-circle { width: 72px; height: 72px; }
          .landing-hero-icon .coin-inner { font-size: 32px; }
        }
      `}</style>

      <div className="landing-page">
        {/* Navbar */}
        <nav className="landing-nav">
          <div className="landing-nav-logo">
            <EcoLogo size={32} />
            <span>EcoinClass</span>
          </div>
          <div className="landing-nav-btns">
            <button className="eco-btn ghost nav-login" onClick={() => navigate('/login')}>
              이미 계정이 있어요
            </button>
            <button className="eco-btn" onClick={() => navigate('/signup')}>
              시작하기
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="landing-hero">
          <span className="deco deco-1">🌿</span>
          <span className="deco deco-2">💧</span>
          <span className="deco deco-3">🍃</span>
          <span className="deco deco-4">🌱</span>
          <span className="deco deco-5">🍀</span>

          <div className="landing-hero-content">
            <div className="landing-hero-icon">
              <div className="coin-circle">
                <EcoLogo size={48} />
              </div>
            </div>
            <h1>
              <span className="brand">Eco-Coin</span>
            </h1>
            <div className="subtitle">교실 속 탄소 화폐 거래소</div>
            <p className="desc">
              환경을 지키는 작은 실천이 <strong>에코 코인</strong>이 되고,
              코인으로 <strong>재미있는 보상</strong>을 교환해요!
            </p>
            <div className="landing-hero-cta">
              <button className="eco-btn" onClick={() => navigate('/signup')}>
                🌱 시작하기 →
              </button>
              <button className="eco-btn ghost" onClick={() => navigate('/login')}>
                이미 계정이 있어요
              </button>
            </div>
            <div className="landing-stats">
              <div className="landing-stat">
                <div className="num">12+</div>
                <div className="label">환경 행동</div>
              </div>
              <div className="landing-stat">
                <div className="num">10+</div>
                <div className="label">보상 아이템</div>
              </div>
              <div className="landing-stat">
                <div className="num">15+</div>
                <div className="label">뱃지 종류</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="landing-features">
          <div className="landing-section-header">
            <div className="icon">🌱</div>
            <h2>이렇게 활용해요</h2>
            <p>Eco-Coin으로 교실에서 환경 교육을 재미있게!</p>
          </div>
          <div className="landing-features-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="emoji">{f.emoji}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="landing-steps">
          <div className="landing-section-header">
            <h2>이용 방법 🚀</h2>
          </div>
          <div className="landing-steps-row">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="step-item">
                  <div className="step-icon">{s.emoji}</div>
                  <div><span className="step-num">{s.num}</span></div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && <div className="step-arrow">→</div>}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Demo CTA */}
        <section className="landing-demo">
          <div className="demo-banner">
            <div className="demo-banner-top">
              <div className="icon">🧪</div>
              <h2>로그인 없이 체험하기</h2>
              <p>데모 데이터로 Eco-Coin을 미리 경험해보세요!</p>
            </div>
            <div className="demo-cards">
              <button className="demo-card" onClick={() => startDemo('student')}>
                <span className="emoji">🎒</span>
                <span className="role">학생으로 체험</span>
                <span className="role-desc">코인 채굴 & 교환</span>
              </button>
              <button className="demo-card" onClick={() => startDemo('teacher')}>
                <span className="emoji">👩‍🏫</span>
                <span className="role">선생님으로 체험</span>
                <span className="role-desc">학급 관리 & 승인</span>
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="logo-row">
            <EcoLogo size={20} />
            <span>EcoinClass</span>
          </div>
          <div className="slogan">🌱 작은 실천이 큰 변화를 만들어요</div>
        </footer>
      </div>
    </>
  );
}
