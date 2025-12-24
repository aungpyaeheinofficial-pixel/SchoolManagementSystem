const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;

export function getApiBaseUrl(): string | null {
  if (!API_BASE_URL) return null;
  return API_BASE_URL.replace(/\/+$/, '');
}

export function getAuthToken(): string | null {
  return localStorage.getItem('pnsp_api_token');
}

export function setAuthToken(token: string | null) {
  if (!token) localStorage.removeItem('pnsp_api_token');
  else localStorage.setItem('pnsp_api_token', token);
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) throw new Error('VITE_API_BASE_URL is not set');

  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');

  if (init.auth) {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated (missing pnsp_api_token)');
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}


