/**
 * useMendeley — Mendeley OAuth, document fetching, status
 */
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchMendeleyDocuments, getMendeleyAuthUrl, exchangeMendeleyCode, getMendeleyStatus } from "../../../lib/api";

interface Deps {
  setStatus: (s: string) => void;
  logApiFailure: (endpoint: string, error: unknown) => void;
}

export function useMendeley({ setStatus, logApiFailure }: Deps) {
  const nav = useNavigate();
  const location = useLocation();
  const [mendeleyToken, setMendeleyToken] = useState("");
  const [mendeleyResults, setMendeleyResults] = useState<any[]>([]);
  const [mendeleyConnected, setMendeleyConnected] = useState(false);
  const [mendeleyExpiresAt, setMendeleyExpiresAt] = useState<string | null>(null);
  const [mendeleyHasRefresh, setMendeleyHasRefresh] = useState(false);

  // Load Mendeley status on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await getMendeleyStatus();
        setMendeleyConnected(res.connected);
        setMendeleyExpiresAt(res.expiresAt || null);
        setMendeleyHasRefresh(!!res.hasRefreshToken);
      } catch { /* ignore */ }
    })();
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    if (!code) return;
    (async () => {
      try {
        await exchangeMendeleyCode(code);
        setMendeleyConnected(true);
        try {
          const status = await getMendeleyStatus();
          setMendeleyExpiresAt(status.expiresAt || null);
          setMendeleyHasRefresh(!!status.hasRefreshToken);
        } catch { /* ignore */ }
        setStatus("Mendeley connected");
        params.delete("code");
        nav({ pathname: "/research", search: params.toString() });
      } catch (e: any) {
        setStatus(e?.message || "Mendeley connect failed");
      }
    })();
  }, [location.search, nav]);

  const connectMendeley = async () => {
    try {
      const res = await getMendeleyAuthUrl();
      window.open(res.authUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setStatus(e?.message || "Mendeley auth failed");
    }
  };

  const loadMendeley = async () => {
    setStatus("Loading Mendeley documents...");
    try {
      const res = await fetchMendeleyDocuments(mendeleyToken || "", 10);
      setMendeleyResults(res.results || []);
      setStatus("Mendeley documents loaded");
    } catch (e: any) {
      logApiFailure("mendeley fetch", e);
      setStatus(e?.message || "Mendeley load failed");
    }
  };

  return {
    nav, location,
    mendeleyToken, setMendeleyToken,
    mendeleyResults, setMendeleyResults,
    mendeleyConnected, setMendeleyConnected,
    mendeleyExpiresAt, setMendeleyExpiresAt,
    mendeleyHasRefresh, setMendeleyHasRefresh,
    connectMendeley, loadMendeley,
  };
}
