const BASE_URL = '/api';

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  return localStorage.getItem('ecoin_token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('ecoin_refresh_token');
}

export function setSession(token: string, refreshToken: string) {
  localStorage.setItem('ecoin_token', token);
  localStorage.setItem('ecoin_refresh_token', refreshToken);
}

export function clearSession() {
  localStorage.removeItem('ecoin_token');
  localStorage.removeItem('ecoin_refresh_token');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearSession();
      return null;
    }

    const { data } = await res.json() as { data: { token: string; refreshToken: string } };
    setSession(data.token, data.refreshToken);
    return data.token;
  } catch {
    clearSession();
    return null;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const doFetch = async (token: string | null) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : null,
    });

    return res;
  };

  let res = await doFetch(getToken());

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    } else {
      clearSession();
      window.location.href = '/login';
      throw new ApiError('unauthorized', '로그인이 필요합니다', 401);
    }
  }

  const json = await res.json() as { data?: T; error?: { code: string; message: string; details?: unknown } };

  if (!res.ok || json.error) {
    const err = json.error ?? { code: 'internal', message: '오류가 발생했습니다' };
    throw new ApiError(err.code, err.message, res.status, err.details);
  }

  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export { ApiError };
