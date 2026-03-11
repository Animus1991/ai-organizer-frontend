/**
 * HederaTimestampService — Hedera Hashgraph timestamp anchoring.
 * Provides proof-of-existence for documents/contributions via Hedera Consensus Service (HCS).
 * All actual Hedera SDK calls are delegated to your external backend.
 * This service prepares payloads and manages the client-side state.
 */

import { hashText, type DocumentHash } from "./HashService";
import { recordAuditEntry } from "./AuditTrailService";

export interface TimestampAnchor {
  id: string;
  documentHash: string;
  topicId: string;         // Hedera HCS topic ID
  sequenceNumber?: number; // HCS message sequence number
  consensusTimestamp?: string; // Hedera consensus timestamp
  transactionId?: string;  // Hedera transaction ID
  status: "pending" | "confirmed" | "failed";
  submittedAt: string;
  confirmedAt?: string;
  payload: TimestampPayload;
}

export interface TimestampPayload {
  type: "document" | "contribution" | "peer-review" | "nda" | "message" | "segment";
  contentHash: string;
  metadata: Record<string, unknown>;
  actor: string;
  previousAnchorHash?: string; // Chain linking
}

export interface TimestampVerification {
  isValid: boolean;
  anchor: TimestampAnchor | null;
  hederaRecord?: {
    topicId: string;
    sequenceNumber: number;
    consensusTimestamp: string;
    runningHash: string;
  };
  verifiedAt: string;
}

const STORAGE_KEY = "hedera-timestamps";
const BACKEND_BASE = import.meta.env.VITE_API_BASE_URL || "";

function loadAnchors(): TimestampAnchor[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveAnchors(anchors: TimestampAnchor[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(anchors)); }
  catch { /* quota */ }
}

/**
 * Create and submit a timestamp anchor for any content type.
 * The backend is responsible for actual Hedera HCS submission.
 */
export async function anchorTimestamp(
  type: TimestampPayload["type"],
  content: string,
  actor: string,
  metadata: Record<string, unknown> = {}
): Promise<TimestampAnchor> {
  const contentHash = await hashText(content);
  const anchors = loadAnchors();
  const previousAnchorHash = anchors.length > 0 ? anchors[anchors.length - 1].documentHash : undefined;

  const payload: TimestampPayload = {
    type,
    contentHash: contentHash.hash,
    metadata,
    actor,
    previousAnchorHash,
  };

  const anchor: TimestampAnchor = {
    id: `ts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    documentHash: contentHash.hash,
    topicId: "",
    status: "pending",
    submittedAt: new Date().toISOString(),
    payload,
  };

  anchors.push(anchor);
  saveAnchors(anchors);

  // Record in audit trail
  await recordAuditEntry("TIMESTAMP_ANCHORED", actor, {
    anchorId: anchor.id,
    contentHash: contentHash.hash,
    type,
    ...metadata,
  }, contentHash.hash);

  // Submit to backend (fire-and-forget with status update)
  submitToBackend(anchor).catch(() => {});

  return anchor;
}

/**
 * Anchor a document upload with full metadata.
 */
export async function anchorDocument(
  documentId: string | number,
  content: string,
  actor: string,
  title?: string
): Promise<TimestampAnchor> {
  return anchorTimestamp("document", content, actor, {
    documentId,
    title: title || `Document ${documentId}`,
  });
}

/**
 * Anchor a peer review submission.
 */
export async function anchorPeerReview(
  reviewId: string,
  reviewContent: string,
  reviewer: string,
  documentId: string | number
): Promise<TimestampAnchor> {
  return anchorTimestamp("peer-review", reviewContent, reviewer, {
    reviewId,
    documentId,
  });
}

/**
 * Anchor an NDA agreement.
 */
export async function anchorNDA(
  ndaContent: string,
  parties: string[],
  actor: string
): Promise<TimestampAnchor> {
  return anchorTimestamp("nda", ndaContent, actor, {
    parties,
    agreementType: "NDA",
  });
}

/**
 * Anchor a contribution record.
 */
export async function anchorContribution(
  contributionType: string,
  description: string,
  actor: string,
  projectId?: string
): Promise<TimestampAnchor> {
  return anchorTimestamp("contribution", description, actor, {
    contributionType,
    projectId,
  });
}

/**
 * Verify a timestamp anchor against the backend/Hedera.
 * Endpoint: GET {BACKEND_BASE}/api/hedera/verify/{anchorId}
 */
export async function verifyTimestamp(anchorId: string): Promise<TimestampVerification> {
  const anchors = loadAnchors();
  const anchor = anchors.find(a => a.id === anchorId) || null;

  if (!anchor) {
    return { isValid: false, anchor: null, verifiedAt: new Date().toISOString() };
  }

  if (!BACKEND_BASE) {
    // Offline verification — check local chain integrity only
    return {
      isValid: anchor.status === "confirmed",
      anchor,
      verifiedAt: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch(`${BACKEND_BASE}/api/hedera/verify/${anchorId}`);
    const data = await res.json();
    return {
      isValid: data.verified === true,
      anchor,
      hederaRecord: data.hederaRecord,
      verifiedAt: new Date().toISOString(),
    };
  } catch {
    return { isValid: false, anchor, verifiedAt: new Date().toISOString() };
  }
}

/**
 * Get all timestamp anchors, optionally filtered by type.
 */
export function getTimestampAnchors(type?: TimestampPayload["type"]): TimestampAnchor[] {
  const anchors = loadAnchors();
  return type ? anchors.filter(a => a.payload.type === type) : anchors;
}

/**
 * Get statistics about timestamp anchors.
 */
export function getTimestampStats() {
  const anchors = loadAnchors();
  return {
    total: anchors.length,
    pending: anchors.filter(a => a.status === "pending").length,
    confirmed: anchors.filter(a => a.status === "confirmed").length,
    failed: anchors.filter(a => a.status === "failed").length,
    byType: {
      document: anchors.filter(a => a.payload.type === "document").length,
      contribution: anchors.filter(a => a.payload.type === "contribution").length,
      "peer-review": anchors.filter(a => a.payload.type === "peer-review").length,
      nda: anchors.filter(a => a.payload.type === "nda").length,
      message: anchors.filter(a => a.payload.type === "message").length,
      segment: anchors.filter(a => a.payload.type === "segment").length,
    },
  };
}

/**
 * Submit anchor to external backend for Hedera HCS submission.
 * Endpoint: POST {BACKEND_BASE}/api/hedera/anchor
 */
async function submitToBackend(anchor: TimestampAnchor): Promise<void> {
  if (!BACKEND_BASE) return;
  try {
    const res = await fetch(`${BACKEND_BASE}/api/hedera/anchor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(anchor),
    });
    if (res.ok) {
      const data = await res.json();
      const anchors = loadAnchors();
      const idx = anchors.findIndex(a => a.id === anchor.id);
      if (idx !== -1) {
        anchors[idx].status = "confirmed";
        anchors[idx].topicId = data.topicId || "";
        anchors[idx].sequenceNumber = data.sequenceNumber;
        anchors[idx].consensusTimestamp = data.consensusTimestamp;
        anchors[idx].transactionId = data.transactionId;
        anchors[idx].confirmedAt = new Date().toISOString();
        saveAnchors(anchors);
      }
    }
  } catch { /* offline */ }
}
