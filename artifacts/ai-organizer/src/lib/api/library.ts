/**
 * Cross-Document Library API.
 */
import { authFetch } from './core';
import type { LibraryItemDTO, LibraryItemFilters, LibraryItemCreateDTO, LibraryItemUpdateDTO } from './types';

export async function listLibraryItems(filters?: LibraryItemFilters): Promise<LibraryItemDTO[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.append("category", filters.category);
  if (filters?.tag) params.append("tag", filters.tag);
  if (filters?.search) params.append("search", filters.search);
  const queryString = params.toString();
  const url = `/workspace/library${queryString ? `?${queryString}` : ""}`;
  const res = await authFetch(url);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to list library items (${res.status})`); }
  return (await res.json()) as LibraryItemDTO[];
}

export async function createLibraryItem(data: LibraryItemCreateDTO): Promise<LibraryItemDTO> {
  const res = await authFetch("/workspace/library", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to create library item (${res.status})`); }
  return (await res.json()) as LibraryItemDTO;
}

export async function updateLibraryItem(itemId: number, updates: LibraryItemUpdateDTO): Promise<LibraryItemDTO> {
  const res = await authFetch(`/workspace/library/${itemId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to update library item (${res.status})`); }
  return (await res.json()) as LibraryItemDTO;
}

export async function deleteLibraryItem(itemId: number): Promise<void> {
  const res = await authFetch(`/workspace/library/${itemId}`, { method: "DELETE" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to delete library item (${res.status})`); }
}
