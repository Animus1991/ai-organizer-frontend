import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type IdentityConnectorKey = "orcid" | "github" | "zenodo";

export type IdentityConnectorStatus = "connected" | "connecting" | "disconnected";

export interface IdentityConnectorState {
  status: IdentityConnectorStatus;
  lastSyncedAt?: number | null;
}

export interface IdentitySyncState {
  connectors: Record<IdentityConnectorKey, IdentityConnectorState>;
  lastRunAt?: number | null;
}

const STORAGE_KEY = "identity-sync-status";

const DEFAULT_STATE: IdentitySyncState = {
  connectors: {
    orcid: { status: "disconnected", lastSyncedAt: null },
    github: { status: "disconnected", lastSyncedAt: null },
    zenodo: { status: "disconnected", lastSyncedAt: null },
  },
  lastRunAt: null,
};

export const CONNECTOR_META: Record<IdentityConnectorKey, { label: string; icon: string; description: string }> = {
  orcid: {
    label: "ORCID",
    icon: "🪪",
    description: "Author identity & publications",
  },
  github: {
    label: "GitHub",
    icon: "💻",
    description: "Code repositories & releases",
  },
  zenodo: {
    label: "Zenodo",
    icon: "🧪",
    description: "Datasets & research outputs",
  },
};

function loadInitialState(): IdentitySyncState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_STATE;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return DEFAULT_STATE;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      connectors: {
        ...DEFAULT_STATE.connectors,
        ...(parsed.connectors || {}),
      },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useIdentitySyncStatus() {
  const [state, setState] = useState<IdentitySyncState>(loadInitialState);
  const [syncing, setSyncing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage quota errors can be ignored for this UX helper state
    }
  }, [state]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const updateConnector = useCallback((key: IdentityConnectorKey, next: Partial<IdentityConnectorState>) => {
    setState(prev => ({
      ...prev,
      connectors: {
        ...prev.connectors,
        [key]: {
          ...prev.connectors[key],
          ...next,
        },
      },
    }));
  }, []);

  const autoSync = useCallback(() => {
    setSyncing(true);
    setState(prev => ({
      ...prev,
      lastRunAt: Date.now(),
      connectors: Object.keys(prev.connectors).reduce((acc, key) => {
        acc[key as IdentityConnectorKey] = {
          ...prev.connectors[key as IdentityConnectorKey],
          status: "connecting",
        };
        return acc;
      }, {} as IdentitySyncState["connectors"]),
    }));

    timeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        lastRunAt: Date.now(),
        connectors: Object.keys(prev.connectors).reduce((acc, key) => {
          acc[key as IdentityConnectorKey] = {
            status: "connected",
            lastSyncedAt: Date.now(),
          };
          return acc;
        }, {} as IdentitySyncState["connectors"]),
      }));
      setSyncing(false);
    }, 1400);
  }, []);

  const lastSyncedAt = useMemo(() => {
    const timestamps = Object.values(state.connectors)
      .map(c => c.lastSyncedAt)
      .filter((v): v is number => Boolean(v));
    if (timestamps.length === 0) return null;
    return Math.max(...timestamps);
  }, [state.connectors]);

  return {
    syncStatus: state,
    syncing,
    autoSync,
    updateConnector,
    lastSyncedAt,
  } as const;
}
