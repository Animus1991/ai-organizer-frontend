// src/auth/useAuth.ts
import { useContext } from "react";
import { AuthContext } from "./AuthContext";

/**
 * Hook to access authentication context
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
