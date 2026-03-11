/**
 * Barrel re-export for src/lib/api.
 * All existing imports from '../lib/api' or '../../lib/api' continue to work.
 */

// Core utilities
export { getAccessToken, getRefreshToken, setTokens, clearTokens, refreshTokens, authFetch } from './core';

// Types
export type {
  UploadItemDTO, UploadResponseDTO,
  SegmentType, EvidenceGrade, LinkType,
  SegmentLinkDTO, SegmentLinksResponse, SegmentLinkCreateDTO,
  SegmentationMode,
  SegmentDTO, SegmentationSummary,
  DocumentDTO,
  SegmentsListMeta, SegmentsListResponse,
  SegmentPatchDTO, DocumentPatchDTO,
  PaginatedResponse,
  FolderDTO, FolderItemDTO, FolderWithItemsDTO,
  SmartNoteDTO, DocumentNoteDTO,
  DeleteFolderItemResponse,
  SearchResultItem, SearchResponse,
  SynonymPair, SynonymListResponse, SynonymResponse,
  DeletedDocumentDTO, DeletedSegmentDTO, DeletedFolderDTO,
  RecycleBinItemDTO, RecycleBinResponse,
  ResearchMetricsDTO,
  GraphNodeDTO, GraphEdgeDTO, GraphDataDTO,
  LibraryItemDTO, LibraryItemFilters, LibraryItemCreateDTO, LibraryItemUpdateDTO,
} from './types';

// Auth
export { login, logout } from './auth';

// Uploads
export { listUploads, uploadFile, deleteUpload } from './uploads';

// Segments
export {
  discoverKeywords, discoverConcepts,
  segmentDocument,
  listSegmentsWithMeta, listSegments,
  patchSegment, patchManualSegment,
  listSegmentations, deleteSegments,
  createManualSegment, deleteSegment, getSegment,
  createSegmentLink, getSegmentLinks, deleteSegmentLink,
} from './segments';

// Documents
export { getDocument, patchDocument } from './documents';

// Workspace
export {
  listFolders, getFolder, createFolder, updateFolder, deleteFolder,
  createFolderItem, deleteFolderItem,
  listSmartNotes, createSmartNote, updateSmartNote, deleteSmartNote,
  getDocumentNote, upsertDocumentNote, deleteDocumentNote,
  migrateLocalStorageData,
} from './workspace';

// Search
export { search, addSynonym, removeSynonym, listSynonyms } from './search';

// Research
export {
  runBenchmark, downloadBenchmarkReport, downloadBenchmarkReportZip,
  getBenchmarkHistory, emailBenchmarkReport, emailBenchmarkReportZip,
  getBenchmarkLatest, getBenchmarkAccess,
  searchOpenAlex, searchOpenAlexAuthors, searchOpenAlexInstitutions,
  searchSemanticScholar, lookupCrossrefDoi, searchArxiv,
  zoteroCollections, zoteroItems, zoteroCreateCollection, zoteroCreateItem,
  zoteroSync, getZoteroSynced, zoteroImportToLibrary,
  fetchMendeleyDocuments, getMendeleyAuthUrl, exchangeMendeleyCode, getMendeleyStatus,
  getPrismaState, savePrismaState,
} from './research';

// Recycle Bin
export {
  softDeleteDocument, restoreDocument, permanentlyDeleteDocument, listDeletedDocuments,
  restoreSegment, permanentlyDeleteSegment, listDeletedSegments,
  restoreFolder, permanentlyDeleteFolder, listDeletedFolders,
  listAllDeletedItems,
} from './recycleBin';

// Metrics & Graph
export { getResearchMetrics, getDocumentGraph } from './metrics';

// Library
export { listLibraryItems, createLibraryItem, updateLibraryItem, deleteLibraryItem } from './library';
