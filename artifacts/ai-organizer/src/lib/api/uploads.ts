/**
 * Upload API functions.
 */
import { authFetch, retryWithBackoff, withTimeout, TIMEOUT_CONFIG, AppError } from './core';
import type { UploadItemDTO, UploadResponseDTO, PaginatedResponse } from './types';

export async function listUploads(page: number = 1, pageSize: number = 50): Promise<PaginatedResponse<UploadItemDTO>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const res = await authFetch(`/uploads?${params.toString()}`);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Failed to load uploads: ${res.status} ${txt}`);
  }
  const data = await res.json().catch(() => ({ items: [], total: 0, page: 1, pageSize: 50 }));

  if (Array.isArray(data)) {
    return { items: data as UploadItemDTO[], total: data.length, page: 1, pageSize: data.length };
  }
  return data as PaginatedResponse<UploadItemDTO>;
}

export async function uploadFile(file: File): Promise<UploadResponseDTO> {
  const form = new FormData();
  form.append("file", file);

  return retryWithBackoff(async () => {
    const res = await withTimeout(
      authFetch(`/upload`, { method: "POST", body: form }),
      TIMEOUT_CONFIG.upload
    );

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      let errorMessage = `Upload failed`;
      if (res.status === 413) errorMessage = `File too large.`;
      else if (res.status === 415) errorMessage = `File type not supported.`;
      else if (res.status === 400) errorMessage = `Invalid file.`;
      else if (res.status === 401) errorMessage = `Authentication required.`;
      else if (res.status >= 500) errorMessage = `Server error.`;
      else if (txt) {
        try { errorMessage = JSON.parse(txt).detail || errorMessage; } catch { errorMessage = `${errorMessage}: ${txt.substring(0, 100)}`; }
      }
      throw new AppError(errorMessage, res.status);
    }
    return (await res.json()) as UploadResponseDTO;
  }, 3, 2000, 2);
}

export async function deleteUpload(uploadId: number) {
  const res = await authFetch(`/uploads/${uploadId}`, { method: "DELETE" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Delete failed: ${res.status} ${txt}`);
  }
  return res.json().catch(() => ({}));
}
