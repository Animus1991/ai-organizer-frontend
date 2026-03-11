/**
 * useResearchInfra — shared infrastructure: status, toast, API telemetry, auth
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { getAccessToken } from "../../../lib/api";

export function useResearchInfra() {
  const [status, setStatus] = useState("");
  const [inlineToast, setInlineToast] = useState<{ message: string; timestamp: string } | null>(null);
  const [apiErrors, setApiErrors] = useState<{ endpoint: string; message: string; ts: string }[]>([]);

  // ── Toast ──
  const showInlineToast = (message: string) => {
    const timestamp = new Date().toLocaleString();
    setInlineToast({ message, timestamp });
    window.setTimeout(() => setInlineToast(null), 1800);
  };

  // ── API telemetry ──
  useEffect(() => {
    const raw = localStorage.getItem("researchHubApiErrors");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setApiErrors(parsed);
    } catch { /* ignore */ }
  }, []);

  const logApiFailure = (endpoint: string, error: unknown) => {
    try {
      const entry = {
        endpoint,
        message: (error as any)?.message || String(error || "Unknown error"),
        ts: new Date().toISOString(),
      };
      const existing = localStorage.getItem("researchHubApiErrors");
      const parsed = existing ? JSON.parse(existing) : [];
      const next = [entry, ...(Array.isArray(parsed) ? parsed : [])].slice(0, 30);
      localStorage.setItem("researchHubApiErrors", JSON.stringify(next));
      setApiErrors(next);
      console.error("[ResearchHub API]", endpoint, entry.message);
    } catch { /* ignore */ }
  };

  const clearApiErrors = () => {
    localStorage.removeItem("researchHubApiErrors");
    setApiErrors([]);
  };

  const exportApiErrorsJson = () => {
    const payload = { exportedAt: new Date().toISOString(), errors: apiErrors };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "researchhub_api_errors.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Telemetry exported");
  };

  // ── Auth / JWT ──
  const jwtPayloadRaw = useMemo(() => {
    const token = getAccessToken();
    if (!token) return "";
    const payload = token.split(".")[1];
    if (!payload) return "";
    try {
      return window.atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    } catch { return ""; }
  }, []);

  const userRoles = useMemo(() => {
    if (!jwtPayloadRaw) return [] as string[];
    try {
      const json = JSON.parse(jwtPayloadRaw);
      const roles = Array.isArray(json?.roles) ? json.roles : [];
      const role = typeof json?.role === "string" ? [json.role] : [];
      const admin = json?.is_admin ? ["admin"] : [];
      return [...new Set([...roles, ...role, ...admin].map((r: string) => String(r).toLowerCase()))];
    } catch { return [] as string[]; }
  }, [jwtPayloadRaw]);

  const hasRole = (allowed: string[]) =>
    allowed.some((role) => userRoles.includes(role.toLowerCase()));

  const copyJwtPayload = async () => {
    if (!jwtPayloadRaw) return;
    try {
      await navigator.clipboard.writeText(jwtPayloadRaw);
      showInlineToast("JWT payload copied");
    } catch { showInlineToast("Failed to copy JWT payload"); }
  };

  return {
    status, setStatus,
    inlineToast, setInlineToast,
    showInlineToast,
    apiErrors, setApiErrors,
    logApiFailure, clearApiErrors, exportApiErrorsJson,
    jwtPayloadRaw, userRoles, hasRole, copyJwtPayload,
  };
}
