const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
const CSRF_COOKIE = 'pj_csrf';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// La cookie de sesión es HttpOnly: JavaScript no puede leerla, pero sí la de
// CSRF, que debe devolverse en X-CSRF-Token en peticiones que cambian estado.
const getCsrfToken = () => {
  try {
    const entry = document.cookie.split('; ').find((part) => part.startsWith(`${CSRF_COOKIE}=`));
    return entry ? decodeURIComponent(entry.slice(CSRF_COOKIE.length + 1)) : '';
  } catch {
    return '';
  }
};

export const api = async (path, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };
  if (!SAFE_METHODS.has(method)) headers['X-CSRF-Token'] = getCsrfToken();

  const response = await fetch(`${BASE}${path}`, {
    ...options,
    method,
    credentials: 'include',
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pj:unauthorized'));
    }
    const problem = payload?.error;
    // Zod devuelve el motivo concreto (por ejemplo, "El precio máximo es 60 USD").
    const detail = problem?.details?.formErrors?.find(Boolean)
      || Object.values(problem?.details?.fieldErrors || {}).flat().find(Boolean);
    throw new Error(detail || problem?.message || `Error ${response.status}`);
  }
  return payload;
};
