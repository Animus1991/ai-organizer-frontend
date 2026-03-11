/**
 * Search API functions.
 */
import { authFetch, AppError, parseApiError } from './core';
import type { SegmentationMode, SearchResponse, SynonymResponse, SynonymListResponse } from './types';

export async function search(
  query: string,
  options?: {
    type?: "document" | "segment";
    mode?: SegmentationMode;
    limit?: number;
    offset?: number;
    semantic?: boolean;
    lang?: "auto" | "el" | "en";
    expand_variations?: boolean;
  }
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query });
  if (options?.type) params.append("type", options.type);
  if (options?.mode) params.append("mode", options.mode);
  if (options?.limit) params.append("limit", String(options.limit));
  if (options?.offset) params.append("offset", String(options.offset));
  if (options?.semantic !== undefined) params.append("semantic", String(options.semantic));
  if (options?.lang) params.append("lang", options.lang);
  if (options?.expand_variations !== undefined) params.append("expand_variations", String(options.expand_variations));

  const response = await authFetch(`/api/search?${params.toString()}`);
  if (!response.ok) {
    const error = await parseApiError(response);
    throw new AppError(error.message || "Search failed", typeof error.code === 'number' ? error.code : response.status);
  }
  return await response.json();
}

export async function addSynonym(word: string, synonym: string): Promise<SynonymResponse> {
  const response = await authFetch(`/api/search/synonyms`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word, synonym }),
  });
  if (!response.ok) {
    const error = await parseApiError(response);
    throw new AppError(error.message || "Failed to add synonym", typeof error.code === 'number' ? error.code : response.status);
  }
  return await response.json();
}

export async function removeSynonym(word: string, synonym: string): Promise<SynonymResponse> {
  const params = new URLSearchParams({ word, synonym });
  const response = await authFetch(`/api/search/synonyms?${params.toString()}`, { method: "DELETE" });
  if (!response.ok) {
    const error = await parseApiError(response);
    throw new AppError(error.message || "Failed to remove synonym", typeof error.code === 'number' ? error.code : response.status);
  }
  return await response.json();
}

export async function listSynonyms(word?: string): Promise<SynonymListResponse> {
  const params = new URLSearchParams();
  if (word) params.append("word", word);
  const response = await authFetch(`/api/search/synonyms?${params.toString()}`);
  if (!response.ok) {
    const error = await parseApiError(response);
    throw new AppError(error.message || "Failed to list synonyms", typeof error.code === 'number' ? error.code : response.status);
  }
  return await response.json();
}
