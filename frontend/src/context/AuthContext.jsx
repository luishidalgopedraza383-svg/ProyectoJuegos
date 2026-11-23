import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';
import { api, setTokenProvider } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      const response = await api('/auth/me');
      setProfile(response.user);
    } catch (err) {
      setError(err.message);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    setTokenProvider(async () => {
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token || null;
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadProfile();
    else setProfile(null);
  }, [session, loadProfile]);

  const login = async (email, password) => {
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      return false;
    }
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const value = useMemo(() => ({
    session, profile, loading, error, login, logout, loadProfile,
    permissions: profile?.permissions || [],
  }), [session, profile, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
