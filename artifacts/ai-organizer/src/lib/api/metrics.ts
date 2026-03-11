/**
 * Research metrics and graph visualization API.
 */
import { authFetch } from './core';
import type { ResearchMetricsDTO, GraphDataDTO } from './types';

export async function getResearchMetrics(documentId: number): Promise<ResearchMetricsDTO> {
  const res = await authFetch(`/documents/${documentId}/research-metrics`);
  if (!res.ok) throw new Error(`Failed to fetch research metrics: ${res.statusText}`);
  return (await res.json()) as ResearchMetricsDTO;
}

export async function getDocumentGraph(documentId: number): Promise<GraphDataDTO> {
  const res = await authFetch(`/documents/${documentId}/graph`);
  if (!res.ok) throw new Error(`Failed to fetch graph data: ${res.statusText}`);
  return (await res.json()) as GraphDataDTO;
}
