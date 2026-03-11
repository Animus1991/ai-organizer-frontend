/**
 * useIsAdmin — Determines admin status.
 * Currently checks a localStorage flag. When backend is connected,
 * this should be replaced with server-side role verification.
 *
 * SECURITY NOTE: This is for UI-only gating (hiding dev tools in tours).
 * Never use this for actual authorization decisions.
 */
import { useMemo } from "react";
import { useAuth } from "../auth/useAuth";

const ADMIN_EMAILS = ["admin@thinkhub.gr", "admin@localhost"];

export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return useMemo(() => {
    if (!user?.email) return false;
    // Check known admin emails
    if (ADMIN_EMAILS.includes(user.email)) return true;
    // Check localStorage override (dev use only)
    try {
      return localStorage.getItem("app-role-admin") === "true";
    } catch {
      return false;
    }
  }, [user?.email]);
}
