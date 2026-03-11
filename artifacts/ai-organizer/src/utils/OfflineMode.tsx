/**
 * OfflineMode - Service worker caching and offline support
 * Provides offline capabilities for the research application
 */

import React, { useState, createContext, useContext, useEffect, useCallback } from "react";

// Types
export interface CachedResource {
  url: string;
  timestamp: Date;
  size?: number;
  type: "document" | "page" | "api" | "asset";
}

export interface OfflineStatus {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  cachedResources: CachedResource[];
  pendingSyncs: number;
  lastSyncTime?: Date;
  cacheSize: number;
}

export interface SyncQueueItem {
  id: string;
  type: "create" | "update" | "delete";
  resource: string;
  data: unknown;
  timestamp: Date;
  retries: number;
}

// Context type
interface OfflineContextType {
  status: OfflineStatus;
  isOffline: boolean;
  cacheResource: (url: string, type: CachedResource["type"]) => Promise<void>;
  clearCache: () => Promise<void>;
  queueSync: (item: Omit<SyncQueueItem, "id" | "timestamp" | "retries">) => void;
  syncNow: () => Promise<void>;
  getCachedData: <T>(key: string) => T | null;
  setCachedData: <T>(key: string, data: T) => void;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

// Storage keys
const CACHE_KEY = "offline_cache";
const SYNC_QUEUE_KEY = "offline_sync_queue";

// Generate ID
const generateId = () => `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Provider
interface OfflineProviderProps {
  children: React.ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [cachedResources, setCachedResources] = useState<CachedResource[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | undefined>();

  // Load cached data on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setCachedResources(
          JSON.parse(cached).map((r: CachedResource) => ({
            ...r,
            timestamp: new Date(r.timestamp),
          }))
        );
      }

      const queue = localStorage.getItem(SYNC_QUEUE_KEY);
      if (queue) {
        setSyncQueue(
          JSON.parse(queue).map((q: SyncQueueItem) => ({
            ...q,
            timestamp: new Date(q.timestamp),
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load offline data:", error);
    }
  }, []);

  // Save cache state
  useEffect(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cachedResources));
    } catch (error) {
      console.error("Failed to save cache:", error);
    }
  }, [cachedResources]);

  // Save sync queue
  useEffect(() => {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(syncQueue));
    } catch (error) {
      console.error("Failed to save sync queue:", error);
    }
  }, [syncQueue]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      if (syncQueue.length > 0) {
        syncNow();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncQueue]);

  // Register service worker
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (import.meta.env.DEV) {
      (async () => {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        } catch {
          // ignore
        }

        if ("caches" in window) {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          } catch {
            // ignore
          }
        }

        setIsServiceWorkerReady(false);
      })();
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        setIsServiceWorkerReady(true);
      })
      .catch((error) => {
        console.warn("Service worker registration failed:", error);
        setIsServiceWorkerReady(false);
      });
  }, []);

  // Cache a resource
  const cacheResource = useCallback(async (url: string, type: CachedResource["type"]) => {
    const resource: CachedResource = {
      url,
      type,
      timestamp: new Date(),
    };

    // Store in IndexedDB or localStorage
    setCachedResources((prev) => {
      const existing = prev.findIndex((r) => r.url === url);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = resource;
        return updated;
      }
      return [...prev, resource];
    });

    // Also cache with service worker if available
    if ("caches" in window) {
      try {
        const cache = await caches.open("research-app-v1");
        await cache.add(url);
      } catch (error) {
        console.warn("Failed to cache resource:", error);
      }
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async () => {
    setCachedResources([]);
    localStorage.removeItem(CACHE_KEY);

    if ("caches" in window) {
      try {
        await caches.delete("research-app-v1");
      } catch (error) {
        console.warn("Failed to clear cache:", error);
      }
    }
  }, []);

  // Queue a sync operation
  const queueSync = useCallback(
    (item: Omit<SyncQueueItem, "id" | "timestamp" | "retries">) => {
      const syncItem: SyncQueueItem = {
        ...item,
        id: generateId(),
        timestamp: new Date(),
        retries: 0,
      };
      setSyncQueue((prev) => [...prev, syncItem]);
    },
    []
  );

  // Sync now
  const syncNow = useCallback(async () => {
    if (!isOnline || syncQueue.length === 0) return;

    const queue = [...syncQueue];
    const failed: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        // Simulate sync (replace with actual API calls)
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log("Synced:", item);
      } catch (error) {
        if (item.retries < 3) {
          failed.push({ ...item, retries: item.retries + 1 });
        }
      }
    }

    setSyncQueue(failed);
    setLastSyncTime(new Date());
  }, [isOnline, syncQueue]);

  // Get cached data
  const getCachedData = useCallback(<T,>(key: string): T | null => {
    try {
      const data = localStorage.getItem(`cache_${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, []);

