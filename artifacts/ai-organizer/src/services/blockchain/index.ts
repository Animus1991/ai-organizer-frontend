/**
 * Blockchain Services — Unified barrel export.
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────┐
 * │  Frontend (React)                               │
 * │  ├─ HashService       — SHA-256 client-side     │
 * │  ├─ AuditTrailService — Chained audit entries   │
 * │  └─ HederaTimestamp   — Timestamp anchoring     │
 * │         │                                       │
 * │         ▼  (HTTP / VITE_API_BASE_URL)           │
 * ├─────────────────────────────────────────────────┤
 * │  Your Backend (Python/Node/etc.)                │
 * │  ├─ POST /api/blockchain/hash                   │
 * │  ├─ GET  /api/blockchain/verify/:hash           │
 * │  ├─ POST /api/audit/entry                       │
 * │  ├─ POST /api/audit/bulk-sync                   │
 * │  ├─ POST /api/hedera/anchor                     │
 * │  └─ GET  /api/hedera/verify/:anchorId           │
 * │         │                                       │
 * │         ▼                                       │
 * │  Hedera Hashgraph (HCS / Token Service)         │
 * └─────────────────────────────────────────────────┘
 */

// SHA-256 Hashing
export {
  hashText,
  hashFile,
  hashMetadata,
  verifyHash,
  submitHashToBackend,
  verifyHashOnBackend,
  type DocumentHash,
  type HashVerification,
} from "./HashService";

// Immutable Audit Trail
export {
  recordAuditEntry,
  verifyAuditChain,
  getAuditEntries,
  getChainStats,
  syncAllToBackend,
  exportAuditTrail,
  type AuditAction,
  type AuditEntry,
  type AuditChainVerification,
} from "./AuditTrailService";

// Hedera Hashgraph Timestamps
export {
  anchorTimestamp,
  anchorDocument,
  anchorPeerReview,
  anchorNDA,
  anchorContribution,
  verifyTimestamp,
  getTimestampAnchors,
  getTimestampStats,
  type TimestampAnchor,
  type TimestampPayload,
  type TimestampVerification,
} from "./HederaTimestampService";
