import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isDemoMode } from '@/lib/demo';
import { AuthProvider, useAuth } from '@/lib/auth';
import { StudentLayout, TeacherLayout } from '@/components/shared/Layout';

import LandingPage from '@/pages/Landing';
import LoginPage from '@/pages/Login';
import SignupPage from '@/pages/Signup';

import StudentHome from '@/pages/student/Home';
import RewardsPage from '@/pages/student/Rewards';
import LeaderboardPage from '@/pages/student/Leaderboard';
import ReportPage from '@/pages/student/Report';
import BadgesPage from '@/pages/student/Badges';
import MyRequestsPage from '@/pages/student/MyRequests';

import TeacherHomePage from '@/pages/teacher/Home';
import ClassManagerPage from '@/pages/teacher/ClassManager';
import EcoActionsPage from '@/pages/teacher/EcoActions';
import MissionsPage from '@/pages/teacher/Missions';
import RewardQueuePage from '@/pages/teacher/RewardQueue';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'student' | 'teacher' }) {
  const { user, loading, isTeacher, isStudent } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'teacher' && !isTeacher) return <Navigate to="/student" replace />;
  if (role === 'student' && !isStudent) return <Navigate to="/teacher" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading, isTeacher } = useAuth();
  if (loading) return null;
  if (user && !isDemoMode()) return <Navigate to={isTeacher ? '/teacher' : '/student'} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnly><LandingPage /></PublicOnly>} />
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />

      <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
        <Route index element={<StudentHome />} />
        <Route path="rewards" element={<RewardsPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="badges" element={<BadgesPage />} />
        <Route path="requests" element={<MyRequestsPage />} />
      </Route>

      <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherLayout /></ProtectedRoute>}>
        <Route index element={<TeacherHomePage />} />
        <Route path="class" element={<ClassManagerPage />} />
        <Route path="eco-actions" element={<EcoActionsPage />} />
        <Route path="missions" element={<MissionsPage />} />
        <Route path="rewards" element={<RewardQueuePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
