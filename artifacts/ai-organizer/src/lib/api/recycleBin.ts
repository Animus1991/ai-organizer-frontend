/**
 * Recycle Bin API: soft delete, restore, purge.
 */
import { authFetch } from './core';
import type {
  DeletedDocumentDTO, DeletedSegmentDTO, DeletedFolderDTO, RecycleBinResponse,
} from './types';

// Documents
export async function softDeleteDocument(documentId: number): Promise<{ ok: boolean; deletedAt?: string; message?: string }> {
  const res = await authFetch(`/recycle-bin/documents/${documentId}`, { method: "DELETE" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to soft delete document (${res.status})`); }
  return (await res.json()) as { ok: boolean; deletedAt?: string; message?: string };
}

export async function restoreDocument(documentId: number): Promise<{ ok: boolean; deletedAt: null | string; message?: string }> {
  const res = await authFetch(`/recycle-bin/documents/${documentId}/restore`, { method: "POST" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to restore document (${res.status})`); }
  return (await res.json()) as { ok: boolean; deletedAt: null | string; message?: string };
}

export async function permanentlyDeleteDocument(documentId: number): Promise<{ ok: boolean; permanentlyDeleted: boolean }> {
  const res = await authFetch(`/recycle-bin/documents/${documentId}/purge`, { method: "DELETE" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to permanently delete document (${res.status})`); }
  return (await res.json()) as { ok: boolean; permanentlyDeleted: boolean };
}

export async function listDeletedDocuments(): Promise<DeletedDocumentDTO[]> {
  const res = await authFetch(`/recycle-bin/documents/recycle-bin`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to list deleted documents (${res.status})`); }
  return (await res.json()) as DeletedDocumentDTO[];
}

// Segments
export async function restoreSegment(segmentId: number): Promise<{ ok: boolean; deletedAt: null | string; message?: string }> {
  const res = await authFetch(`/recycle-bin/segments/${segmentId}/restore`, { method: "POST" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to restore segment (${res.status})`); }
  return (await res.json()) as { ok: boolean; deletedAt: null | string; message?: string };
}

export async function permanentlyDeleteSegment(segmentId: number): Promise<{ ok: boolean; permanentlyDeleted: boolean }> {
  const res = await authFetch(`/recycle-bin/segments/${segmentId}/purge`, { method: "DELETE" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to permanently delete segment (${res.status})`); }
  return (await res.json()) as { ok: boolean; permanentlyDeleted: boolean };
}

export async function listDeletedSegments(documentId?: number): Promise<DeletedSegmentDTO[]> {
  const res = await authFetch(`/recycle-bin/segments/recycle-bin`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to list deleted segments (${res.status})`); }
  const segments = (await res.json()) as DeletedSegmentDTO[];
  if (documentId !== undefined) return segments.filter(s => s.documentId === documentId);
  return segments;
}

// Folders
export async function restoreFolder(folderId: number): Promise<{ ok: boolean; deletedAt: null | string; message?: string }> {
  const res = await authFetch(`/recycle-bin/folders/${folderId}/restore`, { method: "POST" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to restore folder (${res.status})`); }
  return (await res.json()) as { ok: boolean; deletedAt: null | string; message?: string };
}

export async function permanentlyDeleteFolder(folderId: number): Promise<{ ok: boolean; permanentlyDeleted: boolean }> {
  const res = await authFetch(`/recycle-bin/folders/${folderId}/purge`, { method: "DELETE" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to permanently delete folder (${res.status})`); }
  return (await res.json()) as { ok: boolean; permanentlyDeleted: boolean };
}

export async function listDeletedFolders(documentId?: number): Promise<DeletedFolderDTO[]> {
  const res = await authFetch(`/recycle-bin/folders/recycle-bin`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to list deleted folders (${res.status})`); }
  const folders = (await res.json()) as DeletedFolderDTO[];
  if (documentId !== undefined) return folders.filter(f => f.documentId === documentId);
  return folders;
}

// Combined
export async function listAllDeletedItems(): Promise<RecycleBinResponse> {
  const res = await authFetch(`/recycle-bin/recycle-bin`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to list deleted items (${res.status})`); }
  return (await res.json()) as RecycleBinResponse;
}
