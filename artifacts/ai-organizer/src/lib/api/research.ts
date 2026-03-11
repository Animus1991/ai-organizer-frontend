/**
 * Research API: OpenAlex, Semantic Scholar, arXiv, Zotero, Mendeley, PRISMA, Benchmark.
 */
import { authFetch } from './core';

// Benchmark
export async function runBenchmark(): Promise<{ ok: boolean; reportPath?: string | null; report?: any }> {
  const res = await authFetch(`/benchmark/run`, { method: "POST" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Benchmark failed (${res.status})`); }
  return res.json();
}

export async function downloadBenchmarkReport(): Promise<Blob> {
  const res = await authFetch(`/benchmark/download/latest`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Download failed (${res.status})`); }
  return await res.blob();
}

export async function downloadBenchmarkReportZip(): Promise<Blob> {
  const res = await authFetch(`/benchmark/download/latest-zip`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Download failed (${res.status})`); }
  return await res.blob();
}

export async function getBenchmarkHistory(): Promise<any[]> {
  const res = await authFetch(`/benchmark/history`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `History failed (${res.status})`); }
  const data = await res.json();
  return data?.history || [];
}

export async function emailBenchmarkReport(to: string): Promise<{ ok: boolean }> {
  const res = await authFetch(`/benchmark/email`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to }),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Email failed (${res.status})`); }
  return res.json();
}

export async function emailBenchmarkReportZip(to: string): Promise<{ ok: boolean }> {
  const res = await authFetch(`/benchmark/email-zip`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to }),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Email failed (${res.status})`); }
  return res.json();
}

export async function getBenchmarkLatest(): Promise<any> {
  const res = await authFetch(`/benchmark/latest`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Latest failed (${res.status})`); }
  return res.json();
}

export async function getBenchmarkAccess(): Promise<boolean> {
  const res = await authFetch(`/benchmark/access`);
  return res.ok;
}

// OpenAlex
export async function searchOpenAlex(q: string, page: number = 1, perPage: number = 10) {
  const params = new URLSearchParams({ q, page: String(page), per_page: String(perPage) });
  const res = await authFetch(`/research/openalex/search?${params.toString()}`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `OpenAlex failed (${res.status})`); }
  return res.json();
}

export async function searchOpenAlexAuthors(q: string, page: number = 1, perPage: number = 10) {
  const params = new URLSearchParams({ q, page: String(page), per_page: String(perPage) });
  const res = await authFetch(`/research/openalex/authors?${params.toString()}`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `OpenAlex authors failed (${res.status})`); }
  return res.json();
}

export async function searchOpenAlexInstitutions(q: string, page: number = 1, perPage: number = 10) {
  const params = new URLSearchParams({ q, page: String(page), per_page: String(perPage) });
  const res = await authFetch(`/research/openalex/institutions?${params.toString()}`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `OpenAlex institutions failed (${res.status})`); }
  return res.json();
}

// Semantic Scholar
export async function searchSemanticScholar(q: string, limit: number = 10) {
  const params = new URLSearchParams({ q, limit: String(limit) });
  const res = await authFetch(`/research/semanticscholar/search?${params.toString()}`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Semantic Scholar failed (${res.status})`); }
  return res.json();
}

// Crossref
export async function lookupCrossrefDoi(doi: string) {
  const params = new URLSearchParams({ doi });
  const res = await authFetch(`/research/crossref/doi?${params.toString()}`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Crossref failed (${res.status})`); }
  return res.json();
}

// arXiv
export async function searchArxiv(q: string, maxResults: number = 10) {
  const params = new URLSearchParams({ q, max_results: String(maxResults) });
  const res = await authFetch(`/research/arxiv/search?${params.toString()}`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `arXiv failed (${res.status})`); }
  return res.json();
}

// Zotero
export async function zoteroCollections(apiKey: string, libraryType: "user" | "group", libraryId: string, limit: number = 10, start: number = 0) {
  const res = await authFetch(`/research/zotero/collections`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, libraryType, libraryId, limit, start }),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Zotero collections failed (${res.status})`); }
  return res.json();
}

export async function zoteroItems(apiKey: string, libraryType: "user" | "group", libraryId: string, limit: number = 10, start: number = 0) {
  const res = await authFetch(`/research/zotero/items`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, libraryType, libraryId, limit, start }),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Zotero items failed (${res.status})`); }
  return res.json();
}

export async function zoteroCreateCollection(apiKey: string, libraryType: "user" | "group", libraryId: string, name: string, parentCollection?: string) {
  const res = await authFetch(`/research/zotero/collections/create`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, libraryType, libraryId, name, parentCollection }),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Zotero create collection failed (${res.status})`); }
  return res.json();
}

export async function zoteroCreateItem(
  apiKey: string, libraryType: "user" | "group", libraryId: string,
  itemType: string, title: string,
  creators: { firstName?: string; lastName?: string; creatorType?: string }[],
  date?: string, url?: string, abstractNote?: string
) {
  const res = await authFetch(`/research/zotero/items/create`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, libraryType, libraryId, itemType, title, creators, date, url, abstractNote }),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Zotero create item failed (${res.status})`); }
  return res.json();
}

export async function zoteroSync(apiKey: string, libraryType: "user" | "group", libraryId: string, limit: number = 10, start: number = 0) {
  const res = await authFetch(`/research/zotero/sync`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, libraryType, libraryId, limit, start }),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Zotero sync failed (${res.status})`); }
  return res.json();
}

export async function getZoteroSynced() {
  const res = await authFetch(`/research/zotero/synced`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Zotero synced failed (${res.status})`); }
  return res.json();
}

export async function zoteroImportToLibrary(apiKey?: string, libraryType?: "user" | "group", libraryId?: string, limit: number = 50) {
  const res = await authFetch(`/research/zotero/import-library`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, libraryType, libraryId, limit }),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Zotero import failed (${res.status})`); }
  return res.json();
}

// Mendeley
export async function fetchMendeleyDocuments(accessToken: string, limit: number = 10) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (accessToken) params.set("access_token", accessToken);
  const res = await authFetch(`/research/mendeley/documents?${params.toString()}`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Mendeley fetch failed (${res.status})`); }
  return res.json();
}

export async function getMendeleyAuthUrl() {
  const res = await authFetch(`/research/mendeley/oauth/start`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Mendeley OAuth start failed (${res.status})`); }
  return res.json();
}

export async function exchangeMendeleyCode(code: string, redirectUri?: string) {
  const res = await authFetch(`/research/mendeley/oauth/exchange`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirectUri }),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Mendeley OAuth exchange failed (${res.status})`); }
  return res.json();
}

export async function getMendeleyStatus() {
  const res = await authFetch(`/research/mendeley/status`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Mendeley status failed (${res.status})`); }
  return res.json();
}

// PRISMA
export async function getPrismaState(documentId: number) {
  const res = await authFetch(`/research/prisma/${documentId}`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `PRISMA load failed (${res.status})`); }
  return res.json();
}

export async function savePrismaState(documentId: number, payload: any) {
  const res = await authFetch(`/research/prisma/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `PRISMA save failed (${res.status})`); }
  return res.json();
}
