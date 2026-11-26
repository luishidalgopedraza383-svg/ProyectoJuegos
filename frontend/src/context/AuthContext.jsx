import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

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

  // La sesión vive en una cookie HttpOnly: siempre se intenta /auth/me al
  // cargar; si no hay cookie, el backend responde 401 sin exponer el token.
  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      await loadProfile();
      if (!cancelled) setLoading(false);
    };
    const onUnauthorized = () => setProfile(null);

    bootstrap();
    window.addEventListener('pj:unauthorized', onUnauthorized);
    return () => {
      cancelled = true;
      window.removeEventListener('pj:unauthorized', onUnauthorized);
    };
  }, [loadProfile]);

  const login = async (email, password) => {
    setError('');
    try {
      const response = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setProfile(response.user);
      return response.user;
    } catch (err) {
      setError(err.message || 'No fue posible iniciar sesión');
      return false;
    }
  };

  // Registro público: el backend crea la billetera y abre la sesión igual que el login.
  const register = async (payload) => {
    setError('');
    try {
      const response = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setProfile(response.user);
      return response;
    } catch (err) {
      setError(err.message || 'No fue posible crear la cuenta');
      return false;
    }
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // Aun si falla la red, se cierra la interfaz; la cookie expira sola.
    }
    setProfile(null);
  };

  const value = useMemo(() => ({
    session: Boolean(profile),
    profile,
    loading,
    error,
    login,
    register,
    logout,
    loadProfile,
    role: profile?.role?.name || null,
    permissions: profile?.permissions || [],
    can: (code) => (profile?.permissions || []).includes(code),
  }), [profile, loading, error, loadProfile, register]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
