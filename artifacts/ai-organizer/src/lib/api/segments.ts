/**
 * Segment API functions: CRUD, segmentation, keywords, concepts, links.
 */
import { authFetch, retryWithBackoff, withTimeout, TIMEOUT_CONFIG, AppError } from './core';
import type {
  SegmentDTO, SegmentPatchDTO, SegmentsListResponse, SegmentsListMeta,
  SegmentationMode, SegmentationSummary,
  SegmentLinkDTO, SegmentLinksResponse, SegmentLinkCreateDTO,
} from './types';

export async function discoverKeywords(
  documentId: number, maxKeywords: number = 10, focusAreas?: string[]
): Promise<{ keywords: string[]; count: number; provider: string }> {
  const params = new URLSearchParams({ max_keywords: String(maxKeywords) });
  if (focusAreas?.length) focusAreas.forEach(area => params.append("focus_areas", area));
  const res = await authFetch(`/documents/${documentId}/keywords/discover?${params.toString()}`, { method: "POST" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Keyword discovery failed: ${res.status}`); }
  return await res.json();
}

export async function discoverConcepts(
  documentId: number, maxConcepts: number = 10, focusAreas?: string[]
): Promise<{ concepts: string[]; count: number; provider: string }> {
  const params = new URLSearchParams({ max_concepts: String(maxConcepts) });
  if (focusAreas?.length) focusAreas.forEach(area => params.append("focus_areas", area));
  const res = await authFetch(`/documents/${documentId}/concepts/discover?${params.toString()}`, { method: "POST" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Concept discovery failed: ${res.status}`); }
  return await res.json();
}

export async function segmentDocument(
  documentId: number, mode: SegmentationMode,
  keywords?: string[], caseSensitive?: boolean, wholeWordsOnly?: boolean,
  numTopics?: number, questions?: string[], autoGenerateQuestions?: boolean,
  concepts?: string[], autoDiscoverConcepts?: boolean, maxConcepts?: number,
  hybridMethods?: string[], useConsensus?: boolean
) {
  return retryWithBackoff(async () => {
    const params = new URLSearchParams({ mode });
    if (mode === "keywords" && keywords?.length) {
      keywords.forEach(kw => params.append("keywords", kw));
      if (caseSensitive !== undefined) params.append("case_sensitive", String(caseSensitive));
      if (wholeWordsOnly !== undefined) params.append("whole_words_only", String(wholeWordsOnly));
    }
    if (mode === "topics" && numTopics !== undefined) params.append("num_topics", String(numTopics));
    if (mode === "questions" && questions?.length) {
      questions.forEach(q => params.append("questions", q));
      if (autoGenerateQuestions !== undefined) params.append("auto_generate_questions", String(autoGenerateQuestions));
    }
    if (mode === "concepts") {
      if (concepts?.length) concepts.forEach(c => params.append("concepts", c));
      if (autoDiscoverConcepts !== undefined) params.append("auto_discover_concepts", String(autoDiscoverConcepts));
      if (maxConcepts !== undefined) params.append("max_concepts", String(maxConcepts));
    }
    if (mode === "hybrid") {
      if (hybridMethods?.length) hybridMethods.forEach(m => params.append("hybrid_methods", m));
      if (useConsensus !== undefined) params.append("use_consensus", String(useConsensus));
    }

    const res = await withTimeout(
      authFetch(`/documents/${documentId}/segment?${params.toString()}`, { method: "POST" }),
      TIMEOUT_CONFIG.upload
    );

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      let errorMessage = `Segmentation failed`;
      if (res.status === 404) errorMessage = `Document not found.`;
      else if (res.status === 409) errorMessage = `Document is already being segmented.`;
      else if (res.status === 422) errorMessage = `Document cannot be segmented.`;
      else if (res.status >= 500) errorMessage = `Server error during segmentation.`;
      else if (txt) { try { errorMessage = JSON.parse(txt).detail || errorMessage; } catch { errorMessage = `${errorMessage}: ${txt.substring(0, 100)}`; } }
      throw new AppError(errorMessage, res.status);
    }
    return res.json().catch(() => ({}));
  }, 2, 3000, 2);
}

export async function listSegmentsWithMeta(documentId: number, mode?: SegmentationMode): Promise<SegmentsListResponse> {
  const qs = mode ? `?mode=${encodeURIComponent(mode)}` : "";
  const res = await authFetch(`/documents/${documentId}/segments${qs}`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(`List failed: ${res.status} ${txt}`); }
  const data = (await res.json().catch(() => ({}))) as any;
  if (Array.isArray(data)) {
    return { items: data as SegmentDTO[], meta: { count: data.length, mode: mode ?? "all", lastRun: null } };
  }
  return {
    items: Array.isArray(data?.items) ? data.items as SegmentDTO[] : [],
    meta: (data?.meta ?? { count: 0, mode: mode ?? "all", lastRun: null }) as SegmentsListMeta,
  };
}

export async function listSegments(documentId: number, mode?: SegmentationMode, _page: number = 1, _pageSize: number = 100): Promise<SegmentsListResponse> {
  return listSegmentsWithMeta(documentId, mode);
}

