const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
const TOKEN_KEY = 'pj_token';

export const getToken = () => {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage puede no estar disponible (modo privado); la sesión solo duraría la pestaña.
  }
};

export const clearToken = () => setToken(null);

export const api = async (path, options = {}) => {
  const token = getToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) clearToken();
    const problem = payload?.error;
    // Zod devuelve el motivo concreto (por ejemplo, "El precio máximo es 60 USD").
    const detail = problem?.details?.formErrors?.find(Boolean)
      || Object.values(problem?.details?.fieldErrors || {}).flat().find(Boolean);
    throw new Error(detail || problem?.message || `Error ${response.status}`);
  }
  return payload;
};
