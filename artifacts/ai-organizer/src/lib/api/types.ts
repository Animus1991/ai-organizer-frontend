/**
 * Shared DTO types for the API layer.
 */

export type UploadItemDTO = {
  uploadId: number;
  documentId: number;
  filename: string;
  sizeBytes: number;
  contentType: string;
  parseStatus: "ok" | "failed" | "pending" | string;
  parseError?: string | null;
  createdAt?: string;
};

export type UploadResponseDTO = {
  uploadId: number;
  documentId: number;
  sourceType: string;
  filename: string;
  deduped?: boolean;
  parseStatus: "ok" | "failed" | "pending" | string;
  parseError?: string | null;
  processedPath?: string | null;
};

// P2: Segment Type Enum (matches backend SegmentType)
export type SegmentType =
  | "untyped" | "definition" | "assumption" | "claim" | "mechanism"
  | "prediction" | "counterargument" | "evidence" | "open_question"
  | "experiment" | "meta";

// P2: Evidence Grade Enum (matches backend EvidenceGrade)
export type EvidenceGrade = "E0" | "E1" | "E2" | "E3" | "E4";

// P2: Link Type Enum (matches backend LinkType)
export type LinkType =
  | "supports" | "contradicts" | "depends_on"
  | "counterargument" | "evidence" | "related";

export type SegmentLinkDTO = {
  id: number;
  fromSegmentId: number;
  toSegmentId: number;
  linkType: LinkType;
  notes?: string | null;
  direction: "from" | "to";
  createdAt: string;
  createdByUserId: number;
};

export type SegmentLinksResponse = {
  segmentId: number;
  direction: "from" | "to" | "both";
  links: SegmentLinkDTO[];
  count: number;
};

export type SegmentLinkCreateDTO = {
  toSegmentId: number;
  linkType: LinkType;
  notes?: string | null;
};

export type SegmentationMode =
  | "qa" | "paragraphs" | "keywords" | "sections" | "semantic"
  | "topics" | "hierarchical" | "entities" | "questions" | "arguments"
  | "concepts" | "hybrid" | "temporal" | "sentiment" | "dialogue"
  | "texttiling" | "c99" | "changepoint" | "graph" | "layout";

export type SegmentDTO = {
  id: number;
  orderIndex: number;
  mode: SegmentationMode | string;
  title: string;
  content: string;
  start?: number;
  end?: number;
  createdAt?: string | null;
  isManual?: boolean;
  segmentType?: SegmentType | null;
  evidenceGrade?: EvidenceGrade | null;
  falsifiabilityCriteria?: string | null;
};

export type SegmentationSummary = {
  mode: SegmentationMode;
  count: number;
  lastSegmentedAt?: string | null;
};

export type DocumentDTO = {
  id: number;
  title?: string;
  filename?: string | null;
  sourceType?: string;
  text: string;
  parseStatus?: "ok" | "failed" | "pending" | string;
  parseError?: string | null;
  processedPath?: string | null;
  upload?: {
    id?: number | null;
    contentType?: string | null;
    sizeBytes?: number | null;
    storedPath?: string | null;
  };
};

export type SegmentsListMeta = {
  count: number;
  mode: string;
  lastRun?: string | null;
};

export type SegmentsListResponse = {
  items: SegmentDTO[];
  meta: SegmentsListMeta;
};

export type SegmentPatchDTO = {
  title?: string | null;
  start?: number | null;
  end?: number | null;
  content?: string | null;
  segmentType?: SegmentType | null;
  evidenceGrade?: EvidenceGrade | null;
  falsifiabilityCriteria?: string | null;
};

export type DocumentPatchDTO = {
  title?: string | null;
  text?: string | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
};

// Workspace types
export type FolderDTO = {
  id: number;
  name: string;
  documentId: number;
  createdAt: string;
  itemCount: number;
  parentId?: number | null;
  children?: FolderDTO[];
};

export type FolderItemDTO = {
  id: number;
  folderId: number;
  segmentId?: number | null;
  chunkId?: string | null;
  chunkTitle?: string | null;
  chunkContent?: string | null;
  chunkMode?: string | null;
  chunkIsManual?: boolean | null;
  chunkOrderIndex?: number | null;
  createdAt: string;
};

