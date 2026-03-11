// src/auth/AuthContext.tsx
import React, { createContext } from "react";

export type AuthUser = { email: string } | null;

export type AuthContextValue = {
  user: AuthUser;
  loading: boolean;
  isAuthed: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
