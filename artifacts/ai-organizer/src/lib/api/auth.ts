/**
 * Authentication API functions.
 */
import { authFetch, setTokens, API_BASE, AppError } from './core';

export async function login(email: string, password: string) {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = `Login failed (${res.status})`;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new AppError(errorMessage, res.status, 'LOGIN_FAILED');
  }

  const data = await res.json();
  if (data?.accessToken && data?.refreshToken) {
    setTokens(data.accessToken, data.refreshToken);
  } else if (data?.access_token && data?.refresh_token) {
    setTokens(data.access_token, data.refresh_token);
  }
  return data;
}

export async function logout(refreshToken?: string | null) {
  if (!refreshToken) return;
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // no-op
  }
}
