/**
 * Core API utilities: base URL, token management, and authenticated fetch.
 * All other API modules depend on this.
 */
import { AppError, parseApiError } from '../errorHandler';
import { apiCache } from '../cache';
import { retryWithBackoff, withTimeout, TIMEOUT_CONFIG } from '../edgeCases';

export const API_BASE = import.meta.env.VITE_API_BASE_URL?.toString() || "http://127.0.0.1:8000";

const ACCESS_KEY = "aiorg_access_token";
const REFRESH_KEY = "aiorg_refresh_token";

// Refresh lock to prevent race conditions
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Re-export utilities that other modules need
export { retryWithBackoff, withTimeout, TIMEOUT_CONFIG, AppError, parseApiError, apiCache };

// ------------------------------
// Token helpers
// ------------------------------

export function getAccessToken(): string | null {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) return token;

  try {
    const oldTokens = localStorage.getItem("aiorg_tokens_v1");
    if (oldTokens) {
      const parsed = JSON.parse(oldTokens);
      if (parsed?.accessToken) {
        setTokens(parsed.accessToken, parsed.refreshToken || "");
        return parsed.accessToken;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export function getRefreshToken(): string | null {
  const token = localStorage.getItem(REFRESH_KEY);
  if (token) return token;

  try {
    const oldTokens = localStorage.getItem("aiorg_tokens_v1");
    if (oldTokens) {
      const parsed = JSON.parse(oldTokens);
      if (parsed?.refreshToken) {
        setTokens(parsed.accessToken || "", parsed.refreshToken);
        return parsed.refreshToken;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem("aiorg_tokens_v1");
}

export async function refreshTokens(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (data?.accessToken && data?.refreshToken) {
        setTokens(data.accessToken, data.refreshToken);
        return data.accessToken as string;
      } else if (data?.access_token && data?.refresh_token) {
        setTokens(data.access_token, data.refresh_token);
        return data.access_token as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Auth-aware fetch with caching and retry on 401.
 */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let url: string;
  if (path.startsWith("http")) {
    url = path;
  } else {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const apiPath = normalized.startsWith("/api") ? normalized : `/api${normalized}`;
    url = `${API_BASE}${apiPath}`;
  }

  const method = init.method || 'GET';
  const isGet = method === 'GET';
  const cacheKey = isGet ? `cache:${url}` : null;

  // For GET requests, check cache first
  if (isGet && cacheKey) {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const doFetch = async (token: string | null) => {
    const headers = new Headers(init.headers || {});
    headers.set("Accept", headers.get("Accept") || "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    try {
      return await fetch(url, { ...init, headers });
    } catch (error) {
      if (error instanceof TypeError && (error.message.includes("fetch") || error.message.includes("Failed to fetch"))) {
        throw new AppError(
          `Network error: Could not connect to server. Is the backend running at ${API_BASE}?`,
          0,
          'NETWORK_ERROR'
        );
      }
      throw error;
    }
  };

  let res: Response;
  try {
    res = await doFetch(getAccessToken());
  } catch (error) {
    throw error;
  }

  if (res.status === 401) {
    const newAccess = await refreshTokens();
    if (newAccess) {
      try {
        res = await doFetch(newAccess);
      } catch (error) {
        throw error;
      }
    } else {
      clearTokens();
      window.dispatchEvent(new CustomEvent('auth:token-expired'));
    }
  }

  // Cache successful GET responses
  if (isGet && res.ok && cacheKey) {
    try {
      const data = await res.clone().json();
      apiCache.set(cacheKey, data);
    } catch {
      // not JSON, skip
    }
  }

  // Invalidate cache for mutations
  if (!isGet && res.ok) {
    if (url.includes('/workspace/folders') || url.includes('/workspace/folder-items')) {
      apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/folders`);
      apiCache.deleteByPrefix(`cache:${API_BASE}/api/workspace/documents/`);
    }
    if (url.includes('/uploads') || url.includes('/upload')) {
      apiCache.deleteByPrefix(`cache:${API_BASE}/api/uploads`);
    }
    if (url.includes('/documents/') && url.includes('/segments')) {
      const docIdMatch = url.match(/\/documents\/(\d+)/);
      if (docIdMatch) {
        apiCache.deleteByPrefix(`cache:${API_BASE}/api/documents/${docIdMatch[1]}/segments`);
      }
    }
    if (url.includes('/documents/') && !url.includes('/segments')) {
      const docIdMatch = url.match(/\/documents\/(\d+)/);
      if (docIdMatch) {
        apiCache.delete(`cache:${API_BASE}/api/documents/${docIdMatch[1]}`);
      }
    }
  }

  return res;
}
