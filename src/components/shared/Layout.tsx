import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function StudentLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 24px' }}>
        <Outlet />
      </div>
      <BottomNav role="student" />
    </div>
  );
}

export function TeacherLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 24px' }}>
        <Outlet />
      </div>
      <BottomNav role="teacher" />
    </div>
  );
}
