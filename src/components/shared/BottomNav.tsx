import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const STUDENT_ITEMS = [
  { path: '/student', label: '홈', icon: '🏠' },
  { path: '/student/rewards', label: '교환소', icon: '🛒' },
  { path: '/student/leaderboard', label: '리더보드', icon: '🏆' },
  { path: '/student/report', label: '리포트', icon: '📊' },
  { path: '/student/requests', label: '내 정보', icon: '👤' },
];

const TEACHER_ITEMS = [
  { path: '/teacher', label: '홈', icon: '🏠' },
  { path: '/teacher/class', label: '학급', icon: '👥' },
  { path: '/teacher/eco-actions', label: '행동관리', icon: '🌿' },
  { path: '/teacher/missions', label: '미션', icon: '🎯' },
  { path: '/teacher/rewards', label: '보상', icon: '🎁' },
];

export function BottomNav({ role }: { role: 'student' | 'teacher' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const items = role === 'student' ? STUDENT_ITEMS : TEACHER_ITEMS;

  return (
    <div
      style={{
        borderTop: '1px solid var(--line)',
        background: 'var(--surface)',
        padding: '10px 8px 14px',
        display: 'flex',
        justifyContent: 'space-around',
        flexShrink: 0,
      }}
    >
      {items.map((it) => {
        const on = location.pathname === it.path || (it.path !== '/student' && it.path !== '/teacher' && location.pathname.startsWith(it.path));
        return (
          <div
            key={it.path}
            onClick={() => navigate(it.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              color: on ? 'var(--leaf-deep)' : 'var(--ink-3)',
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: 12,
              background: on ? 'var(--leaf-soft)' : 'transparent',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <span style={{ fontSize: 18, filter: on ? 'none' : 'grayscale(0.3)' }}>{it.icon}</span>
            <span>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}
