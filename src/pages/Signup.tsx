import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { EcoLogo } from '@/components/ui/primitives';

type Role = 'student' | 'teacher';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [role, setRole] = useState<Role>('student');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup({ email, password, displayName, role, ...(role === 'student' ? { joinCode } : {}) });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '가입 중 오류가 발생했어요.');
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

  const roles: { key: Role; glyph: string; title: string; desc: string }[] = [
    { key: 'student', glyph: '🎒', title: '학생', desc: '환경 행동을 실천하고 코인을 모아요. 학급 코드로 가입해요.' },
    { key: 'teacher', glyph: '👩‍🏫', title: '선생님', desc: '학급을 만들고 학생들을 관리해요.' },
  ];

  return (
    <div style={{
      minHeight: '100vh', maxWidth: 480, margin: '0 auto',
      padding: '20px 24px 24px', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 18, color: 'var(--ink-3)', cursor: 'pointer' }} onClick={() => navigate('/')}>←</div>
        <EcoLogo size={24} />
        <span style={{ fontSize: 14, fontWeight: 700 }}>회원가입</span>
      </div>

      <div style={{ marginTop: 26 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
          어떤 역할로<br />가입하시나요?
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>가입 후에는 변경할 수 없어요</p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {roles.map((r) => {
            const selected = role === r.key;
            return (
              <div
                key={r.key}
                onClick={() => setRole(r.key)}
                style={{
                  border: selected ? '2px solid var(--leaf)' : '1px solid var(--line)',
                  background: selected ? 'var(--leaf-tint)' : 'var(--surface)',
                  borderRadius: 18, padding: 18,
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  cursor: 'pointer', position: 'relative',
                }}
              >
                <div style={{ fontSize: 36, lineHeight: 1 }}>{r.glyph}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.5 }}>{r.desc}</div>
                </div>
                {selected && (
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--leaf)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>✓</div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600, marginBottom: 6 }}>이름</div>
            <input placeholder="홍길동" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} required />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600, marginBottom: 6 }}>이메일</div>
            <input type="email" placeholder="example@school.kr" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600, marginBottom: 6 }}>비밀번호</div>
            <input type="password" placeholder="8자 이상" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required minLength={8} />
          </div>
          {role === 'student' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600, marginBottom: 6 }}>학급 코드 (6자리)</div>
              <input
                placeholder="K7Q3WX" value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                style={{ ...inputStyle, letterSpacing: '0.12em', textTransform: 'uppercase' }}
                required maxLength={6}
              />
            </div>
          )}
        </div>

        {error && <div style={{ fontSize: 12, color: 'var(--berry)', fontWeight: 600 }}>{error}</div>}

        <button className="eco-btn" type="submit" disabled={loading} style={{ marginTop: 'auto', padding: 16, fontSize: 15, width: '100%' }}>
          {loading ? '가입 중...' : '가입하고 시작하기'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', marginTop: 8, marginBottom: 20 }}>
          이미 계정이 있나요?{' '}
          <span style={{ color: 'var(--leaf-deep)', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/login')}>로그인</span>
        </div>
      </form>
    </div>
  );
}
