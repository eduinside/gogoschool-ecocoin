import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setSession, clearSession } from './api';
import { isDemoMode, getDemoRole, exitDemo, DEMO_STUDENT_USER, DEMO_TEACHER_USER } from './demo';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarEmoji: string | null;
  grade: number | null;
  totalCoins: number;
  carbonSavedG: number;
  level: number;
  roles: Array<{ role: string; classId: string | null }>;
  classes: Array<{ id: string; name: string; joinCode: string }>;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    displayName: string;
    role: 'student' | 'teacher';
    joinCode?: string;
    grade?: number;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isTeacher: boolean;
  isStudent: boolean;
  primaryClassId: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const data = await api.get<{
        user: { id: string; email: string };
        profile: {
          displayName: string;
          avatarEmoji: string | null;
          grade: number | null;
          totalCoins: number;
          carbonSavedG: number;
          level: number;
        };
        roles: Array<{ role: string; classId: string | null }>;
        classes: Array<{ id: string; name: string; joinCode: string }>;
      }>('/auth/me');

      setUser({
        id: data.user.id,
        email: data.user.email,
        ...data.profile,
        roles: data.roles,
        classes: data.classes,
      });
    } catch {
      setUser(null);
      clearSession();
    }
  }, []);

  useEffect(() => {
    if (isDemoMode()) {
      const role = getDemoRole();
      setUser(role === 'teacher' ? DEMO_TEACHER_USER : DEMO_STUDENT_USER);
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('ecoin_token');
    if (token) {
      fetchMe().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const data = await api.post<{
      user: { id: string; email: string; displayName: string; roles: string[]; classIds: string[] };
      token: string;
      refreshToken: string;
    }>('/auth/login', { email, password });

    setSession(data.token, data.refreshToken);
    await fetchMe();
  };

  const signup = async (signupData: {
    email: string;
    password: string;
    displayName: string;
    role: 'student' | 'teacher';
    joinCode?: string;
    grade?: number;
  }) => {
    const data = await api.post<{
      user: { id: string; email: string; displayName: string };
      token: string;
      refreshToken: string;
    }>('/auth/signup', signupData);

    setSession(data.token, data.refreshToken);
    await fetchMe();
  };

  const logout = async () => {
    if (isDemoMode()) {
      exitDemo();
      setUser(null);
      return;
    }
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    clearSession();
    setUser(null);
  };

  const isTeacher = user?.roles.some((r) => r.role === 'teacher') ?? false;
  const isStudent = user?.roles.some((r) => r.role === 'student') ?? false;
  const primaryClassId = user?.classes[0]?.id ?? null;

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, refreshUser: fetchMe, isTeacher, isStudent, primaryClassId }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
