import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { EcoLogo } from '@/components/ui/primitives';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않아요.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'var(--surface)', border: '1px solid var(--line)',
    borderRadius: 12, fontSize: 14, fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh', maxWidth: 480, margin: '0 auto',
      padding: '20px 24px 24px', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 18, color: 'var(--ink-3)', cursor: 'pointer' }} onClick={() => navigate('/')}>←</div>
        <EcoLogo size={24} />
        <span style={{ fontSize: 14, fontWeight: 700 }}>로그인</span>
      </div>

      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>다시 만나서 반가워요!</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>이메일과 비밀번호로 로그인하세요</p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600, marginBottom: 6 }}>이메일</div>
          <input type="email" placeholder="example@school.kr" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600, marginBottom: 6 }}>비밀번호</div>
          <input type="password" placeholder="8자 이상" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
        </div>

        {error && <div style={{ fontSize: 12, color: 'var(--berry)', fontWeight: 600 }}>{error}</div>}

        <button className="eco-btn" type="submit" disabled={loading} style={{ marginTop: 'auto', padding: 16, fontSize: 15, width: '100%' }}>
          {loading ? '로그인 중...' : '로그인'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', marginTop: 8, marginBottom: 20 }}>
          계정이 없나요?{' '}
          <span style={{ color: 'var(--leaf-deep)', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/signup')}>회원가입</span>
        </div>
      </form>
    </div>
  );
}