  // Set cached data
  const setCachedData = useCallback(<T,>(key: string, data: T) => {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to cache data:", error);
    }
  }, []);

  // Calculate cache size (approximation)
  const cacheSize = cachedResources.reduce((sum, r) => sum + (r.size || 1024), 0);

  const status: OfflineStatus = {
    isOnline,
    isServiceWorkerReady,
    cachedResources,
    pendingSyncs: syncQueue.length,
    lastSyncTime,
    cacheSize,
  };

  return (
    <OfflineContext.Provider
      value={{
        status,
        isOffline: !isOnline,
        cacheResource,
        clearCache,
        queueSync,
        syncNow,
        getCachedData,
        setCachedData,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

// Hook
export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used within OfflineProvider");
  }
  return context;
};

// Offline indicator component
export const OfflineIndicator: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { isOffline, status } = useOffline();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setVisible(true);
    } else {
      // Delay hiding to show "back online" message
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  if (!visible && status.isOnline) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "12px 24px",
        background: isOffline
          ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
          : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        zIndex: 9999,
        animation: "slideUp 0.3s ease",
        ...style,
      }}
    >
      <span style={{ fontSize: "18px" }}>{isOffline ? "📴" : "📶"}</span>
      <div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>
          {isOffline ? "You're offline" : "Back online!"}
        </div>
        {isOffline && status.pendingSyncs > 0 && (
          <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)" }}>
            {status.pendingSyncs} changes pending sync
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes slideUp {
            from { transform: translateX(-50%) translateY(20px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

// Offline status panel
export const OfflineStatusPanel: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { status, clearCache, syncNow } = useOffline();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await syncNow();
    setSyncing(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e1e2e 0%, #181825 100%)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "12px",
        padding: "16px",
        ...style,
      }}
    >
      {/* Status header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: status.isOnline ? "#22c55e" : "#ef4444",
            boxShadow: status.isOnline
              ? "0 0 8px rgba(34, 197, 94, 0.5)"
              : "0 0 8px rgba(239, 68, 68, 0.5)",
          }}
        />
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#eaeaea" }}>
          {status.isOnline ? "Online" : "Offline"}
        </span>
        {status.isServiceWorkerReady && (
          <span
            style={{
              fontSize: "10px",
              padding: "2px 6px",
              background: "rgba(34, 197, 94, 0.15)",
              borderRadius: "4px",
              color: "#22c55e",
            }}
          >
            SW Ready
          </span>
        )}
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            padding: "12px",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#3b82f6" }}>
            {status.cachedResources.length}
          </div>
          <div style={{ fontSize: "11px", color: "#71717a" }}>Cached</div>
        </div>
        <div
          style={{
            padding: "12px",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#f59e0b" }}>
            {status.pendingSyncs}
          </div>
          <div style={{ fontSize: "11px", color: "#71717a" }}>Pending</div>
        </div>
      </div>

      {/* Cache size */}
      <div
        style={{
          padding: "10px",
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "6px",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#71717a" }}>Cache Size</span>
          <span style={{ fontSize: "12px", fontWeight: 500, color: "#eaeaea" }}>
            {formatSize(status.cacheSize)}
          </span>
        </div>
      </div>

      {/* Last sync */}
      {status.lastSyncTime && (
        <div style={{ fontSize: "11px", color: "#52525b", marginBottom: "12px" }}>
          Last sync: {status.lastSyncTime.toLocaleTimeString()}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px" }}>
        {status.pendingSyncs > 0 && status.isOnline && (
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              flex: 1,
              padding: "8px",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "6px",
              color: "#a5b4fc",
              fontSize: "12px",
              cursor: syncing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {syncing ? (
              <>
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    border: "2px solid #6366f1",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Syncing...
              </>
            ) : (
              <>🔄 Sync Now</>
            )}
          </button>
        )}
        <button
          onClick={clearCache}
          style={{
            padding: "8px 12px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "6px",
            color: "#fca5a5",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Clear Cache
        </button>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

// Cache button for individual items
export const CacheButton: React.FC<{
  url: string;
  type: CachedResource["type"];
  style?: React.CSSProperties;
}> = ({ url, type, style }) => {
  const { cacheResource, status } = useOffline();
  const [caching, setCaching] = useState(false);

  const isCached = status.cachedResources.some((r) => r.url === url);

  const handleCache = async () => {
    setCaching(true);
    await cacheResource(url, type);
    setCaching(false);
  };

  return (
    <button
      onClick={handleCache}
      disabled={caching || isCached}
      style={{
        padding: "6px 12px",
        background: isCached
          ? "rgba(34, 197, 94, 0.15)"
          : "rgba(99, 102, 241, 0.15)",
        border: isCached
          ? "1px solid rgba(34, 197, 94, 0.3)"
          : "1px solid rgba(99, 102, 241, 0.3)",
        borderRadius: "6px",
        color: isCached ? "#22c55e" : "#a5b4fc",
        fontSize: "12px",
        cursor: caching || isCached ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        ...style,
      }}
      title={isCached ? "Available offline" : "Save for offline"}
    >
      {caching ? (
        <span
          style={{
            width: "12px",
            height: "12px",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      ) : isCached ? (
        "✓ Cached"
      ) : (
        "📥 Cache"
      )}
    </button>
  );
};

export default OfflineProvider;