export type FolderWithItemsDTO = FolderDTO & {
  items: FolderItemDTO[];
};

export type SmartNoteDTO = {
  id: number;
  documentId: number;
  content: string;
  html: string;
  tags: string[];
  category: string;
  priority: string;
  chunkId?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentNoteDTO = {
  id: number;
  documentId: number;
  html: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};

// Search types
export interface SearchResultItem {
  id: number;
  type: "document" | "segment";
  documentId: number | null;
  title: string;
  content: string;
  score: number | null;
  mode: string | null;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  total: number;
  semantic?: boolean;
  variations?: string[];
}

export interface SynonymPair {
  word: string;
  synonym: string;
}

export interface SynonymListResponse {
  synonyms: Record<string, string[]>;
}

export interface SynonymResponse {
  ok: boolean;
  word: string;
  synonym: string;
  message?: string;
}

// Recycle Bin types
export type DeletedDocumentDTO = {
  id: number;
  title: string;
  filename: string;
  sourceType: string;
  deletedAt: string;
  upload: { id: number; contentType: string; sizeBytes: number };
};

export type DeletedSegmentDTO = {
  id: number;
  title: string;
  content: string;
  mode: string;
  documentId: number;
  documentTitle: string;
  deletedAt: string;
  isManual: boolean;
};

export type DeletedFolderDTO = {
  id: number;
  name: string;
  documentId: number;
  documentTitle: string;
  deletedAt: string;
};

export type RecycleBinItemDTO = {
  type: "document" | "segment" | "folder";
  id: number;
  title?: string;
  name?: string;
  content?: string;
  filename?: string;
  documentTitle?: string;
  deletedAt: string;
};

export type RecycleBinResponse = {
  documents: Array<Omit<DeletedDocumentDTO, "upload"> & { type: "document" }>;
  segments: Array<DeletedSegmentDTO & { type: "segment" }>;
  folders: Array<DeletedFolderDTO & { type: "folder" }>;
};

// Research Metrics types
export type ResearchMetricsDTO = {
  documentId: number;
  totalSegments: number;
  typeDistribution: Record<string, number>;
  evidenceGradeDistribution: Record<string, number>;
  evidenceMetrics: {
    claimsWithEvidence: number;
    claimsWithoutEvidence: number;
    totalClaims: number;
    evidenceCoverage: number;
  };
  falsifiabilityMetrics: {
    predictionsWithFalsifiability: number;
    predictionsWithoutFalsifiability: number;
    totalPredictions: number;
    falsifiabilityCoverage: number;
  };
  linkMetrics: {
    totalLinks: number;
    linkDensity: number;
  };
};

// Graph types
export type GraphNodeDTO = {
  id: number;
  label: string;
  type: string;
  evidenceGrade: string | null;
  size: number;
  color: string;
  orderIndex: number;
  isManual: boolean;
};

export type GraphEdgeDTO = {
  id: number;
  from: number;
  to: number;
  source?: number;
  target?: number;
  type: string;
  color: string;
  notes: string | null;
};

export type GraphDataDTO = {
  documentId: number;
  nodes: GraphNodeDTO[];
  edges: GraphEdgeDTO[];
  nodeCount: number;
  edgeCount: number;
};

// Library types
export type LibraryItemDTO = {
  id: number;
  segmentId: number;
  documentId: number;
  title: string | null;
  segmentTitle: string | null;
  content: string;
  segmentType: string | null;
  evidenceGrade: string | null;
  category: string | null;
  tags: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LibraryItemFilters = {
  category?: string;
  tag?: string;
  search?: string;
};

export type LibraryItemCreateDTO = {
  segmentId: number;
  category?: string;
  tags?: string;
  notes?: string;
};

export type LibraryItemUpdateDTO = {
  title?: string;
  notes?: string;
  tags?: string;
  category?: string;
};

export interface DeleteFolderItemResponse {
  ok: boolean;
  folder_deleted: boolean;
  folder_id: number | null;
}
