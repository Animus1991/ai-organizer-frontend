/**
 * AuditTrailService — Immutable audit trail with cryptographic chaining.
 * Each entry's hash includes the previous entry's hash, creating a tamper-evident chain.
 * Ready for external backend sync.
 */

import { hashText, type DocumentHash } from "./HashService";

export type AuditAction =
  | "DOCUMENT_CREATED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_EDITED"
  | "DOCUMENT_DELETED"
  | "DOCUMENT_VERIFIED"
  | "SEGMENT_CREATED"
  | "SEGMENT_EDITED"
  | "SEGMENT_DELETED"
  | "HASH_GENERATED"
  | "HASH_VERIFIED"
  | "HASH_SUBMITTED_BLOCKCHAIN"
  | "PEER_REVIEW_SUBMITTED"
  | "PEER_REVIEW_REVEALED"
  | "NDA_SIGNED"
  | "NDA_EXPORTED"
  | "CONTRIBUTION_RECORDED"
  | "PROVENANCE_UPDATED"
  | "TIMESTAMP_ANCHORED"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "SETTINGS_CHANGED"
  | "EXPORT_GENERATED";

export interface AuditEntry {
  id: string;
  action: AuditAction;
  actor: string;
  timestamp: string;
  details: Record<string, unknown>;
  documentHash?: string;
  previousEntryHash: string;
  entryHash: string;
  chainIndex: number;
  synced: boolean;
}

export interface AuditChainVerification {
  isValid: boolean;
  totalEntries: number;
  brokenAt?: number;
  verifiedAt: string;
}

const STORAGE_KEY = "audit-trail-chain";
const BACKEND_BASE = import.meta.env.VITE_API_BASE_URL || "";

function loadChain(): AuditEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveChain(chain: AuditEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chain));
  } catch { /* quota exceeded — drop silently */ }
}

/**
 * Record a new audit entry with cryptographic chain linking.
 */
export async function recordAuditEntry(
  action: AuditAction,
  actor: string,
  details: Record<string, unknown> = {},
  documentHash?: string
): Promise<AuditEntry> {
  const chain = loadChain();
  const previousHash = chain.length > 0 ? chain[chain.length - 1].entryHash : "GENESIS";
  const chainIndex = chain.length;

  const payload = JSON.stringify({
    action,
    actor,
    timestamp: new Date().toISOString(),
    details,
    documentHash: documentHash || "",
    previousEntryHash: previousHash,
    chainIndex,
  });

  const hashResult = await hashText(payload);

  const entry: AuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    actor,
    timestamp: new Date().toISOString(),
    details,
    documentHash,
    previousEntryHash: previousHash,
    entryHash: hashResult.hash,
    chainIndex,
    synced: false,
  };

  chain.push(entry);
  saveChain(chain);

  // Fire-and-forget backend sync
  syncEntryToBackend(entry).catch(() => {});

  return entry;
}

/**
 * Verify the integrity of the entire audit chain.
 */
export async function verifyAuditChain(): Promise<AuditChainVerification> {
  const chain = loadChain();

  for (let i = 0; i < chain.length; i++) {
    const entry = chain[i];

    // Check previous hash linkage
    if (i === 0 && entry.previousEntryHash !== "GENESIS") {
      return { isValid: false, totalEntries: chain.length, brokenAt: 0, verifiedAt: new Date().toISOString() };
    }
    if (i > 0 && entry.previousEntryHash !== chain[i - 1].entryHash) {
      return { isValid: false, totalEntries: chain.length, brokenAt: i, verifiedAt: new Date().toISOString() };
    }

    // Recompute and verify entry hash
    const payload = JSON.stringify({
      action: entry.action,
      actor: entry.actor,
      timestamp: entry.timestamp,
      details: entry.details,
      documentHash: entry.documentHash || "",
      previousEntryHash: entry.previousEntryHash,
      chainIndex: entry.chainIndex,
    });
    const recomputed = await hashText(payload);
    if (recomputed.hash !== entry.entryHash) {
      return { isValid: false, totalEntries: chain.length, brokenAt: i, verifiedAt: new Date().toISOString() };
    }
  }

  return { isValid: true, totalEntries: chain.length, verifiedAt: new Date().toISOString() };
}

/**
 * Get all audit entries, optionally filtered.
 */
export function getAuditEntries(filter?: { action?: AuditAction; actor?: string; since?: string }): AuditEntry[] {
  let chain = loadChain();
  if (filter?.action) chain = chain.filter(e => e.action === filter.action);
  if (filter?.actor) chain = chain.filter(e => e.actor === filter.actor);
  if (filter?.since) chain = chain.filter(e => e.timestamp >= filter.since!);
  return chain;
}

/**
 * Get chain statistics.
 */
export function getChainStats() {
  const chain = loadChain();
  const synced = chain.filter(e => e.synced).length;
  return {
    totalEntries: chain.length,
    syncedEntries: synced,
    unsyncedEntries: chain.length - synced,
    lastEntry: chain[chain.length - 1] || null,
    genesisEntry: chain[0] || null,
  };
}

/**
 * Sync a single entry to external backend.
 * Endpoint: POST {BACKEND_BASE}/api/audit/entry
 */
async function syncEntryToBackend(entry: AuditEntry): Promise<void> {
  if (!BACKEND_BASE) return;
  try {
    const res = await fetch(`${BACKEND_BASE}/api/audit/entry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (res.ok) {
      const chain = loadChain();
      const idx = chain.findIndex(e => e.id === entry.id);
      if (idx !== -1) {
        chain[idx].synced = true;
        saveChain(chain);
      }
    }
  } catch { /* offline — will retry */ }
}

/**
 * Bulk sync all unsynced entries to backend.
 * Endpoint: POST {BACKEND_BASE}/api/audit/bulk-sync
 */
export async function syncAllToBackend(): Promise<{ synced: number; failed: number }> {
  if (!BACKEND_BASE) return { synced: 0, failed: 0 };
  const chain = loadChain();
  const unsynced = chain.filter(e => !e.synced);
  let synced = 0;
  let failed = 0;

  try {
    const res = await fetch(`${BACKEND_BASE}/api/audit/bulk-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: unsynced }),
    });
    if (res.ok) {
      const result = await res.json();
      const syncedIds = new Set(result.syncedIds || unsynced.map((e: AuditEntry) => e.id));
      chain.forEach(e => { if (syncedIds.has(e.id)) e.synced = true; });
      saveChain(chain);
      synced = syncedIds.size;
    } else {
      failed = unsynced.length;
    }
  } catch {
    failed = unsynced.length;
  }

  return { synced, failed };
}

/**
 * Export full audit trail as JSON for legal/compliance purposes.
 */
export function exportAuditTrail(): string {
  const chain = loadChain();
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    chainLength: chain.length,
    genesisHash: chain[0]?.entryHash || null,
    latestHash: chain[chain.length - 1]?.entryHash || null,
    entries: chain,
  }, null, 2);
}
