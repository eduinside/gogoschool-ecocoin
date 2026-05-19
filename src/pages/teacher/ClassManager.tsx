import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import { CoinIcon, Avatar, SectionTitle, getLevel } from '@/components/ui/primitives';

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  section: number;
  joinCode: string;
  memberCount: number;
}

interface StudentEntry {
  userId: string;
  displayName: string;
  totalCoins: number;
  carbonSavedG: number;
  level: number;
  isHelper: boolean;
}

export default function ClassManagerPage() {
  const { primaryClassId } = useAuth();
  const [search, setSearch] = useState('');
  const { data: classInfo } = usePolling<ClassInfo>(primaryClassId ? `/classes/${primaryClassId}` : '', 30000);
  const { data: students, refetch } = usePolling<StudentEntry[]>(
    primaryClassId ? `/classes/${primaryClassId}/students?sort=coins&order=desc` : '', 15000,
  );

  const filtered = (students ?? []).filter((s) => s.displayName.includes(search));

  const toggleHelper = async (userId: string) => {
    if (!primaryClassId) return;
    await api.post(`/classes/${primaryClassId}/helpers`, { userId });
    refetch();
  };

  return (
    <>
      <div style={{ padding: '6px 0 14px' }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>
          {classInfo ? `${classInfo.grade}학년 ${classInfo.section}반 · ${classInfo.memberCount}명` : '...'}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>학급 관리</div>
      </div>

      {classInfo && (
        <div style={{
          background: 'var(--ink)', color: 'white',
          borderRadius: 18, padding: '16px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>학급 코드</div>
            <div className="num" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.12em', marginTop: 4 }}>{classInfo.joinCode}</div>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(classInfo.joinCode)}
            style={{
              background: 'rgba(255,255,255,0.15)', color: 'white',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 10, padding: '8px 12px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >📋 복사</button>
        </div>
      )}

      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <input
          placeholder="학생 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px',
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 12, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      </div>

      <div className="eco-card" style={{
        background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-1)', overflow: 'hidden',
      }}>
        {filtered.map((s, i) => {
          const lv = getLevel(s.carbonSavedG);
          return (
            <div key={s.userId} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 'none',
            }}>
              <Avatar name={s.displayName} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{s.displayName}</span>
                  {s.isHelper && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                      background: 'var(--lime)', color: 'var(--ink)',
                    }}>꼬마관리자</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, display: 'flex', gap: 8 }}>
                  <span>{lv.glyph} Lv.{lv.lv}</span>
                  <span>·</span>
                  <span className="num">{(s.carbonSavedG / 1000).toFixed(1)}kg</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CoinIcon size={13} />
                <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--leaf-deep)' }}>{s.totalCoins}</span>
              </div>
              <div
                onClick={() => toggleHelper(s.userId)}
                style={{
                  fontSize: 18,
                  color: s.isHelper ? 'var(--sun-deep)' : 'var(--ink-3)',
                  cursor: 'pointer', padding: 4,
                  opacity: s.isHelper ? 1 : 0.4,
                }}
              >★</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
