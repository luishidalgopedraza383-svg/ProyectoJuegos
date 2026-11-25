import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, getToken, setToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      const response = await api('/auth/me');
      setProfile(response.user);
      return true;
    } catch {
      setProfile(null);
      return false;
    }
  }, []);

  // Restaura la sesión desde el token guardado (si existe).
  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      if (!getToken()) {
        if (!cancelled) setLoading(false);
        return;
      }
      const ok = await loadProfile();
      if (!ok) clearToken();
      if (!cancelled) setLoading(false);
    };
    bootstrap();
    return () => { cancelled = true; };
  }, [loadProfile]);

  const login = async (email, password) => {
    setError('');
    try {
      const response = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(response.token);
      setProfile(response.user);
      return response.user;
    } catch (err) {
      setError(err.message || 'No fue posible iniciar sesión');
      return false;
    }
  };

  const logout = () => {
    clearToken();
    setProfile(null);
  };

  const value = useMemo(() => ({
    session: Boolean(profile),
    profile,
    loading,
    error,
    login,
    logout,
    loadProfile,
    role: profile?.role?.name || null,
    permissions: profile?.permissions || [],
    can: (code) => (profile?.permissions || []).includes(code),
  }), [profile, loading, error, loadProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
