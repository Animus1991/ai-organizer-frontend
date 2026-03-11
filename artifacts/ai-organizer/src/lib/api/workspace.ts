/**
 * Workspace API: folders, smart notes, document notes, migration.
 */
import { authFetch, retryWithBackoff, AppError, apiCache, API_BASE } from './core';
import type {
  FolderDTO, FolderWithItemsDTO, FolderItemDTO,
  SmartNoteDTO, DocumentNoteDTO, DeleteFolderItemResponse,
} from './types';

// Folders
export async function listFolders(documentId: number): Promise<FolderDTO[]> {
  const res = await authFetch(`/workspace/documents/${documentId}/folders`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to list folders (${res.status})`); }
  return (await res.json()) as FolderDTO[];
}

export async function getFolder(folderId: number, skipCache: boolean = false): Promise<FolderWithItemsDTO> {
  if (skipCache) {
    apiCache.delete(`cache:${API_BASE}/api/workspace/folders/${folderId}`);
  }
  const res = await authFetch(`/workspace/folders/${folderId}`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to get folder (${res.status})`); }
  return (await res.json()) as FolderWithItemsDTO;
}

export async function createFolder(documentId: number, name: string, parentId?: number | null): Promise<FolderDTO> {
  return retryWithBackoff(async () => {
    const res = await authFetch(`/workspace/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ documentId, name, parentId: parentId ?? null }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      let errorMessage = `Failed to create folder`;
      if (res.status === 409) errorMessage = `Folder with this name already exists.`;
      else if (res.status === 422) errorMessage = `Circular reference detected.`;
      else if (txt) { try { errorMessage = JSON.parse(txt).detail || errorMessage; } catch { errorMessage = `${errorMessage}: ${txt.substring(0, 100)}`; } }
      throw new AppError(errorMessage, res.status);
    }
    return (await res.json()) as FolderDTO;
  }, 2, 1000, 2);
}

export async function updateFolder(folderId: number, name?: string, parentId?: number | null): Promise<FolderDTO> {
  return retryWithBackoff(async () => {
    const body: { name?: string; parentId?: number | null } = {};
    if (name !== undefined) body.name = name;
    if (parentId !== undefined) body.parentId = parentId;
    const res = await authFetch(`/workspace/folders/${folderId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      let errorMessage = `Failed to update folder`;
      if (txt) { try { errorMessage = JSON.parse(txt).detail || errorMessage; } catch { /* */ } }
      throw new AppError(errorMessage, res.status);
    }
    return (await res.json()) as FolderDTO;
  }, 2, 1000, 2);
}

export async function deleteFolder(folderId: number): Promise<void> {
  const res = await authFetch(`/workspace/folders/${folderId}`, { method: "DELETE" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to delete folder (${res.status})`); }
}

export async function createFolderItem(payload: {
  folderId: number; segmentId?: number | null; chunkId?: string | null;
  chunkTitle?: string | null; chunkContent?: string | null; chunkMode?: string | null;
  chunkIsManual?: boolean | null; chunkOrderIndex?: number | null;
}): Promise<FolderItemDTO> {
  const res = await authFetch(`/workspace/folder-items`, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    if (res.status === 409) {
      try {
        const folder = await getFolder(payload.folderId);
        const existingItem = folder.items.find(
          item => (payload.segmentId && item.segmentId === payload.segmentId) ||
                  (payload.chunkId && item.chunkId === payload.chunkId)
        );
        if (existingItem) return existingItem;
      } catch { /* */ }
      return { id: 0, folderId: payload.folderId, segmentId: payload.segmentId ?? null, chunkId: payload.chunkId ?? null } as FolderItemDTO;
    }
    throw new Error(txt || `Failed to create folder item (${res.status})`);
  }
  return (await res.json()) as FolderItemDTO;
}

export async function deleteFolderItem(itemId: number): Promise<DeleteFolderItemResponse> {
  const res = await authFetch(`/workspace/folder-items/${itemId}`, { method: "DELETE" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to delete folder item (${res.status})`); }
  const data = await res.json();
  return { ok: data.ok ?? true, folder_deleted: data.folder_deleted ?? false, folder_id: data.folder_id ?? null };
}

// Smart Notes
export async function listSmartNotes(documentId: number): Promise<SmartNoteDTO[]> {
  const res = await authFetch(`/workspace/documents/${documentId}/smart-notes`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to list smart notes (${res.status})`); }
  return (await res.json()) as SmartNoteDTO[];
}

export async function createSmartNote(payload: {
  documentId: number; content: string; html: string; tags?: string[];
  category?: string; priority?: string; chunkId?: number | null;
}): Promise<SmartNoteDTO> {
  const res = await authFetch(`/workspace/smart-notes`, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to create smart note (${res.status})`); }
  return (await res.json()) as SmartNoteDTO;
}

export async function updateSmartNote(noteId: number, payload: {
  content?: string; html?: string; tags?: string[];
  category?: string; priority?: string; chunkId?: number | null;
}): Promise<SmartNoteDTO> {
  const res = await authFetch(`/workspace/smart-notes/${noteId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to update smart note (${res.status})`); }
  return (await res.json()) as SmartNoteDTO;
}

export async function deleteSmartNote(noteId: number): Promise<void> {
  const res = await authFetch(`/workspace/smart-notes/${noteId}`, { method: "DELETE" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to delete smart note (${res.status})`); }
}

// Document Notes
export async function getDocumentNote(documentId: number): Promise<DocumentNoteDTO | null> {
  const res = await authFetch(`/workspace/documents/${documentId}/note`);
  if (!res.ok) {
    if (res.status === 404) return null;
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Failed to get document note (${res.status})`);
  }
  return (await res.json()) as DocumentNoteDTO | null;
}

export async function upsertDocumentNote(documentId: number, html: string, text: string): Promise<DocumentNoteDTO> {
  const res = await authFetch(`/workspace/documents/${documentId}/note`, {
    method: "PUT", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ html, text }),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to upsert document note (${res.status})`); }
  return (await res.json()) as DocumentNoteDTO;
}

export async function deleteDocumentNote(documentId: number): Promise<void> {
  const res = await authFetch(`/workspace/documents/${documentId}/note`, { method: "DELETE" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to delete document note (${res.status})`); }
}

// Migration
export async function migrateLocalStorageData(documentId: number, payload: {
  folders?: any[]; folderMap?: Record<string, string>; duplicatedChunks?: any[];
  smartNotes?: any[]; documentNote?: any;
}): Promise<{ ok: boolean; imported: any; message: string }> {
  const res = await authFetch(`/workspace/documents/${documentId}/migrate-localstorage`, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ documentId, ...payload }),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to migrate data (${res.status})`); }
  return (await res.json()) as { ok: boolean; imported: any; message: string };
}
