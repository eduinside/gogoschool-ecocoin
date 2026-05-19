import React from 'react';

export function EcoLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="ecologo-leaf" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(0.72 0.16 140)" />
          <stop offset="1" stopColor="oklch(0.50 0.13 155)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#ecologo-leaf)" />
      <path d="M13 26 C 13 16, 21 11, 28 11 C 28 19, 23 26, 13 26 Z" fill="white" opacity="0.95" />
      <path d="M13 26 C 17 22, 22 17, 28 11" stroke="oklch(0.55 0.12 152)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function CoinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="oklch(0.86 0.13 88)" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="oklch(0.62 0.14 75)" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="oklch(0.62 0.14 75)" strokeWidth="1" strokeDasharray="2 2" />
      <path d="M9 12 L11 14 L15 9" stroke="oklch(0.32 0.10 80)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CarbonIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 18 C 5 10, 12 5, 19 5 C 19 13, 13 18, 5 18 Z" fill="oklch(0.78 0.14 145)" stroke="oklch(0.45 0.12 152)" strokeWidth="1.2" />
      <path d="M5 18 C 9 14, 14 10, 19 5" stroke="oklch(0.45 0.12 152)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export const LEVELS = [
  { lv: 1, name: '새싹', glyph: '🌱', min: 0, next: 10000 },
  { lv: 2, name: '풀잎', glyph: '🌿', min: 10000, next: 30000 },
  { lv: 3, name: '나무', glyph: '🌳', min: 30000, next: 80000 },
  { lv: 4, name: '지구지킴이', glyph: '🌍', min: 80000, next: 150000 },
  { lv: 5, name: '에코히어로', glyph: '🦸', min: 150000, next: Infinity },
];

export function getLevel(carbonG: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (carbonG >= LEVELS[i]!.min) return LEVELS[i]!;
  }
  return LEVELS[0]!;
}

export function ProgressBar({
  value,
  max,
  color = 'var(--leaf)',
  track = 'var(--leaf-tint)',
  height = 8,
}: {
  value: number;
  max: number;
  color?: string;
  track?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ width: '100%', height, background: track, borderRadius: 999, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 999,
          transition: 'width 0.4s cubic-bezier(.2,.7,.3,1)',
        }}
      />
    </div>
  );
}

export function StatTile({
  icon,
  label,
  value,
  suffix,
  accent = 'var(--leaf)',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 18,
        padding: '14px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-3)', fontSize: 12, fontWeight: 600 }}>
        {icon}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="num" style={{ fontSize: 24, fontWeight: 700, color: accent, letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {suffix && <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{suffix}</span>}
      </div>
    </div>
  );
}

export function Avatar({ name, size = 36, hueSeed }: { name: string; size?: number; hueSeed?: number }) {
  const hash = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = hueSeed != null ? hueSeed : (hash * 47) % 360;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `oklch(0.86 0.08 ${hue})`,
        color: `oklch(0.30 0.10 ${hue})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.42,
        flexShrink: 0,
        border: `1.5px solid oklch(0.95 0.04 ${hue})`,
      }}
    >
      {(name || '?').slice(0, 1)}
    </div>
  );
}

export function StatusPill({ status }: { status: 'pending' | 'approved' | 'rejected' | 'cancelled' }) {
  const map = {
    pending: { label: '대기 중', bg: 'oklch(0.95 0.06 90)', fg: 'oklch(0.45 0.12 75)' },
    approved: { label: '승인됨', bg: 'var(--leaf-soft)', fg: 'var(--leaf-deep)' },
    rejected: { label: '거절됨', bg: 'oklch(0.95 0.04 25)', fg: 'oklch(0.50 0.14 25)' },
    cancelled: { label: '취소됨', bg: 'var(--bg-soft)', fg: 'var(--ink-3)' },
  };
  const s = map[status] || map.pending;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 999,
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.02em',
      }}
    >
      {s.label}
    </span>
  );
}

export function SectionTitle({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
        padding: '0 0 10px',
      }}
    >
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{title}</div>
        {hint && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{hint}</div>}
      </div>
      {action}
    </div>
  );
}
