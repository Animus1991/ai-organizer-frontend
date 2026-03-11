// src/components/AuthGuard.tsx
import React from "react";
import { useAuth } from "../auth/useAuth";
import { Navigate } from "react-router-dom";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthed, loading } = useAuth();
  const isDemoMode = localStorage.getItem("demo_mode") === "true";

  if (loading && !isDemoMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-secondary">Loading...</div>
      </div>
    );
  }

  if (!isAuthed && !isDemoMode) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
