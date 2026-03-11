/**
 * HashService — SHA-256 document hashing for integrity verification.
 * Ready for external backend integration (Python, Node, etc.)
 * All methods are pure client-side; backend endpoints are configurable.
 */

export interface DocumentHash {
  hash: string;
  algorithm: "SHA-256";
  timestamp: string;
  inputSize: number;
  inputType: "text" | "file" | "segment" | "metadata";
}

export interface HashVerification {
  isValid: boolean;
  originalHash: string;
  currentHash: string;
  algorithm: "SHA-256";
  verifiedAt: string;
}

const BACKEND_BASE = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Compute SHA-256 hash of arbitrary text content.
 */
export async function hashText(content: string): Promise<DocumentHash> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return {
    hash: hashHex,
    algorithm: "SHA-256",
    timestamp: new Date().toISOString(),
    inputSize: data.byteLength,
    inputType: "text",
  };
}

/**
 * Compute SHA-256 hash of a File/Blob.
 */
export async function hashFile(file: File | Blob): Promise<DocumentHash> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return {
    hash: hashHex,
    algorithm: "SHA-256",
    timestamp: new Date().toISOString(),
    inputSize: buffer.byteLength,
    inputType: "file",
  };
}

/**
 * Compute SHA-256 of structured metadata (JSON-serialized).
 */
export async function hashMetadata(metadata: Record<string, unknown>): Promise<DocumentHash> {
  const canonical = JSON.stringify(metadata, Object.keys(metadata).sort());
  return { ...(await hashText(canonical)), inputType: "metadata" };
}

/**
 * Verify content integrity by comparing current hash to stored hash.
 */
export async function verifyHash(content: string, expectedHash: string): Promise<HashVerification> {
  const current = await hashText(content);
  return {
    isValid: current.hash === expectedHash,
    originalHash: expectedHash,
    currentHash: current.hash,
    algorithm: "SHA-256",
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Submit hash to external backend for permanent storage.
 * Endpoint: POST {BACKEND_BASE}/api/blockchain/hash
 */
export async function submitHashToBackend(hash: DocumentHash, documentId: string | number): Promise<{ success: boolean; txId?: string; error?: string }> {
  if (!BACKEND_BASE) return { success: false, error: "VITE_API_BASE_URL not configured" };
  try {
    const res = await fetch(`${BACKEND_BASE}/api/blockchain/hash`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...hash, documentId }),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Verify hash against backend record.
 * Endpoint: GET {BACKEND_BASE}/api/blockchain/verify/{hash}
 */
export async function verifyHashOnBackend(hash: string): Promise<{ verified: boolean; record?: any; error?: string }> {
  if (!BACKEND_BASE) return { verified: false, error: "VITE_API_BASE_URL not configured" };
  try {
    const res = await fetch(`${BACKEND_BASE}/api/blockchain/verify/${hash}`);
    return await res.json();
  } catch (e: any) {
    return { verified: false, error: e.message };
  }
}