export async function patchSegment(segmentId: number, patch: SegmentPatchDTO): Promise<SegmentDTO> {
  return retryWithBackoff(async () => {
    const res = await authFetch(`/segments/${segmentId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) { const txt = await res.text().catch(() => ""); throw new AppError(`Patch segment failed: ${res.status} ${txt}`, res.status); }
    const result = (await res.json()) as SegmentDTO;
    
    // Audit trail for segment edits
    const { recordAuditEntry } = await import('../../services/blockchain/AuditTrailService');
    const actor = localStorage.getItem('aiorg_username') || 'anonymous';
    await recordAuditEntry('SEGMENT_EDITED', actor, {
      segmentId,
      patch,
      editTimestamp: new Date().toISOString(),
    }).catch(() => {}); // Non-blocking
    
    return result;
  });
}

export async function patchManualSegment(segmentId: number, payload: { title?: string | null; start?: number | null; end?: number | null }): Promise<SegmentDTO> {
  const body: SegmentPatchDTO = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.start !== undefined) body.start = payload.start;
  if (payload.end !== undefined) body.end = payload.end;
  return patchSegment(segmentId, body);
}

export async function listSegmentations(documentId: number): Promise<SegmentationSummary[]> {
  const res = await authFetch(`/documents/${documentId}/segmentations`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to load segmentations (${res.status})`); }
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data as SegmentationSummary[] : [];
}

export async function deleteSegments(documentId: number, mode?: SegmentationMode) {
  const qs = mode ? `?mode=${encodeURIComponent(mode)}` : "";
  const res = await authFetch(`/documents/${documentId}/segments${qs}`, { method: "DELETE" });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(`Delete segments failed: ${res.status} ${txt}`); }
  return res.json().catch(() => ({}));
}

export async function createManualSegment(documentId: number, payload: {
  mode: SegmentationMode; title?: string | null; start: number; end: number;
  content?: string; segmentType?: string; evidenceGrade?: string; falsifiabilityCriteria?: string | null;
}) {
  const res = await authFetch(`/documents/${documentId}/segments/manual`, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(`Manual segment failed: ${res.status} ${txt}`); }
  const result = (await res.json()) as SegmentDTO;
  
  // Audit trail for segment creation
  const { recordAuditEntry } = await import('../../services/blockchain/AuditTrailService');
  const actor = localStorage.getItem('aiorg_username') || 'anonymous';
  await recordAuditEntry('SEGMENT_CREATED', actor, {
    documentId,
    segmentId: result.id,
    mode: payload.mode,
    title: payload.title,
    createdTimestamp: new Date().toISOString(),
  }).catch(() => {}); // Non-blocking
  
  return result;
}

export async function deleteSegment(segmentId: number) {
  return retryWithBackoff(async () => {
    const res = await authFetch(`/segments/${segmentId}`, { method: "DELETE" });
    if (!res.ok) { const txt = await res.text().catch(() => ""); throw new AppError(`Delete segment failed: ${res.status} ${txt}`, res.status); }
    
    // Audit trail for segment deletion
    const { recordAuditEntry } = await import('../../services/blockchain/AuditTrailService');
    const actor = localStorage.getItem('aiorg_username') || 'anonymous';
    await recordAuditEntry('SEGMENT_DELETED', actor, {
      segmentId,
      deletedTimestamp: new Date().toISOString(),
    }).catch(() => {}); // Non-blocking
    
    return res.json().catch(() => ({}));
  });
}

export async function getSegment(segmentId: number): Promise<SegmentDTO> {
  const res = await authFetch(`/segments/${segmentId}`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || `Failed to load segment (${res.status})`); }
  return (await res.json()) as SegmentDTO;
}

// P2: Segment Links
export async function createSegmentLink(fromSegmentId: number, link: SegmentLinkCreateDTO): Promise<SegmentLinkDTO> {
  return retryWithBackoff(async () => {
    const res = await authFetch(`/segments/${fromSegmentId}/links`, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(link),
    });
    if (!res.ok) { const txt = await res.text().catch(() => ""); throw new AppError(`Create segment link failed: ${res.status} ${txt}`, res.status); }
    const data = await res.json();
    return {
      id: data.id, fromSegmentId: data.fromSegmentId, toSegmentId: data.toSegmentId,
      linkType: data.linkType, notes: data.notes ?? null, direction: "from" as const,
      createdAt: data.createdAt, createdByUserId: data.createdByUserId,
    };
  });
}

export async function getSegmentLinks(segmentId: number, direction: "from" | "to" | "both" = "both"): Promise<SegmentLinksResponse> {
  const params = new URLSearchParams({ direction });
  const res = await authFetch(`/segments/${segmentId}/links?${params.toString()}`);
  if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(`Get segment links failed: ${res.status} ${txt}`); }
  const data = await res.json();
  return {
    segmentId: data.segmentId ?? segmentId,
    direction: data.direction ?? direction,
    links: (data.links ?? []).map((link: any) => ({
      id: link.id, fromSegmentId: link.fromSegmentId, toSegmentId: link.toSegmentId,
      linkType: link.linkType, notes: link.notes ?? null,
      direction: link.direction ?? (link.fromSegmentId === segmentId ? "from" : "to"),
      createdAt: link.createdAt, createdByUserId: link.createdByUserId,
    })) as SegmentLinkDTO[],
    count: data.count ?? 0,
  };
}

export async function deleteSegmentLink(linkId: number): Promise<void> {
  return retryWithBackoff(async () => {
    const res = await authFetch(`/segment-links/${linkId}`, { method: "DELETE" });
    if (!res.ok) { const txt = await res.text().catch(() => ""); throw new AppError(`Delete segment link failed: ${res.status} ${txt}`, res.status); }
  });
}
