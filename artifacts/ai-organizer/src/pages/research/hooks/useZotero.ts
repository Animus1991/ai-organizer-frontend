/**
 * useZotero — Zotero library management, sync, auto-sync timing
 */
import { useEffect, useState } from "react";
import {
  zoteroCollections, zoteroItems, zoteroSync, getZoteroSynced,
  zoteroImportToLibrary, zoteroCreateCollection, zoteroCreateItem,
} from "../../../lib/api";

interface Deps {
  setStatus: (s: string) => void;
  logApiFailure: (endpoint: string, error: unknown) => void;
  loadLibrary: () => Promise<void>;
}

export function useZotero({ setStatus, logApiFailure, loadLibrary }: Deps) {
  const [zoteroKey, setZoteroKey] = useState("");
  const [zoteroLibraryType, setZoteroLibraryType] = useState<"user" | "group">("user");
  const [zoteroLibraryId, setZoteroLibraryId] = useState("");
  const [zoteroCollectionsState, setZoteroCollectionsState] = useState<any[]>([]);
  const [zoteroItemsState, setZoteroItemsState] = useState<any[]>([]);
  const [zoteroSyncState, setZoteroSyncState] = useState<any | null>(null);
  const [zoteroAuthEncrypted, setZoteroAuthEncrypted] = useState<boolean | null>(null);
  const [zoteroAutoSyncEnabled, setZoteroAutoSyncEnabled] = useState<boolean | null>(null);
  const [zoteroAutoSyncInterval, setZoteroAutoSyncInterval] = useState<number | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemType, setNewItemType] = useState("journalArticle");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemDate, setNewItemDate] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());

  // Auto-refresh tick for sync timer
  useEffect(() => {
    if (!zoteroAutoSyncEnabled && !zoteroSyncState?.lastSyncAt) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [zoteroAutoSyncEnabled, zoteroSyncState?.lastSyncAt]);

  const loadZotero = async () => {
    if (!zoteroKey || !zoteroLibraryId) return;
    setStatus("Fetching Zotero library...");
    try {
      const [collections, items] = await Promise.all([
        zoteroCollections(zoteroKey, zoteroLibraryType, zoteroLibraryId, 10, 0),
        zoteroItems(zoteroKey, zoteroLibraryType, zoteroLibraryId, 10, 0),
      ]);
      setZoteroCollectionsState(collections.results || []);
      setZoteroItemsState(items.results || []);
      setStatus("Zotero data loaded");
    } catch (e: any) {
      logApiFailure("zotero load", e);
      setStatus(e?.message || "Zotero load failed");
    }
  };

  const runZoteroSync = async () => {
    if (!zoteroKey || !zoteroLibraryId) return;
    setStatus("Syncing Zotero...");
    try {
      const res = await zoteroSync(zoteroKey, zoteroLibraryType, zoteroLibraryId, 25, 0);
      setZoteroSyncState(res.state || null);
      setZoteroAuthEncrypted(!!res.state?.authEncrypted);
      setZoteroAutoSyncEnabled(res.state?.autoSyncEnabled ?? null);
      setZoteroAutoSyncInterval(res.state?.autoSyncIntervalMin ?? null);
      setStatus("Zotero sync complete");
    } catch (e: any) {
      logApiFailure("zotero sync", e);
      setStatus(e?.message || "Zotero sync failed");
    }
  };

  const loadZoteroSynced = async () => {
    try {
      const res = await getZoteroSynced();
      setZoteroSyncState(res.state || null);
      setZoteroAuthEncrypted(!!res.state?.authEncrypted);
      setZoteroAutoSyncEnabled(res.state?.autoSyncEnabled ?? null);
      setZoteroAutoSyncInterval(res.state?.autoSyncIntervalMin ?? null);
    } catch { /* ignore */ }
  };

  const importZoteroToLibrary = async () => {
    setStatus("Importing Zotero into Library...");
    try {
      const res = await zoteroImportToLibrary(zoteroKey || undefined, zoteroLibraryType, zoteroLibraryId || undefined, 100);
      setStatus(`Imported ${res.imported || 0} items into Library`);
      await loadLibrary();
    } catch (e: any) {
      logApiFailure("zotero import", e);
      setStatus(e?.message || "Zotero import failed");
    }
  };

  const createZoteroCollection = async () => {
    if (!newCollectionName || !zoteroKey || !zoteroLibraryId) return;
    try {
      await zoteroCreateCollection(zoteroKey, zoteroLibraryType, zoteroLibraryId, newCollectionName);
      setNewCollectionName("");
      setStatus("Zotero collection created");
    } catch (e: any) {
      logApiFailure("zotero create collection", e);
      setStatus(e?.message || "Create collection failed");
    }
  };

  const createZoteroItem = async () => {
    if (!newItemTitle || !zoteroKey || !zoteroLibraryId) return;
    try {
      await zoteroCreateItem(zoteroKey, zoteroLibraryType, zoteroLibraryId, newItemType, newItemTitle, [], newItemDate || undefined, newItemUrl || undefined, undefined);
      setNewItemTitle("");
      setStatus("Zotero item created");
    } catch (e: any) {
      logApiFailure("zotero create item", e);
      setStatus(e?.message || "Create item failed");
    }
  };

  // Sync timing helpers
  const computeNextSync = () => {
    if (!zoteroAutoSyncEnabled || !zoteroSyncState?.lastSyncAt || !zoteroAutoSyncInterval) return null;
    return new Date(new Date(zoteroSyncState.lastSyncAt).getTime() + zoteroAutoSyncInterval * 60 * 1000);
  };

  const computeNextSyncFromLast = () => {
    if (!zoteroSyncState?.lastSyncAt || !zoteroAutoSyncInterval) return null;
    return new Date(new Date(zoteroSyncState.lastSyncAt).getTime() + zoteroAutoSyncInterval * 60 * 1000);
  };

  const formatEta = () => {
    const next = computeNextSync();
    if (!next) return null;
    const seconds = Math.max(0, Math.ceil((next.getTime() - nowTick) / 1000));
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  };

  const formatNextSyncTooltip = () => {
    const next = computeNextSync();
    return next ? `Next sync: ${next.toLocaleString()}` : null;
  };

  const formatTimeUntilNextSync = () => {
    const next = computeNextSyncFromLast();
    if (!next) return null;
    const diffSeconds = Math.max(0, Math.ceil((next.getTime() - nowTick) / 1000));
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;
    if (minutes < 60) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
  };

  const formatLastSyncAgo = () => {
    if (!zoteroSyncState?.lastSyncAt) return null;
    const last = new Date(zoteroSyncState.lastSyncAt);
    const diffSeconds = Math.max(0, Math.floor((nowTick - last.getTime()) / 1000));
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;
    if (minutes < 60) return `${minutes}m ${String(seconds).padStart(2, "0")}s ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${String(minutes % 60).padStart(2, "0")}m ago`;
  };

  return {
    zoteroKey, setZoteroKey,
    zoteroLibraryType, setZoteroLibraryType,
    zoteroLibraryId, setZoteroLibraryId,
    zoteroCollectionsState, setZoteroCollectionsState,
    zoteroItemsState, setZoteroItemsState,
    zoteroSyncState, setZoteroSyncState,
    zoteroAuthEncrypted, setZoteroAuthEncrypted,
    zoteroAutoSyncEnabled, setZoteroAutoSyncEnabled,
    zoteroAutoSyncInterval, setZoteroAutoSyncInterval,
    newCollectionName, setNewCollectionName,
    newItemTitle, setNewItemTitle,
    newItemType, setNewItemType,
    newItemUrl, setNewItemUrl,
    newItemDate, setNewItemDate,
    nowTick, setNowTick,
    loadZotero, runZoteroSync, loadZoteroSynced,
    importZoteroToLibrary, createZoteroCollection, createZoteroItem,
    computeNextSync, computeNextSyncFromLast,
    formatEta, formatNextSyncTooltip, formatTimeUntilNextSync, formatLastSyncAgo,
  };
}
