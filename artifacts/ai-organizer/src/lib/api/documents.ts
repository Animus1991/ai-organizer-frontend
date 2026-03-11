/**
 * Document API functions.
 */
import { authFetch, retryWithBackoff, AppError } from './core';
import type { DocumentDTO, DocumentPatchDTO } from './types';

export async function getDocument(documentId: number): Promise<DocumentDTO> {
  return retryWithBackoff(async () => {
    const res = await authFetch(`/documents/${documentId}`);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new AppError(txt || `Failed to load document (${res.status})`, res.status);
    }
    const data = await res.json().catch(() => ({}));
    return {
      id: Number((data as any).id ?? documentId),
      title: (data as any).title ?? undefined,
      filename: (data as any).filename ?? null,
      sourceType: (data as any).sourceType ?? undefined,
      text: String((data as any).text ?? ""),
      parseStatus: (data as any).parseStatus ?? undefined,
      parseError: (data as any).parseError ?? null,
      processedPath: (data as any).processedPath ?? null,
      upload: (data as any).upload ? {
        id: (data as any).upload.id ?? null,
        contentType: (data as any).upload.contentType ?? null,
        sizeBytes: (data as any).upload.sizeBytes ?? null,
        storedPath: (data as any).upload.storedPath ?? null,
      } : undefined,
    };
  });
}

export async function patchDocument(documentId: number, patch: DocumentPatchDTO): Promise<DocumentDTO> {
  return retryWithBackoff(async () => {
    const res = await authFetch(`/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new AppError(`Patch document failed: ${res.status} ${txt}`, res.status);
    }
    const data = await res.json().catch(() => ({}));
    return {
      id: Number((data as any).id ?? documentId),
      title: (data as any).title ?? undefined,
      filename: (data as any).filename ?? null,
      sourceType: (data as any).sourceType ?? undefined,
      text: String((data as any).text ?? ""),
      parseStatus: (data as any).parseStatus ?? undefined,
      parseError: (data as any).parseError ?? null,
      processedPath: (data as any).processedPath ?? null,
      upload: (data as any).upload ? {
        id: (data as any).upload.id ?? null,
        contentType: (data as any).upload.contentType ?? null,
        sizeBytes: (data as any).upload.sizeBytes ?? null,
        storedPath: (data as any).upload.storedPath ?? null,
      } : undefined,
    };
  });
}
