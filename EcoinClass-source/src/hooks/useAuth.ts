import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export type AppRole = 'student' | 'teacher' | 'super_admin' | 'mini_admin';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  class_name: string;
  total_coins: number;
  total_carbon_saved: number;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  role: AppRole | null; // primary role for backward compat
  loading: boolean;
  isTeacher: boolean;
  isSuperAdmin: boolean;
  isMiniAdmin: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    roles: [],
    role: null,
    loading: true,
    isTeacher: false,
    isSuperAdmin: false,
    isMiniAdmin: false,
  });

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Fetch all roles for this user
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const roles = (rolesData || []).map(r => r.role as AppRole);
      const primaryRole = roles.includes('super_admin') ? 'super_admin' 
        : roles.includes('teacher') ? 'teacher'
        : roles.includes('mini_admin') ? 'mini_admin'
        : roles.includes('student') ? 'student'
        : null;

      setAuthState(prev => ({
        ...prev,
        profile,
        roles,
        role: primaryRole,
        isTeacher: roles.includes('teacher') || roles.includes('super_admin'),
        isSuperAdmin: roles.includes('super_admin'),
        isMiniAdmin: roles.includes('mini_admin'),
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching user data:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({
          ...prev,
          user: session?.user ?? null,
          session,
        }));

        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            profile: null,
            roles: [],
            role: null,
            isTeacher: false,
            isSuperAdmin: false,
            isMiniAdmin: false,
            loading: false,
          }));
        }
      }
    );

    // THEN check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        user: session?.user ?? null,
        session,
      }));

      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signUp = async (email: string, password: string, name: string, role: 'student' | 'teacher' = 'student') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name, role },
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const refreshProfile = useCallback(async () => {
    if (authState.user) {
      await fetchUserData(authState.user.id);
    }
  }, [authState.user, fetchUserData]);

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };
}
