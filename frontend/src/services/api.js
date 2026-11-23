const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

let tokenProvider = () => Promise.resolve(null);

export const setTokenProvider = (provider) => {
  tokenProvider = provider;
};

export const api = async (path, options = {}) => {
  const token = await tokenProvider();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Error ${response.status}`);
  }
  return payload;
};
